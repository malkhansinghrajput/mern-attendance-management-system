const { body } = require('express-validator');
const { VALIDATION_STATUS } = require('../constants/attendance');

const punchInValidators = [
  body('selfieUrl')
    .notEmpty().withMessage('Selfie URL is required')
    .isURL().withMessage('Selfie must be a valid URL'),

  body('location')
    .notEmpty().withMessage('Location is required'),

  body('location.lat')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),

  body('location.lng')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
];

const punchOutValidators = [
  body('location')
    .optional()
    .notEmpty().withMessage('Location must not be empty if provided'),

  body('location.lat')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),

  body('location.lng')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
];

const validateAttendanceValidators = [
  body('validationStatus')
    .notEmpty().withMessage('Validation status is required')
    .isIn([VALIDATION_STATUS.VALID, VALIDATION_STATUS.INVALID])
    .withMessage('Status must be valid or invalid'),

  body('validationRemarks')
    .if(body('validationStatus').equals(VALIDATION_STATUS.INVALID))
    .notEmpty().withMessage('Remarks are required when marking attendance as invalid')
    .isLength({ max: 500 }).withMessage('Remarks cannot exceed 500 characters'),
];

module.exports = { punchInValidators, punchOutValidators, validateAttendanceValidators };
