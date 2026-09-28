const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/jwtUtils');
const { generateManagerCode } = require('../utils/managerCode');
const { ERROR_CODES } = require('../constants/errors');
const logger = require('../config/logger');

/**
 * Creates a new user account.
 *
 * Signup flow for employees:
 *  - They can provide a `managerCode` (e.g. "MGR-ALEXM-3821") instead of raw managerId ObjectId.
 *  - The service resolves the code to the actual manager's _id.
 *  - If neither is provided, managerId stays null.
 */
const signup = async ({ name, email, password, managerId, managerCode: rawManagerCode, role: requestedRole, createdByRole }) => {
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

  // Role assignment:
  //   - Self-signup → always 'employee'
  //   - Admin-created → can assign any role
  const VALID_ROLES = ['employee', 'manager', 'admin'];
  const role = (createdByRole === 'admin' && requestedRole && VALID_ROLES.includes(requestedRole))
    ? requestedRole
    : 'employee';

  // Resolve manager: prefer managerCode lookup, fallback to raw managerId ObjectId
  let resolvedManagerId = managerId || null;
  if (rawManagerCode && rawManagerCode.trim()) {
    const managerUser = await User.findOne({
      managerCode: rawManagerCode.trim().toUpperCase(),
      role: 'manager',
      isActive: true,
    });
    if (!managerUser) {
      const err = new Error('Invalid Manager Code. Please check the code and try again.');
      err.status = 400;
      err.code = ERROR_CODES.VALIDATION_ERROR;
      throw err;
    }
    resolvedManagerId = managerUser._id;
  }

  // Auto-generate managerCode if this account is being created as a manager
  let newManagerCode = null;
  if (role === 'manager') {
    newManagerCode = await generateManagerCode(name);
  }

  const userData = {
    name,
    email,
    passwordHash,
    role,
    managerId: resolvedManagerId,
  };
  if (newManagerCode) {
    userData.managerCode = newManagerCode;
  }

  const user = await User.create(userData);

  const token = signToken(user._id.toString(), user.role);
  logger.info(`User signup: email=${email}, role=${user.role}${newManagerCode ? `, managerCode=${newManagerCode}` : ''}`);

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

