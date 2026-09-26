const mongoose = require('mongoose');
const { OVERTIME_STATUS } = require('../constants/attendance');

const overtimeRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee ID is required'],
    },
    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
      required: [true, 'Attendance ID is required'],
    },
    requestedHours: {
      type: Number,
      required: [true, 'Requested hours is required'],
      min: [0.5, 'Minimum 0.5 hours'],
      max: [8, 'Maximum 8 hours'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      minlength: [10, 'Reason must be at least 10 characters'],
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: Object.values(OVERTIME_STATUS),
      default: OVERTIME_STATUS.PENDING,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    reviewRemarks: {
      type: String,
      default: null,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// One OT request per attendance record
overtimeRequestSchema.index({ attendanceId: 1 }, { unique: true });
// Employee's own requests
overtimeRequestSchema.index({ employeeId: 1 });
// Manager/Admin pending queue
overtimeRequestSchema.index({ status: 1 });

const OvertimeRequest = mongoose.model('OvertimeRequest', overtimeRequestSchema);

module.exports = OvertimeRequest;
