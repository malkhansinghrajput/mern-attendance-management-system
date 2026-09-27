import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../context/SocketContext';
import { formatDate } from '../../utils/formatters';
import { useTheme } from '../../hooks/useTheme';
import '../../styles/components.css';

const PAGE_TITLES = {
  '/employee/dashboard': 'Dashboard',
  '/employee/attendance': 'My Attendance',
  '/employee/overtime': 'Overtime Requests',
  '/manager/dashboard': 'Manager Dashboard',
  '/manager/team-attendance': 'Team Attendance',
  '/manager/validation': 'Attendance Validation',
  '/manager/overtime': 'Overtime Approval',
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/attendance': 'All Attendance',
  '/admin/validation': 'Validation',
  '/admin/overtime': 'Overtime Management',
  '/admin/users': 'User Management',
  '/admin/settings': 'Geofence Settings',
  '/reports': 'Reports',
  '/profile': 'My Profile',
  '/profile/edit': 'Edit Profile',
};

const Navbar = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAllRead, connected } = useSocket();
  const { isDark, toggleTheme } = useTheme();

  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  const path = window.location.pathname;
  const title = PAGE_TITLES[path] || 'Attendance System';

  useEffect(() => {
    const handleMousedown = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowNotifs(false);
    };
    document.addEventListener('mousedown', handleMousedown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMousedown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);


  const toggleNotifs = () => {
    if (!showNotifs) markAllRead();
    setShowNotifs((prev) => !prev);
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="navbar-menu-btn"
            aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {isSidebarOpen ? '✕' : '☰'}
          </button>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span className="navbar-title">{title}</span>
          <span className="navbar-date">
            {formatDate(new Date())} &middot; Welcome, {user?.name?.split(' ')[0] || 'User'}
          </span>
        </div>
      </div>

      <div className="navbar-right">
        <span className="navbar-tz">🌐 IST</span>

        {/* Notification Button & Flyout */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={toggleNotifs}
            style={{
              position: 'relative',
              background: showNotifs ? 'rgba(99,102,241,0.15)' : 'var(--bg-glass)',
              border: '1px solid var(--border-default)',
              borderRadius: '10px',
              padding: '0.45rem 0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--text-primary)',
              transition: 'all 0.2s ease',
            }}
            title="Notifications"
            aria-label="Open notifications"
            id="btn-notifications"
          >
            <span style={{ fontSize: '1rem' }}>🔔</span>
            <span
              style={{
                width: 7, height: 7, borderRadius: '50%',
                background: connected ? '#10b981' : '#ef4444',
                boxShadow: connected ? '0 0 6px #10b981' : 'none',
                display: 'inline-block',
              }}
              title={connected ? 'Socket.IO Live' : 'Disconnected'}
            />
            {unreadCount > 0 && (
              <span style={{
                background: '#ef4444', color: '#fff', borderRadius: '10px',
                fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px',
                minWidth: '16px', textAlign: 'center',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 10px)',
              width: '340px', maxHeight: '440px', display: 'flex',
              flexDirection: 'column', background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)', borderRadius: '14px',
              boxShadow: 'var(--shadow-lg)', zIndex: 99999,
              backdropFilter: 'blur(16px)', overflow: 'hidden',
            }}>
              <div style={{
                padding: '0.85rem 1rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-glass)',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)',
                }}>
                  <span>🔔</span> Notifications
                  {notifications.length > 0 && (
                    <span style={{
                      fontSize: '0.75rem', background: 'rgba(99,102,241,0.2)',
                      color: '#818cf8', padding: '1px 7px', borderRadius: '10px',
                    }}>
                      {notifications.length}
                    </span>
                  )}
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  color: connected ? '#10b981' : '#ef4444',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: connected ? '#10b981' : '#ef4444',
                    display: 'inline-block',
                  }} />
                  {connected ? 'Live' : 'Offline'}
                </span>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '360px' }}>
                {notifications.length === 0 ? (
                  <div style={{
                    padding: '2.5rem 1rem', textAlign: 'center',
                    color: 'var(--text-muted)', fontSize: '0.85rem',
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}>🔕</div>
                    No notifications right now.<br />
                    <span style={{ fontSize: '0.75rem' }}>Real-time events will appear here live.</span>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} style={{
                      padding: '0.8rem 1rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      fontSize: '0.82rem', lineHeight: 1.4,
                      background: n.read ? 'transparent' : 'rgba(99,102,241,0.08)',
                      transition: 'background 0.2s',
                    }}>
                      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '1.1rem', marginTop: '1px' }}>{n.icon || '🔔'}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                            {n.title}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{n.message}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          id="btn-theme-toggle"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            position: 'relative',
            width: '52px', height: '28px',
            borderRadius: '999px', border: 'none',
            cursor: 'pointer', padding: 0,
            background: isDark
              ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
              : 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
            boxShadow: isDark
              ? '0 0 12px rgba(99,102,241,0.5)'
              : '0 0 12px rgba(245,158,11,0.5)',
            transition: 'background 0.35s ease, box-shadow 0.35s ease',
            flexShrink: 0,
          }}
        >
          <span style={{
            position: 'absolute', top: '3px',
            left: isDark ? '3px' : '25px',
            width: '22px', height: '22px',
            borderRadius: '50%', background: '#ffffff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '12px', lineHeight: 1,
          }}>
            {isDark ? '🌙' : '☀️'}
          </span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
