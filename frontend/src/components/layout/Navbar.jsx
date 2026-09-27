import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../context/SocketContext';
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

const Navbar = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAllRead, connected } = useSocket();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  const path = window.location.pathname;
  const title = PAGE_TITLES[path] || 'Attendance System';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleToggle = () => {
    if (!showNotifs) markAllRead();
    setShowNotifs((prev) => !prev);
  };

  return (
    <header className="navbar" style={{ position: 'relative' }}>
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
            {formatDate(new Date())} · Welcome, {user?.name?.split(' ')[0] || 'User'}
          </span>
        </div>
      </div>

      <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <span className="navbar-tz" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          🌐 IST
        </span>

        {/* Top Header Notification Button */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={handleToggle}
            style={{
              position: 'relative',
              background: showNotifs ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
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
            aria-label="Notifications"
          >
            <span style={{ fontSize: '1rem' }}>🔔</span>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: connected ? '#10b981' : '#ef4444',
                boxShadow: connected ? '0 0 6px #10b981' : 'none',
              }}
              title={connected ? 'Socket.IO Live' : 'Disconnected'}
            />
            {unreadCount > 0 && (
              <span
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '10px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  minWidth: '16px',
                  textAlign: 'center',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Header Dropdown Menu */}
          {showNotifs && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 10px)',
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
      </div>
    </header>
  );
};

export default Navbar;
