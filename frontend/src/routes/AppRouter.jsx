import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';

// Shared Pages
import UnauthorizedPage from '../pages/shared/UnauthorizedPage';
import NotFoundPage from '../pages/shared/NotFoundPage';
import ReportsPage from '../pages/shared/ReportsPage';

// Employee Pages
import EmployeeDashboard from '../pages/employee/EmployeeDashboard';
import MyAttendance from '../pages/employee/MyAttendance';
import MyOvertime from '../pages/employee/MyOvertime';

// Manager Pages
import ManagerDashboard from '../pages/manager/ManagerDashboard';
import TeamAttendance from '../pages/manager/TeamAttendance';
import ValidationPage from '../pages/manager/ValidationPage';
import OvertimeApproval from '../pages/manager/OvertimeApproval';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AllUsers from '../pages/admin/AllUsers';
import AllAttendance from '../pages/admin/AllAttendance';
import AdminValidation from '../pages/admin/AdminValidation';
import AdminOvertime from '../pages/admin/AdminOvertime';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';

/**
 * RootRedirect — sends authenticated users to their role's home page.
 */
const RootRedirect = () => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const roleRoutes = { employee: '/employee/dashboard', manager: '/manager/dashboard', admin: '/admin/dashboard' };
  return <Navigate to={roleRoutes[role] || '/login'} replace />;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Shared */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Employee routes */}
        <Route
          path="/employee/dashboard"
          element={
            <RoleRoute allowedRoles={['employee']}>
              <EmployeeDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/employee/attendance"
          element={
            <RoleRoute allowedRoles={['employee']}>
              <MyAttendance />
            </RoleRoute>
          }
        />
        <Route
          path="/employee/overtime"
          element={
            <RoleRoute allowedRoles={['employee']}>
              <MyOvertime />
            </RoleRoute>
          }
        />

        {/* Manager routes */}
        <Route
          path="/manager/dashboard"
          element={
            <RoleRoute allowedRoles={['manager']}>
              <ManagerDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/manager/team-attendance"
          element={
            <RoleRoute allowedRoles={['manager']}>
              <TeamAttendance />
            </RoleRoute>
          }
        />
        <Route
          path="/manager/validation"
          element={
            <RoleRoute allowedRoles={['manager']}>
              <ValidationPage />
            </RoleRoute>
          }
        />
        <Route
          path="/manager/overtime"
          element={
            <RoleRoute allowedRoles={['manager']}>
              <OvertimeApproval />
            </RoleRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AllUsers />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/attendance"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AllAttendance />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/validation"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminValidation />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/overtime"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminOvertime />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminSettingsPage />
            </RoleRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
