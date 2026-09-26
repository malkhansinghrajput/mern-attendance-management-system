import { useSelector } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated, selectToken } from '../features/auth/authSlice';

/**
 * Hook to access authentication state.
 */
export const useAuth = () => {
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return {
    user,
    token,
    isAuthenticated,
    role: user?.role || null,
    isEmployee: user?.role === 'employee',
    isManager: user?.role === 'manager',
    isAdmin: user?.role === 'admin',
  };
};
