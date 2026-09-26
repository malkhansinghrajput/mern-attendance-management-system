import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import { useGetTeamAttendanceQuery } from '../../features/attendance/attendanceApi';
import { useGetPendingOvertimeQuery } from '../../features/overtime/overtimeApi';
import { useGetTeamUsersQuery } from '../../features/users/usersApi';
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

const ManagerDashboard = () => {
  const today = getTodayString();
  const { data: teamAttData, isLoading: attLoading } = useGetTeamAttendanceQuery({ date: today, page: 1, limit: 20 });
  const { data: pendingOtData } = useGetPendingOvertimeQuery({ page: 1, limit: 5 });
  const { data: teamData } = useGetTeamUsersQuery();

  const teamAttendance = teamAttData?.data?.attendances || [];
  const pendingOT = pendingOtData?.data?.requests || [];
  const teamMembers = teamData?.data?.users || [];

  const presentCount = teamAttendance.filter((a) => !!a.punchIn).length;
  const pendingValidation = teamAttendance.filter((a) => a.validationStatus === 'pending').length;

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Team Overview 👥</h1>
        <p>Today — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="👥" value={teamMembers.length} label="Team Size" variant="primary" />
        <StatCard icon="✅" value={presentCount} label="Present Today" variant="success" />
        <StatCard icon="⏳" value={pendingValidation} label="Pending Validation" variant="warning" />
        <StatCard icon="⏰" value={pendingOT.length} label="Pending OT" variant="danger" />
      </div>

      {/* Today's Team Attendance */}
      <div className="section">
        <div className="section-title" style={{ justifyContent: 'space-between' }}>
          <span>📋 Team Attendance Today</span>
          <Link to="/manager/team-attendance">
            <Button variant="ghost" size="sm">View All →</Button>
          </Link>
        </div>
        {attLoading ? <Spinner /> : teamAttendance.length === 0 ? (
          <EmptyState icon="📋" title="No attendance today" description="No team member has punched in yet." />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Employee</th><th>Punch In</th><th>Status</th><th>Validation</th></tr>
              </thead>
              <tbody>
                {teamAttendance.slice(0, 8).map((rec) => (
                  <tr key={rec._id}>
                    <td>
                      <div className="name-cell">
                        <div className="avatar">{rec.userId?.name?.charAt(0)?.toUpperCase()}</div>
                        <div className="name-cell-info">
                          <div className="name">{rec.userId?.name}</div>
                        </div>
                      </div>
                    </td>
                    <td>{rec.punchIn ? formatTime(rec.punchIn) : '—'}</td>
                    <td><Badge status={rec.attendanceStatus || 'active'} /></td>
                    <td><Badge status={rec.validationStatus || 'pending'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending OT */}
      {pendingOT.length > 0 && (
        <div className="section">
          <div className="section-title" style={{ justifyContent: 'space-between' }}>
            <span>⏰ Pending Overtime Requests</span>
            <Link to="/manager/overtime">
              <Button variant="ghost" size="sm">Review All →</Button>
            </Link>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Employee</th><th>Hours</th><th>Reason</th><th>Action</th></tr>
              </thead>
              <tbody>
                {pendingOT.map((ot) => (
                  <tr key={ot._id}>
                    <td><div className="name-cell">
                      <div className="avatar">{ot.employeeId?.name?.charAt(0)?.toUpperCase()}</div>
                      <div className="name-cell-info"><div className="name">{ot.employeeId?.name}</div></div>
                    </div></td>
                    <td><strong>{ot.requestedHours}h</strong></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '180px' }}>{ot.reason?.slice(0, 60)}…</td>
                    <td>
                      <Link to="/manager/overtime">
                        <Button size="sm" variant="primary">Review</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManagerDashboard;
