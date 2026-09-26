export const ROUTES = {
  // Auth
  LOGIN: '/login',
  SIGNUP: '/signup',

  // Employee
  EMPLOYEE_DASHBOARD: '/employee/dashboard',
  EMPLOYEE_ATTENDANCE: '/employee/attendance',
  EMPLOYEE_OVERTIME: '/employee/overtime',

  // Manager
  MANAGER_DASHBOARD: '/manager/dashboard',
  MANAGER_TEAM_ATTENDANCE: '/manager/team-attendance',
  MANAGER_VALIDATION: '/manager/validation',
  MANAGER_OVERTIME: '/manager/overtime',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_ATTENDANCE: '/admin/attendance',
  ADMIN_VALIDATION: '/admin/validation',
  ADMIN_OVERTIME: '/admin/overtime',

  // Shared
  REPORTS: '/reports',
  UNAUTHORIZED: '/unauthorized',
};

export const ROLE_DEFAULT_ROUTES = {
  employee: '/employee/dashboard',
  manager: '/manager/dashboard',
  admin: '/admin/dashboard',
};
