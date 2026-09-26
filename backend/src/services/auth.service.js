const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/jwtUtils');
const { ERROR_CODES } = require('../constants/errors');
const logger = require('../config/logger');

/**
 * Creates a new user account.
 */
const signup = async ({ name, email, password, managerId }) => {
  // Check for existing user
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 409;
    err.code = ERROR_CODES.EMAIL_ALREADY_EXISTS;
    throw err;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Role is always 'employee' on self-signup.
  // Admin/Manager roles can only be assigned by an Admin user.
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: 'employee',
    managerId: managerId || null,
  });

  const token = signToken(user._id.toString(), user.role);
  logger.info(`User signup: email=${email}, role=${user.role}`);

  return { user, token };
};

/**
 * Authenticates a user and returns a token.
 */
const login = async ({ email, password }) => {
  // Explicitly select passwordHash (excluded by default)
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !user.isActive) {
    logger.warn(`Login failed: email=${email} (not found or inactive)`);
    const err = new Error('Invalid email or password');
    err.status = 401;
    err.code = ERROR_CODES.AUTHENTICATION_FAILED;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    logger.warn(`Login failed: email=${email} (wrong password)`);
    const err = new Error('Invalid email or password');
    err.status = 401;
    err.code = ERROR_CODES.AUTHENTICATION_FAILED;
    throw err;
  }

  const token = signToken(user._id.toString(), user.role);
  logger.info(`User login: userId=${user._id}, role=${user.role}`);

  // Remove passwordHash before returning
  user.passwordHash = undefined;
  return { user, token };
};

module.exports = { signup, login };
