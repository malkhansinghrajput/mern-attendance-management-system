import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AttendanceTable from '../../components/attendance/AttendanceTable';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useGetMyAttendanceQuery } from '../../features/attendance/attendanceApi';
import { getTodayString } from '../../utils/formatters';
import '../../styles/index.css';

const LIMIT = 10;

const MyAttendance = () => {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selfieModal, setSelfieModal] = useState(null);

  const { data, isLoading, isFetching } = useGetMyAttendanceQuery({
    page, limit: LIMIT,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const records = data?.data?.attendances || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>My Attendance</h1>
        <p>View your complete attendance history with filters</p>
      </div>

      {/* Filters */}
      <form onSubmit={handleFilter}>
        <div className="filter-bar">
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="start-date">From</label>
            <input
              id="start-date" type="date"
              className="form-input"
              value={startDate} max={getTodayString()}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="end-date">To</label>
            <input
              id="end-date" type="date"
              className="form-input"
              value={endDate} max={getTodayString()}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <Button type="submit" variant="primary" size="sm" id="btn-apply-filter">Apply</Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleReset} id="btn-reset-filter">Reset</Button>
          </div>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {total} record{total !== 1 ? 's' : ''}
          </span>
        </div>
      </form>

      {/* Table */}
      {isLoading || isFetching ? (
        <Spinner label="Loading attendance..." />
      ) : (
        <>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <AttendanceTable
              records={records}
              showValidation
              onViewSelfie={(url) => setSelfieModal(url)}
            />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <Button
                variant="ghost" size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                id="btn-prev-page"
              >
                ← Prev
              </Button>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="ghost" size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                id="btn-next-page"
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}

      {/* Selfie Preview Modal */}
      <Modal isOpen={!!selfieModal} onClose={() => setSelfieModal(null)} title="Selfie Preview">
        {selfieModal && (
          <img src={selfieModal} alt="Employee selfie" className="selfie-modal-img" />
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default MyAttendance;
