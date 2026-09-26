const { body } = require('express-validator');

const requestOvertimeValidators = [
  body('attendanceId')
    .notEmpty().withMessage('Attendance ID is required')
    .isMongoId().withMessage('Must be a valid attendance ID'),

  body('requestedHours')
    .notEmpty().withMessage('Requested hours is required')
    .isFloat({ min: 0.5, max: 8 }).withMessage('Requested hours must be between 0.5 and 8'),

  body('reason')
    .trim()
    .notEmpty().withMessage('Reason is required')
    .isLength({ min: 10, max: 500 }).withMessage('Reason must be 10-500 characters'),
];

const reviewOvertimeValidators = [
  body('reviewRemarks')
    .optional()
    .isLength({ max: 500 }).withMessage('Review remarks cannot exceed 500 characters'),
];

module.exports = { requestOvertimeValidators, reviewOvertimeValidators };
