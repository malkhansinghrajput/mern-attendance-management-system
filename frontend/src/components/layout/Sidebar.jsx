import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLogoutUserMutation } from '../../features/auth/authApi';
import '../../styles/components.css';

const NAV_ITEMS = {
  employee: [
    { label: 'Dashboard', icon: '🏠', to: '/employee/dashboard' },
    { label: 'My Attendance', icon: '📋', to: '/employee/attendance' },
    { label: 'Overtime Requests', icon: '⏰', to: '/employee/overtime' },
    { label: 'Reports', icon: '📊', to: '/reports' },
  ],
  manager: [
    { label: 'Dashboard', icon: '🏠', to: '/manager/dashboard' },
    { label: 'Team Attendance', icon: '👥', to: '/manager/team-attendance' },
    { label: 'Validation', icon: '✅', to: '/manager/validation' },
    { label: 'Overtime Approval', icon: '⏰', to: '/manager/overtime' },
    { label: 'Reports', icon: '📊', to: '/reports' },
  ],
  admin: [
    { label: 'Dashboard', icon: '🏠', to: '/admin/dashboard' },
    { label: 'All Attendance', icon: '📋', to: '/admin/attendance' },
    { label: 'Validation', icon: '✅', to: '/admin/validation' },
    { label: 'Overtime', icon: '⏰', to: '/admin/overtime' },
    { label: 'Users', icon: '👤', to: '/admin/users' },
    { label: 'Reports', icon: '📊', to: '/reports' },
  ],
};

const Sidebar = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [logoutUser] = useLogoutUserMutation();

  const navItems = NAV_ITEMS[role] || [];

  const handleLogout = async () => {
    try {
      await logoutUser().unwrap();
    } catch {
      // logout clears state regardless
    }
    navigate('/login', { replace: true });
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <aside className="sidebar" id="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">📍</div>
        <div>
          <div className="sidebar-brand-name">AttendPro</div>
          <div className="sidebar-brand-sub">Management System</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">Navigation</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* User & Logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-role">{role}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-nav-item"
          style={{ width: '100%', marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
          aria-label="Logout"
        >
          <span className="nav-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
