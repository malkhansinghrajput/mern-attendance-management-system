const dns = require('dns');
// Use reliable public DNS resolvers (Google / Cloudflare) to prevent Windows querySrv ECONNREFUSED on MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // fallback silently if custom DNS setting is restricted
}

require('dotenv').config();

// Set timezone BEFORE anything else
process.env.TZ = process.env.TZ || 'Asia/Kolkata';

const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { connectCloudinary } = require('./config/cloudinary');
const { initSocket } = require('./socket/socketServer');
const logger = require('./config/logger');

const PORT = process.env.PORT || 5000;
let httpServer;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Configure Cloudinary
    connectCloudinary();

    // Create HTTP server from Express app
    httpServer = http.createServer(app);

    // Handle server socket errors (e.g. EADDRINUSE)
    httpServer.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Clean up the process or retry.`);
      } else {
        logger.error(`Server error: ${error.message}`);
      }
      process.exit(1);
    });

    // Initialize Socket.IO — must attach to httpServer, not app directly
    initSocket(httpServer);

    // Start listening
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`Timezone: ${process.env.TZ}`);
      logger.info(`Socket.IO ready — real-time events enabled`);
    });
  } catch (error) {
    logger.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down HTTP server cleanly...`);
  if (httpServer) {
    httpServer.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGUSR2', () => {
  if (httpServer) {
    httpServer.close(() => {
      process.kill(process.pid, 'SIGUSR2');
    });
  } else {
    process.kill(process.pid, 'SIGUSR2');
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

startServer();
