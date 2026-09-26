const express = require('express');
const router = express.Router();
const {
  punchIn, punchOut, getTodayAttendance, getMyAttendance,
  getTeamAttendance, getAllAttendance, validateAttendance,
} = require('../controllers/attendance.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const { validate } = require('../middlewares/validate');
const {
  punchInValidators, punchOutValidators, validateAttendanceValidators,
} = require('../validators/attendance.validators');

// Employee routes
router.post('/punch-in', authenticate, authorize('employee'), punchInValidators, validate, punchIn);
router.post('/punch-out', authenticate, authorize('employee'), punchOutValidators, validate, punchOut);
router.get('/today', authenticate, authorize('employee'), getTodayAttendance);
router.get('/my', authenticate, authorize('employee'), getMyAttendance);

// Manager routes
router.get('/team', authenticate, authorize('manager', 'admin'), getTeamAttendance);

// Admin routes
router.get('/all', authenticate, authorize('admin'), getAllAttendance);

// Validation (Manager + Admin)
router.patch('/:id/validate', authenticate, authorize('manager', 'admin'), validateAttendanceValidators, validate, validateAttendance);

module.exports = router;
