# 🏢 AttendPro — MERN Attendance & Overtime Management System

[![Node.js](https://img.shields.io/badge/Node.js-v18+-68a063?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-v5.2-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-v19.0-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v9.10-47a248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite-v8.3-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-ISC-blue?style=flat-square)](LICENSE)

A modern, enterprise-ready **Attendance and Overtime Management System** built on the **MERN** stack (MongoDB, Express, React, Node.js). **AttendPro** provides real-time GPS geofence validation, camera selfie verification, cross-midnight shift handling, multi-role approval workflows, real-time Socket.IO notifications, and automated report exports in PDF and Excel formats.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Demo Accounts](#-demo-accounts)
- [Getting Started & Local Setup](#-getting-started--local-setup)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
- [Environment Configuration](#-environment-configuration)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Testing & Maintenance Scripts](#-testing--maintenance-scripts)
- [Security & Performance Highlights](#-security--performance-highlights)

---

## ✨ Key Features

### 👤 Multi-Role Access Control (RBAC)
- **Admin**: Full system control — manage all users, update system-wide geofence settings, view overall company stats, approve/reject overtime, validate attendance, and export enterprise reports.
- **Manager**: Team oversight — view assigned employee attendance, validate punch records with remarks, review team overtime requests, and generate team daily reports.
- **Employee**: Individual dashboard — punch in/out with live geofencing and selfie photo upload, view personal attendance logs, track shift stats, submit overtime requests, and update profile settings.

### 📍 Geofencing & Selfie Verification
- **GPS Coordinates Check**: Validates the employee's current latitude and longitude against the company's designated office location within a configurable radius (e.g., 200m).
- **Selfie Photo Verification**: Integrates Multer and **Cloudinary** cloud storage to capture and store camera selfies at both Punch-In and Punch-Out.

### 🌙 Cross-Midnight Shift Support
- Accurately tracks overnight shifts (e.g., 10:00 PM to 6:00 AM the next day) by linking records to the originating `shiftDate` (YYYY-MM-DD).
- Prevents double punch-in conflicts and ensures continuous shift calculations across calendar days.

### ⏳ Overtime Workflow & Validation
- Employees submit overtime requests with reason and duration (0.5 to 8 hours).
- Managers and Admins receive real-time notifications to approve or reject requests with review notes.
- Automatic integration of approved overtime minutes into total attendance calculations.

### 📊 Reports & Automated Exports
- **PDF Export**: Built with `pdfkit` to generate clean, tabular monthly/daily attendance summaries.
- **Excel Export**: Built with `exceljs` for complete spreadsheets with status breakdown, worked hours, and timestamps.

### ⚡ Real-Time Socket.IO Updates
- Instant notifications for Punch events, Overtime submissions, and Validation actions across active client sessions.

---

## 🛠 Architecture & Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js (v5.2)
- **Database**: MongoDB with Mongoose ODM (v9.10)
- **Real-Time Communication**: Socket.IO (v4.8)
- **Authentication**: JWT (JSON Web Tokens) with HTTP Bearer strategy & bcryptjs hashing
- **Security & Optimization**: Helmet, Express Rate Limit, CORS middleware
- **File Uploads & Storage**: Multer + Cloudinary API
- **Reporting Engines**: `pdfkit` (PDF generation) & `exceljs` (Excel workbook generation)
- **Logging**: Winston logger with daily log streams & Morgan HTTP middleware

### Frontend
- **Framework**: React 19 (Vite SPA bundler)
- **State Management**: Redux Toolkit & React Context API (Socket & Auth context)
- **Routing**: React Router DOM (v7)
- **Notifications**: React Hot Toast
- **API Client**: Axios with centralized request/response interceptors
- **Styling**: Modern CSS Design Tokens & Responsive Dashboard Layouts

---

## 📁 Project Directory Structure

```
mern-attendance-management-system/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Cloudinary, Logger configurations
│   │   ├── constants/       # Role definitions, attendance & overtime status constants
│   │   ├── controllers/     # Auth, Attendance, Overtime, User, Report, Settings, Upload controllers
│   │   ├── middlewares/     # JWT Auth, RBAC Authorization, Validation, Error Handling
│   │   ├── models/          # Mongoose Schemas (User, Attendance, OvertimeRequest, CompanySettings)
│   │   ├── routes/          # Express route declarations (auth, attendance, overtime, users, reports, etc.)
│   │   ├── scripts/         # Seed script & migration scripts
│   │   ├── services/        # Business logic & export generation services
│   │   ├── socket/          # Socket.IO event handlers and server setup
│   │   ├── tests/           # Integration tests (cross-midnight, exports, geofencing)
│   │   ├── validators/      # Express-validator schema rules
│   │   ├── app.js           # Express application setup & middleware assembly
│   │   └── server.js        # Server launcher with HTTP & Socket.IO listener
│   ├── .env.example         # Template for backend environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/             # Redux store configuration
│   │   ├── components/      # Reusable UI components (Navbar, Sidebar, Modals, Cards, Loaders)
│   │   ├── context/         # AuthContext & SocketContext providers
│   │   ├── features/        # Redux slices (auth, attendance, overtime, users)
│   │   ├── hooks/           # Custom React hooks (useAuth, useSocket, useGeofence)
│   │   ├── pages/           # Admin, Manager, Employee, Auth, and Shared views
│   │   ├── routes/          # ProtectedRoute and App router definitions
│   │   ├── styles/          # Global styles, variables, and utility classes
│   │   ├── utils/           # Date formatters, geolocation helpers, API client
│   │   ├── App.jsx          # Top-level React application component
│   │   └── main.jsx         # React application entry point
│   ├── .env.example         # Template for frontend environment variables
│   ├── vite.config.js       # Vite bundler configuration
│   └── package.json
│
└── README.md                # Root project documentation
```

---

## 🔑 Demo Accounts

The project includes a built-in database seeding script that generates standard demo accounts for all roles with the default password `password123`.

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@company.com` | `password123` | System settings, user management, global reports, validation |
| **Manager** | `manager@company.com` | `password123` | Team attendance, overtime review, team reporting |
| **Employee** | `employee@company.com` | `password123` | Personal punch in/out, overtime submission, personal logs |

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local instance running on `mongodb://localhost:27017` or a **MongoDB Atlas** connection string
- **Cloudinary Account** (Optional for selfie image uploads in development mode)

---

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment configuration file:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` variables (see [Environment Configuration](#-environment-configuration)).

5. Seed initial demo accounts:
   ```bash
   npm run seed
   ```

6. Start backend development server:
   ```bash
   npm run dev
   ```
   *The server will start at `http://localhost:5000`.*

---

### 2. Frontend Setup

1. Open a new terminal tab and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment configuration file:
   ```bash
   cp .env.example .env
   ```

4. Start Vite development server:
   ```bash
   npm run dev
   ```
   *The application will open at `http://localhost:5173`.*

---

## ⚙️ Environment Configuration

### Backend `.env`

```env
PORT=5000
NODE_ENV=development
TZ=Asia/Kolkata

MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/attendance-management

JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📡 API Endpoints Reference

### Authentication (`/api/auth`)
- `POST /api/auth/signup` — Register new user
- `POST /api/auth/login` — Authenticate user & get JWT token
- `GET /api/auth/me` — Get current logged-in user profile
- `POST /api/auth/logout` — Revoke user session

### Attendance (`/api/attendance`)
- `POST /api/attendance/punch-in` — Employee punch-in (Geofence + Selfie)
- `POST /api/attendance/punch-out` — Employee punch-out
- `GET /api/attendance/today` — Get today's attendance record
- `GET /api/attendance/my` — Get employee's attendance history
- `GET /api/attendance/team` — Manager team attendance overview
- `GET /api/attendance/all` — Admin company-wide attendance overview
- `PATCH /api/attendance/:id/validate` — Validate/Review attendance record

### Overtime (`/api/overtime`)
- `POST /api/overtime` — Submit overtime request
- `GET /api/overtime/my` — View employee overtime requests
- `GET /api/overtime/pending` — View pending overtime requests (Manager/Admin)
- `PATCH /api/overtime/:id/approve` — Approve overtime request
- `PATCH /api/overtime/:id/reject` — Reject overtime request

### User Management (`/api/users`)
- `GET /api/users` — Get all users (Admin)
- `GET /api/users/team` — Get team members (Manager)
- `POST /api/users/create` — Create user account (Admin)
- `GET /api/users/manager-code/:code` — Verify manager code during signup
- `PATCH /api/users/:id/status` — Activate/Deactivate user account

### Reports & Settings (`/api/reports`, `/api/settings`)
- `GET /api/reports/daily` — Get daily summary report
- `GET /api/reports/stats` — Admin dashboard summary stats
- `GET /api/reports/attendance/export/pdf` — Export attendance report as PDF
- `GET /api/reports/attendance/export/excel` — Export attendance report as Excel
- `GET /api/settings/geofence` — Fetch active office geofence settings
- `PUT /api/settings/geofence` — Update office location & radius (Admin)

---

## 🧪 Testing & Maintenance Scripts

### Backend Test Suite
Run automated test suites for shift logic and report generation:
```bash
cd backend
npm test
```
*Executes `crossMidnightShift.test.js` and `exportReport.test.js`.*

### Database Migrations & Seeds
- Seed default accounts: `node backend/src/scripts/seed.js`
- Migrate historical shift date records: `node backend/src/scripts/migrateShiftDate.js`

### Frontend Quality Commands
```bash
cd frontend
npm run lint    # Run Oxlint checks
npm run build   # Production build
npm run preview # Preview production build locally
```

---

## 🔒 Security & Performance Highlights

- **JWT Authentication**: Secure token verification with structured bearer headers.
- **Strict Rate Limiting**: Protection against brute-force login and general API flooding via `express-rate-limit`.
- **HTTP Header Security**: `helmet` headers configured for XSS, clickjacking, and mime-sniffing prevention.
- **Payload Limits**: Request body size cap (`10mb`) prevents memory exhaustion attacks.
- **Indexed Database Queries**: MongoDB compound indexes on `date`, `shiftDate`, `userId`, `role`, and `validationStatus` ensure fast querying even with large datasets.

---

## 📜 License

This project is licensed under the [ISC License](LICENSE).
