import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import { authApi } from '../features/auth/authApi';
import { attendanceApi } from '../features/attendance/attendanceApi';
import { overtimeApi } from '../features/overtime/overtimeApi';
import { usersApi } from '../features/users/usersApi';
import { reportsApi } from '../features/reports/reportsApi';
import { settingsApi } from '../features/settings/settingsApi';

// Combine all reducers into one root reducer
const appReducer = combineReducers({
  auth: authReducer,
  [authApi.reducerPath]: authApi.reducer,
  [attendanceApi.reducerPath]: attendanceApi.reducer,
  [overtimeApi.reducerPath]: overtimeApi.reducer,
  [usersApi.reducerPath]: usersApi.reducer,
  [reportsApi.reducerPath]: reportsApi.reducer,
  [settingsApi.reducerPath]: settingsApi.reducer,
});

/**
 * Root reducer that resets ALL RTK Query API caches on logout.
 *
 * Problem: When User A logs out and User B logs in, RTK Query still holds
 * User A's cached API responses in memory. The dashboard briefly shows
 * User A's data until the new network request completes.
 *
 * Fix: When the auth/logout action fires, pass undefined as the state for
 * every API slice so they all reset to their empty initial state.
 * The auth slice still receives the action normally and clears itself.
 */
const rootReducer = (state, action) => {
  if (action.type === 'auth/logout') {
    // Keep only the auth slice state (which the logout action will clear),
    // reset every RTK Query API cache to undefined → forces fresh fetches
    const { auth } = state;
    state = { auth };
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      attendanceApi.middleware,
      overtimeApi.middleware,
      usersApi.middleware,
      reportsApi.middleware,
      settingsApi.middleware
    ),
});
