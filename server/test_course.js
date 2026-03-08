import mongoose from 'mongoose';
import 'dotenv/config';

const courseSchema = new mongoose.Schema({
    courseTitle: String,
    courseContent: Array
}, { strict: false });

const Course = mongoose.model('Course', courseSchema);

async function checkCourse() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const course = await Course.findById('69a3c23cd7306f34aad4dff9');
        if (!course) {
            console.log('Course not found');
        } else {
            console.log('Course Title:', course.courseTitle);
            console.log('Course Content:', JSON.stringify(course.courseContent, null, 2));
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkCourse();
