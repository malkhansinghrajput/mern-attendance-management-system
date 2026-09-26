import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { useGetDailyReportQuery } from '../../features/reports/reportsApi';
import { useAuth } from '../../hooks/useAuth';
import { formatTime, formatWorkingHours, getTodayString } from '../../utils/formatters';
import '../../styles/index.css';

const LIMIT = 20;

const ReportsPage = () => {
  const { role } = useAuth();
  const [page, setPage] = useState(1);
  const [date, setDate] = useState(getTodayString());
  const [selfieModal, setSelfieModal] = useState(null);

  const { data, isLoading, isFetching } = useGetDailyReportQuery({
    date: date || undefined,
    page, limit: LIMIT,
  });

  const records = data?.data?.records || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);
  const reportDate = data?.data?.date || date;

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

      {/* Filter */}
      <div className="filter-bar">
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
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {total} record{total !== 1 ? 's' : ''} for {reportDate}
        </span>
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
