const overtimeService = require('../services/overtime.service');
const { sendSuccess } = require('../utils/response');
const { emitToUser, emitToManager, emitToManagersAndAdmins } = require('../socket/socketServer');

const requestOvertime = async (req, res, next) => {
  try {
    const { attendanceId, requestedHours, reason } = req.body;
    const otRequest = await overtimeService.requestOvertime(req.user._id, { attendanceId, requestedHours, reason });

    // ── Real-time: notify managers/admins of new OT request ─────────────────
    if (req.user.managerId) {
      emitToManager(req.user.managerId, 'overtime:new-request', {
        employee: { _id: req.user._id, name: req.user.name, email: req.user.email },
        overtimeRequest: otRequest,
        timestamp: new Date(),
      });
    } else {
      emitToManagersAndAdmins('overtime:new-request', {
        employee: { _id: req.user._id, name: req.user.name, email: req.user.email },
        overtimeRequest: otRequest,
        timestamp: new Date(),
      });
    }

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

    // ── Real-time: notify the employee of approval ───────────────────────────
    const employeeId = otRequest.employeeId?._id || otRequest.employeeId;
    if (employeeId) {
      emitToUser(employeeId, 'overtime:approved', {
        overtimeRequest: otRequest,
        reviewedBy: { name: req.user.name, role: req.user.role },
        reviewRemarks,
        timestamp: new Date(),
      });
    }

    return sendSuccess(res, 200, 'Overtime approved', { overtimeRequest: otRequest });
  } catch (error) {
    next(error);
  }
};

const rejectOvertime = async (req, res, next) => {
  try {
    const { reviewRemarks } = req.body;
    const otRequest = await overtimeService.rejectOvertime(req.params.id, req.user._id, req.user.role, { reviewRemarks });

    // ── Real-time: notify the employee of rejection ──────────────────────────
    const employeeId = otRequest.employeeId?._id || otRequest.employeeId;
    if (employeeId) {
      emitToUser(employeeId, 'overtime:rejected', {
        overtimeRequest: otRequest,
        reviewedBy: { name: req.user.name, role: req.user.role },
        reviewRemarks,
        timestamp: new Date(),
      });
    }

    return sendSuccess(res, 200, 'Overtime rejected', { overtimeRequest: otRequest });
  } catch (error) {
    next(error);
  }
};

module.exports = { requestOvertime, getMyOvertime, getPendingOvertime, approveOvertime, rejectOvertime };
