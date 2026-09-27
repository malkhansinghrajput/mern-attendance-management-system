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

/**
 * Formats a Date or date string to DD-MM-YYYY in Asia/Kolkata timezone.
 * @param {string|Date} date
 * @returns {string} DD-MM-YYYY
 */
const formatDateDDMMYYYY = (date) => {
  if (!date) return '—';
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split('-');
    return `${d}-${m}-${y}`;
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: process.env.TZ || 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(d);
  const day = parts.find((p) => p.type === 'day')?.value || '';
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const year = parts.find((p) => p.type === 'year')?.value || '';
  return `${day}-${month}-${year}`;
};

/**
 * Formats a Date object or ISO string to hh:mm A in Asia/Kolkata timezone.
 * @param {string|Date} date
 * @returns {string} e.g. "09:30 AM"
 */
const formatTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', {
    timeZone: process.env.TZ || 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Formats a Date object to DD-MM-YYYY HH:mm for generation timestamp.
 * @param {Date} date
 * @returns {string}
 */
const formatDateTime = (date = new Date()) => {
  const dateStr = formatDateDDMMYYYY(date);
  const timeStr = formatTime(date);
  return `${dateStr} ${timeStr}`;
};

module.exports = {
  getTodayDate,
  formatDate,
  formatWorkingHours,
  formatDateDDMMYYYY,
  formatTime,
  formatDateTime,
};
