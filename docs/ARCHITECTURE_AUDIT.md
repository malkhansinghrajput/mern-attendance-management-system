# AttendPro MERN Attendance Management System — Architecture Audit

**Date:** September 28, 2026  
**Auditor:** Antigravity Pairing Assistant  
**Repository:** AttendPro (MERN Attendance Management System)  
**Status:** Complete Repository Audit (Phase 1 to Phase 5)

---

## 1. Current Architecture Overview

AttendPro is an enterprise-oriented MERN (MongoDB, Express, React, Node.js) web application for employee attendance management, geofenced punch operations, selfie verification, overtime tracking, managerial attendance validation, administrative analytics, and multi-format report exports (PDF / Excel).

```
┌────────────────────────────────────────────────────────────┐
│                    Client (React 19 + Vite)                │
│  - Redux Toolkit + RTK Query (Cache & State Management)    │
│  - Socket.IO Client (Real-time live notifications)        │
│  - Vanilla CSS Design System (Dark/Light responsive theme) │
│  - Native HTML5 Geolocation & MediaDevices Camera Streams  │
└─────────────────────────────┬──────────────────────────────┘
                              │ HTTP REST + WebSocket
                              ▼
┌────────────────────────────────────────────────────────────┐
│                 Node.js / Express 5 API Server             │
│  - JWT Bearer Authentication & RBAC Middleware             │
│  - Input Validation via express-validator                  │
│  - Socket.IO Server (Rooms: user, role, manager)           │
│  - Geofence Haversine Coordinate Distance Engine           │
│  - Working Hours / Shift Computation Engine                │
│  - Report Generation (PDFKit + ExcelJS streaming)          │
└─────────────────────────────┬──────────────────────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
   ┌───────────────────────┐     ┌───────────────────────┐
   │    MongoDB Atlas      │     │  Cloudinary / Base64  │
   │  - User collection    │     │  - Selfie photo store │
   │  - Attendance         │     └───────────────────────┘
   │  - OvertimeRequest    │
   │  - CompanySettings    │
   └───────────────────────┘
```

---

## 2. Frontend Structure

- **Framework & Bundler:** React 19.3.0, Vite 8.3.0
- **Routing:** React Router v7 (`react-router-dom` 7.18.4) with `AppRouter`, `ProtectedRoute`, and `RoleRoute`
- **State Management:** `@reduxjs/toolkit` 2.12.0 with RTK Query and root reducer resetting API caches on `auth/logout`
- **Real-Time Integration:** `SocketContext.jsx` leveraging `socket.io-client` 4.8.4
- **CSS Architecture:** Vanilla CSS with custom tokens in `styles/index.css` and `styles/components.css`
- **Hardware Integration:**
  - `useCamera.js`: HTML5 `navigator.mediaDevices.getUserMedia`
  - `useGeolocation.js`: `navigator.geolocation` with reverse geocoding fallback
- **File Structure:**
  - `src/app/store.js`: Redux store configuration and RTK Query reducer registration
  - `src/components/attendance/`: `AttendanceTable.jsx`, `PunchCard.jsx`
  - `src/components/camera/`: `CameraCapture.jsx`
  - `src/components/common/`: `Badge.jsx`, `Button.jsx`, `EmptyState.jsx`, `Modal.jsx`, `Spinner.jsx`
  - `src/components/layout/`: `DashboardLayout.jsx`, `Navbar.jsx`, `Sidebar.jsx`
  - `src/constants/`: `roles.js`, `routes.js`
  - `src/context/`: `SocketContext.jsx`
  - `src/features/`: `auth`, `attendance`, `overtime`, `reports`, `settings`, `users`
  - `src/hooks/`: `useAuth.js`, `useCamera.js`, `useGeolocation.js`, `useTheme.js`
  - `src/pages/`: `auth` (Login, Signup), `employee` (Dashboard, MyAttendance, MyOvertime), `manager` (Dashboard, TeamAttendance, ValidationPage, OvertimeApproval), `admin` (Dashboard, AllUsers, AllAttendance, AdminValidation, AdminOvertime, AdminSettingsPage), `shared` (ReportsPage, ProfilePage, EditProfilePage, UnauthorizedPage, NotFoundPage)
  - `src/utils/`: `formatters.js`

---

## 3. Backend Structure

- **Runtime & Framework:** Node.js, Express 5.2.1
- **Database ODM:** Mongoose 9.10.2
- **Logging & Security:** Helmet 8.3.0, CORS 2.8.6, Morgan 1.12.1, Winston 3.19.0, Express Rate Limit 8.7.0
- **File Structure:**
  - `src/app.js`: Express application setup, middlewares, rate limits, routes, error handlers
  - `src/server.js`: HTTP server bootstrap, DNS configuration for Atlas, Socket.IO attachment
  - `src/config/`: `db.js`, `cloudinary.js`, `logger.js`
  - `src/constants/`: `attendance.js`, `errors.js`, `roles.js`
  - `src/controllers/`: `attendance`, `auth`, `overtime`, `report`, `settings`, `upload`, `user`
  - `src/middlewares/`: `auth.js`, `rbac.js`, `validate.js`, `errorHandler.js`
  - `src/models/`: `Attendance.js`, `CompanySettings.js`, `OvertimeRequest.js`, `User.js`
  - `src/routes/`: `index.js`, `attendance.routes.js`, `auth.routes.js`, `overtime.routes.js`, `report.routes.js`, `settings.routes.js`, `upload.routes.js`, `user.routes.js`
  - `src/services/`: `attendance.service.js`, `auth.service.js`, `overtime.service.js`, `report.service.js`, `reportExport.service.js`, `upload.service.js`, `workingHours.service.js`
  - `src/socket/`: `socketServer.js`
  - `src/utils/`: `dateUtils.js`, `geoUtils.js`, `jwtUtils.js`, `response.js`
  - `src/validators/`: `attendance.validators.js`, `auth.validators.js`, `overtime.validators.js`

---

## 4. Complete Frontend & Backend API Inventory

| Method | Endpoint | Backend Route / Controller / Service | Frontend Consumer | Auth / RBAC | Status & Contract Match |
|---|---|---|---|---|---|
| `POST` | `/api/auth/signup` | `auth.routes.js` → `auth.controller.js` → `auth.service.js` | `authApi.useSignupMutation` (`SignupPage.jsx`) | Optional Auth | Matches (payload: name, email, password, optional managerId) |
| `POST` | `/api/auth/login` | `auth.routes.js` → `auth.controller.js` → `auth.service.js` | `authApi.useLoginMutation` (`LoginPage.jsx`) | Public | Matches (payload: email, password) |
| `GET` | `/api/auth/me` | `auth.routes.js` → `auth.controller.js` | `authApi.useGetMeQuery` | Authenticated | Matches |
| `POST` | `/api/auth/logout` | `auth.routes.js` → `auth.controller.js` | `authApi.useLogoutUserMutation` (`Sidebar.jsx`) | Authenticated | Matches |
| `POST` | `/api/attendance/punch-in` | `attendance.routes.js` → `attendance.controller.js` → `attendance.service.js` | `attendanceApi.usePunchInMutation` (`PunchCard.jsx`) | Employee | Matches (selfieUrl, location) |
| `POST` | `/api/attendance/punch-out` | `attendance.routes.js` → `attendance.controller.js` → `attendance.service.js` | `attendanceApi.usePunchOutMutation` (`PunchCard.jsx`) | Employee | Matches (optional selfieUrl, location) |
| `GET` | `/api/attendance/today` | `attendance.routes.js` → `attendance.controller.js` → `attendance.service.js` | `attendanceApi.useGetTodayAttendanceQuery` (`EmployeeDashboard.jsx`) | Employee | Matches |
| `GET` | `/api/attendance/my` | `attendance.routes.js` → `attendance.controller.js` → `attendance.service.js` | `attendanceApi.useGetMyAttendanceQuery` (`EmployeeDashboard.jsx`, `MyAttendance.jsx`) | Employee | Matches (query: page, limit, startDate, endDate) |
| `GET` | `/api/attendance/team` | `attendance.routes.js` → `attendance.controller.js` → `attendance.service.js` | `attendanceApi.useGetTeamAttendanceQuery` (`ManagerDashboard.jsx`, `TeamAttendance.jsx`, `ValidationPage.jsx`) | Manager, Admin | Matches (query: page, limit, userId, date, validationStatus) |
| `GET` | `/api/attendance/all` | `attendance.routes.js` → `attendance.controller.js` → `attendance.service.js` | `attendanceApi.useGetAllAttendanceQuery` (`AdminDashboard.jsx`, `AllAttendance.jsx`, `AdminValidation.jsx`) | Admin | Matches (query: page, limit, userId, date, startDate, endDate, validationStatus) |
| `PATCH` | `/api/attendance/:id/validate` | `attendance.routes.js` → `attendance.controller.js` → `attendance.service.js` | `attendanceApi.useValidateAttendanceMutation` (`TeamAttendance.jsx`, `ValidationPage.jsx`, `AdminValidation.jsx`) | Manager, Admin | Matches (body: validationStatus, validationRemarks) |
| `POST` | `/api/overtime` | `overtime.routes.js` → `overtime.controller.js` → `overtime.service.js` | `overtimeApi.useRequestOvertimeMutation` (`MyOvertime.jsx`) | Employee | Matches (body: attendanceId, requestedHours, reason) |
| `GET` | `/api/overtime/my` | `overtime.routes.js` → `overtime.controller.js` → `overtime.service.js` | `overtimeApi.useGetMyOvertimeQuery` (`EmployeeDashboard.jsx`, `MyOvertime.jsx`) | Employee | Matches (query: page, limit) |
| `GET` | `/api/overtime/pending` | `overtime.routes.js` → `overtime.controller.js` → `overtime.service.js` | `overtimeApi.useGetPendingOvertimeQuery` (`ManagerDashboard.jsx`, `OvertimeApproval.jsx`, `AdminOvertime.jsx`) | Manager, Admin | Matches (query: page, limit) |
| `PATCH` | `/api/overtime/:id/approve` | `overtime.routes.js` → `overtime.controller.js` → `overtime.service.js` | `overtimeApi.useApproveOvertimeMutation` (`OvertimeApproval.jsx`, `AdminOvertime.jsx`) | Manager, Admin | Matches (body: reviewRemarks) |
| `PATCH` | `/api/overtime/:id/reject` | `overtime.routes.js` → `overtime.controller.js` → `overtime.service.js` | `overtimeApi.useRejectOvertimeMutation` (`OvertimeApproval.jsx`, `AdminOvertime.jsx`) | Manager, Admin | Matches (body: reviewRemarks) |
| `GET` | `/api/users/me` | `user.routes.js` → `user.controller.js` | `usersApi.useGetMyProfileQuery` (`ProfilePage.jsx`, `EditProfilePage.jsx`) | Authenticated | Matches |
| `PUT` | `/api/users/me` | `user.routes.js` → `user.controller.js` | `usersApi.useUpdateMyProfileMutation` (`EditProfilePage.jsx`) | Authenticated | Matches (body: name, phone, avatarUrl) |
| `GET` | `/api/users` | `user.routes.js` → `user.controller.js` | `usersApi.useGetAllUsersQuery` (`AdminDashboard.jsx`, `AllUsers.jsx`) | Admin | Matches (query: role, page, limit, isActive) |
| `GET` | `/api/users/team` | `user.routes.js` → `user.controller.js` | `usersApi.useGetTeamUsersQuery` (`ManagerDashboard.jsx`) | Manager | Matches |
| `POST` | `/api/users/create` | `user.routes.js` → `user.controller.js` | `usersApi.useCreateUserMutation` (`AllUsers.jsx`) | Admin | Matches (body: name, email, password, role, managerId) |
| `GET` | `/api/users/:id` | `user.routes.js` → `user.controller.js` | `usersApi.useGetUserByIdQuery` | Admin, Manager | Matches |
| `PATCH` | `/api/users/:id/status` | `user.routes.js` → `user.controller.js` | `usersApi.useUpdateUserStatusMutation` (`AllUsers.jsx`) | Admin | Matches (body: isActive) |
| `GET` | `/api/reports/daily` | `report.routes.js` → `report.controller.js` → `report.service.js` | `reportsApi.useGetDailyReportQuery` (`ReportsPage.jsx`) | Authenticated (scoped by role) | Matches (query: date, userId, page, limit) |
| `GET` | `/api/reports/stats` | `report.routes.js` → `report.controller.js` → `report.service.js` | `reportsApi.useGetAdminStatsQuery` (`AdminDashboard.jsx`) | Admin | Matches |
| `GET` | `/api/reports/attendance/export/pdf` | `report.routes.js` → `report.controller.js` → `reportExport.service.js` | `reportsExport.downloadAttendanceReport` (`ReportsPage.jsx`) | Authenticated | Matches (streams PDF attachment) |
| `GET` | `/api/reports/attendance/export/excel` | `report.routes.js` → `report.controller.js` → `reportExport.service.js` | `reportsExport.downloadAttendanceReport` (`ReportsPage.jsx`) | Authenticated | Matches (streams XLSX attachment) |
| `POST` | `/api/upload/selfie` | `upload.routes.js` → `upload.controller.js` → `upload.service.js` | Native fetch in `PunchCard.jsx` & `EditProfilePage.jsx` | Employee | Matches (multipart form-data: file) |
| `GET` | `/api/settings/geofence` | `settings.routes.js` → `settings.controller.js` | `settingsApi.useGetGeofenceSettingsQuery` (`AdminSettingsPage.jsx`) | Authenticated | Matches |
| `PUT` | `/api/settings/geofence` | `settings.routes.js` → `settings.controller.js` | `settingsApi.useUpdateGeofenceSettingsMutation` (`AdminSettingsPage.jsx`) | Admin | Matches (body: officeName, geofenceEnabled, latitude, longitude, radiusMeters) |

---

## 5. Frontend Duplication & Code Quality Findings

1. **Unused Code & Dead Variables:**
   - `PunchCard.jsx`: `useRef` is imported but never used. `selfieBlob`, `showOtPrompt`, `setShowOtPrompt`, and `isIncomplete` states are declared but never consumed.
   - `EmployeeDashboard.jsx`: `useState` is imported but never used.
   - `SignupPage.jsx`: Unused variable `res` in `const res = await signup(payload).unwrap();`.
   - `TeamAttendance.jsx`: `formatDate` is imported from `formatters.js` but never used.
   - `Navbar.jsx`: Line 59-63 contains an unused `handleLogout` function with `eslint-disable-next-line no-unused-vars` because actual logout occurs in `Sidebar.jsx`.

2. **React Compiler & Hook Lint Warnings:**
   - `useCamera.js`: `useCallback` for `capturePhoto` references `stopCamera()` which is declared after it and omitted from the dependency array. Reordering and memoizing properly fixes this warning.
   - `SocketContext.jsx`:
     - Line 152 accesses `socketRef.current` directly during the render pass to construct the context value (`socket: socketRef.current`), triggering React 19's `react(refs)` linter warning. Maintaining a reactive `socket` state or stable accessor resolves this safely.
     - `useSocket` is co-exported with `SocketProvider`, causing the fast refresh warning.

3. **Synchronous SetState within Effects:**
   - `EditProfilePage.jsx` (line 30-39) and `AdminSettingsPage.jsx` (line 26-37) call `setFormData` directly when query data arrives. While functional, structuring initialization avoids cascading re-render warnings.

4. **Monolithic Bundle Size (Vite Chunk Warning):**
   - The production build output produces a single 522 kB JavaScript bundle (`index-ByxzC7Aa.js`) because all 18 route components and third-party libraries (PDF/Excel download handlers, icons, etc.) are bundled into the initial entry chunk.
   - Vite `manualChunks` in `vite.config.js` can cleanly separate third-party vendor dependencies (`react`, `react-dom`, `@reduxjs/toolkit`, `react-redux`, `react-router-dom`) without changing any component logic or UI.

---

## 6. Backend Duplication & Quality Findings

1. **User Creation Duplication:**
   - `user.controller.js` (`createUser`) duplicates logic already cleanly encapsulated in `auth.service.js` (`signup`):
     - Validates existence of user by email
     - Generates bcrypt salt and hashes password
     - Normalizes allowed roles
     - Instantiates `User.create`
   - Reusing `auth.service.js` removes duplicate hashing logic and ensures central policy enforcement.

2. **Unnecessary Database Overhead & Over-fetching:**
   - `report.service.js` (`getAdminStats`):
     - Performs `Attendance.find({ date: today }).populate('userId', 'name role')`.
     - The `populate('userId')` is never used anywhere in the stat calculations!
     - In addition, it fetches full Mongoose documents containing large embedded selfie base64 URIs and GPS coordinates into memory just to check `attendanceStatus` and `validationStatus`.
     - Adding `.select('attendanceStatus validationStatus').lean()` reduces query latency and memory consumption by orders of magnitude.
   - `attendance.service.js` (`getMyAttendance`, `getTeamAttendance`, `getAllAttendance`):
     - Queries return heavy Mongoose Document wrapper instances, which are then manually converted to POJOs via `formatAttendanceRecord`. Adding `.lean()` to these query streams significantly saves memory and execution overhead.

3. **Redundant Database Index:**
   - In `backend/src/models/Attendance.js`:
     - `attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });`
     - `attendanceSchema.index({ userId: 1, attendanceStatus: 1 });`
     - `attendanceSchema.index({ userId: 1 });`
   - MongoDB automatically satisfies single-field queries on `{ userId }` using the prefix of the compound index `{ userId: 1, date: 1 }`. The standalone `{ userId: 1 }` index is 100% redundant, consuming extra index storage and write CPU on every insert/update.
   - Admin and team queries frequently sort by `{ date: -1, createdAt: -1 }`. Adding an index on `{ date: -1, createdAt: -1 }` optimizes attendance pagination sorting.

---

## 7. Database Findings & Model Schema Integrity

- **Schemas Verified:** `User`, `Attendance`, `OvertimeRequest`, `CompanySettings`.
- **Field Consistency:**
  - `shiftDate` and `date` format: `YYYY-MM-DD` string ensures UTC boundary safety.
  - Duration fields (`workedMinutes`, `regularMinutes`, `overtimeMinutes`) are computed exclusively server-side in `workingHours.service.js`.
  - No database field names will be altered.

---

## 8. Socket.IO Implementation Findings

- **Architecture:** `backend/src/socket/socketServer.js` attaches to Node's HTTP server with JWT handshake authentication.
- **Rooms:**
  - `user:<userId>`: Individual user notifications.
  - `role:admin`: Admin events.
  - `role:manager`: Manager events.
  - `manager:<managerId>`: Subordinated employee live stream.
- **Events & Consumers:**
  - `attendance:punch-in`, `attendance:punch-out`: Handled by `SocketContext.jsx` & `ManagerDashboard.jsx`.
  - `attendance:updated`: Handled by `EmployeeDashboard.jsx`.
  - `attendance:validated`: Handled by `EmployeeDashboard.jsx`.
  - `overtime:new-request`: Handled by `ManagerDashboard.jsx`.
  - `overtime:approved`, `overtime:rejected`: Handled by `EmployeeDashboard.jsx`.
- **Integrity:** Event emissions in controllers are wrapped in try/catch blocks to ensure Socket.IO failures never fail HTTP requests.

---

## 9. Authentication & Authorization Findings

- **Stateless JWT:** 7-day expiration, signed with secret and decoded in `authenticate` middleware.
- **RBAC Server Enforcement:** Every endpoint is protected with `authorize('employee')`, `authorize('manager')`, or `authorize('admin')`.
- **Security Check:** Manager scope validation prevents managers from validating or approving records outside their assigned subordinates.
- **Status Validation:** `isActive` flag checked on both HTTP request auth and Socket.IO handshake auth. Deactivated users cannot connect or access resources.

---

## 10. Performance Findings

1. **Frontend Bundle:** Single 522 kB chunk can be safely optimized via Vite build vendor chunking.
2. **Backend Queries:** Elimination of unnecessary `populate()` and projection of only needed fields in `getAdminStats` eliminates megabytes of RAM overhead on large attendance days.
3. **Database Lookups:** Removal of redundant index and addition of sorting index reduces B-Tree write costs.

---

## 11. Reusability Findings

- Reusable components already well-utilized: `Button`, `Badge`, `Modal`, `EmptyState`, `Spinner`, `AttendanceTable`, `DashboardLayout`.
- Duplication in `createUser` vs `signup` can be safely resolved by reusing `authService.signup`.

---

## 12. Potential Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Lean queries losing virtual properties or methods | Low | Medium | Verified that `formatAttendanceRecord` already handles plain POJOs (`{ ...rec }`). |
| Redux cache invalidation regressions | Low | High | Existing RTK Query tags (`Attendance`, `TodayAttendance`, `Overtime`, `Users`, `Reports`, `Settings`) remain unchanged. |
| UI visual regression | Low | Critical | Absolutely zero CSS or markup alterations to existing layouts, cards, colors, or tables. |

---

## 13. Files Affected by Proposed Safe Optimizations

- `backend/src/services/report.service.js`
- `backend/src/services/attendance.service.js`
- `backend/src/controllers/user.controller.js`
- `backend/src/models/Attendance.js`
- `frontend/src/components/attendance/PunchCard.jsx`
- `frontend/src/pages/employee/EmployeeDashboard.jsx`
- `frontend/src/pages/auth/SignupPage.jsx`
- `frontend/src/pages/manager/TeamAttendance.jsx`
- `frontend/src/components/layout/Navbar.jsx`
- `frontend/src/hooks/useCamera.js`
- `frontend/src/context/SocketContext.jsx`
- `frontend/vite.config.js`
