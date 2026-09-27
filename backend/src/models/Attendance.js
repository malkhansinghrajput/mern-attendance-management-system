const mongoose = require('mongoose');
const { ATTENDANCE_STATUS, VALIDATION_STATUS } = require('../constants/attendance');

const locationSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    accuracy: { type: Number, default: null },
    address: { type: String, default: null },
    capturedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    // Date stored as YYYY-MM-DD string to avoid UTC midnight boundary issues
    date: {
      type: String,
      required: [true, 'Date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
    },
    // Shift Date representing the date on which the shift started
    shiftDate: {
      type: String,
      default: function () {
        return this.date;
      },
      match: [/^\d{4}-\d{2}-\d{2}$/, 'shiftDate must be in YYYY-MM-DD format'],
    },

    // Punch In
    punchIn: { type: Date, default: null },
    punchInSelfie: { type: String, default: null },
    punchInLocation: { type: locationSchema, default: null },

    // Punch Out
    punchOut: { type: Date, default: null },
    punchOutSelfie: { type: String, default: null },
    punchOutLocation: { type: locationSchema, default: null },

    // Working & shift duration fields (calculated server-side on punch-out)
    workingMinutes: { type: Number, default: 0 },
    workedMinutes: { type: Number, default: 0 },
    regularMinutes: { type: Number, default: 0 },
    overtimeMinutes: { type: Number, default: 0 },

    // Overall attendance status
    attendanceStatus: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUS),
      default: ATTENDANCE_STATUS.ACTIVE,
    },

    // Validation by Manager/Admin
    validationStatus: {
      type: String,
      enum: Object.values(VALIDATION_STATUS),
      default: VALIDATION_STATUS.PENDING,
    },
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    validatedAt: { type: Date, default: null },
    validationRemarks: { type: String, default: null, maxlength: 500 },

    // Reference to overtime request (if any)
    overtimeRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OvertimeRequest',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One attendance record per user per shift date — prevents double punch-in
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
// Active attendance lookup index for cross-midnight shift punches
attendanceSchema.index({ userId: 1, attendanceStatus: 1 });
// Queries for daily reports
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ shiftDate: 1 });
// Manager validation queue
attendanceSchema.index({ validationStatus: 1 });
// Employee history
attendanceSchema.index({ userId: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
