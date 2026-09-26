import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useGetAdminStatsQuery } from '../../features/reports/reportsApi';
import { useGetAllUsersQuery } from '../../features/users/usersApi';
import { useGetAllAttendanceQuery } from '../../features/attendance/attendanceApi';
import { getTodayString, formatTime } from '../../utils/formatters';
import '../../styles/index.css';
import '../../styles/components.css';

const StatCard = ({ icon, value, label, variant = 'primary' }) => (
  <div className={`stat-card ${variant}`}>
    <div className="stat-card-icon">{icon}</div>
    <div className="stat-card-value">{value}</div>
    <div className="stat-card-label">{label}</div>
  </div>
);

const AdminDashboard = () => {
  const today = getTodayString();
  const { data: statsData, isLoading: statsLoading } = useGetAdminStatsQuery();
  const { data: usersData } = useGetAllUsersQuery({ page: 1, limit: 5 });
  const { data: attData, isLoading: attLoading } = useGetAllAttendanceQuery({ date: today, page: 1, limit: 8 });

  const stats = statsData?.data?.stats;
  const recentUsers = usersData?.data?.users || [];
  const todayAtt = attData?.data?.attendances || [];

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Admin Dashboard 🛡️</h1>
        <p>System-wide overview — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats */}
      {statsLoading ? <Spinner label="Loading stats..." /> : (
        <div className="stats-grid">
          <StatCard icon="👤" value={stats?.totalUsers ?? '—'} label="Active Users" variant="primary" />
          <StatCard icon="✅" value={stats?.presentToday ?? '—'} label="Present Today" variant="success" />
          <StatCard icon="🟢" value={stats?.completedToday ?? '—'} label="Completed (8h+)" variant="info" />
          <StatCard icon="🟡" value={stats?.incompleteToday ?? '—'} label="Incomplete (<8h)" variant="warning" />
          <StatCard icon="🔍" value={stats?.validToday ?? '—'} label="Validated Today" variant="info" />
          <StatCard icon="❌" value={stats?.invalidToday ?? '—'} label="Invalid Today" variant="danger" />
          <StatCard icon="⏳" value={stats?.pendingValidation ?? '—'} label="Pending Validation" variant="warning" />
        </div>
      )}

      {/* Today's Attendance */}
      <div className="section">
        <div className="section-title" style={{ justifyContent: 'space-between' }}>
          <span>📋 Today's Attendance</span>
          <Link to="/admin/attendance"><Button variant="ghost" size="sm">View All →</Button></Link>
        </div>
        {attLoading ? <Spinner /> : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Employee</th><th>Role</th><th>Punch In</th><th>Status</th><th>Validation</th></tr>
              </thead>
              <tbody>
                {todayAtt.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No attendance today</td></tr>
                ) : todayAtt.map((rec) => (
                  <tr key={rec._id}>
                    <td>
                      <div className="name-cell">
                        <div className="avatar">{rec.userId?.name?.charAt(0)?.toUpperCase()}</div>
                        <div className="name-cell-info">
                          <div className="name">{rec.userId?.name}</div>
                          <div className="email">{rec.userId?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><Badge status={rec.userId?.role} /></td>
                    <td>{rec.punchIn ? formatTime(rec.punchIn) : '—'}</td>
                    <td><Badge status={rec.attendanceStatus} /></td>
                    <td><Badge status={rec.validationStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Users */}
      <div className="section">
        <div className="section-title" style={{ justifyContent: 'space-between' }}>
          <span>👥 Recent Users</span>
          <Link to="/admin/users"><Button variant="ghost" size="sm">Manage Users →</Button></Link>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="name-cell">
                      <div className="avatar">{u.name?.charAt(0)?.toUpperCase()}</div>
                      <div className="name-cell-info"><div className="name">{u.name}</div></div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.email}</td>
                  <td><Badge status={u.role} /></td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-valid' : 'badge-invalid'}`}>
                      {u.isActive ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
