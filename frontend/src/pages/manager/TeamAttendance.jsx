import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AttendanceTable from '../../components/attendance/AttendanceTable';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useGetTeamAttendanceQuery, useValidateAttendanceMutation } from '../../features/attendance/attendanceApi';
import { getTodayString, parseApiError } from '../../utils/formatters';
import toast from 'react-hot-toast';
import '../../styles/index.css';

const LIMIT = 10;

const TeamAttendance = () => {
  const [page, setPage] = useState(1);
  const [date, setDate] = useState('');
  const [selfieModal, setSelfieModal] = useState(null);
  const [validateModal, setValidateModal] = useState(null);
  const [validForm, setValidForm] = useState({ validationStatus: 'valid', validationRemarks: '' });

  const { data, isLoading, isFetching } = useGetTeamAttendanceQuery({
    page, limit: LIMIT, date: date || undefined,
  });
  const [validateAttendance, { isLoading: validating }] = useValidateAttendanceMutation();

  const records = data?.data?.attendances || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!validateModal) return;
    try {
      await validateAttendance({
        id: validateModal._id,
        validationStatus: validForm.validationStatus,
        validationRemarks: validForm.validationRemarks || undefined,
      }).unwrap();
      toast.success('Attendance validated!');
      setValidateModal(null);
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const openValidate = (rec) => {
    setValidateModal(rec);
    setValidForm({
      validationStatus: rec.validationStatus === 'pending' ? 'valid' : rec.validationStatus,
      validationRemarks: rec.validationRemarks || '',
    });
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Team Attendance</h1>
        <p>View and validate your team's attendance records</p>
      </div>

      {/* Filter */}
      <div className="filter-bar">
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" htmlFor="team-date">Filter by Date</label>
          <input
            id="team-date" type="date"
            className="form-input"
            value={date} max={getTodayString()}
            onChange={(e) => { setDate(e.target.value); setPage(1); }}
          />
        </div>
        {date && (
          <Button variant="ghost" size="sm" onClick={() => { setDate(''); setPage(1); }}>
            Clear Date
          </Button>
        )}
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {total} record{total !== 1 ? 's' : ''}
        </span>
      </div>

      {isLoading || isFetching ? <Spinner /> : (
        <>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <AttendanceTable
              records={records}
              showEmployee
              showValidation
              onValidate={openValidate}
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

      {/* Selfie Modal */}
      <Modal isOpen={!!selfieModal} onClose={() => setSelfieModal(null)} title="Selfie Preview">
        {selfieModal && <img src={selfieModal} alt="Selfie" className="selfie-modal-img" />}
      </Modal>

      {/* Validate Modal */}
      <Modal
        isOpen={!!validateModal}
        onClose={() => setValidateModal(null)}
        title={`Validate — ${validateModal?.userId?.name || ''}`}
      >
        <form onSubmit={handleValidate} id="validate-form">
          {validateModal?.punchInSelfie && (
            <div style={{ marginBottom: '1rem' }}>
              <img src={validateModal.punchInSelfie} alt="Selfie" className="selfie-modal-img" style={{ maxHeight: '200px', objectFit: 'cover' }} />
            </div>
          )}
          {validateModal?.punchInLocation && (
            <div style={{ marginBottom: '1rem' }}>
              <a
                href={`https://maps.google.com/?q=${validateModal.punchInLocation.lat},${validateModal.punchInLocation.lng}`}
                target="_blank" rel="noopener noreferrer"
                className="map-link"
              >
                🗺️ View Punch-In Location on Maps
              </a>
            </div>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="validation-status">Validation Status</label>
            <select
              id="validation-status" className="form-select"
              value={validForm.validationStatus}
              onChange={(e) => setValidForm((f) => ({ ...f, validationStatus: e.target.value }))}
            >
              <option value="valid">✅ Valid</option>
              <option value="invalid">❌ Invalid</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="validation-remarks">
              Remarks {validForm.validationStatus === 'invalid' && <span style={{ color: 'var(--color-danger)' }}>*</span>}
            </label>
            <textarea
              id="validation-remarks"
              className="form-textarea"
              rows={3}
              placeholder="Add remarks (required when marking invalid)..."
              value={validForm.validationRemarks}
              onChange={(e) => setValidForm((f) => ({ ...f, validationRemarks: e.target.value }))}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={() => setValidateModal(null)}>Cancel</Button>
            <Button
              type="submit"
              variant={validForm.validationStatus === 'valid' ? 'success' : 'danger'}
              loading={validating}
              id="btn-confirm-validate"
            >
              {validForm.validationStatus === 'valid' ? '✅ Mark Valid' : '❌ Mark Invalid'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default TeamAttendance;
