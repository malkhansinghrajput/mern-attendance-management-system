import { store } from '../../app/store';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Triggers a browser download from a binary Blob.
 * @param {Blob} blob
 * @param {string} filename
 */
const triggerFileDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 150);
};

/**
 * Extracts filename from the Content-Disposition header.
 * @param {Response} response
 * @param {string} fallbackFilename
 * @returns {string}
 */
const getFilenameFromResponse = (response, fallbackFilename) => {
  const disposition = response.headers.get('Content-Disposition') || response.headers.get('content-disposition');
  if (disposition && disposition.includes('filename=')) {
    const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      return filenameMatch[1].replace(/['"]/g, '').trim();
    }
  }
  return fallbackFilename;
};

/**
 * Core report downloader that handles authentication, streaming blob reception,
 * error parsing from server, and automated browser file save.
 *
 * @param {object} options
 * @param {'pdf' | 'excel'} options.format
 * @param {string} [options.date]
 * @param {string} [options.userId]
 * @param {string} [options.status]
 * @param {string} [options.validation]
 * @param {string} [options.startDate]
 * @param {string} [options.endDate]
 * @returns {Promise<string>} downloaded filename
 */
export const downloadAttendanceReport = async ({ format = 'pdf', ...filters }) => {
  const token = store.getState().auth.token || localStorage.getItem('ams_token');
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      params.append(key, val);
    }
  });

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const endpoint = `${API_BASE}/reports/attendance/export/${format}${queryString}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  if (!response.ok) {
    let errorMessage = `Failed to export ${format.toUpperCase()} report (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson?.error?.message) {
        errorMessage = errorJson.error.message;
      } else if (errorJson?.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      // Non-JSON response
    }
    throw new Error(errorMessage);
  }

  const blob = await response.blob();
  const dateStr = filters.date || new Date().toISOString().slice(0, 10);
  const ext = format === 'pdf' ? 'pdf' : 'xlsx';
  const defaultFilename = `AttendPro_Attendance_Report_${dateStr}.${ext}`;
  const filename = getFilenameFromResponse(response, defaultFilename);

  triggerFileDownload(blob, filename);
  return filename;
};

/**
 * Export attendance report as PDF.
 * @param {object} filters
 * @returns {Promise<string>}
 */
export const exportAttendancePDF = (filters = {}) =>
  downloadAttendanceReport({ ...filters, format: 'pdf' });

/**
 * Export attendance report as Excel workbook (.xlsx).
 * @param {object} filters
 * @returns {Promise<string>}
 */
export const exportAttendanceExcel = (filters = {}) =>
  downloadAttendanceReport({ ...filters, format: 'excel' });
