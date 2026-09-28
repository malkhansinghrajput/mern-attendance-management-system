import { useState, useEffect, useRef } from 'react';
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

  const [exportModal, setExportModal] = useState({
    isOpen: false,
    format: 'pdf',
  });
  const [exportFilterMode, setExportFilterMode] = useState('range');
  const [exportSingleDate, setExportSingleDate] = useState(date);
  const [exportStartDate, setExportStartDate] = useState(date);
  const [exportEndDate, setExportEndDate] = useState(getTodayString());
  const [exportStatus, setExportStatus] = useState('');
  const [exportValidation, setExportValidation] = useState('');

  const { data, isLoading, isFetching } = useGetDailyReportQuery({
    date: date || undefined,
    page, limit: LIMIT,
  });

  const records = data?.data?.records || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);
  const reportDate = data?.data?.date || date;

  const tableRef = useRef(null);

  useEffect(() => {
    const el = tableRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (el.scrollWidth > el.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const atLeft = el.scrollLeft <= 0 && e.deltaY < 0;
        const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && e.deltaY > 0;
        if (!atLeft && !atRight) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
        }
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const openExportModal = (format) => {
    setExportModal({ isOpen: true, format });
    setExportSingleDate(date);
    setExportStartDate(date);
    setExportEndDate(getTodayString());
    setExportStatus('');
    setExportValidation('');
  };

  const setPresetRange = (preset) => {
    const today = getTodayString();
    if (preset === 'today') {
      setExportFilterMode('single');
      setExportSingleDate(today);
      setExportStartDate(today);
      setExportEndDate(today);
    } else if (preset === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const yest = d.toISOString().slice(0, 10);
      setExportFilterMode('single');
      setExportSingleDate(yest);
      setExportStartDate(yest);
      setExportEndDate(yest);
    } else if (preset === 'last7') {
      const d = new Date();
      const end = d.toISOString().slice(0, 10);
      d.setDate(d.getDate() - 6);
      const start = d.toISOString().slice(0, 10);
      setExportFilterMode('range');
      setExportStartDate(start);
      setExportEndDate(end);
    } else if (preset === 'thisMonth') {
      const d = new Date();
      const end = d.toISOString().slice(0, 10);
      const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      setExportFilterMode('range');
      setExportStartDate(start);
      setExportEndDate(end);
    }
  };

  const handleDownload = async () => {
    const format = exportModal.format;
    if (format === 'pdf') setIsExportingPdf(true);
    else setIsExportingExcel(true);

    try {
      const params = {};
      if (exportFilterMode === 'single') {
        params.date = exportSingleDate;
      } else {
        params.startDate = exportStartDate;
        params.endDate = exportEndDate;
      }
      if (exportStatus) params.status = exportStatus;
      if (exportValidation) params.validation = exportValidation;

      const filename = await (format === 'pdf'
        ? exportAttendancePDF(params)
        : exportAttendanceExcel(params));

      toast.success(`${format.toUpperCase()} report downloaded: ${filename}`);
      setExportModal((prev) => ({ ...prev, isOpen: false }));
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
            onClick={() => openExportModal('pdf')}
            disabled={isExportingPdf || isExportingExcel}
            id="btn-export-pdf"
            title="Export Report as PDF"
          >
            📄 Export PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openExportModal('excel')}
            disabled={isExportingPdf || isExportingExcel}
            id="btn-export-excel"
            title="Export Report as Excel"
          >
            📊 Export Excel
          </Button>
        </div>
      </div>

      {isLoading || isFetching ? <Spinner label="Loading report..." /> : records.length === 0 ? (
        <EmptyState icon="📊" title="No records for this date" description="No attendance records found for the selected date." />
      ) : (
        <>
          <div className="table-wrapper" ref={tableRef}>
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

      {/* Date-wise Report Export Modal */}
      <Modal
        isOpen={exportModal.isOpen}
        onClose={() => !isExportingPdf && !isExportingExcel && setExportModal((prev) => ({ ...prev, isOpen: false }))}
        title={`Export Report (${exportModal.format === 'pdf' ? 'PDF Document' : 'Excel Spreadsheet'})`}
        maxWidth="520px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button
              variant="ghost"
              onClick={() => setExportModal((prev) => ({ ...prev, isOpen: false }))}
              disabled={isExportingPdf || isExportingExcel}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDownload}
              loading={isExportingPdf || isExportingExcel}
              disabled={isExportingPdf || isExportingExcel}
            >
              {exportModal.format === 'pdf' ? '📄 Download PDF' : '📊 Download Excel'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label className="form-label" style={{ marginBottom: '0.35rem', fontSize: '0.825rem' }}>Filter Mode</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.35rem',
                background: 'var(--bg-input)',
                padding: '4px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
              }}
            >
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setExportFilterMode('range')}
                style={{
                  border: 'none',
                  background: exportFilterMode === 'range' ? 'var(--gradient-primary)' : 'transparent',
                  color: exportFilterMode === 'range' ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: exportFilterMode === 'range' ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  padding: '0.45rem',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                📅 Date Range
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setExportFilterMode('single')}
                style={{
                  border: 'none',
                  background: exportFilterMode === 'single' ? 'var(--gradient-primary)' : 'transparent',
                  color: exportFilterMode === 'single' ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: exportFilterMode === 'single' ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  padding: '0.45rem',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                🗓️ Single Date
              </button>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: '0.35rem', fontSize: '0.825rem' }}>Quick Presets</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
              {[
                { key: 'today', label: 'Today' },
                { key: 'yesterday', label: 'Yesterday' },
                { key: 'last7', label: 'Last 7 Days' },
                { key: 'thisMonth', label: 'This Month' },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setPresetRange(p.key)}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    padding: '0.4rem 0.25rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.color = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {exportFilterMode === 'range' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="export-start-date" style={{ fontSize: '0.825rem', marginBottom: '0.35rem' }}>From Date</label>
                <input
                  id="export-start-date"
                  type="date"
                  className="form-input"
                  value={exportStartDate}
                  max={exportEndDate || getTodayString()}
                  onChange={(e) => setExportStartDate(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="export-end-date" style={{ fontSize: '0.825rem', marginBottom: '0.35rem' }}>To Date</label>
                <input
                  id="export-end-date"
                  type="date"
                  className="form-input"
                  value={exportEndDate}
                  min={exportStartDate}
                  max={getTodayString()}
                  onChange={(e) => setExportEndDate(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="export-single-date" style={{ fontSize: '0.825rem', marginBottom: '0.35rem' }}>Select Date</label>
              <input
                id="export-single-date"
                type="date"
                className="form-input"
                value={exportSingleDate}
                max={getTodayString()}
                onChange={(e) => setExportSingleDate(e.target.value)}
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="export-status" style={{ fontSize: '0.825rem', marginBottom: '0.35rem' }}>Status</label>
              <select
                id="export-status"
                className="form-select form-input"
                value={exportStatus}
                onChange={(e) => setExportStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active (Present)</option>
                <option value="completed">Completed</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="export-validation" style={{ fontSize: '0.825rem', marginBottom: '0.35rem' }}>Validation</label>
              <select
                id="export-validation"
                className="form-select form-input"
                value={exportValidation}
                onChange={(e) => setExportValidation(e.target.value)}
              >
                <option value="">All Validations</option>
                <option value="valid">Valid</option>
                <option value="invalid">Invalid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default ReportsPage;
