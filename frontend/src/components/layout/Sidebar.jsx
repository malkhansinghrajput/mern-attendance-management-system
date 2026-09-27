import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLogoutUserMutation } from '../../features/auth/authApi';
import { useSocket } from '../../context/SocketContext';
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
  const { notifications, unreadCount, markAllRead, connected } = useSocket();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  const navItems = NAV_ITEMS[role] || [];

  // Close notification panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  const toggleNotifs = () => {
    if (!showNotifs) markAllRead();
    setShowNotifs((v) => !v);
  };

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

      {/* Notification Bell */}
      <div className="sidebar-section" ref={notifRef} style={{ position: 'relative' }}>
        <button
          onClick={toggleNotifs}
          className="sidebar-nav-item"
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.6rem 1rem',
          }}
          aria-label="Notifications"
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="nav-icon">🔔</span>
            <span>Notifications</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Live connection indicator */}
            <span
              title={connected ? 'Live (real-time active)' : 'Offline'}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: connected ? 'var(--color-success)' : 'var(--color-danger)',
                flexShrink: 0,
              }}
            />
            {unreadCount > 0 && (
              <span
                style={{
                  background: 'var(--color-danger)',
                  color: '#fff',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  fontWeight: 700,
                  minWidth: '18px',
                  textAlign: 'center',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </span>
        </button>

        {/* Notification panel */}
        {showNotifs && (
          <div
            style={{
              position: 'absolute',
              left: '100%',
              top: 0,
              marginLeft: '8px',
              width: '320px',
              maxHeight: '400px',
              overflowY: 'auto',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border-color)',
                fontWeight: 700,
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
              }}
            >
              🔔 Notifications
              {notifications.length > 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                  ({notifications.length})
                </span>
              )}
            </div>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: '0.82rem',
                    lineHeight: 1.4,
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1rem' }}>{n.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                        {n.title}
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>{n.message}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
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
