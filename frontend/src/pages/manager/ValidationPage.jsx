import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AttendanceTable from '../../components/attendance/AttendanceTable';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { useGetTeamAttendanceQuery, useValidateAttendanceMutation } from '../../features/attendance/attendanceApi';
import { parseApiError, formatTime, formatWorkingHours } from '../../utils/formatters';
import toast from 'react-hot-toast';
import '../../styles/index.css';

const LIMIT = 10;

const ValidationPage = () => {
  const [page, setPage] = useState(1);
  const [selfieModal, setSelfieModal] = useState(null);
  const [validateModal, setValidateModal] = useState(null);
  const [validForm, setValidForm] = useState({ validationStatus: 'valid', validationRemarks: '' });

  // Filter pending records server-side — fixes broken pagination from client-side filtering
  const { data, isLoading, isFetching } = useGetTeamAttendanceQuery({
    page, limit: LIMIT, validationStatus: 'pending',
  });
  const [validateAttendance, { isLoading: validating }] = useValidateAttendanceMutation();

  const records = data?.data?.attendances || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!validateModal) return;
    if (validForm.validationStatus === 'invalid' && !validForm.validationRemarks.trim()) {
      toast.error('Remarks are required when marking as invalid');
      return;
    }
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
    setValidForm({ validationStatus: 'valid', validationRemarks: '' });
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Attendance Validation</h1>
        <p>Review selfies and locations to validate your team's attendance</p>
      </div>

      {(isLoading || isFetching) ? <Spinner /> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '1rem 1.5rem' }}>
            <span className="card-title">Pending Validations</span>
            <span className="badge badge-pending">{total} pending</span>
          </div>
          <AttendanceTable
            records={records}
            showEmployee
            showValidation
            onValidate={openValidate}
            onViewSelfie={(url) => setSelfieModal(url)}
          />
          {totalPages > 1 && (
            <div className="pagination">
              <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</Button>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Page {page} of {totalPages}</span>
              <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</Button>
            </div>
          )}
        </div>
      )}

      {/* Selfie Fullscreen Preview Modal */}
      <Modal isOpen={!!selfieModal} onClose={() => setSelfieModal(null)} title="Selfie Preview">
        {selfieModal && <img src={selfieModal} alt="Selfie" className="selfie-modal-img" />}
      </Modal>

      {/* Validation Modal — shows full attendance details so manager can make informed decision */}
      <Modal
        isOpen={!!validateModal}
        onClose={() => setValidateModal(null)}
        title={`Validate — ${validateModal?.userId?.name || ''}`}
        maxWidth="520px"
      >
        <form onSubmit={handleValidate} id="manager-validate-form">

          {/* Attendance Time Summary */}
          {validateModal && (
            <div className="card" style={{ padding: '0.875rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Date</span>
                  <strong>{validateModal.date}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>🟢 Punch In</span>
                  <span>{validateModal.punchIn ? formatTime(validateModal.punchIn) : '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>🔴 Punch Out</span>
                  <span>{validateModal.punchOut ? formatTime(validateModal.punchOut) : '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>⏱️ Working Hours</span>
                  <strong style={{ color: 'var(--color-success)' }}>
                    {formatWorkingHours(validateModal.workingMinutes || 0)}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Punch-In Selfie */}
          {validateModal?.punchInSelfie && (
            <div style={{ marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                📷 Punch-In Selfie
              </p>
              <img
                src={validateModal.punchInSelfie}
                alt="Punch-In Selfie"
                className="selfie-modal-img"
                style={{ maxHeight: '200px', cursor: 'pointer' }}
                onClick={() => setSelfieModal(validateModal.punchInSelfie)}
              />
            </div>
          )}

          {/* Punch-Out Selfie (if captured) */}
          {validateModal?.punchOutSelfie && (
            <div style={{ marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                📷 Punch-Out Selfie
              </p>
              <img
                src={validateModal.punchOutSelfie}
                alt="Punch-Out Selfie"
                className="selfie-modal-img"
                style={{ maxHeight: '200px', cursor: 'pointer' }}
                onClick={() => setSelfieModal(validateModal.punchOutSelfie)}
              />
            </div>
          )}

          {/* Punch-In Location */}
          {validateModal?.punchInLocation && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                📍 Punch-In Location
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                GPS: {validateModal.punchInLocation.lat.toFixed(5)}, {validateModal.punchInLocation.lng.toFixed(5)}
              </p>
              <a
                href={`https://maps.google.com/?q=${validateModal.punchInLocation.lat},${validateModal.punchInLocation.lng}`}
                target="_blank" rel="noopener noreferrer"
                className="map-link"
              >
                🗺️ View on Google Maps
              </a>
            </div>
          )}

          {/* Punch-Out Location */}
          {validateModal?.punchOutLocation && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                📍 Punch-Out Location
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                GPS: {validateModal.punchOutLocation.lat.toFixed(5)}, {validateModal.punchOutLocation.lng.toFixed(5)}
              </p>
              <a
                href={`https://maps.google.com/?q=${validateModal.punchOutLocation.lat},${validateModal.punchOutLocation.lng}`}
                target="_blank" rel="noopener noreferrer"
                className="map-link"
              >
                🗺️ View on Google Maps
              </a>
            </div>
          )}

          {/* Decision dropdown */}
          <div className="form-group">
            <label className="form-label" htmlFor="val-status">Your Decision</label>
            <select
              id="val-status" className="form-select"
              value={validForm.validationStatus}
              onChange={(e) => setValidForm((f) => ({ ...f, validationStatus: e.target.value }))}
            >
              <option value="valid">✅ Valid — Attendance is genuine</option>
              <option value="invalid">❌ Invalid — Attendance is suspicious</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="val-remarks">
              Remarks{' '}
              {validForm.validationStatus === 'invalid' && (
                <span style={{ color: 'var(--color-danger)' }}>*required</span>
              )}
            </label>
            <textarea
              id="val-remarks" className="form-textarea" rows={3}
              placeholder={
                validForm.validationStatus === 'invalid'
                  ? 'State reason for marking as invalid...'
                  : 'Optional remarks...'
              }
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
              id="btn-submit-validation"
            >
              {validForm.validationStatus === 'valid' ? '✅ Mark Valid' : '❌ Mark Invalid'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default ValidationPage;
