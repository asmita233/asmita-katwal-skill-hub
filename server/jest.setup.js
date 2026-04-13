const dotenv = require('dotenv');
const connectDB = require('./configs/mongodb');

dotenv.config();

const mongoose = require('mongoose');

// Connect to database once before all tests
connectDB();

afterAll(async () => {
  await mongoose.connection.close();
});

// Suppress console output during tests for cleaner output
// Comment these out if you need to debug
// jest.spyOn(console, 'log').mockImplementation(() => {});
// jest.spyOn(console, 'error').mockImplementation(() => {});
