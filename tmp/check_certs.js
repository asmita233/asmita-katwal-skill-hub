import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

import Certificate from './server/models/Certificate.js';
import User from './server/models/User.js';
import Course from './server/models/Course.js';

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('DB Connected');

        // Assuming the user in the image has a name like 'Educator' or something
        // or just get all certificates and log them
        const certs = await Certificate.find({}).populate('userId', 'name').populate('courseId', 'courseTitle');
        console.log(`Total Certificates in DB: ${certs.length}`);
        
        certs.forEach(c => {
            console.log(`User: ${c.userId?.name} (${c.userId?._id}) | Course: ${c.courseTitle} | ID: ${c.certificateId}`);
        });

        // Let's also check for users who have 100% progress but no certificates
        const users = await User.find({}).populate('enrolledCourses.courseId');
        console.log(`\nChecking for eligible but ungenerated certificates...`);
        
        for (const user of users) {
             console.log(`\nUser: ${user.name} (${user._id})`);
             for (const ec of user.enrolledCourses) {
                 if (!ec.courseId) continue;
                 
                 // Calculate progress like the backend does
                 let totalLectures = 0;
                 ec.courseId.courseContent?.forEach(chapter => {
                     totalLectures += chapter.chapterContent?.length || 0;
                 });
                 
                 const completedLectures = ec.progress?.completedLectures?.length || 0;
                 const progress = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;
                 
                 if (progress === 100) {
                     const existing = await Certificate.findOne({ userId: user._id, courseId: ec.courseId._id });
                     if (!existing) {
                         console.log(`  [ELIGIBLE] Course: ${ec.courseId.courseTitle} - Has 100% progress but NO certificate.`);
                     } else {
                         console.log(`  [OK] Course: ${ec.courseId.courseTitle} - Has certificate.`);
                     }
                 } else {
                     console.log(`  [INCOMPLETE] Course: ${ec.courseId.courseTitle} - Progress: ${progress}%`);
                 }
             }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

check();
