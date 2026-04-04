import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Stripe from 'stripe';

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

/**
 * S3-T01: Enrollment System API
 * Purpose: Manual enrollment handler as documented in user report
 */
export const enrollCourse = async (req, res) => {
  try {
    // Note: Clerk uses req.auth.userId in newer versions
    const userId = req.auth?.userId || req.body.userId;
    const { courseId } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({ success: false, message: 'UserId and CourseId are required' });
    }

    const existingEnrollment = await Enrollment.findOne({ userId, courseId });
    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    const enrollment = await Enrollment.create({
      userId,
      courseId,
      status: 'pending'
    });

    res.status(201).json({ success: true, enrollment });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * S3-T01: Get student enrollments
 */
export const getUserEnrollments = async (req, res) => {
  try {
    const { userId } = req.params;
    const enrollments = await Enrollment.find({ userId }).populate('courseId', 'courseTitle courseThumbnail coursePrice');

    res.status(200).json({ success: true, enrollments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * S3-T02: Stripe Payment Integration
 * Purpose: Manual stripe checkout handler for report screenshots
 */
export const processPayment = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.auth?.userId;

    if (!userId || !courseId) {
      return res.status(400).json({ success: false, message: 'Not authorized or missing course' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const discountedPrice = course.coursePrice - (course.discount * course.coursePrice) / 100;

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { 
            name: course.courseTitle,
            description: `S3-T02 Integration: ${course.courseTitle}`
          },
          unit_amount: Math.round(discountedPrice * 100)
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/course/${courseId}`,
      metadata: { courseId: course._id.toString(), userId }
    });

    res.status(200).json({ success: true, sessionUrl: session.url });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
