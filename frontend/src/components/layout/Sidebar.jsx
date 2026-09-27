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

  // Keyboard Escape listener to close drawer on mobile
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showNotifs) setShowNotifs(false);
        else if (isOpen && onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, showNotifs]);

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

  const toggleNotifs = () => {
    if (!showNotifs) markAllRead();
    setShowNotifs((v) => !v);
  };

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

        {/* Notifications */}
        <div className="sidebar-section" ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={toggleNotifs}
            className={`sidebar-nav-item${showNotifs ? ' active' : ''}`}
            style={{
              width: '100%',
              background: showNotifs ? 'var(--bg-glass-hover)' : 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.65rem 0.75rem',
            }}
            aria-label="Open notifications"
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="nav-icon">🔔</span>
              <span>Notifications</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                title={connected ? 'Socket.IO Live' : 'Disconnected'}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: connected ? 'var(--color-success)' : 'var(--color-danger)',
                  flexShrink: 0,
                  boxShadow: connected ? '0 0 8px rgba(16,185,129,0.6)' : 'none',
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

          {showNotifs && (
            <div
              className="sidebar-notif-flyout"
              style={{
                position: 'fixed',
                left: 'calc(var(--sidebar-width, 260px) + 8px)',
                bottom: '80px',
                width: '340px',
                maxHeight: '440px',
                display: 'flex',
                flexDirection: 'column',
                background: '#1e1e2d',
                border: '1px solid var(--border-color, rgba(255,255,255,0.12))',
                borderRadius: '14px',
                boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                zIndex: 99999,
                backdropFilter: 'blur(16px)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                  <span>🔔</span> Notifications
                  {notifications.length > 0 && (
                    <span style={{ fontSize: '0.75rem', background: 'rgba(99,102,241,0.2)', color: '#818cf8', padding: '1px 7px', borderRadius: '10px' }}>
                      {notifications.length}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.72rem', color: connected ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#10b981' : '#ef4444' }} />
                  {connected ? 'Live' : 'Offline'}
                </span>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '360px' }}>
                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: '2.5rem 1rem',
                      textAlign: 'center',
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}>🔕</div>
                    No notifications right now.<br />
                    <span style={{ fontSize: '0.75rem' }}>Real-time events will appear here live.</span>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '0.8rem 1rem',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        fontSize: '0.82rem',
                        lineHeight: 1.4,
                        background: n.read ? 'transparent' : 'rgba(99,102,241,0.08)',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '1.1rem', marginTop: '1px' }}>{n.icon || '🔔'}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#f3f4f6', marginBottom: '0.15rem' }}>
                            {n.title}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>{n.message}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
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
