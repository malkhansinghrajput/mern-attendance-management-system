import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/formatters';
import '../../styles/components.css';

const PAGE_TITLES = {
  '/employee/dashboard': 'Dashboard',
  '/employee/attendance': 'My Attendance',
  '/employee/overtime': 'Overtime Requests',
  '/manager/dashboard': 'Dashboard',
  '/manager/team-attendance': 'Team Attendance',
  '/manager/validation': 'Attendance Validation',
  '/manager/overtime': 'Overtime Approval',
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/attendance': 'All Attendance',
  '/admin/validation': 'Validation',
  '/admin/overtime': 'Overtime Management',
  '/admin/users': 'User Management',
  '/reports': 'Reports',
};

const Navbar = () => {
  const { user } = useAuth();
  const path = window.location.pathname;
  const title = PAGE_TITLES[path] || 'Attendance System';

  return (
    <header className="navbar">
      <div className="navbar-left">
        <span className="navbar-title">{title}</span>
        <span className="navbar-date">
          {formatDate(new Date())} · Welcome, {user?.name?.split(' ')[0] || 'User'}
        </span>
      </div>
      <div className="navbar-right">
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          🌐 IST
        </span>
      </div>
    </header>
  );
};

export default Navbar;
