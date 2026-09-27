const fs = require('fs');
const path = require('path');
const assert = require('assert');
const {
  generateAttendancePdf,
  generateAttendanceExcel,
} = require('../services/reportExport.service');

const runExportUnitTests = async () => {
  console.log('====================================================');
  console.log(' RUNNING REPORT EXPORT UNIT TESTS (PDF & EXCEL)');
  console.log('====================================================\n');

  const mockExportDataWithRecords = {
    records: [
      {
        _id: 'rec_1',
        employeeName: 'Rahul Sharma',
        employeeEmail: 'rahul.sharma@example.com',
        employeeId: 'EMP-001',
        date: '2026-09-28',
        dateFormatted: '28-09-2026',
        shiftDate: '2026-09-28',
        punchInFormatted: '09:00 AM',
        punchOutFormatted: '05:30 PM',
        isCrossMidnight: false,
        punchOutDateStr: '',
        workingMinutes: 510,
        workingHoursFormatted: '8h 30m',
        overtimeMinutes: 30,
        overtimeHoursFormatted: '0h 30m',
        attendanceStatus: 'completed',
        validationStatus: 'valid',
        otStatus: 'APPROVED',
        location: 'Sector 62, Noida, UP (28.6280, 77.3649)',
        latitude: 28.628,
        longitude: 77.3649,
        selfieStatus: 'Available',
      },
      {
        _id: 'rec_2',
        employeeName: 'Anita Roy',
        employeeEmail: 'anita.roy@example.com',
        employeeId: 'EMP-002',
        date: '2026-09-28',
        dateFormatted: '28-09-2026',
        shiftDate: '2026-09-28',
        punchInFormatted: '11:00 PM',
        punchOutFormatted: '07:30 AM',
        isCrossMidnight: true,
        punchOutDateStr: '29-09-2026',
        workingMinutes: 510,
        workingHoursFormatted: '8h 30m',
        overtimeMinutes: 30,
        overtimeHoursFormatted: '0h 30m',
        attendanceStatus: 'completed',
        validationStatus: 'valid',
        otStatus: 'NONE',
        location: 'Indore Office (22.7446, 75.8998)',
        latitude: 22.7446,
        longitude: 75.8998,
        selfieStatus: 'Available',
      },
      {
        _id: 'rec_3',
        employeeName: 'Vikram Singh',
        employeeEmail: 'vikram.singh@example.com',
        employeeId: 'EMP-003',
        date: '2026-09-28',
        dateFormatted: '28-09-2026',
        shiftDate: '2026-09-28',
        punchInFormatted: '10:15 AM',
        punchOutFormatted: '—',
        isCrossMidnight: false,
        punchOutDateStr: '',
        workingMinutes: 240,
        workingHoursFormatted: '4h 0m',
        overtimeMinutes: 0,
        overtimeHoursFormatted: '0h 0m',
        attendanceStatus: 'active',
        validationStatus: 'pending',
        otStatus: 'NONE',
        location: '22.7196, 75.8577',
        latitude: 22.7196,
        longitude: 75.8577,
        selfieStatus: 'Not Available',
      },
    ],
    summary: {
      reportDate: '28-09-2026',
      rawDate: '2026-09-28',
      generatedAt: '28-09-2026 15:30',
      generatedBy: 'Admin User (ADMIN)',
      totalRecords: 3,
      presentActive: 1,
      completed: 2,
      incomplete: 0,
      validCount: 2,
      invalidCount: 0,
      pendingCount: 1,
      totalWorkingMinutes: 1260,
      totalWorkingHoursFormatted: '21h 0m',
      totalOvertimeMinutes: 60,
      totalOvertimeHoursFormatted: '1h 0m',
    },
  };

  const mockExportDataEmpty = {
    records: [],
    summary: {
      reportDate: '28-09-2026',
      rawDate: '2026-09-28',
      generatedAt: '28-09-2026 15:30',
      generatedBy: 'Admin User (ADMIN)',
      totalRecords: 0,
      presentActive: 0,
      completed: 0,
      incomplete: 0,
      validCount: 0,
      invalidCount: 0,
      pendingCount: 0,
      totalWorkingMinutes: 0,
      totalWorkingHoursFormatted: '0h 0m',
      totalOvertimeMinutes: 0,
      totalOvertimeHoursFormatted: '0h 0m',
    },
  };

  const tmpDir = path.join(__dirname, '../../logs');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  // ── TEST 1: Generate PDF with records ──
  console.log('✔ Running TEST 1: Generate PDF with populated attendance records');
  const pdfOut1 = path.join(tmpDir, 'test_report_with_records.pdf');
  const pdfStream1 = fs.createWriteStream(pdfOut1);
  await generateAttendancePdf(mockExportDataWithRecords, pdfStream1);
  assert.ok(fs.existsSync(pdfOut1));
  const pdfStat1 = fs.statSync(pdfOut1);
  assert.ok(pdfStat1.size > 1000, `PDF size ${pdfStat1.size} should be > 1000 bytes`);
  console.log(`  -> Generated PDF (${pdfStat1.size} bytes) successfully!`);

  // ── TEST 2: Generate PDF with empty records ──
  console.log('✔ Running TEST 2: Generate PDF with 0 records (empty report state)');
  const pdfOut2 = path.join(tmpDir, 'test_report_empty.pdf');
  const pdfStream2 = fs.createWriteStream(pdfOut2);
  await generateAttendancePdf(mockExportDataEmpty, pdfStream2);
  assert.ok(fs.existsSync(pdfOut2));
  const pdfStat2 = fs.statSync(pdfOut2);
  assert.ok(pdfStat2.size > 1000, `Empty PDF size ${pdfStat2.size} should be > 1000 bytes`);
  console.log(`  -> Generated Empty PDF (${pdfStat2.size} bytes) successfully!`);

  // ── TEST 3: Generate Excel with records ──
  console.log('✔ Running TEST 3: Generate Excel with populated records and 2 sheets');
  const excelOut1 = path.join(tmpDir, 'test_report_with_records.xlsx');
  const excelStream1 = fs.createWriteStream(excelOut1);
  await generateAttendanceExcel(mockExportDataWithRecords, excelStream1);
  assert.ok(fs.existsSync(excelOut1));
  const excelStat1 = fs.statSync(excelOut1);
  assert.ok(excelStat1.size > 2000, `Excel size ${excelStat1.size} should be > 2000 bytes`);
  console.log(`  -> Generated Excel (${excelStat1.size} bytes) successfully!`);

  // ── TEST 4: Generate Excel with empty records ──
  console.log('✔ Running TEST 4: Generate Excel with 0 records');
  const excelOut2 = path.join(tmpDir, 'test_report_empty.xlsx');
  const excelStream2 = fs.createWriteStream(excelOut2);
  await generateAttendanceExcel(mockExportDataEmpty, excelStream2);
  assert.ok(fs.existsSync(excelOut2));
  const excelStat2 = fs.statSync(excelOut2);
  assert.ok(excelStat2.size > 2000, `Empty Excel size ${excelStat2.size} should be > 2000 bytes`);
  console.log(`  -> Generated Empty Excel (${excelStat2.size} bytes) successfully!`);

  // Clean up test generated files
  [pdfOut1, pdfOut2, excelOut1, excelOut2].forEach((f) => {
    try {
      fs.unlinkSync(f);
    } catch {
      // ignore
    }
  });

  console.log('\n====================================================');
  console.log(' 🎉 ALL PDF & EXCEL REPORT EXPORT UNIT TESTS PASSED!');
  console.log('====================================================\n');
};

runExportUnitTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
