const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { getTodayDate, formatWorkingHours } = require('../utils/dateUtils');
const { calculateWorkingMinutes } = require('./workingHours.service');
const { ATTENDANCE_STATUS } = require('../constants/attendance');

/**
 * Generate daily attendance report scoped by role.
 */
const getDailyReport = async (requesterId, requesterRole, { date, userId, page = 1, limit = 20 }) => {
  const reportDate = date || getTodayDate();
  const skip = (page - 1) * limit;

  let query = { date: reportDate };

  if (requesterRole === 'employee') {
    // Employee sees only own data
    query.userId = requesterId;
  } else if (requesterRole === 'manager') {
    // Manager sees team data
    const teamMembers = await User.find({ managerId: requesterId }).select('_id');
    const teamIds = teamMembers.map((m) => m._id);
    query.userId = { $in: teamIds };
    if (userId) query.userId = userId; // Optional user filter within team
  } else if (requesterRole === 'admin') {
    // Admin sees all
    if (userId) query.userId = userId;
  }

  const [records, total] = await Promise.all([
    Attendance.find(query)
      .populate('userId', 'name email role')
      .populate('validatedBy', 'name role')
      .populate('overtimeRequest')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Attendance.countDocuments(query),
  ]);

  // Shape records for the report response
  const shaped = records.map((a) => {
    const isRecordActive = a.attendanceStatus === ATTENDANCE_STATUS.ACTIVE && a.punchIn && !a.punchOut;
    const workingMins = isRecordActive
      ? calculateWorkingMinutes(a.punchIn, new Date())
      : (a.workingMinutes || 0);

    return {
      _id: a._id,
      employee: a.userId,
      date: a.date,
      punchIn: a.punchIn,
      punchOut: a.punchOut,
      punchInSelfie: a.punchInSelfie,
      punchOutSelfie: a.punchOutSelfie,
      punchInLocation: a.punchInLocation,
      punchOutLocation: a.punchOutLocation,
      workingMinutes: workingMins,
      workingHoursFormatted: formatWorkingHours(workingMins),
      attendanceStatus: a.attendanceStatus,
      validationStatus: a.validationStatus,
      validatedBy: a.validatedBy,
      validatedAt: a.validatedAt,
      validationRemarks: a.validationRemarks,
      overtimeRequest: a.overtimeRequest,
    };
  });

  return { records: shaped, total, page: Number(page), limit: Number(limit), date: reportDate };
};

/**
 * Get dashboard stats for admin.
 */
const getAdminStats = async () => {
  const today = getTodayDate();
  const [totalUsers, todayAttendance] = await Promise.all([
    User.countDocuments({ isActive: true }),
    Attendance.find({ date: today })
      .select('validationStatus attendanceStatus')
      .lean(),
  ]);

  const presentToday = todayAttendance.length;
  const validToday = todayAttendance.filter((a) => a.validationStatus === 'valid').length;
  const invalidToday = todayAttendance.filter((a) => a.validationStatus === 'invalid').length;
  const pendingValidation = todayAttendance.filter((a) => a.validationStatus === 'pending').length;
  const completedToday = todayAttendance.filter((a) => a.attendanceStatus === 'completed').length;
  const incompleteToday = todayAttendance.filter((a) => a.attendanceStatus === 'incomplete').length;

  return { totalUsers, presentToday, validToday, invalidToday, pendingValidation, completedToday, incompleteToday };
};

module.exports = { getDailyReport, getAdminStats };
