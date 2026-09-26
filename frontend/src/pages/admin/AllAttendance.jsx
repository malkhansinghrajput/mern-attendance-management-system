import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AttendanceTable from '../../components/attendance/AttendanceTable';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useGetAllAttendanceQuery } from '../../features/attendance/attendanceApi';
import { getTodayString } from '../../utils/formatters';
import '../../styles/index.css';

const LIMIT = 15;

const AllAttendance = () => {
  const [page, setPage] = useState(1);
  const [date, setDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selfieModal, setSelfieModal] = useState(null);

  const { data, isLoading, isFetching } = useGetAllAttendanceQuery({
    page, limit: LIMIT,
    date: date || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const records = data?.data?.attendances || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  const handleReset = () => {
    setDate('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>All Attendance</h1>
        <p>System-wide attendance records</p>
      </div>

      <div className="filter-bar">
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" htmlFor="att-date">Single Date</label>
          <input id="att-date" type="date" className="form-input" value={date} max={getTodayString()}
            onChange={(e) => { setDate(e.target.value); setStartDate(''); setEndDate(''); setPage(1); }} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" htmlFor="att-from">From</label>
          <input id="att-from" type="date" className="form-input" value={startDate} max={getTodayString()}
            onChange={(e) => { setStartDate(e.target.value); setDate(''); setPage(1); }} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" htmlFor="att-to">To</label>
          <input id="att-to" type="date" className="form-input" value={endDate} max={getTodayString()}
            onChange={(e) => { setEndDate(e.target.value); setDate(''); setPage(1); }} />
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset}>Reset</Button>
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{total} records</span>
      </div>

      {isLoading || isFetching ? <Spinner /> : (
        <>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <AttendanceTable
              records={records}
              showEmployee
              showValidation
              onViewSelfie={(url) => setSelfieModal(url)}
            />
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

      <Modal isOpen={!!selfieModal} onClose={() => setSelfieModal(null)} title="Selfie Preview">
        {selfieModal && <img src={selfieModal} alt="Selfie" className="selfie-modal-img" />}
      </Modal>
    </DashboardLayout>
  );
};

export default AllAttendance;
