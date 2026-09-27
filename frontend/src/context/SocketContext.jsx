import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { selectToken, selectIsAuthenticated } from '../features/auth/authSlice';

const SocketContext = createContext(null);

/**
 * SocketProvider — wraps the app and provides a shared Socket.IO connection.
 *
 * Key design decisions:
 *  - One socket per authenticated session (socket reuses across routes)
 *  - Auto-disconnects on logout
 *  - Reconnects automatically on page reload (socket.io built-in)
 *  - Notifications are stored in state and can be dismissed
 */
export const SocketProvider = ({ children }) => {
  const token = useSelector(selectToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);

  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [
      { id: Date.now() + Math.random(), ...notification, read: false },
      ...prev.slice(0, 49), // Keep max 50 notifications
    ]);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Disconnect when logged out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
        setNotifications([]);
      }
      return;
    }

    // Already connected with same token
    if (socketRef.current?.connected) return;

    const newSocket = io(import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', ''), {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('[Socket] Connected:', newSocket.id);
    });

    newSocket.on('disconnect', (reason) => {
      setConnected(false);
      console.log('[Socket] Disconnected:', reason);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    // ── Attendance events ──────────────────────────────────────────────────
    newSocket.on('attendance:punch-in', (data) => {
      addNotification({
        type: 'info',
        title: 'Punch In',
        message: `${data.employee?.name} punched in`,
        icon: '🟢',
        data,
      });
    });

    newSocket.on('attendance:punch-out', (data) => {
      addNotification({
        type: 'info',
        title: 'Punch Out',
        message: `${data.employee?.name} punched out`,
        icon: '🔴',
        data,
      });
    });

    newSocket.on('attendance:updated', () => {
      // Trigger RTK Query refetch by dispatching an invalidation
      // Components listening to this can call their refetch()
    });

    newSocket.on('attendance:validated', (data) => {
      const isValid = data.validationStatus === 'valid';
      addNotification({
        type: isValid ? 'success' : 'warning',
        title: `Attendance ${isValid ? '✅ Validated' : '❌ Marked Invalid'}`,
        message: `Your attendance was marked ${data.validationStatus} by ${data.validatedBy?.name}`,
        icon: isValid ? '✅' : '❌',
        data,
      });
    });

    // ── Overtime events ────────────────────────────────────────────────────
    newSocket.on('overtime:new-request', (data) => {
      addNotification({
        type: 'warning',
        title: 'New OT Request',
        message: `${data.employee?.name} requested ${data.overtimeRequest?.requestedHours}h overtime`,
        icon: '⏰',
        data,
      });
    });

    newSocket.on('overtime:approved', (data) => {
      addNotification({
        type: 'success',
        title: 'Overtime Approved ✅',
        message: `Your overtime request was approved by ${data.reviewedBy?.name}`,
        icon: '✅',
        data,
      });
    });

    newSocket.on('overtime:rejected', (data) => {
      addNotification({
        type: 'error',
        title: 'Overtime Rejected ❌',
        message: `Your overtime request was rejected by ${data.reviewedBy?.name}${data.reviewRemarks ? ': ' + data.reviewRemarks : ''}`,
        icon: '❌',
        data,
      });
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [isAuthenticated, token, addNotification]);

  const value = {
    socket,
    connected,
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    addNotification,
    markAllRead,
    clearNotification,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
  return ctx;
};
