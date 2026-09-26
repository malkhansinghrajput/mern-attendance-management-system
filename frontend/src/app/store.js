import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import { authApi } from '../features/auth/authApi';
import { attendanceApi } from '../features/attendance/attendanceApi';
import { overtimeApi } from '../features/overtime/overtimeApi';
import { usersApi } from '../features/users/usersApi';
import { reportsApi } from '../features/reports/reportsApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [attendanceApi.reducerPath]: attendanceApi.reducer,
    [overtimeApi.reducerPath]: overtimeApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      attendanceApi.middleware,
      overtimeApi.middleware,
      usersApi.middleware,
      reportsApi.middleware
    ),
});
