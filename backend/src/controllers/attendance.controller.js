const attendanceService = require('../services/attendance.service');
const { sendSuccess } = require('../utils/response');
const { emitToUser, emitToManager, emitToManagersAndAdmins } = require('../socket/socketServer');
const User = require('../models/User');

const punchIn = async (req, res, next) => {
  try {
    const { selfieUrl, location } = req.body;
    const attendance = await attendanceService.punchIn(req.user._id, { selfieUrl, location });

    // ── Real-time: notify manager & admins of punch-in ──────────────────────
    if (req.user.managerId) {
      emitToManager(req.user.managerId, 'attendance:punch-in', {
        employee: { _id: req.user._id, name: req.user.name, email: req.user.email },
        attendance,
        timestamp: new Date(),
      });
    } else {
      emitToManagersAndAdmins('attendance:punch-in', {
        employee: { _id: req.user._id, name: req.user.name, email: req.user.email },
        attendance,
        timestamp: new Date(),
      });
    }

    // Notify the employee themselves so other tabs refresh
    emitToUser(req.user._id, 'attendance:updated', { attendance });

    return sendSuccess(res, 201, 'Punched in successfully', { attendance });
  } catch (error) {
    next(error);
  }
};

const punchOut = async (req, res, next) => {
  try {
    const { selfieUrl, location } = req.body;
    const attendance = await attendanceService.punchOut(req.user._id, { selfieUrl, location });

    // ── Real-time: notify manager & admins of punch-out ──────────────────────
    if (req.user.managerId) {
      emitToManager(req.user.managerId, 'attendance:punch-out', {
        employee: { _id: req.user._id, name: req.user.name, email: req.user.email },
        attendance,
        timestamp: new Date(),
      });
    } else {
      emitToManagersAndAdmins('attendance:punch-out', {
        employee: { _id: req.user._id, name: req.user.name, email: req.user.email },
        attendance,
        timestamp: new Date(),
      });
    }

    // Personal refresh event
    emitToUser(req.user._id, 'attendance:updated', { attendance });

    return sendSuccess(res, 200, 'Punched out successfully', { attendance });
  } catch (error) {
    next(error);
  }
};

const getTodayAttendance = async (req, res, next) => {
  try {
    const attendance = await attendanceService.getTodayAttendance(req.user._id);
    return sendSuccess(res, 200, 'Today attendance', { attendance });
  } catch (error) {
    next(error);
  }
};

const getMyAttendance = async (req, res, next) => {
  try {
    const { page, limit, startDate, endDate } = req.query;
    const result = await attendanceService.getMyAttendance(req.user._id, { page, limit, startDate, endDate });
    return sendSuccess(res, 200, 'My attendance history', result);
  } catch (error) {
    next(error);
  }
};

const getTeamAttendance = async (req, res, next) => {
  try {
    const { page, limit, userId, date, validationStatus } = req.query;
    const result = await attendanceService.getTeamAttendance(req.user._id, { page, limit, userId, date, validationStatus });
    return sendSuccess(res, 200, 'Team attendance', result);
  } catch (error) {
    next(error);
  }
};

const getAllAttendance = async (req, res, next) => {
  try {
    const { page, limit, userId, date, startDate, endDate, validationStatus } = req.query;
    const result = await attendanceService.getAllAttendance({ page, limit, userId, date, startDate, endDate, validationStatus });
    return sendSuccess(res, 200, 'All attendance', result);
  } catch (error) {
    next(error);
  }
};

const validateAttendance = async (req, res, next) => {
  try {
    const { validationStatus, validationRemarks } = req.body;
    const attendance = await attendanceService.validateAttendance(
      req.params.id,
      req.user._id,
      req.user.role,
      { validationStatus, validationRemarks }
    );

    // ── Real-time: notify the employee whose attendance was validated ────────
    const employeeId = attendance.userId?._id || attendance.userId;
    if (employeeId) {
      emitToUser(employeeId, 'attendance:validated', {
        attendance,
        validationStatus,
        validationRemarks,
        validatedBy: { name: req.user.name, role: req.user.role },
        timestamp: new Date(),
      });
    }

    return sendSuccess(res, 200, 'Attendance validated', { attendance });
  } catch (error) {
    next(error);
  }
};

module.exports = { punchIn, punchOut, getTodayAttendance, getMyAttendance, getTeamAttendance, getAllAttendance, validateAttendance };
