const { STANDARD_SHIFT_MINUTES, ATTENDANCE_STATUS } = require('../constants/attendance');

/**
 * Calculates working minutes between punchIn and punchOut.
 * Always calculated server-side. Never trust frontend values.
 *
 * @param {Date} punchIn
 * @param {Date} punchOut
 * @returns {number} working minutes (floored to whole minutes)
 */
const calculateWorkingMinutes = (punchIn, punchOut) => {
  if (!punchIn || !punchOut) return 0;
  const diffMs = new Date(punchOut) - new Date(punchIn);
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / 60000);
};

/**
 * Calculates complete shift durations (worked, regular, overtime minutes).
 *
 * @param {Date} punchIn
 * @param {Date} punchOut
 * @returns {{ workedMinutes: number, regularMinutes: number, overtimeMinutes: number }}
 */
const calculateShiftDurations = (punchIn, punchOut) => {
  const workedMinutes = calculateWorkingMinutes(punchIn, punchOut);
  const regularMinutes = Math.min(workedMinutes, STANDARD_SHIFT_MINUTES);
  const overtimeMinutes = Math.max(workedMinutes - STANDARD_SHIFT_MINUTES, 0);
  return { workedMinutes, regularMinutes, overtimeMinutes };
};

/**
 * Determines attendance status based on working minutes.
 *
 * @param {number} workingMinutes
 * @returns {string} 'completed' | 'incomplete'
 */
const determineAttendanceStatus = (workingMinutes) => {
  return workingMinutes >= STANDARD_SHIFT_MINUTES
    ? ATTENDANCE_STATUS.COMPLETED
    : ATTENDANCE_STATUS.INCOMPLETE;
};

module.exports = {
  calculateWorkingMinutes,
  calculateShiftDurations,
  determineAttendanceStatus,
};
