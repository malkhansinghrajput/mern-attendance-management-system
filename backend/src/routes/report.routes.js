const express = require('express');
const router = express.Router();
const { getDailyReport, getAdminStats } = require('../controllers/report.controller');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');

router.get('/daily', authenticate, getDailyReport);
router.get('/stats', authenticate, authorize('admin'), getAdminStats);

module.exports = router;
