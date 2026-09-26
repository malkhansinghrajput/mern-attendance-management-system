const ATTENDANCE_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  INCOMPLETE: 'incomplete',
};

const VALIDATION_STATUS = {
  PENDING: 'pending',
  VALID: 'valid',
  INVALID: 'invalid',
};

const OVERTIME_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const STANDARD_SHIFT_MINUTES = 480; // 8 hours

module.exports = {
  ATTENDANCE_STATUS,
  VALIDATION_STATUS,
  OVERTIME_STATUS,
  STANDARD_SHIFT_MINUTES,
};
