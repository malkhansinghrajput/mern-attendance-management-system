const User = require('../models/User');
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
        .limit(Number(limit)),
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

module.exports = { getAllUsers, getTeamUsers, getUserById, updateUserStatus };
