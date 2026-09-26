import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AttendanceTable from '../../components/attendance/AttendanceTable';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { useGetAllAttendanceQuery, useValidateAttendanceMutation } from '../../features/attendance/attendanceApi';
import { parseApiError } from '../../utils/formatters';
import toast from 'react-hot-toast';
import '../../styles/index.css';

const LIMIT = 15;

const AdminValidation = () => {
  const [page, setPage] = useState(1);
  const [selfieModal, setSelfieModal] = useState(null);
  const [validateModal, setValidateModal] = useState(null);
  const [validForm, setValidForm] = useState({ validationStatus: 'valid', validationRemarks: '' });

  // Admin fetches all — we filter for pending in the query by relying on the service to return all
  const { data, isLoading, isFetching } = useGetAllAttendanceQuery({ page, limit: LIMIT });
  const [validateAttendance, { isLoading: validating }] = useValidateAttendanceMutation();

  // Show all records so admin can see everything and re-validate
  const records = data?.data?.attendances || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!validateModal) return;
    if (validForm.validationStatus === 'invalid' && !validForm.validationRemarks.trim()) {
      toast.error('Remarks are required when marking invalid');
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
    setValidForm({
      validationStatus: rec.validationStatus === 'pending' ? 'valid' : rec.validationStatus,
      validationRemarks: rec.validationRemarks || '',
    });
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Attendance Validation (Admin)</h1>
        <p>Review and validate any attendance record. Admin can re-validate manager's decisions.</p>
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

      <Modal isOpen={!!selfieModal} onClose={() => setSelfieModal(null)} title="Selfie Preview">
        {selfieModal && <img src={selfieModal} alt="Selfie" className="selfie-modal-img" />}
      </Modal>

      <Modal
        isOpen={!!validateModal}
        onClose={() => setValidateModal(null)}
        title={`Validate — ${validateModal?.userId?.name || ''}`}
      >
        <form onSubmit={handleValidate} id="admin-validate-form">
          {validateModal?.punchInSelfie && (
            <div style={{ marginBottom: '1rem' }}>
              <img src={validateModal.punchInSelfie} alt="Selfie" className="selfie-modal-img" style={{ maxHeight: '220px' }} />
            </div>
          )}
          {validateModal?.punchInLocation && (
            <div style={{ marginBottom: '1rem' }}>
              <a
                href={`https://maps.google.com/?q=${validateModal.punchInLocation.lat},${validateModal.punchInLocation.lng}`}
                target="_blank" rel="noopener noreferrer" className="map-link"
              >
                🗺️ View Punch-In Location
              </a>
            </div>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="admin-val-status">Decision</label>
            <select id="admin-val-status" className="form-select"
              value={validForm.validationStatus}
              onChange={(e) => setValidForm((f) => ({ ...f, validationStatus: e.target.value }))}>
              <option value="valid">✅ Valid</option>
              <option value="invalid">❌ Invalid</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-val-remarks">Remarks</label>
            <textarea id="admin-val-remarks" className="form-textarea" rows={3}
              value={validForm.validationRemarks}
              onChange={(e) => setValidForm((f) => ({ ...f, validationRemarks: e.target.value }))}
              style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={() => setValidateModal(null)}>Cancel</Button>
            <Button type="submit"
              variant={validForm.validationStatus === 'valid' ? 'success' : 'danger'}
              loading={validating} id="btn-admin-validate">
              Submit Validation
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default AdminValidation;
