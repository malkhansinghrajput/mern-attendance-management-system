import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { useGetAllUsersQuery, useUpdateUserStatusMutation } from '../../features/users/usersApi';
import { parseApiError } from '../../utils/formatters';
import toast from 'react-hot-toast';
import '../../styles/index.css';

const LIMIT = 15;
const ROLES = ['', 'employee', 'manager', 'admin'];

const AllUsers = () => {
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);

  const { data, isLoading, isFetching } = useGetAllUsersQuery({
    page, limit: LIMIT,
    role: roleFilter || undefined,
    isActive: statusFilter !== '' ? statusFilter : undefined,
  });
  const [updateUserStatus, { isLoading: updating }] = useUpdateUserStatusMutation();

  const users = data?.data?.users || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  const handleToggleStatus = async () => {
    if (!confirmModal) return;
    try {
      await updateUserStatus({ id: confirmModal._id, isActive: !confirmModal.isActive }).unwrap();
      toast.success(`User ${!confirmModal.isActive ? 'activated' : 'deactivated'}!`);
      setConfirmModal(null);
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>User Management</h1>
        <p>View and manage all users in the system</p>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" htmlFor="role-filter">Role</label>
          <select
            id="role-filter" className="form-select"
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Roles</option>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" htmlFor="status-filter">Status</label>
          <select
            id="status-filter" className="form-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {total} user{total !== 1 ? 's' : ''}
        </span>
      </div>

      {isLoading || isFetching ? <Spinner /> : users.length === 0 ? (
        <EmptyState icon="👤" title="No users found" description="Try adjusting the filters." />
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Manager</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="name-cell">
                        <div className="avatar">{u.name?.charAt(0)?.toUpperCase()}</div>
                        <div className="name-cell-info">
                          <div className="name">{u.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.email}</td>
                    <td><Badge status={u.role} /></td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {u.managerId?.name || '—'}
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-valid' : 'badge-invalid'}`}>
                        {u.isActive ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant={u.isActive ? 'danger' : 'success'}
                        onClick={() => setConfirmModal(u)}
                        id={`btn-toggle-${u._id}`}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
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

      {/* Confirm Modal */}
      <Modal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal?.isActive ? 'Deactivate User?' : 'Activate User?'}
      >
        {confirmModal && (
          <div>
            <p style={{ marginBottom: '1.5rem' }}>
              Are you sure you want to {confirmModal.isActive ? 'deactivate' : 'activate'}{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{confirmModal.name}</strong>?
              {confirmModal.isActive && ' They will not be able to log in.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button
                variant={confirmModal.isActive ? 'danger' : 'success'}
                loading={updating}
                onClick={handleToggleStatus}
                id="btn-confirm-status"
              >
                {confirmModal.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default AllUsers;
