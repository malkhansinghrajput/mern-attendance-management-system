import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import {
  useGetPendingOvertimeQuery,
  useApproveOvertimeMutation,
  useRejectOvertimeMutation,
} from '../../features/overtime/overtimeApi';
import { formatDate, parseApiError } from '../../utils/formatters';
import toast from 'react-hot-toast';
import '../../styles/index.css';

const LIMIT = 10;

const OvertimeApproval = () => {
  const [page, setPage] = useState(1);
  const [reviewModal, setReviewModal] = useState(null);
  const [action, setAction] = useState('approve'); // 'approve' | 'reject'
  const [remarks, setRemarks] = useState('');

  const { data, isLoading } = useGetPendingOvertimeQuery({ page, limit: LIMIT });
  const [approveOvertime, { isLoading: approving }] = useApproveOvertimeMutation();
  const [rejectOvertime, { isLoading: rejecting }] = useRejectOvertimeMutation();

  const requests = data?.data?.requests || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  const openReview = (ot, act) => {
    setReviewModal(ot);
    setAction(act);
    setRemarks('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (action === 'reject' && !remarks.trim()) {
      toast.error('Remarks are required when rejecting');
      return;
    }
    try {
      const payload = { id: reviewModal._id, reviewRemarks: remarks || undefined };
      if (action === 'approve') {
        await approveOvertime(payload).unwrap();
        toast.success('Overtime approved!');
      } else {
        await rejectOvertime(payload).unwrap();
        toast.success('Overtime rejected.');
      }
      setReviewModal(null);
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Overtime Approval</h1>
        <p>Review and approve or reject your team's overtime requests</p>
      </div>

      {isLoading ? <Spinner /> : requests.length === 0 ? (
        <EmptyState icon="⏰" title="No pending overtime requests" description="All caught up! No overtime requests awaiting review." />
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Requested Hours</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((ot) => (
                  <tr key={ot._id}>
                    <td>
                      <div className="name-cell">
                        <div className="avatar">{ot.employeeId?.name?.charAt(0)?.toUpperCase()}</div>
                        <div className="name-cell-info">
                          <div className="name">{ot.employeeId?.name}</div>
                          <div className="email">{ot.employeeId?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatDate(ot.attendanceId?.date || ot.createdAt)}</td>
                    <td><strong style={{ color: 'var(--color-warning)' }}>{ot.requestedHours}h</strong></td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '200px' }}>
                      {ot.reason?.slice(0, 80)}{ot.reason?.length > 80 ? '…' : ''}
                    </td>
                    <td><Badge status={ot.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                          size="sm" variant="success"
                          onClick={() => openReview(ot, 'approve')}
                          id={`btn-approve-${ot._id}`}
                        >
                          ✅
                        </Button>
                        <Button
                          size="sm" variant="danger"
                          onClick={() => openReview(ot, 'reject')}
                          id={`btn-reject-${ot._id}`}
                        >
                          ❌
                        </Button>
                      </div>
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

      {/* Review Modal */}
      <Modal
        isOpen={!!reviewModal}
        onClose={() => setReviewModal(null)}
        title={action === 'approve' ? '✅ Approve Overtime' : '❌ Reject Overtime'}
      >
        <form onSubmit={handleSubmit} id="ot-review-form">
          {reviewModal && (
            <div className="card" style={{ padding: '0.875rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div className="ot-info">
                  <span>👤 <strong>{reviewModal.employeeId?.name}</strong></span>
                  <span>📅 {formatDate(reviewModal.attendanceId?.date)}</span>
                  <span>⏱️ <strong>{reviewModal.requestedHours}h requested</strong></span>
                </div>
                <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                  <strong>Reason:</strong> {reviewModal.reason}
                </p>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="ot-remarks">
              Remarks {action === 'reject' && <span style={{ color: 'var(--color-danger)' }}>*required</span>}
            </label>
            <textarea
              id="ot-remarks"
              className="form-textarea" rows={3}
              placeholder={action === 'reject' ? 'State reason for rejection...' : 'Optional remarks...'}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={() => setReviewModal(null)}>Cancel</Button>
            <Button
              type="submit"
              variant={action === 'approve' ? 'success' : 'danger'}
              loading={approving || rejecting}
              id="btn-confirm-ot-action"
            >
              {action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default OvertimeApproval;
