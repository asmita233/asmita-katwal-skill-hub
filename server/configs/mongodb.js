import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => {
            console.log(' MongoDB Connected Successfully');
        });

        mongoose.connection.on('error', (err) => {
            console.error(' MongoDB Connection Error:', err);
        });

        await mongoose.connect(process.env.MONGODB_URI);
    } catch (error) {
        console.error(' Failed to connect to MongoDB:', error.message);
        process.exit(1);
    }
};

export default connectDB;