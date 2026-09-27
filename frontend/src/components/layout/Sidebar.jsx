import { useEffect } from 'react';
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
    { label: 'My Profile', icon: '👤', to: '/profile' },
  ],
  manager: [
    { label: 'Dashboard', icon: '🏠', to: '/manager/dashboard' },
    { label: 'Team Attendance', icon: '👥', to: '/manager/team-attendance' },
    { label: 'Validation', icon: '✅', to: '/manager/validation' },
    { label: 'Overtime Approval', icon: '⏰', to: '/manager/overtime' },
    { label: 'Reports', icon: '📊', to: '/reports' },
    { label: 'My Profile', icon: '👤', to: '/profile' },
  ],
  admin: [
    { label: 'Dashboard', icon: '🏠', to: '/admin/dashboard' },
    { label: 'All Attendance', icon: '📋', to: '/admin/attendance' },
    { label: 'Validation', icon: '✅', to: '/admin/validation' },
    { label: 'Overtime', icon: '⏰', to: '/admin/overtime' },
    { label: 'Users', icon: '👤', to: '/admin/users' },
    { label: 'Geofence Settings', icon: '⚙️', to: '/admin/settings' },
    { label: 'Reports', icon: '📊', to: '/reports' },
    { label: 'My Profile', icon: '👤', to: '/profile' },
  ],
};

const Sidebar = ({ isOpen = false, onClose }) => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [logoutUser] = useLogoutUserMutation();
  const navItems = NAV_ITEMS[role] || [];

  // Keyboard Escape listener to close drawer on mobile
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    try {
      await logoutUser().unwrap();
    } catch {
      // ignore
    }
    if (onClose) onClose();
    navigate('/login', { replace: true });
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';


  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`sidebar-backdrop${isOpen ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar${isOpen ? ' open' : ''}`} id="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <img
            src="/logo.png"
            alt="AttendPro Logo"
            className="sidebar-logo-img"
          />
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">Attendance</span>
            <span className="sidebar-brand-subtitle">Management</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="sidebar-close-btn"
              aria-label="Close navigation"
              style={{ flexShrink: 0, marginLeft: '0.25rem' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Navigation</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `sidebar-nav-item${isActive ? ' active' : ''}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="sidebar-footer">
          <div
            className="sidebar-user"
            onClick={() => { if (onClose) onClose(); navigate('/profile'); }}
            style={{ cursor: 'pointer' }}
            title="View Profile"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user?.name || 'User'}
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div className="sidebar-avatar">{initials}</div>
            )}
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'User'}</div>
              <div className="sidebar-user-role">{role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-nav-item"
            style={{
              width: '100%',
              marginTop: '0.5rem',
              background: 'none',
              border: 'none',
              color: 'var(--color-danger)',
              cursor: 'pointer',
            }}
            aria-label="Logout"
          >
            <span className="nav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
