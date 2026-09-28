const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');

const signup = async (req, res, next) => {
  try {
    const { name, email, password, role, managerId, managerCode } = req.body;
    // If an admin is making this request (authenticated), pass their role so service can allow role assignment
    const createdByRole = req.user?.role || null;
    const { user, token } = await authService.signup({ name, email, password, role, managerId, managerCode, createdByRole });
    return sendSuccess(res, 201, 'Account created successfully', { user, token });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login({ email, password });
    return sendSuccess(res, 200, 'Login successful', { user, token });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    // req.user is set by authenticate middleware
    return sendSuccess(res, 200, 'Current user', { user: req.user });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    // Stateless JWT — client must discard the token
    return sendSuccess(res, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, getMe, logout };
