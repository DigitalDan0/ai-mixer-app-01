const mongoose = require('mongoose');
const { logInfo, logError } = require('../utils/logger');

// Load environment variables
require('dotenv').config();

// Database connection URI
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_mixing_mastering';

// Connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
  autoIndex: true,
  poolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
};

// Function to connect to the database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(DB_URI, options);
    logInfo(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logError('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  logInfo('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  logError('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logInfo('Mongoose disconnected');
});

// Close the Mongoose connection if the Node process ends
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logInfo('Mongoose connection closed due to app termination');
  process.exit(0);
});

module.exports = {
  connectDB
};