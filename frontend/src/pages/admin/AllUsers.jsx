import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { useGetAllUsersQuery, useUpdateUserStatusMutation, useCreateUserMutation } from '../../features/users/usersApi';
import { parseApiError } from '../../utils/formatters';
import toast from 'react-hot-toast';
import '../../styles/index.css';

const LIMIT = 15;

const EMPTY_FORM = { name: '', email: '', password: '', role: 'employee', managerId: '' };

const AllUsers = () => {
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [createErrors, setCreateErrors] = useState({});

  const { data, isLoading, isFetching } = useGetAllUsersQuery({
    page, limit: LIMIT,
    role: roleFilter || undefined,
    isActive: statusFilter !== '' ? statusFilter : undefined,
  });
  const [updateUserStatus, { isLoading: updating }] = useUpdateUserStatusMutation();
  const [createUser, { isLoading: creating }] = useCreateUserMutation();

  // Also fetch all managers for the managerId dropdown
  const { data: managerData } = useGetAllUsersQuery({ role: 'manager', limit: 100 });
  const managers = managerData?.data?.users || [];

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

  const validateCreate = () => {
    const e = {};
    if (!createForm.name.trim()) e.name = 'Name is required';
    if (!createForm.email.trim()) e.email = 'Email is required';
    if (!createForm.password || createForm.password.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const errs = validateCreate();
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    try {
      await createUser({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
        managerId: createForm.managerId || undefined,
      }).unwrap();
      toast.success('User created successfully!');
      setShowCreateModal(false);
      setCreateForm(EMPTY_FORM);
      setCreateErrors({});
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const handleCreateChange = (e) => {
    setCreateForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (createErrors[e.target.name]) setCreateErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  return (
    <DashboardLayout>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>User Management</h1>
          <p>View and manage all users in the system</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)} id="btn-create-user">
          + Create User
        </Button>
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

      {/* Toggle Status Modal */}
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

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setCreateForm(EMPTY_FORM); setCreateErrors({}); }}
        title="➕ Create New User"
        maxWidth="480px"
      >
        <form onSubmit={handleCreateUser} id="create-user-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="cu-name">Full Name</label>
            <input id="cu-name" name="name" className={`form-input${createErrors.name ? ' error' : ''}`}
              placeholder="John Doe" value={createForm.name} onChange={handleCreateChange} />
            {createErrors.name && <p className="form-error">{createErrors.name}</p>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="cu-email">Email</label>
            <input id="cu-email" name="email" type="email" className={`form-input${createErrors.email ? ' error' : ''}`}
              placeholder="john@company.com" value={createForm.email} onChange={handleCreateChange} />
            {createErrors.email && <p className="form-error">{createErrors.email}</p>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="cu-password">Password (min 6 chars)</label>
            <input id="cu-password" name="password" type="password" className={`form-input${createErrors.password ? ' error' : ''}`}
              placeholder="••••••••" value={createForm.password} onChange={handleCreateChange} />
            {createErrors.password && <p className="form-error">{createErrors.password}</p>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="cu-role">Role</label>
            <select id="cu-role" name="role" className="form-select" value={createForm.role} onChange={handleCreateChange}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {createForm.role === 'employee' && (
            <div className="form-group">
              <label className="form-label" htmlFor="cu-manager">Assign Manager (optional)</label>
              <select id="cu-manager" name="managerId" className="form-select" value={createForm.managerId} onChange={handleCreateChange}>
                <option value="">— No manager —</option>
                {managers.map((m) => (
                  <option key={m._id} value={m._id}>{m.name} ({m.email})</option>
                ))}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={creating} id="btn-confirm-create-user">Create User</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default AllUsers;
