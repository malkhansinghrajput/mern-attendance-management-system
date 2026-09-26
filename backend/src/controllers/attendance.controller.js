const attendanceService = require('../services/attendance.service');
const { sendSuccess } = require('../utils/response');

const punchIn = async (req, res, next) => {
  try {
    const { selfieUrl, location } = req.body;
    const attendance = await attendanceService.punchIn(req.user._id, { selfieUrl, location });
    return sendSuccess(res, 201, 'Punched in successfully', { attendance });
  } catch (error) {
    next(error);
  }
};

const punchOut = async (req, res, next) => {
  try {
    const { selfieUrl, location } = req.body;
    const attendance = await attendanceService.punchOut(req.user._id, { selfieUrl, location });
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
    const { page, limit, userId, date } = req.query;
    const result = await attendanceService.getTeamAttendance(req.user._id, { page, limit, userId, date });
    return sendSuccess(res, 200, 'Team attendance', result);
  } catch (error) {
    next(error);
  }
};

const getAllAttendance = async (req, res, next) => {
  try {
    const { page, limit, userId, date, startDate, endDate } = req.query;
    const result = await attendanceService.getAllAttendance({ page, limit, userId, date, startDate, endDate });
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
    return sendSuccess(res, 200, 'Attendance validated', { attendance });
  } catch (error) {
    next(error);
  }
};

module.exports = { punchIn, punchOut, getTodayAttendance, getMyAttendance, getTeamAttendance, getAllAttendance, validateAttendance };
