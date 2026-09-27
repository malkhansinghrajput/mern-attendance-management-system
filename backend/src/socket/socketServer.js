const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwtUtils');
const User = require('../models/User');
const logger = require('../config/logger');

let io;

/**
 * Initialize Socket.IO with the HTTP server.
 * Attaches JWT auth middleware so every connection is verified.
 *
 * Rooms:
 *  - user:<userId>       → personal notifications
 *  - role:admin          → all admin connections
 *  - role:manager        → all manager connections
 *  - manager:<managerId> → employees under a specific manager
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL
        ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
        : ['http://localhost:5173', 'http://localhost:5174'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // ── Auth middleware ────────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select('_id name role managerId isActive');
      if (!user || !user.isActive) {
        return next(new Error('User not found or deactivated'));
      }

      socket.user = user;
      next();
    } catch (err) {
      logger.warn(`Socket auth failed: ${err.message}`);
      next(new Error('Invalid authentication token'));
    }
  });

  // ── Connection handler ─────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const user = socket.user;
    logger.info(`Socket connected: userId=${user._id}, role=${user.role}, socketId=${socket.id}`);

    // Personal room
    socket.join(`user:${user._id}`);

    // Role room (admin / manager)
    socket.join(`role:${user.role}`);

    // Employees join their manager's room so manager gets real-time punch events
    if (user.role === 'employee' && user.managerId) {
      socket.join(`manager:${user.managerId}`);
    }

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: userId=${user._id}, reason=${reason}`);
    });

    // Client can request a ping to verify connection
    socket.on('ping', () => socket.emit('pong'));
  });

  logger.info('Socket.IO server initialized');
  return io;
};

/**
 * Get the initialized io instance (throws if not yet initialized).
 */
const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized. Call initSocket(httpServer) first.');
  return io;
};

// ─── Emission helpers (called from controllers) ────────────────────────────

/**
 * Notify a specific user.
 * @param {string} userId
 * @param {string} event
 * @param {object} payload
 */
const emitToUser = (userId, event, payload) => {
  try {
    getIO().to(`user:${userId}`).emit(event, payload);
  } catch (e) {
    logger.warn(`emitToUser failed: ${e.message}`);
  }
};

/**
 * Notify all admins.
 */
const emitToAdmins = (event, payload) => {
  try {
    getIO().to('role:admin').emit(event, payload);
  } catch (e) {
    logger.warn(`emitToAdmins failed: ${e.message}`);
  }
};

/**
 * Notify a specific manager (and all admins too).
 */
const emitToManager = (managerId, event, payload) => {
  try {
    const _io = getIO();
    _io.to(`user:${managerId}`).emit(event, payload);
    _io.to('role:admin').emit(event, payload);
  } catch (e) {
    logger.warn(`emitToManager failed: ${e.message}`);
  }
};

/**
 * Notify all managers and admins.
 */
const emitToManagersAndAdmins = (event, payload) => {
  try {
    const _io = getIO();
    _io.to('role:manager').emit(event, payload);
    _io.to('role:admin').emit(event, payload);
  } catch (e) {
    logger.warn(`emitToManagersAndAdmins failed: ${e.message}`);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToAdmins,
  emitToManager,
  emitToManagersAndAdmins,
};
