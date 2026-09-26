const overtimeService = require('../services/overtime.service');
const { sendSuccess } = require('../utils/response');

const requestOvertime = async (req, res, next) => {
  try {
    const { attendanceId, requestedHours, reason } = req.body;
    const otRequest = await overtimeService.requestOvertime(req.user._id, { attendanceId, requestedHours, reason });
    return sendSuccess(res, 201, 'Overtime request submitted', { overtimeRequest: otRequest });
  } catch (error) {
    next(error);
  }
};

const getMyOvertime = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await overtimeService.getMyOvertime(req.user._id, { page, limit });
    return sendSuccess(res, 200, 'My overtime requests', result);
  } catch (error) {
    next(error);
  }
};

const getPendingOvertime = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await overtimeService.getPendingOvertime(req.user._id, req.user.role, { page, limit });
    return sendSuccess(res, 200, 'Pending overtime requests', result);
  } catch (error) {
    next(error);
  }
};

const approveOvertime = async (req, res, next) => {
  try {
    const { reviewRemarks } = req.body;
    const otRequest = await overtimeService.approveOvertime(req.params.id, req.user._id, req.user.role, { reviewRemarks });
    return sendSuccess(res, 200, 'Overtime approved', { overtimeRequest: otRequest });
  } catch (error) {
    next(error);
  }
};

const rejectOvertime = async (req, res, next) => {
  try {
    const { reviewRemarks } = req.body;
    const otRequest = await overtimeService.rejectOvertime(req.params.id, req.user._id, req.user.role, { reviewRemarks });
    return sendSuccess(res, 200, 'Overtime rejected', { overtimeRequest: otRequest });
  } catch (error) {
    next(error);
  }
};

module.exports = { requestOvertime, getMyOvertime, getPendingOvertime, approveOvertime, rejectOvertime };
