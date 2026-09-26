import { useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import {
  useGetMyOvertimeQuery,
  useRequestOvertimeMutation,
} from '../../features/overtime/overtimeApi';
import { useGetMyAttendanceQuery } from '../../features/attendance/attendanceApi';
import { formatDate, parseApiError } from '../../utils/formatters';
import '../../styles/index.css';

const LIMIT = 10;

const MyOvertime = () => {
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ attendanceId: '', requestedHours: '', reason: '' });
  const [formErrors, setFormErrors] = useState({});

  const { data, isLoading } = useGetMyOvertimeQuery({ page, limit: LIMIT });
  const { data: attData } = useGetMyAttendanceQuery({ page: 1, limit: 20 });
  const [requestOvertime, { isLoading: submitting }] = useRequestOvertimeMutation();

  const requests = data?.data?.requests || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  // Only show completed/incomplete attendance (not active, not already having OT)
  const eligibleAttendances = (attData?.data?.attendances || []).filter(
    (a) => a.attendanceStatus !== 'active' && !a.overtimeRequest
  );

  const validate = () => {
    const e = {};
    if (!form.attendanceId) e.attendanceId = 'Select an attendance record';
    if (!form.requestedHours) e.requestedHours = 'Enter requested hours';
    else if (isNaN(form.requestedHours) || form.requestedHours < 0.5 || form.requestedHours > 8)
      e.requestedHours = 'Hours must be between 0.5 and 8';
    if (!form.reason.trim()) e.reason = 'Reason is required';
    else if (form.reason.trim().length < 10) e.reason = 'Reason must be at least 10 characters';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    try {
      await requestOvertime({
        attendanceId: form.attendanceId,
        requestedHours: parseFloat(form.requestedHours),
        reason: form.reason.trim(),
      }).unwrap();
      toast.success('Overtime request submitted!');
      setShowModal(false);
      setForm({ attendanceId: '', requestedHours: '', reason: '' });
      setFormErrors({});
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (formErrors[e.target.name]) setFormErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  return (
    <DashboardLayout>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Overtime Requests</h1>
          <p>Request and track your overtime approvals</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} id="btn-new-ot">
          + New Request
        </Button>
      </div>

      {isLoading ? <Spinner label="Loading requests..." /> : (
        <>
          {requests.length === 0 ? (
            <EmptyState
              icon="⏰"
              title="No overtime requests"
              description="You haven't submitted any overtime requests yet."
              action={<Button variant="primary" onClick={() => setShowModal(true)}>Request Overtime</Button>}
            />
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Requested Hours</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Reviewed By</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((ot) => (
                    <tr key={ot._id}>
                      <td style={{ fontWeight: 600 }}>{formatDate(ot.attendanceId?.date || ot.createdAt)}</td>
                      <td><strong style={{ color: 'var(--text-primary)' }}>{ot.requestedHours}h</strong></td>
                      <td style={{ maxWidth: '200px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{ot.reason}</td>
                      <td><Badge status={ot.status} /></td>
                      <td style={{ fontSize: '0.85rem' }}>{ot.reviewedBy?.name || '—'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ot.reviewRemarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="pagination">
                  <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)} id="ot-prev">← Prev</Button>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Page {page} of {totalPages}</span>
                  <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} id="ot-next">Next →</Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Request Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setFormErrors({}); }}
        title="Request Overtime"
      >
        <form onSubmit={handleSubmit} noValidate id="ot-request-form">
          <div className="form-group">
            <label className="form-label" htmlFor="ot-attendance">Select Attendance Date</label>
            <select
              id="ot-attendance" name="attendanceId"
              className={`form-select${formErrors.attendanceId ? ' error' : ''}`}
              value={form.attendanceId} onChange={handleChange}
            >
              <option value="">-- Select punched-out day --</option>
              {eligibleAttendances.map((a) => (
                <option key={a._id} value={a._id}>
                  {formatDate(a.date)} — {a.attendanceStatus}
                </option>
              ))}
            </select>
            {formErrors.attendanceId && <p className="form-error">{formErrors.attendanceId}</p>}
            {eligibleAttendances.length === 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                No eligible attendance records. You need to punch out first, and not have an existing OT request.
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ot-hours">Requested Hours (0.5 – 8)</label>
            <input
              id="ot-hours" name="requestedHours" type="number"
              min="0.5" max="8" step="0.5"
              className={`form-input${formErrors.requestedHours ? ' error' : ''}`}
              placeholder="e.g. 2"
              value={form.requestedHours} onChange={handleChange}
            />
            {formErrors.requestedHours && <p className="form-error">{formErrors.requestedHours}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ot-reason">Reason (min 10 chars)</label>
            <textarea
              id="ot-reason" name="reason"
              className={`form-textarea${formErrors.reason ? ' error' : ''}`}
              rows={4}
              placeholder="Describe why overtime was needed..."
              value={form.reason} onChange={handleChange}
              maxLength={500}
              style={{ resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
              {formErrors.reason ? <p className="form-error">{formErrors.reason}</p> : <span />}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{form.reason.length}/500</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={submitting} id="btn-submit-ot">Submit Request</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default MyOvertime;
