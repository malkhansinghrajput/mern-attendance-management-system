const Attendance = require('../models/Attendance');
const OvertimeRequest = require('../models/OvertimeRequest');
const User = require('../models/User');
const { getTodayDate } = require('../utils/dateUtils');
const { calculateWorkingMinutes, determineAttendanceStatus } = require('./workingHours.service');
const { ERROR_CODES } = require('../constants/errors');
const { ATTENDANCE_STATUS, VALIDATION_STATUS } = require('../constants/attendance');
const logger = require('../config/logger');

/**
 * Punch in for an employee.
 * Creates a new attendance record for today.
 */
const punchIn = async (userId, { selfieUrl, location }) => {
  const date = getTodayDate();

  // Check for existing record today
  const existing = await Attendance.findOne({ userId, date });
  if (existing) {
    const err = new Error('Already punched in today');
    err.status = 409;
    err.code = ERROR_CODES.ALREADY_PUNCHED_IN;
    throw err;
  }

  const attendance = await Attendance.create({
    userId,
    date,
    punchIn: new Date(),
    punchInSelfie: selfieUrl,
    punchInLocation: {
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy || null,
      address: location.address || null,
      capturedAt: new Date(),
    },
    attendanceStatus: ATTENDANCE_STATUS.ACTIVE,
  });

  logger.info(`Punch in: userId=${userId}, date=${date}`);
  return attendance.populate('userId', 'name email role');
};

/**
 * Punch out for an employee.
 * Updates attendance with punch-out time and calculates working hours.
 */
const punchOut = async (userId, { selfieUrl, location }) => {
  const date = getTodayDate();

  const attendance = await Attendance.findOne({ userId, date });
  if (!attendance) {
    const err = new Error('No punch-in found for today');
    err.status = 409;
    err.code = ERROR_CODES.NOT_PUNCHED_IN;
    throw err;
  }

  if (attendance.attendanceStatus !== ATTENDANCE_STATUS.ACTIVE) {
    const err = new Error('Already punched out');
    err.status = 409;
    err.code = ERROR_CODES.ALREADY_PUNCHED_OUT;
    throw err;
  }

  const punchOutTime = new Date();
  const workingMinutes = calculateWorkingMinutes(attendance.punchIn, punchOutTime);
  const attendanceStatus = determineAttendanceStatus(workingMinutes);

  attendance.punchOut = punchOutTime;
  attendance.workingMinutes = workingMinutes;
  attendance.attendanceStatus = attendanceStatus;

  if (selfieUrl) {
    attendance.punchOutSelfie = selfieUrl;
  }
  if (location) {
    attendance.punchOutLocation = {
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy || null,
      address: location.address || null,
      capturedAt: new Date(),
    };
  }

  await attendance.save();
  logger.info(`Punch out: userId=${userId}, workingMinutes=${workingMinutes}, status=${attendanceStatus}`);

  return attendance.populate('userId', 'name email role');
};

/**
 * Get today's attendance for an employee.
 */
const getTodayAttendance = async (userId) => {
  const date = getTodayDate();
  const attendance = await Attendance.findOne({ userId, date })
    .populate('userId', 'name email role')
    .populate('validatedBy', 'name role')
    .populate('overtimeRequest');
  return attendance;
};

/**
 * Get attendance history for an employee (paginated).
 */
const getMyAttendance = async (userId, { page = 1, limit = 10, startDate, endDate }) => {
  const query = { userId };
  if (startDate) query.date = { ...query.date, $gte: startDate };
  if (endDate) query.date = { ...query.date, $lte: endDate };

  const skip = (page - 1) * limit;
  const [attendances, total] = await Promise.all([
    Attendance.find(query)
      .populate('userId', 'name email role')
      .populate('overtimeRequest')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Attendance.countDocuments(query),
  ]);

  return { attendances, total, page: Number(page), limit: Number(limit) };
};

/**
 * Get team attendance for a manager (paginated).
 */
const getTeamAttendance = async (managerId, { page = 1, limit = 20, userId, date }) => {
  // Get all team member IDs
  const teamMembers = await User.find({ managerId }).select('_id');
  const teamIds = teamMembers.map((m) => m._id);

  const query = { userId: { $in: teamIds } };
  if (userId) query.userId = userId;
  if (date) query.date = date;

  const skip = (page - 1) * limit;
  const [attendances, total] = await Promise.all([
    Attendance.find(query)
      .populate('userId', 'name email role')
      .populate('validatedBy', 'name role')
      .populate('overtimeRequest')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Attendance.countDocuments(query),
  ]);

  return { attendances, total, page: Number(page), limit: Number(limit) };
};

/**
 * Get all attendance for admin (paginated).
 */
const getAllAttendance = async ({ page = 1, limit = 20, userId, date, startDate, endDate }) => {
  const query = {};
  if (userId) query.userId = userId;
  if (date) query.date = date;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  const skip = (page - 1) * limit;
  const [attendances, total] = await Promise.all([
    Attendance.find(query)
      .populate('userId', 'name email role')
      .populate('validatedBy', 'name role')
      .populate('overtimeRequest')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Attendance.countDocuments(query),
  ]);

  return { attendances, total, page: Number(page), limit: Number(limit) };
};

/**
 * Validate an attendance record (Manager/Admin).
 */
const validateAttendance = async (attendanceId, validatorId, validatorRole, { validationStatus, validationRemarks }) => {
  const attendance = await Attendance.findById(attendanceId).populate('userId', 'name managerId');
  if (!attendance) {
    const err = new Error('Attendance record not found');
    err.status = 404;
    err.code = ERROR_CODES.ATTENDANCE_NOT_FOUND;
    throw err;
  }

  // Manager can only validate their team's attendance
  if (validatorRole === 'manager') {
    const employee = await User.findById(attendance.userId._id);
    if (!employee || employee.managerId?.toString() !== validatorId.toString()) {
      const err = new Error('You can only validate your team members\' attendance');
      err.status = 403;
      err.code = ERROR_CODES.FORBIDDEN;
      throw err;
    }
  }

  attendance.validationStatus = validationStatus;
  attendance.validatedBy = validatorId;
  attendance.validatedAt = new Date();
  attendance.validationRemarks = validationRemarks || null;

  await attendance.save();
  logger.info(`Validation: attendanceId=${attendanceId}, status=${validationStatus}, by=${validatorId}`);

  return attendance.populate([
    { path: 'userId', select: 'name email role' },
    { path: 'validatedBy', select: 'name role' },
  ]);
};

module.exports = {
  punchIn,
  punchOut,
  getTodayAttendance,
  getMyAttendance,
  getTeamAttendance,
  getAllAttendance,
  validateAttendance,
};
