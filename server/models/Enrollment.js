import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'failed'],
    default: 'pending',
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment;
