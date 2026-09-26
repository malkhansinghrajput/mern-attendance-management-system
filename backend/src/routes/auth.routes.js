const express = require('express');
const router = express.Router();
const { signup, login, getMe, logout } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { signupValidators, loginValidators } = require('../validators/auth.validators');

router.post('/signup', signupValidators, validate, signup);
router.post('/login', loginValidators, validate, login);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

module.exports = router;
