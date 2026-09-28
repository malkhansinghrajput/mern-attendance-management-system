const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/attendance-management';
    const conn = await mongoose.connect(uri);
    logger.info(`MongoDB connected: ${conn.connection.host}`);

    // Synchronize User collection indexes (rebuilds managerCode partial index if needed)
    try {
      const User = mongoose.model('User');
      await User.syncIndexes();
      logger.info('MongoDB indexes synchronized successfully');
    } catch (indexErr) {
      logger.warn(`MongoDB index sync notice: ${indexErr.message}`);
    }
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
