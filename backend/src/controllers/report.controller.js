const reportService = require('../services/report.service');
const exportService = require('../services/reportExport.service');
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

/**
 * GET /api/reports/attendance/export/pdf
 * Export attendance report as PDF.
 */
const exportAttendancePdf = async (req, res, next) => {
  try {
    const { date, userId, status, validation, startDate, endDate } = req.query;
    const exportData = await exportService.getAttendanceExportData(
      req.user._id,
      req.user.role,
      { date, userId, status, validation, startDate, endDate },
      req.user
    );

    const filename = `AttendPro_Attendance_Report_${exportData.summary.rawDate}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await exportService.generateAttendancePdf(exportData, res);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/attendance/export/excel
 * Export attendance report as Excel workbook.
 */
const exportAttendanceExcel = async (req, res, next) => {
  try {
    const { date, userId, status, validation, startDate, endDate } = req.query;
    const exportData = await exportService.getAttendanceExportData(
      req.user._id,
      req.user.role,
      { date, userId, status, validation, startDate, endDate },
      req.user
    );

    const filename = `AttendPro_Attendance_Report_${exportData.summary.rawDate}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await exportService.generateAttendanceExcel(exportData, res);
    res.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDailyReport,
  getAdminStats,
  exportAttendancePdf,
  exportAttendanceExcel,
};
