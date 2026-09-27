import { useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import {
  useGetDailyReportQuery,
  exportAttendancePDF,
  exportAttendanceExcel,
} from '../../features/reports/reportsApi';
import { useAuth } from '../../hooks/useAuth';
import { formatTime, formatWorkingHours, getTodayString } from '../../utils/formatters';
import '../../styles/index.css';

const LIMIT = 20;

const ReportsPage = () => {
  const { role } = useAuth();
  const [page, setPage] = useState(1);
  const [date, setDate] = useState(getTodayString());
  const [selfieModal, setSelfieModal] = useState(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const { data, isLoading, isFetching } = useGetDailyReportQuery({
    date: date || undefined,
    page, limit: LIMIT,
  });

  const records = data?.data?.records || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);
  const reportDate = data?.data?.date || date;

  const handleExport = async (format) => {
    if (format === 'pdf') setIsExportingPdf(true);
    else setIsExportingExcel(true);

    try {
      const filename = await (format === 'pdf'
        ? exportAttendancePDF({ date })
        : exportAttendanceExcel({ date }));
      toast.success(`${format.toUpperCase()} report downloaded: ${filename}`);
    } catch (err) {
      toast.error(err.message || `Failed to export ${format.toUpperCase()} report`);
    } finally {
      if (format === 'pdf') setIsExportingPdf(false);
      else setIsExportingExcel(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Daily Attendance Report</h1>
        <p>
          {role === 'employee' && 'Your personal attendance report'}
          {role === 'manager' && "Your team's attendance report"}
          {role === 'admin' && 'System-wide attendance report'}
        </p>
      </div>

      {/* Filter and Export Actions */}
      <div className="filter-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="report-date">Report Date</label>
            <input
              id="report-date" type="date"
              className="form-input"
              value={date} max={getTodayString()}
              onChange={(e) => { setDate(e.target.value); setPage(1); }}
            />
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setDate(getTodayString()); setPage(1); }}>
            Today
          </Button>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {total} record{total !== 1 ? 's' : ''} for {reportDate}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleExport('pdf')}
            disabled={isExportingPdf || isExportingExcel}
            loading={isExportingPdf}
            id="btn-export-pdf"
            title="Export Daily Report as PDF"
          >
            📄 Export PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleExport('excel')}
            disabled={isExportingPdf || isExportingExcel}
            loading={isExportingExcel}
            id="btn-export-excel"
            title="Export Daily Report as Excel"
          >
            📊 Export Excel
          </Button>
        </div>
      </div>

      {isLoading || isFetching ? <Spinner label="Loading report..." /> : records.length === 0 ? (
        <EmptyState icon="📊" title="No records for this date" description="No attendance records found for the selected date." />
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  {role !== 'employee' && <th>Employee</th>}
                  <th>Date</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                  <th>Validation</th>
                  <th>Selfie</th>
                  <th>Location</th>
                  <th>OT Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec._id}>
                    {role !== 'employee' && (
                      <td>
                        <div className="name-cell">
                          <div className="avatar">{rec.employee?.name?.charAt(0)?.toUpperCase() || '?'}</div>
                          <div className="name-cell-info">
                            <div className="name">{rec.employee?.name}</div>
                            <div className="email">{rec.employee?.email}</div>
                          </div>
                        </div>
                      </td>
                    )}
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rec.date}</td>
                    <td>{rec.punchIn ? formatTime(rec.punchIn) : '—'}</td>
                    <td>{rec.punchOut ? formatTime(rec.punchOut) : '—'}</td>
                    <td>
                      <span className="working-hours-badge" style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}>
                        {rec.workingHoursFormatted || formatWorkingHours(rec.workingMinutes)}
                      </span>
                    </td>
                    <td><Badge status={rec.attendanceStatus} /></td>
                    <td><Badge status={rec.validationStatus} /></td>
                    <td>
                      {rec.punchInSelfie ? (
                        <img
                          src={rec.punchInSelfie}
                          alt="Selfie"
                          className="selfie-thumb"
                          onClick={() => setSelfieModal(rec.punchInSelfie)}
                        />
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                    </td>
                    <td>
                      {rec.punchInLocation ? (
                        <a
                          href={`https://maps.google.com/?q=${rec.punchInLocation.lat},${rec.punchInLocation.lng}`}
                          target="_blank" rel="noopener noreferrer"
                          className="map-link"
                        >
                          🗺️ Map
                        </a>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                    </td>
                    <td>
                      {rec.overtimeRequest ? (
                        <Badge status={rec.overtimeRequest?.status || 'pending'} />
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</Button>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Page {page} of {totalPages}</span>
              <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</Button>
            </div>
          )}
        </>
      )}

      {/* Selfie Preview */}
      <Modal isOpen={!!selfieModal} onClose={() => setSelfieModal(null)} title="Selfie Preview">
        {selfieModal && <img src={selfieModal} alt="Selfie" className="selfie-modal-img" />}
      </Modal>
    </DashboardLayout>
  );
};

export default ReportsPage;
