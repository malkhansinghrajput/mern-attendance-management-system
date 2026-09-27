const User = require('../models/User');
const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/response');
const { ERROR_CODES } = require('../constants/errors');

const getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20, isActive } = req.query;
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query)
        .populate('managerId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    return sendSuccess(res, 200, 'All users', { users, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    next(error);
  }
};

const getTeamUsers = async (req, res, next) => {
  try {
    const users = await User.find({ managerId: req.user._id, isActive: true }).sort({ name: 1 });
    return sendSuccess(res, 200, 'Team members', { users });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('managerId', 'name email');
    if (!user) {
      return sendError(res, 404, ERROR_CODES.USER_NOT_FOUND, 'User not found');
    }
    return sendSuccess(res, 200, 'User details', { user });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, managerId } = req.body;
    if (!name || !email || !password) {
      return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, 'name, email and password are required');
    }
    const { user } = await authService.signup({
      name,
      email,
      password,
      role,
      managerId,
      createdByRole: 'admin',
    });
    return sendSuccess(res, 201, 'User created successfully', { user });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    );
    if (!user) {
      return sendError(res, 404, ERROR_CODES.USER_NOT_FOUND, 'User not found');
    }
    return sendSuccess(res, 200, `User ${isActive ? 'activated' : 'deactivated'}`, { user });
  } catch (error) {
    next(error);
  }
};

const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('managerId', 'name email');
    if (!user) {
      return sendError(res, 404, ERROR_CODES.USER_NOT_FOUND, 'User profile not found');
    }
    return sendSuccess(res, 200, 'User profile', { user });
  } catch (error) {
    next(error);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const { name, phone, avatarUrl } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('managerId', 'name email');

    return sendSuccess(res, 200, 'Profile updated successfully', { user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getTeamUsers,
  getUserById,
  createUser,
  updateUserStatus,
  getMyProfile,
  updateMyProfile,
};
