const express = require('express');
const router = express.Router();
const {
  getDailyReport,
  getAdminStats,
  exportAttendancePdf,
  exportAttendanceExcel,
} = require('../controllers/report.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');

router.get('/daily', authenticate, getDailyReport);
router.get('/stats', authenticate, authorize('admin'), getAdminStats);

// Export endpoints
router.get('/attendance/export/pdf', authenticate, exportAttendancePdf);
router.get('/attendance/export/excel', authenticate, exportAttendanceExcel);
router.get('/export/pdf', authenticate, exportAttendancePdf);
router.get('/export/excel', authenticate, exportAttendanceExcel);

module.exports = router;
