import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import { useGetMyProfileQuery } from '../../features/users/usersApi';
import { formatDate, parseApiError } from '../../utils/formatters';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetMyProfileQuery();

  const user = data?.data?.user;

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              👤 My Profile
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Manage your personal information and account settings
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/profile/edit')}
            id="btn-edit-profile-page"
          >
            ✏️ Edit Profile
          </Button>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            <span>⚠️</span>
            <span>Failed to load profile: {parseApiError(error)}</span>
          </div>
        ) : user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Top User Overview Card */}
            <div className="card" style={{ padding: '1.75rem', background: 'var(--gradient-card)', border: '1px solid var(--border-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    style={{
                      width: '84px',
                      height: '84px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--color-primary)',
                      boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '84px',
                      height: '84px',
                      borderRadius: '50%',
                      background: 'var(--gradient-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '2rem',
                      color: '#fff',
                      boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
                    }}
                  >
                    {initials}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {user.name}
                    </h2>
                    <span className={`badge badge-${user.role}`}>{user.role}</span>
                    <Badge status={user.isActive ? 'active' : 'inactive'} />
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    {user.email}
                  </p>
                  {user.employeeId && (
                    <span style={{ fontSize: '0.78rem', background: 'var(--bg-glass)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                      ID: {user.employeeId}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {/* Personal Information */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📋 Personal Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{user.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{user.email}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number</span>
                    <strong style={{ color: user.phone ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {user.phone || 'Not provided'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</span>
                    <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{user.role}</strong>
                  </div>
                </div>
              </div>

              {/* Work & Account Information */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  💼 Work & Account Info
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Manager</span>
                    <strong style={{ color: user.managerId ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {user.managerId ? `${user.managerId.name} (${user.managerId.email})` : 'None / Admin'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Status</span>
                    <strong style={{ color: user.isActive ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Joined Date</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{formatDate(user.createdAt)}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Updated</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{formatDate(user.updatedAt)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
