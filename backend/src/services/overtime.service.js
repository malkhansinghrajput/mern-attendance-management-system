const OvertimeRequest = require('../models/OvertimeRequest');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { ERROR_CODES } = require('../constants/errors');
const { OVERTIME_STATUS, ATTENDANCE_STATUS } = require('../constants/attendance');
const logger = require('../config/logger');

/**
 * Create an overtime request for a completed/incomplete attendance.
 */
const requestOvertime = async (employeeId, { attendanceId, requestedHours, reason }) => {
  // Verify attendance belongs to employee and is punched out
  const attendance = await Attendance.findById(attendanceId);
  if (!attendance) {
    const err = new Error('Attendance record not found');
    err.status = 404;
    err.code = ERROR_CODES.ATTENDANCE_NOT_FOUND;
    throw err;
  }

  if (attendance.userId.toString() !== employeeId.toString()) {
    const err = new Error('Access denied');
    err.status = 403;
    err.code = ERROR_CODES.FORBIDDEN;
    throw err;
  }

  if (attendance.attendanceStatus === ATTENDANCE_STATUS.ACTIVE) {
    const err = new Error('Please punch out before requesting overtime');
    err.status = 400;
    err.code = ERROR_CODES.OVERTIME_REQUIRES_PUNCHOUT;
    throw err;
  }

  // Check for existing OT request
  const existing = await OvertimeRequest.findOne({ attendanceId });
  if (existing) {
    const err = new Error('Overtime request already submitted for this attendance');
    err.status = 409;
    err.code = ERROR_CODES.OVERTIME_EXISTS;
    throw err;
  }

  const otRequest = await OvertimeRequest.create({
    employeeId,
    attendanceId,
    requestedHours,
    reason,
  });

  // Link the OT request to the attendance record
  attendance.overtimeRequest = otRequest._id;
  await attendance.save();

  logger.info(`OT request: employeeId=${employeeId}, attendanceId=${attendanceId}, hours=${requestedHours}`);
  return await otRequest.populate('employeeId', 'name email');
};

/**
 * Get employee's own overtime requests.
 */
const getMyOvertime = async (employeeId, { page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const [requests, total] = await Promise.all([
    OvertimeRequest.find({ employeeId })
      .populate('employeeId', 'name email')
      .populate('reviewedBy', 'name role')
      .populate('attendanceId', 'date workingMinutes attendanceStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    OvertimeRequest.countDocuments({ employeeId }),
  ]);
  return { requests, total, page: Number(page), limit: Number(limit) };
};

/**
 * Get pending overtime requests (Manager = team only, Admin = all).
 */
const getPendingOvertime = async (reviewerId, reviewerRole, { page = 1, limit = 20 }) => {
  const query = { status: OVERTIME_STATUS.PENDING };

  if (reviewerRole === 'manager') {
    const teamMembers = await User.find({ managerId: reviewerId }).select('_id');
    const teamIds = teamMembers.map((m) => m._id);
    query.employeeId = { $in: teamIds };
  }

  const skip = (page - 1) * limit;
  const [requests, total] = await Promise.all([
    OvertimeRequest.find(query)
      .populate('employeeId', 'name email role')
      .populate('attendanceId', 'date workingMinutes attendanceStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    OvertimeRequest.countDocuments(query),
  ]);

  return { requests, total, page: Number(page), limit: Number(limit) };
};

/**
 * Approve an overtime request.
 */
const approveOvertime = async (otId, reviewerId, reviewerRole, { reviewRemarks }) => {
  const otRequest = await OvertimeRequest.findById(otId).populate('employeeId', 'name managerId');
  if (!otRequest) {
    const err = new Error('Overtime request not found');
    err.status = 404;
    err.code = ERROR_CODES.OVERTIME_NOT_FOUND;
    throw err;
  }

  if (otRequest.status !== OVERTIME_STATUS.PENDING) {
    const err = new Error('Overtime request already reviewed');
    err.status = 409;
    err.code = ERROR_CODES.OVERTIME_ALREADY_REVIEWED;
    throw err;
  }

  // Manager scope check
  if (reviewerRole === 'manager') {
    const employee = await User.findById(otRequest.employeeId._id);
    if (!employee || employee.managerId?.toString() !== reviewerId.toString()) {
      const err = new Error('You can only review your team members\' overtime requests');
      err.status = 403;
      err.code = ERROR_CODES.FORBIDDEN;
      throw err;
    }
  }

  otRequest.status = OVERTIME_STATUS.APPROVED;
  otRequest.reviewedBy = reviewerId;
  otRequest.reviewedAt = new Date();
  otRequest.reviewRemarks = reviewRemarks || null;
  await otRequest.save();

  logger.info(`OT approved: otId=${otId}, by=${reviewerId}`);
  return await otRequest.populate([
    { path: 'employeeId', select: 'name email' },
    { path: 'reviewedBy', select: 'name role' },
  ]);
};

/**
 * Reject an overtime request.
 */
const rejectOvertime = async (otId, reviewerId, reviewerRole, { reviewRemarks }) => {
  const otRequest = await OvertimeRequest.findById(otId).populate('employeeId', 'name managerId');
  if (!otRequest) {
    const err = new Error('Overtime request not found');
    err.status = 404;
    err.code = ERROR_CODES.OVERTIME_NOT_FOUND;
    throw err;
  }

  if (otRequest.status !== OVERTIME_STATUS.PENDING) {
    const err = new Error('Overtime request already reviewed');
    err.status = 409;
    err.code = ERROR_CODES.OVERTIME_ALREADY_REVIEWED;
    throw err;
  }

  // Manager scope check
  if (reviewerRole === 'manager') {
    const employee = await User.findById(otRequest.employeeId._id);
    if (!employee || employee.managerId?.toString() !== reviewerId.toString()) {
      const err = new Error('You can only review your team members\' overtime requests');
      err.status = 403;
      err.code = ERROR_CODES.FORBIDDEN;
      throw err;
    }
  }

  otRequest.status = OVERTIME_STATUS.REJECTED;
  otRequest.reviewedBy = reviewerId;
  otRequest.reviewedAt = new Date();
  otRequest.reviewRemarks = reviewRemarks || null;
  await otRequest.save();

  logger.info(`OT rejected: otId=${otId}, by=${reviewerId}`);
  return await otRequest.populate([
    { path: 'employeeId', select: 'name email' },
    { path: 'reviewedBy', select: 'name role' },
  ]);
};

module.exports = {
  requestOvertime,
  getMyOvertime,
  getPendingOvertime,
  approveOvertime,
  rejectOvertime,
};
