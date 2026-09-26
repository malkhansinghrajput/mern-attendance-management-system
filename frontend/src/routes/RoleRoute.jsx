import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * RoleRoute — allows only specified roles to access children.
 * Redirects to /unauthorized if role doesn't match.
 *
 * NOTE: This is a UI guard only. Every API endpoint enforces RBAC server-side.
 */
const RoleRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleRoute;
