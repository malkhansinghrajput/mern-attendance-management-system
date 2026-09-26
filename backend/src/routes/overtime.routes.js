const express = require('express');
const router = express.Router();
const {
  requestOvertime, getMyOvertime, getPendingOvertime, approveOvertime, rejectOvertime,
} = require('../controllers/overtime.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const { validate } = require('../middlewares/validate');
const { requestOvertimeValidators, reviewOvertimeValidators } = require('../validators/overtime.validators');

router.post('/', authenticate, authorize('employee'), requestOvertimeValidators, validate, requestOvertime);
router.get('/my', authenticate, authorize('employee'), getMyOvertime);
router.get('/pending', authenticate, authorize('manager', 'admin'), getPendingOvertime);
router.patch('/:id/approve', authenticate, authorize('manager', 'admin'), reviewOvertimeValidators, validate, approveOvertime);
router.patch('/:id/reject', authenticate, authorize('manager', 'admin'), reviewOvertimeValidators, validate, rejectOvertime);

module.exports = router;
