const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const {
  getTodayDate,
  formatWorkingHours,
  formatDateDDMMYYYY,
  formatTime,
  formatDateTime,
} = require('../utils/dateUtils');
const { calculateWorkingMinutes } = require('./workingHours.service');
const { ATTENDANCE_STATUS, VALIDATION_STATUS } = require('../constants/attendance');

/**
 * Fetch and shape attendance data for export according to requester role and filters.
 */
const getAttendanceExportData = async (requesterId, requesterRole, filters = {}, requesterUser = null) => {
  const { date, userId, status, validation, startDate, endDate } = filters;
  const reportDate = date || getTodayDate();

  let query = {};

  // Date or Date Range
  if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate };
  } else {
    query.date = reportDate;
  }

  // Filter by status if provided
  if (status && Object.values(ATTENDANCE_STATUS).includes(status)) {
    query.attendanceStatus = status;
  }

  // Filter by validation status if provided
  if (validation && Object.values(VALIDATION_STATUS).includes(validation)) {
    query.validationStatus = validation;
  }

  // Role-based Access Control
  if (requesterRole === 'employee') {
    // Employee can ONLY export their own attendance
    query.userId = requesterId;
  } else if (requesterRole === 'manager') {
    // Manager can export team attendance
    const teamMembers = await User.find({ managerId: requesterId }).select('_id');
    const teamIds = teamMembers.map((m) => m._id);
    query.userId = { $in: teamIds };
    if (userId) {
      // Must be within team
      const isTeamMember = teamIds.some((id) => id.toString() === userId.toString());
      query.userId = isTeamMember ? userId : { $in: [] };
    }
  } else if (requesterRole === 'admin') {
    // Admin can export system-wide attendance or filter by specific user
    if (userId) {
      query.userId = userId;
    }
  }

  const records = await Attendance.find(query)
    .populate('userId', 'name email role employeeId')
    .populate('validatedBy', 'name role')
    .populate('overtimeRequest')
    .sort({ date: -1, punchIn: -1 })
    .lean();

  // Summary counters
  let totalWorkingMinutes = 0;
  let totalOvertimeMinutes = 0;
  let presentActive = 0;
  let completed = 0;
  let incomplete = 0;
  let validCount = 0;
  let invalidCount = 0;
  let pendingCount = 0;

  const shapedRecords = records.map((a) => {
    const isRecordActive =
      a.attendanceStatus === ATTENDANCE_STATUS.ACTIVE && a.punchIn && !a.punchOut;
    const workingMins = isRecordActive
      ? calculateWorkingMinutes(a.punchIn, new Date())
      : a.workingMinutes || 0;

    const otMins =
      a.overtimeMinutes ||
      (a.overtimeRequest?.requestedHours ? Math.round(a.overtimeRequest.requestedHours * 60) : 0);

    totalWorkingMinutes += workingMins;
    totalOvertimeMinutes += otMins;

    if (a.attendanceStatus === ATTENDANCE_STATUS.ACTIVE) presentActive++;
    else if (a.attendanceStatus === ATTENDANCE_STATUS.COMPLETED) completed++;
    else if (a.attendanceStatus === ATTENDANCE_STATUS.INCOMPLETE) incomplete++;

    if (a.validationStatus === 'valid') validCount++;
    else if (a.validationStatus === 'invalid') invalidCount++;
    else if (a.validationStatus === 'pending') pendingCount++;

    // Cross-midnight detection
    let isCrossMidnight = false;
    let punchOutDateStr = '';
    if (a.punchIn && a.punchOut) {
      const inDate = formatDateDDMMYYYY(a.punchIn);
      const outDate = formatDateDDMMYYYY(a.punchOut);
      if (inDate !== outDate) {
        isCrossMidnight = true;
        punchOutDateStr = outDate;
      }
    }

    // Human readable location
    let locationStr = '—';
    if (a.punchInLocation) {
      if (a.punchInLocation.address) {
        locationStr = a.punchInLocation.address;
      } else if (a.punchInLocation.lat != null && a.punchInLocation.lng != null) {
        locationStr = `${Number(a.punchInLocation.lat).toFixed(4)}, ${Number(a.punchInLocation.lng).toFixed(4)}`;
      }
    }

    return {
      _id: a._id,
      employeeName: a.userId?.name || 'Unknown Employee',
      employeeEmail: a.userId?.email || '—',
      employeeId: a.userId?.employeeId || '—',
      date: a.date,
      dateFormatted: formatDateDDMMYYYY(a.date),
      shiftDate: a.shiftDate || a.date,
      punchIn: a.punchIn,
      punchInFormatted: a.punchIn ? formatTime(a.punchIn) : '—',
      punchOut: a.punchOut,
      punchOutFormatted: a.punchOut ? formatTime(a.punchOut) : '—',
      isCrossMidnight,
      punchOutDateStr,
      workingMinutes: workingMins,
      workingHoursFormatted: formatWorkingHours(workingMins),
      overtimeMinutes: otMins,
      overtimeHoursFormatted: formatWorkingHours(otMins),
      attendanceStatus: a.attendanceStatus || '—',
      validationStatus: a.validationStatus || '—',
      validatedByName: a.validatedBy?.name || '—',
      otStatus: a.overtimeRequest?.status ? a.overtimeRequest.status.toUpperCase() : 'NONE',
      location: locationStr,
      latitude: a.punchInLocation?.lat != null ? a.punchInLocation.lat : '—',
      longitude: a.punchInLocation?.lng != null ? a.punchInLocation.lng : '—',
      selfieStatus: a.punchInSelfie ? 'Available' : 'Not Available',
    };
  });

  const displayDate =
    startDate && endDate ? `${formatDateDDMMYYYY(startDate)} to ${formatDateDDMMYYYY(endDate)}` : formatDateDDMMYYYY(reportDate);

  const rawDate = startDate && endDate ? `${startDate}_to_${endDate}` : reportDate;

  const requesterName = requesterUser?.name || 'System User';
  const requesterRoleFormatted = requesterRole ? requesterRole.toUpperCase() : 'USER';

  return {
    records: shapedRecords,
    summary: {
      reportDate: displayDate,
      rawDate,
      generatedAt: formatDateTime(new Date()),
      generatedBy: `${requesterName} (${requesterRoleFormatted})`,
      totalRecords: shapedRecords.length,
      presentActive,
      completed,
      incomplete,
      validCount,
      invalidCount,
      pendingCount,
      totalWorkingMinutes,
      totalWorkingHoursFormatted: formatWorkingHours(totalWorkingMinutes),
      totalOvertimeMinutes,
      totalOvertimeHoursFormatted: formatWorkingHours(totalOvertimeMinutes),
    },
  };
};

/**
 * Generate PDF Attendance Report using PDFKit (Landscape A4)
 */
const generateAttendancePdf = async (exportData, outputStream) => {
  return new Promise((resolve, reject) => {
    try {
      const { records, summary } = exportData;

      // Landscape A4: 841.89 x 595.28 pt
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: { top: 28, bottom: 35, left: 28, right: 28 },
        bufferPages: true,
      });

      doc.on('error', (err) => reject(err));
      outputStream.on('finish', () => resolve());
      outputStream.on('error', (err) => reject(err));

      doc.pipe(outputStream);

      const printableWidth = 841.89 - 56; // 785.89 pt
      const leftMargin = 28;

      // ─── Header ──────────────────────────────────────────────
      // Top accent bar
      doc.rect(leftMargin, 22, printableWidth, 4).fill('#4F46E5');

      // Title & Branding
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#1E293B').text('AttendPro', leftMargin, 32);
      doc.font('Helvetica').fontSize(9).fillColor('#64748B').text('Attendance Management System', leftMargin, 53);

      // Report Info (Right aligned block)
      const rightColX = 540;
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#1E293B').text('Daily Attendance Report', rightColX, 32, { align: 'right', width: 270 });
      doc.font('Helvetica').fontSize(8.5).fillColor('#475569');
      doc.text(`Report Date: ${summary.reportDate}`, rightColX, 48, { align: 'right', width: 270 });
      doc.text(`Generated At: ${summary.generatedAt}`, rightColX, 60, { align: 'right', width: 270 });
      doc.text(`Generated By: ${summary.generatedBy}`, rightColX, 72, { align: 'right', width: 270 });

      // Separator line
      doc.strokeColor('#CBD5E1').lineWidth(0.75).moveTo(leftMargin, 86).lineTo(leftMargin + printableWidth, 86).stroke();

      // ─── Summary KPI Cards ────────────────────────────────────
      const kpis = [
        { label: 'Total Records', value: String(summary.totalRecords) },
        { label: 'Active / Present', value: String(summary.presentActive) },
        { label: 'Completed Shifts', value: String(summary.completed) },
        { label: 'Incomplete', value: String(summary.incomplete) },
        { label: 'Total Working Hrs', value: summary.totalWorkingHoursFormatted },
        { label: 'Total Overtime', value: summary.totalOvertimeHoursFormatted },
      ];

      const kpiGap = 8;
      const kpiWidth = (printableWidth - kpiGap * 5) / 6;
      const kpiY = 94;
      const kpiHeight = 36;

      kpis.forEach((kpi, idx) => {
        const x = leftMargin + idx * (kpiWidth + kpiGap);
        // Box
        doc.roundedRect(x, kpiY, kpiWidth, kpiHeight, 4).fillAndStroke('#F8FAFC', '#E2E8F0');
        // Label
        doc.font('Helvetica').fontSize(7.5).fillColor('#64748B').text(kpi.label, x + 4, kpiY + 5, { width: kpiWidth - 8, align: 'center' });
        // Value
        doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#1E293B').text(kpi.value, x + 4, kpiY + 18, { width: kpiWidth - 8, align: 'center' });
      });

      // ─── Table Structure ──────────────────────────────────────
      const columns = [
        { header: 'Employee', width: 140, align: 'left' },
        { header: 'Date', width: 64, align: 'center' },
        { header: 'Punch In', width: 66, align: 'center' },
        { header: 'Punch Out', width: 76, align: 'center' },
        { header: 'Working Hrs', width: 68, align: 'center' },
        { header: 'Status', width: 64, align: 'center' },
        { header: 'Validation', width: 64, align: 'center' },
        { header: 'OT Status', width: 60, align: 'center' },
        { header: 'Location', width: 125, align: 'left' },
        { header: 'Selfie', width: 58, align: 'center' },
      ];

      const tableTopY = 138;
      const headerHeight = 20;

      const drawTableHeader = (y) => {
        doc.rect(leftMargin, y, printableWidth, headerHeight).fill('#1E293B');
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#FFFFFF');

        let curX = leftMargin;
        columns.forEach((col) => {
          doc.text(col.header, curX + 4, y + 6, {
            width: col.width - 8,
            align: col.align,
          });
          curX += col.width;
        });
      };

      drawTableHeader(tableTopY);

      let currentY = tableTopY + headerHeight;

      if (records.length === 0) {
        // Empty state block
        doc.rect(leftMargin, currentY, printableWidth, 42).fillAndStroke('#FFFFFF', '#E2E8F0');
        doc.font('Helvetica-Oblique').fontSize(9.5).fillColor('#64748B').text(
          'No attendance records found for the selected date.',
          leftMargin,
          currentY + 15,
          { width: printableWidth, align: 'center' }
        );
      } else {
        records.forEach((rec, index) => {
          const rowHeight = 24;

          // Check if page overflow
          if (currentY + rowHeight > 545) {
            doc.addPage();
            // Accent line on new page
            doc.rect(leftMargin, 22, printableWidth, 3).fill('#4F46E5');
            // Redraw table header
            drawTableHeader(32);
            currentY = 32 + headerHeight;
          }

          // Row background
          const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
          doc.rect(leftMargin, currentY, printableWidth, rowHeight).fillAndStroke(rowBg, '#F1F5F9');

          let cellX = leftMargin;

          // 1. Employee Name & Email
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0F172A').text(
            rec.employeeName,
            cellX + 4,
            currentY + 4,
            { width: columns[0].width - 8, height: 10, ellipsis: true }
          );
          doc.font('Helvetica').fontSize(6.8).fillColor('#64748B').text(
            rec.employeeEmail,
            cellX + 4,
            currentY + 13,
            { width: columns[0].width - 8, height: 9, ellipsis: true }
          );
          cellX += columns[0].width;

          // 2. Date
          doc.font('Helvetica').fontSize(7.5).fillColor('#334155').text(
            rec.dateFormatted,
            cellX + 2,
            currentY + 7,
            { width: columns[1].width - 4, align: 'center' }
          );
          cellX += columns[1].width;

          // 3. Punch In
          doc.font('Helvetica').fontSize(7.5).fillColor('#334155').text(
            rec.punchInFormatted,
            cellX + 2,
            currentY + 7,
            { width: columns[2].width - 4, align: 'center' }
          );
          cellX += columns[2].width;

          // 4. Punch Out (handling cross-midnight)
          if (rec.isCrossMidnight) {
            doc.font('Helvetica').fontSize(7.2).fillColor('#334155').text(
              rec.punchOutFormatted,
              cellX + 2,
              currentY + 3,
              { width: columns[3].width - 4, align: 'center' }
            );
            doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#4F46E5').text(
              `(${rec.punchOutDateStr.slice(0, 5)})`,
              cellX + 2,
              currentY + 13,
              { width: columns[3].width - 4, align: 'center' }
            );
          } else {
            doc.font('Helvetica').fontSize(7.5).fillColor('#334155').text(
              rec.punchOutFormatted,
              cellX + 2,
              currentY + 7,
              { width: columns[3].width - 4, align: 'center' }
            );
          }
          cellX += columns[3].width;

          // 5. Working Hours
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#334155').text(
            rec.workingHoursFormatted,
            cellX + 2,
            currentY + 7,
            { width: columns[4].width - 4, align: 'center' }
          );
          cellX += columns[4].width;

          // 6. Status
          let statusColor = '#334155';
          if (rec.attendanceStatus === 'completed') statusColor = '#16A34A';
          else if (rec.attendanceStatus === 'active') statusColor = '#2563EB';
          else if (rec.attendanceStatus === 'incomplete') statusColor = '#D97706';

          doc.font('Helvetica-Bold').fontSize(7.2).fillColor(statusColor).text(
            rec.attendanceStatus.toUpperCase(),
            cellX + 2,
            currentY + 7,
            { width: columns[5].width - 4, align: 'center' }
          );
          cellX += columns[5].width;

          // 7. Validation
          let valColor = '#D97706';
          if (rec.validationStatus === 'valid') valColor = '#16A34A';
          else if (rec.validationStatus === 'invalid') valColor = '#DC2626';

          doc.font('Helvetica-Bold').fontSize(7.2).fillColor(valColor).text(
            rec.validationStatus.toUpperCase(),
            cellX + 2,
            currentY + 7,
            { width: columns[6].width - 4, align: 'center' }
          );
          cellX += columns[6].width;

          // 8. OT Status
          doc.font('Helvetica').fontSize(7.2).fillColor('#64748B').text(
            rec.otStatus,
            cellX + 2,
            currentY + 7,
            { width: columns[7].width - 4, align: 'center' }
          );
          cellX += columns[7].width;

          // 9. Location
          doc.font('Helvetica').fontSize(6.8).fillColor('#475569').text(
            rec.location,
            cellX + 4,
            currentY + 7,
            { width: columns[8].width - 8, height: 12, ellipsis: true }
          );
          cellX += columns[8].width;

          // 10. Selfie
          const selfieText = rec.selfieStatus === 'Available' ? 'Available' : '—';
          doc.font('Helvetica').fontSize(7.2).fillColor(rec.selfieStatus === 'Available' ? '#16A34A' : '#94A3B8').text(
            selfieText,
            cellX + 2,
            currentY + 7,
            { width: columns[9].width - 4, align: 'center' }
          );

          currentY += rowHeight;
        });
      }

      // ─── Add Page Numbers to Buffered Pages ───────────────────
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        // Bottom divider
        doc.strokeColor('#E2E8F0').lineWidth(0.5).moveTo(leftMargin, 565).lineTo(leftMargin + printableWidth, 565).stroke();

        doc.font('Helvetica').fontSize(7.5).fillColor('#94A3B8').text(
          'AttendPro — Smart Attendance Management System',
          leftMargin,
          570,
          { width: 300, align: 'left' }
        );
        doc.text(
          `Page ${i + 1} of ${range.count}`,
          leftMargin + printableWidth - 150,
          570,
          { width: 150, align: 'right' }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate Excel Attendance Report using ExcelJS
 */
const generateAttendanceExcel = async (exportData, outputStream) => {
  const { records, summary } = exportData;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AttendPro';
  workbook.lastModifiedBy = 'AttendPro System';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ─── SHEET 1: Attendance Report ─────────────────────────────
  const sheet1 = workbook.addWorksheet('Attendance Report', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet1.columns = [
    { header: 'Employee Name', key: 'employeeName', width: 24 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Punch In', key: 'punchIn', width: 16 },
    { header: 'Punch Out', key: 'punchOut', width: 22 },
    { header: 'Working Hours', key: 'workingHours', width: 16 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Validation', key: 'validation', width: 14 },
    { header: 'OT Status', key: 'otStatus', width: 14 },
    { header: 'Latitude', key: 'latitude', width: 14 },
    { header: 'Longitude', key: 'longitude', width: 14 },
    { header: 'Location', key: 'location', width: 32 },
    { header: 'Selfie Status', key: 'selfie', width: 16 },
  ];

  // Style Header Row
  const headerRow = sheet1.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FF4F46E5' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };
  });

  // Enable AutoFilter
  sheet1.autoFilter = 'A1:M1';

  if (records.length === 0) {
    const emptyRow = sheet1.addRow({
      employeeName: 'No attendance records found for the selected date.',
    });
    emptyRow.height = 24;
    emptyRow.getCell(1).font = { italic: true, color: { argb: 'FF64748B' } };
  } else {
    records.forEach((rec, idx) => {
      let punchOutDisplay = rec.punchOutFormatted;
      if (rec.isCrossMidnight) {
        punchOutDisplay = `${rec.punchOutFormatted} (${rec.punchOutDateStr})`;
      }

      const row = sheet1.addRow({
        employeeName: rec.employeeName,
        email: rec.employeeEmail,
        date: rec.dateFormatted,
        punchIn: rec.punchInFormatted,
        punchOut: punchOutDisplay,
        workingHours: rec.workingHoursFormatted,
        status: rec.attendanceStatus.toUpperCase(),
        validation: rec.validationStatus.toUpperCase(),
        otStatus: rec.otStatus,
        latitude: rec.latitude,
        longitude: rec.longitude,
        location: rec.location,
        selfie: rec.selfieStatus,
      });

      row.height = 22;
      const isEven = idx % 2 === 1;

      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FF1E293B' } };
        cell.alignment = {
          vertical: 'middle',
          horizontal: colNumber === 1 || colNumber === 2 || colNumber === 12 ? 'left' : 'center',
        };

        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
        }

        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });
  }

  // ─── SHEET 2: Summary ───────────────────────────────────────
  const sheet2 = workbook.addWorksheet('Summary');
  sheet2.columns = [
    { header: '', key: 'metric', width: 28 },
    { header: '', key: 'value', width: 30 },
  ];

  // Title Block
  const titleRow = sheet2.addRow(['AttendPro - Attendance Summary Report', '']);
  titleRow.height = 32;
  titleRow.getCell(1).font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FF1E293B' } };
  titleRow.getCell(1).alignment = { vertical: 'middle' };

  sheet2.addRow([]);

  // Report Metadata
  const metaRows = [
    ['Report Date', summary.reportDate],
    ['Generated At', summary.generatedAt],
    ['Generated By', summary.generatedBy],
  ];

  metaRows.forEach(([metric, val]) => {
    const r = sheet2.addRow([metric, val]);
    r.height = 20;
    r.getCell(1).font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF475569' } };
    r.getCell(2).font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FF0F172A' } };
  });

  sheet2.addRow([]);

  // KPI Table Header
  const summaryHeaderRow = sheet2.addRow(['Attendance Metric', 'Value / Count']);
  summaryHeaderRow.height = 26;
  summaryHeaderRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  const summaryData = [
    ['Total Records', summary.totalRecords],
    ['Active / In-Progress', summary.presentActive],
    ['Completed Shifts', summary.completed],
    ['Incomplete Shifts', summary.incomplete],
    ['Valid Attendance Records', summary.validCount],
    ['Invalid Attendance Records', summary.invalidCount],
    ['Pending Validation', summary.pendingCount],
    ['Total Working Hours', summary.totalWorkingHoursFormatted],
    ['Total Overtime Hours', summary.totalOvertimeHoursFormatted],
  ];

  summaryData.forEach(([metric, val], idx) => {
    const r = sheet2.addRow([metric, val]);
    r.height = 22;
    const isEven = idx % 2 === 1;

    r.eachCell((cell) => {
      cell.font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      if (isEven) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
  });

  await workbook.xlsx.write(outputStream);
};

module.exports = {
  getAttendanceExportData,
  generateAttendancePdf,
  generateAttendanceExcel,
};
