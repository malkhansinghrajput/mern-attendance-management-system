/**
 * Formats an ISO date string to a readable date.
 * @param {string|Date} date
 * @returns {string} e.g. "Sep 26, 2026"
 */
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Formats an ISO timestamp to time string.
 * @param {string|Date} date
 * @returns {string} e.g. "09:30 AM"
 */
export const formatTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Formats minutes to "Xh Ym" string.
 * @param {number} minutes
 * @returns {string} e.g. "8h 30m"
 */
export const formatWorkingHours = (minutes) => {
  if (!minutes || minutes <= 0) return '0h 0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

/**
 * Returns today's date as YYYY-MM-DD string.
 */
export const getTodayString = () => {
  return new Date().toLocaleDateString('en-CA');
};

/**
 * Extracts a readable error message from RTK Query error.
 * @param {object} error
 * @returns {string}
 */
export const parseApiError = (error) => {
  if (!error) return 'An unknown error occurred';
  if (error.data?.error?.message) return error.data.error.message;
  if (error.data?.message) return error.data.message;
  if (error.error) return error.error;
  return 'An unexpected error occurred';
};
