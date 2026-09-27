const express = require('express');
const router = express.Router();
const { signup, login, getMe, logout } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { signupValidators, loginValidators } = require('../validators/auth.validators');

// Optional auth middleware — sets req.user if a valid token is present, but does NOT block the request
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  next();
};

// Public routes
router.post('/signup', optionalAuth, signupValidators, validate, signup);
router.post('/login', loginValidators, validate, login);

// Protected routes
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

module.exports = router;
