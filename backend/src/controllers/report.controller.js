const reportService = require('../services/report.service');
const { sendSuccess } = require('../utils/response');

const getDailyReport = async (req, res, next) => {
  try {
    const { date, userId, page, limit } = req.query;
    const result = await reportService.getDailyReport(
      req.user._id,
      req.user.role,
      { date, userId, page, limit }
    );
    return sendSuccess(res, 200, 'Daily attendance report', result);
  } catch (error) {
    next(error);
  }
};

const getAdminStats = async (req, res, next) => {
  try {
    const stats = await reportService.getAdminStats();
    return sendSuccess(res, 200, 'Admin dashboard stats', { stats });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDailyReport, getAdminStats };
