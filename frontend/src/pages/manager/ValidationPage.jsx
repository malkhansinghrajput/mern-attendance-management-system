import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AttendanceTable from '../../components/attendance/AttendanceTable';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { useGetTeamAttendanceQuery, useValidateAttendanceMutation } from '../../features/attendance/attendanceApi';
import { parseApiError } from '../../utils/formatters';
import toast from 'react-hot-toast';
import '../../styles/index.css';

const LIMIT = 10;

const ValidationPage = () => {
  const [page, setPage] = useState(1);
  const [selfieModal, setSelfieModal] = useState(null);
  const [validateModal, setValidateModal] = useState(null);
  const [validForm, setValidForm] = useState({ validationStatus: 'valid', validationRemarks: '' });

  const { data, isLoading, isFetching } = useGetTeamAttendanceQuery({ page, limit: LIMIT });
  const [validateAttendance, { isLoading: validating }] = useValidateAttendanceMutation();

  const allRecords = data?.data?.attendances || [];
  const records = allRecords.filter((a) => a.validationStatus === 'pending');
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
        <p>Review selfies and locations to validate team attendance</p>
      </div>

      {(isLoading || isFetching) ? <Spinner /> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '1rem 1.5rem' }}>
            <span className="card-title">Pending Validations</span>
            <span className="badge badge-pending">{records.length} pending</span>
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
              <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Page {page} of {totalPages}</span>
              <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={!!selfieModal} onClose={() => setSelfieModal(null)} title="Selfie Preview">
        {selfieModal && <img src={selfieModal} alt="Selfie" className="selfie-modal-img" />}
      </Modal>

      <Modal
        isOpen={!!validateModal}
        onClose={() => setValidateModal(null)}
        title={`Validate — ${validateModal?.userId?.name || ''}`}
      >
        <form onSubmit={handleValidate} id="manager-validate-form">
          {validateModal?.punchInSelfie && (
            <div style={{ marginBottom: '1rem' }}>
              <img src={validateModal.punchInSelfie} alt="Selfie" className="selfie-modal-img" style={{ maxHeight: '220px' }} />
            </div>
          )}
          {validateModal?.punchInLocation && (
            <div style={{ marginBottom: '1rem' }}>
              <a
                href={`https://maps.google.com/?q=${validateModal.punchInLocation.lat},${validateModal.punchInLocation.lng}`}
                target="_blank" rel="noopener noreferrer"
                className="map-link"
              >
                View Location on Maps
              </a>
            </div>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="val-status">Decision</label>
            <select
              id="val-status" className="form-select"
              value={validForm.validationStatus}
              onChange={(e) => setValidForm((f) => ({ ...f, validationStatus: e.target.value }))}
            >
              <option value="valid">Valid</option>
              <option value="invalid">Invalid</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="val-remarks">Remarks</label>
            <textarea
              id="val-remarks" className="form-textarea" rows={3}
              placeholder="Add remarks..."
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
              Submit Validation
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default ValidationPage;
