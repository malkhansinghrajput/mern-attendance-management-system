const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const attendanceRoutes = require('./attendance.routes');
const overtimeRoutes = require('./overtime.routes');
const userRoutes = require('./user.routes');
const reportRoutes = require('./report.routes');
const uploadRoutes = require('./upload.routes');

router.use('/auth', authRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/overtime', overtimeRoutes);
router.use('/users', userRoutes);
router.use('/reports', reportRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;
