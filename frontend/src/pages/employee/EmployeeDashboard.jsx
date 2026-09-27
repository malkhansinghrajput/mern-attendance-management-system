import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../context/SocketContext';
import { useGetTodayAttendanceQuery, useGetMyAttendanceQuery } from '../../features/attendance/attendanceApi';
import { useGetMyOvertimeQuery } from '../../features/overtime/overtimeApi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PunchCard from '../../components/attendance/PunchCard';
import AttendanceTable from '../../components/attendance/AttendanceTable';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import { formatDate, formatWorkingHours } from '../../utils/formatters';
import '../../styles/index.css';
import '../../styles/components.css';

const STANDARD_SHIFT_MINUTES = 480;

const StatCard = ({ icon, value, label, variant = 'primary', subtitle }) => (
  <div className={`stat-card ${variant}`}>
    <div className="stat-card-icon">{icon}</div>
    <div className="stat-card-value">{value}</div>
    <div className="stat-card-label">{label}</div>
    {subtitle && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{subtitle}</div>}
  </div>
);

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const {
    data: todayData,
    isLoading: todayLoading,
    refetch: refetchToday,
  } = useGetTodayAttendanceQuery(undefined, {
    // Keep 30s polling as fallback — socket events are primary
    pollingInterval: 30000,
  });

  const {
    data: historyData,
    refetch: refetchHistory,
  } = useGetMyAttendanceQuery({ page: 1, limit: 7 });

  const { data: otData } = useGetMyOvertimeQuery({ page: 1, limit: 3 });

  // ── Real-time: refetch when socket fires attendance events ─────────────────
  useEffect(() => {
    if (!socket) return;
    const onUpdate = () => {
      refetchToday();
      refetchHistory();
    };
    // Listen to own attendance update events
    socket.on('attendance:updated', onUpdate);
    socket.on('attendance:validated', onUpdate);
    socket.on('overtime:approved', onUpdate);
    socket.on('overtime:rejected', onUpdate);
    return () => {
      socket.off('attendance:updated', onUpdate);
      socket.off('attendance:validated', onUpdate);
      socket.off('overtime:approved', onUpdate);
      socket.off('overtime:rejected', onUpdate);
    };
  }, [socket, refetchToday, refetchHistory]);

  const attendance = todayData?.data?.attendance;
  const history = historyData?.data?.attendances || [];
  const otRequests = otData?.data?.requests || [];

  // Stats
  const completedDays = history.filter((a) => a.attendanceStatus === 'completed').length;
  const incompleteDays = history.filter((a) => a.attendanceStatus === 'incomplete').length;
  const totalHours = history.reduce((sum, a) => sum + (a.workingMinutes || 0), 0);

  const todayMinutes = attendance?.workingMinutes || 0;
  const isActive = attendance?.attendanceStatus === 'active';

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Navigate to OT page with the record pre-selected
  const handleRequestOvertime = () => {
    navigate('/employee/overtime');
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
          icon={isActive ? '⚡' : attendance?.attendanceStatus === 'completed' ? '✅' : '📋'}
          value={
            isActive ? 'Active'
            : attendance?.attendanceStatus === 'completed' ? 'Completed'
            : attendance?.attendanceStatus === 'incomplete' ? 'Incomplete'
            : 'Not In'
          }
          label="Today's Status"
          subtitle={
            isActive ? 'Shift in progress'
            : attendance?.attendanceStatus === 'completed' ? '≥ 8h shift done'
            : attendance?.attendanceStatus === 'incomplete' ? '< 8h — incomplete'
            : 'Not punched in yet'
          }
          variant={
            isActive ? 'success'
            : attendance?.attendanceStatus === 'completed' ? 'info'
            : attendance?.attendanceStatus === 'incomplete' ? 'warning'
            : 'primary'
          }
        />
        <StatCard
          icon="⏱️"
          value={attendance ? formatWorkingHours(todayMinutes) : '—'}
          label="Today's Hours"
          subtitle={attendance ? `of 8h target (${todayMinutes >= STANDARD_SHIFT_MINUTES ? '✅ met' : `${STANDARD_SHIFT_MINUTES - Math.min(todayMinutes, STANDARD_SHIFT_MINUTES)}m left`})` : 'No data'}
          variant="info"
        />
        <StatCard
          icon="📅"
          value={`${completedDays}`}
          label="Days Completed (Last 7)"
          subtitle={`${incompleteDays} incomplete day${incompleteDays !== 1 ? 's' : ''}`}
          variant="success"
        />
        <StatCard
          icon="🕐"
          value={formatWorkingHours(totalHours)}
          label="Total Hours (Last 7)"
          subtitle={`Avg: ${formatWorkingHours(Math.round(totalHours / Math.max(history.length, 1)))}/day`}
          variant="warning"
        />
      </div>

      {/* Punch Card */}
      <div className="section">
        <div className="section-title">⚡ Attendance Actions</div>
        {todayLoading ? (
          <Spinner label="Loading today's attendance..." />
        ) : (
          <PunchCard attendance={attendance} onRequestOvertime={handleRequestOvertime} />
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
