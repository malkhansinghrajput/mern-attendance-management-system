import { useAuth } from '../../hooks/useAuth';
import { useGetTodayAttendanceQuery } from '../../features/attendance/attendanceApi';
import { useGetMyOvertimeQuery } from '../../features/overtime/overtimeApi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PunchCard from '../../components/attendance/PunchCard';
import AttendanceTable from '../../components/attendance/AttendanceTable';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import { useGetMyAttendanceQuery } from '../../features/attendance/attendanceApi';
import { formatDate, formatWorkingHours } from '../../utils/formatters';
import '../../styles/index.css';
import '../../styles/components.css';

const StatCard = ({ icon, value, label, variant = 'primary' }) => (
  <div className={`stat-card ${variant}`}>
    <div className="stat-card-icon">{icon}</div>
    <div className="stat-card-value">{value}</div>
    <div className="stat-card-label">{label}</div>
  </div>
);

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const { data: todayData, isLoading: todayLoading } = useGetTodayAttendanceQuery();
  const { data: historyData } = useGetMyAttendanceQuery({ page: 1, limit: 7 });
  const { data: otData } = useGetMyOvertimeQuery({ page: 1, limit: 3 });

  const attendance = todayData?.data?.attendance;
  const history = historyData?.data?.attendances || [];
  const otRequests = otData?.data?.requests || [];

  const thisMonthDays = history.filter((a) => a.attendanceStatus === 'completed').length;
  const totalHours = history.reduce((sum, a) => sum + (a.workingMinutes || 0), 0);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="page-header">
        <h1>{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
        <p>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          icon="✅"
          value={attendance?.attendanceStatus === 'active' ? 'Active' : attendance?.attendanceStatus || 'Not In'}
          label="Today's Status"
          variant={attendance?.attendanceStatus === 'active' ? 'success' : attendance?.attendanceStatus === 'completed' ? 'info' : 'primary'}
        />
        <StatCard
          icon="⏱️"
          value={attendance?.workingMinutes ? formatWorkingHours(attendance.workingMinutes) : '—'}
          label="Today's Hours"
          variant="info"
        />
        <StatCard
          icon="📅"
          value={`${thisMonthDays}`}
          label="Days Completed (Last 7)"
          variant="success"
        />
        <StatCard
          icon="🕐"
          value={formatWorkingHours(totalHours)}
          label="Total Hours (Last 7)"
          variant="warning"
        />
      </div>

      {/* Punch Card */}
      <div className="section">
        <div className="section-title">⚡ Attendance Actions</div>
        {todayLoading ? <Spinner label="Loading today's attendance..." /> : (
          <PunchCard attendance={attendance} />
        )}
      </div>

      {/* Attendance History */}
      {history.length > 0 && (
        <div className="section">
          <div className="section-title">📋 Recent Attendance (Last 7 Days)</div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <AttendanceTable records={history} showValidation />
          </div>
        </div>
      )}

      {/* Overtime Requests */}
      {otRequests.length > 0 && (
        <div className="section">
          <div className="section-title">⏰ Recent Overtime Requests</div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Requested Hours</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {otRequests.map((ot) => (
                  <tr key={ot._id}>
                    <td>{formatDate(ot.attendanceId?.date || ot.createdAt)}</td>
                    <td><strong>{ot.requestedHours}h</strong></td>
                    <td style={{ maxWidth: '200px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {ot.reason?.slice(0, 60)}{ot.reason?.length > 60 ? '…' : ''}
                      </span>
                    </td>
                    <td><Badge status={ot.status} /></td>
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

export default EmployeeDashboard;
