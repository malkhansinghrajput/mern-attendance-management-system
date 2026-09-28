const { body } = require('express-validator');

const signupValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  // managerId is optional — raw ObjectId (admin-created flows)
  body('managerId')
    .optional({ nullable: true })
    .isMongoId().withMessage('managerId must be a valid ID'),

  // managerCode is optional — human-readable code employees get from their manager
  // Format: MGR-NAMEPART-NNNN
  body('managerCode')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .matches(/^MGR-[A-Z0-9]+-\d{4}$/i)
    .withMessage('Manager Code must be in format MGR-XXXXX-1234'),
];

const loginValidators = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

module.exports = { signupValidators, loginValidators };
