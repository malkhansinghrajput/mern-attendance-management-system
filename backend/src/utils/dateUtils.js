/**
 * Returns today's date as YYYY-MM-DD string in Asia/Kolkata timezone.
 * Using string dates avoids UTC midnight boundary issues for attendance records.
 */
const getTodayDate = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: process.env.TZ || 'Asia/Kolkata' });
};

/**
 * Formats a date string or Date object to YYYY-MM-DD.
 * @param {string|Date} date
 * @returns {string} YYYY-MM-DD
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: process.env.TZ || 'Asia/Kolkata' });
};

/**
 * Formats minutes to a human-readable string like "8h 30m".
 * @param {number} minutes
 * @returns {string}
 */
const formatWorkingHours = (minutes) => {
  if (!minutes || minutes <= 0) return '0h 0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

module.exports = { getTodayDate, formatDate, formatWorkingHours };
