import Stripe from 'stripe';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Purchase from '../models/Purchase.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Stripe checkout session
export const createCheckoutSession = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { courseId } = req.body;

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Get course
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }

        // Check if already enrolled
        if (course.enrolledStudents.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Already enrolled in this course',
            });
        }

        // Calculate price
        const discountedPrice = course.coursePrice - (course.discount * course.coursePrice) / 100;
        const amountInCents = Math.round(discountedPrice * 100);

        // Handle free courses
        if (amountInCents === 0) {
            // Directly enroll for free courses
            course.enrolledStudents.push(userId);
            await course.save();

            user.enrolledCourses.push({
                courseId: course._id,
                enrolledAt: new Date(),
                progress: {
                    completedLectures: [],
                    lastAccessedAt: new Date(),
                },
            });
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Successfully enrolled in free course',
                isFree: true,
            });
        }

        // Create Stripe checkout session
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
            metadata: {
                courseId: courseId,
                userId: userId,
            },
        });

        // Create purchase record
        await Purchase.create({
            courseId: course._id,
            userId,
            amount: discountedPrice,
            stripeSessionId: session.id,
            status: 'pending',
        });

        res.status(200).json({
            success: true,
            sessionId: session.id,
            url: session.url,
        });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
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

// Stripe webhook handler
export const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            const { courseId, userId } = session.metadata;

            // Update purchase status
            await Purchase.findOneAndUpdate(
                { stripeSessionId: session.id },
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
            break;

        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.log('Payment failed:', failedPayment.id);
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
};

// Get user's purchase history
export const getPurchaseHistory = async (req, res) => {
    try {
        const userId = req.auth.userId;

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
