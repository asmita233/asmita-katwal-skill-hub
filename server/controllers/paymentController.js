import Stripe from 'stripe';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Purchase from '../models/Purchase.js';
import { sendEnrollmentEmail, sendPaymentSuccessEmail } from '../utils/emailService.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// CREATE STRIPE CHECKOUT SESSION:
// This function is triggered when a student clicks Buy Course.
export const createCheckoutSession = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { courseId } = req.body;

        // Verify that the user exists in our database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify that the requested course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Logic check: Prevent double-purchasing the same course
        if (course.enrolledStudents.includes(userId)) {
            return res.status(400).json({ success: false, message: 'Already enrolled' });
        }

        // Financial Calculation: Apply discount and convert to cents (Stripe logic)
        const discountedPrice = course.coursePrice - (course.discount * course.coursePrice) / 100;
        const amountInCents = Math.round(discountedPrice * 100);

        // If the course is 100% discounted (Free), bypass Stripe
        if (amountInCents === 0) {
            course.enrolledStudents.push(userId); // Add student to course list
            await course.save();

            user.enrolledCourses.push({ // Initialize enrollment model for the user
                courseId: course._id,
                enrolledAt: new Date(),
                progress: { completedLectures: [], lastAccessedAt: new Date() },
            });
            await user.save();

            // Send enrollment email for free courses
            if (user.email) {
                sendEnrollmentEmail(user.email, user.name, course.courseTitle).catch(err =>
                    console.error('Failed to send enrollment email:', err)
                );
            }

            return res.status(200).json({ success: true, message: 'Enrolled in free course', isFree: true });
        }

        // STRIPE SESSION CREATION:
        // We define the product name, price, and the URLs Stripe should redirect to after payment.
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: course.courseTitle,
                            description: `Enrollment for ${course.courseTitle}`,
                            images: course.courseThumbnail ? [course.courseThumbnail] : [],
                        },
                        unit_amount: amountInCents,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/course/${courseId}`,
            customer_email: user.email,
            // Metadata is hidden data we pass to Stripe so we can identify the purchase in our webhook later.
            metadata: { courseId: courseId, userId: userId },
        });

        // Log the purchase as 'pending' in our database
        await Purchase.create({
            courseId: course._id,
            userId,
            amount: discountedPrice,
            stripeSessionId: session.id,
            status: 'pending',
        });

        res.status(200).json({ success: true, sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Verify payment and complete enrollment
export const verifyPayment = async (req, res) => {
    try {
        const { sessionId } = req.body;

        // Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            const { courseId, userId } = session.metadata;

            // Update purchase status
            await Purchase.findOneAndUpdate(
                { stripeSessionId: sessionId },
                {
                    status: 'completed',
                    stripePaymentIntentId: session.payment_intent,
                }
            );

            // Enroll user in course
            const course = await Course.findById(courseId);
            if (course && !course.enrolledStudents.includes(userId)) {
                course.enrolledStudents.push(userId);
                await course.save();
            }

            // Update user's enrolled courses
            const user = await User.findById(userId);
            if (user) {
                const alreadyEnrolled = user.enrolledCourses.some(
                    (ec) => ec.courseId.toString() === courseId
                );

                if (!alreadyEnrolled) {
                    user.enrolledCourses.push({
                        courseId: course._id,
                        enrolledAt: new Date(),
                        progress: {
                            completedLectures: [],
                            lastAccessedAt: new Date(),
                        },
                    });
                    await user.save();
                }
            }

            res.status(200).json({
                success: true,
                message: 'Payment verified and enrolled successfully',
            });

            // Send payment success + enrollment email
            if (user && user.email) {
                const amount = session.amount_total / 100;
                sendPaymentSuccessEmail(user.email, user.name, course?.courseTitle || 'Course', amount).catch(err =>
                    console.error('Failed to send payment email:', err)
                );
            }
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment not completed',
            });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// STRIPE WEBHOOK HANDLER:
// This is the MOST SECURE way to handle payments. 
// Even if the student closes their browser, Stripe will call this URL to tell us the payment was successful.
export const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature']; // Signature ensures the request actually came from Stripe
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // Verification step: Ensure the request is authentic
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Process specific events sent by Stripe
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            const { courseId, userId } = session.metadata; // Retrieve our hidden data

            // 1. Mark purchase as 'completed' in DB
            await Purchase.findOneAndUpdate(
                { stripeSessionId: session.id },
                { status: 'completed', stripePaymentIntentId: session.payment_intent }
            );

            // 2. Add Student ID to the Course's list of enrolled students
            const course = await Course.findById(courseId);
            if (course && !course.enrolledStudents.includes(userId)) {
                course.enrolledStudents.push(userId);
                await course.save();
            }

            // 3. Add Course ID to the User's list of purchased courses
            const user = await User.findById(userId);
            if (user) {
                const alreadyEnrolled = user.enrolledCourses.some(
                    (ec) => ec.courseId.toString() === courseId
                );

                if (!alreadyEnrolled) {
                    user.enrolledCourses.push({
                        courseId: course._id,
                        enrolledAt: new Date(),
                        progress: { completedLectures: [], lastAccessedAt: new Date() },
                    });
                    await user.save();
                }
            }
            break;
        }

        case 'payment_intent.payment_failed':
            console.log('Payment failed, no enrollment granted.');
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
};

// Get user's purchase history
export const getPurchaseHistory = async (req, res) => {
    try {
        const userId = req.auth?.userId;

        const purchases = await Purchase.find({ userId, status: 'completed' })
            .populate('courseId', 'courseTitle courseThumbnail coursePrice')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            purchases,
        });
    } catch (error) {
        console.error('Error getting purchase history:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
