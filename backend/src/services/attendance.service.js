const Attendance = require('../models/Attendance');
const OvertimeRequest = require('../models/OvertimeRequest');
const User = require('../models/User');
const CompanySettings = require('../models/CompanySettings');
const { calculateHaversineDistance, isValidCoordinate } = require('../utils/geoUtils');
const { getTodayDate } = require('../utils/dateUtils');
const {
  calculateWorkingMinutes,
  calculateShiftDurations,
  determineAttendanceStatus,
} = require('./workingHours.service');
const { ERROR_CODES } = require('../constants/errors');
const { ATTENDANCE_STATUS, VALIDATION_STATUS } = require('../constants/attendance');
const logger = require('../config/logger');

/**
 * Helper to validate location against company geofence settings.
 */
const validateGeofence = async (location) => {
  const settings = await CompanySettings.getSettings();
  const hasValidCoords = location && isValidCoordinate(location.lat, location.lng);

  if (settings.geofenceEnabled) {
    if (!hasValidCoords) {
      const err = new Error('Location permission and valid GPS coordinates are required to punch in/out.');
      err.status = 400;
      err.code = ERROR_CODES.VALIDATION_ERROR;
      throw err;
    }

    const distanceFromOffice = calculateHaversineDistance(
      location.lat,
      location.lng,
      settings.latitude,
      settings.longitude
    );

    if (distanceFromOffice > settings.radiusMeters) {
      const err = new Error(
        `Location outside allowed office geofence. You are ${distanceFromOffice}m away from ${settings.officeName} (maximum allowed is ${settings.radiusMeters}m).`
      );
      err.status = 403;
      err.code = ERROR_CODES.GEOFENCE_OUT_OF_RANGE;
      err.details = {
        distanceFromOffice,
        radiusMeters: settings.radiusMeters,
        officeName: settings.officeName,
      };
      throw err;
    }

    return { settings, distanceFromOffice };
  }

  // Geofencing disabled: still calculate distanceFromOffice if valid coordinates provided
  let distanceFromOffice = null;
  if (hasValidCoords) {
    distanceFromOffice = calculateHaversineDistance(
      location.lat,
      location.lng,
      settings.latitude,
      settings.longitude
    );
  }

  return { settings, distanceFromOffice };
};

/**
 * Punch in for an employee.
 * Creates a new attendance record for the current shift date.
 * Enforces single active shift rule across midnight.
 */
const punchIn = async (userId, { selfieUrl, location }) => {
  const shiftDate = getTodayDate();

  // 1. Check for any currently ACTIVE attendance record (cross-midnight check)
  const activeShift = await Attendance.findOne({
    userId,
    attendanceStatus: ATTENDANCE_STATUS.ACTIVE,
  });
  if (activeShift) {
    const err = new Error('Already punched in and have an active shift in progress');
    err.status = 409;
    err.code = ERROR_CODES.ALREADY_PUNCHED_IN;
    throw err;
  }

  // 2. Check for existing attendance record starting on today's shiftDate
  const existingToday = await Attendance.findOne({ userId, date: shiftDate });
  if (existingToday) {
    const err = new Error('Already completed shift for today');
    err.status = 409;
    err.code = ERROR_CODES.ALREADY_PUNCHED_IN;
    throw err;
  }

  // 3. Geofence validation
  const { distanceFromOffice } = await validateGeofence(location);

  const attendance = await Attendance.create({
    userId,
    date: shiftDate,
    shiftDate,
    punchIn: new Date(),
    punchInSelfie: selfieUrl,
    punchInLocation: {
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy || null,
      address: location.address || null,
      distanceFromOffice: distanceFromOffice !== null ? distanceFromOffice : null,
      capturedAt: new Date(),
    },
    attendanceStatus: ATTENDANCE_STATUS.ACTIVE,
    workingMinutes: 0,
    workedMinutes: 0,
    regularMinutes: 0,
    overtimeMinutes: 0,
  });

  logger.info(`Punch in: userId=${userId}, shiftDate=${shiftDate}, distance=${distanceFromOffice}m`);
  return attendance.populate('userId', 'name email role');
};

/**
 * Punch out for an employee.
 * Finds the employee's active attendance record (regardless of calendar date boundary)
 * and calculates workedMinutes, regularMinutes, overtimeMinutes.
 */
const punchOut = async (userId, { selfieUrl, location }) => {
  // Find employee's active attendance record (supports cross-midnight shifts)
  const attendance = await Attendance.findOne({
    userId,
    attendanceStatus: ATTENDANCE_STATUS.ACTIVE,
  });

  if (!attendance) {
    const err = new Error('No active punch-in shift found');
    err.status = 409;
    err.code = ERROR_CODES.NOT_PUNCHED_IN;
    throw err;
  }

  // 2. Geofence validation for punchOut
  const { distanceFromOffice } = await validateGeofence(location);

  const punchOutTime = new Date();
  const durations = calculateShiftDurations(attendance.punchIn, punchOutTime);
  const status = determineAttendanceStatus(durations.workedMinutes);

  attendance.punchOut = punchOutTime;
  attendance.workedMinutes = durations.workedMinutes;
  attendance.workingMinutes = durations.workedMinutes; // backward compat
  attendance.regularMinutes = durations.regularMinutes;
  attendance.overtimeMinutes = durations.overtimeMinutes;
  attendance.attendanceStatus = status;

  if (selfieUrl) {
    attendance.punchOutSelfie = selfieUrl;
  }
  if (location) {
    attendance.punchOutLocation = {
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy || null,
      address: location.address || null,
      distanceFromOffice: distanceFromOffice !== null ? distanceFromOffice : null,
      capturedAt: new Date(),
    };
  }

  await attendance.save();
  logger.info(
    `Punch out: userId=${userId}, shiftDate=${attendance.shiftDate || attendance.date}, workedMinutes=${durations.workedMinutes}, regularMinutes=${durations.regularMinutes}, overtimeMinutes=${durations.overtimeMinutes}, status=${status}`
  );

  return attendance.populate('userId', 'name email role');
};

/**
 * Attaches calculated elapsed working minutes to active attendance records.
 */
const formatAttendanceRecord = (rec) => {
  if (!rec) return rec;
  const obj = typeof rec.toObject === 'function' ? rec.toObject() : { ...rec };
  if (!obj.shiftDate) {
    obj.shiftDate = obj.date;
  }
  if (obj.attendanceStatus === ATTENDANCE_STATUS.ACTIVE && obj.punchIn && !obj.punchOut) {
    const elapsed = calculateWorkingMinutes(obj.punchIn, new Date());
    obj.workingMinutes = elapsed;
    obj.workedMinutes = elapsed;
    obj.regularMinutes = Math.min(elapsed, 480);
    obj.overtimeMinutes = Math.max(elapsed - 480, 0);
  }
  return obj;
};

/**
 * Get current/today's attendance for an employee.
 * Prioritizes active shift (even if started on previous calendar day).
 */
const getTodayAttendance = async (userId) => {
  // 1. Check for an active shift first (handles night shift running past midnight)
  let attendance = await Attendance.findOne({
    userId,
    attendanceStatus: ATTENDANCE_STATUS.ACTIVE,
  })
    .populate('userId', 'name email role')
    .populate('validatedBy', 'name role')
    .populate('overtimeRequest');

  // 2. If no active shift, check for record on today's shiftDate
  if (!attendance) {
    const todayStr = getTodayDate();
    attendance = await Attendance.findOne({ userId, date: todayStr })
      .populate('userId', 'name email role')
      .populate('validatedBy', 'name role')
      .populate('overtimeRequest');
  }

  return formatAttendanceRecord(attendance);
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

  return { attendances: attendances.map(formatAttendanceRecord), total, page: Number(page), limit: Number(limit) };
};

/**
 * Get team attendance for a manager (paginated).
 */
const getTeamAttendance = async (managerId, { page = 1, limit = 20, userId, date, validationStatus }) => {
  // Get all team member IDs
  const teamMembers = await User.find({ managerId }).select('_id');
  const teamIds = teamMembers.map((m) => m._id);

  const query = { userId: { $in: teamIds } };
  if (userId) query.userId = userId;
  if (date) query.date = date;
  if (validationStatus) query.validationStatus = validationStatus;

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

  return { attendances: attendances.map(formatAttendanceRecord), total, page: Number(page), limit: Number(limit) };
};

/**
 * Get all attendance for admin (paginated).
 */
const getAllAttendance = async ({ page = 1, limit = 20, userId, date, startDate, endDate, validationStatus }) => {
  const query = {};
  if (userId) query.userId = userId;
  if (date) query.date = date;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }
  if (validationStatus) query.validationStatus = validationStatus;

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

  return { attendances: attendances.map(formatAttendanceRecord), total, page: Number(page), limit: Number(limit) };
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
