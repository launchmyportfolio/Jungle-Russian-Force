# JRF Digital Timesheet System

Production-focused Digital Timesheet + Attendance platform for Admin and Employee roles.

## Stack
- Frontend: React (Vite), Tailwind CSS, Axios, React Router DOM
- Backend: Node.js, Express.js, MongoDB (Mongoose), JWT, bcrypt
- Architecture: centralized error handling, role middleware, service/validation layers, reusable UI components

## Key Improvements in This Refactor
- Stable auth session flow with `GET /api/auth/me`
- Reusable protected route model with role gating and loading fallback
- Admin real-time monitoring with React Query auto-refresh (10s) + query invalidation
- Admin account settings with Email OTP verification (Resend) for username/password updates
- Two-step Email OTP login for both Admin and Employees (Resend)
- Global API response contract:
  - success: `{ "success": true, "data": {}, "message": "..." }`
  - error: `{ "success": false, "data": null|{}, "message": "..." }`
- Frontend null-safe rendering and explicit loading/error/empty states
- Centralized backend error middleware, validation middleware, and async handler wrappers
- Employee timesheet protections:
  - only current week editable
  - future/past week writes blocked on backend

## Folder Structure

### Backend
```text
backend/
  server.js
  seed.js
  .env
  .env.example
  src/
    app.js
    config/
      db.js
      cookieOptions.js
    controllers/
      authController.js
      adminSettingsController.js
      employeeController.js
      attendanceController.js
    middleware/
      authMiddleware.js
      errorMiddleware.js
      validationMiddleware.js
    models/
      Admin.js
      Employee.js
      Attendance.js
    routes/
      authRoutes.js
      adminAuthRoutes.js
      employeeAuthRoutes.js
      employeeRoutes.js
      attendanceRoutes.js
      adminAttendanceRoutes.js
      adminReportRoutes.js
      adminSettingsRoutes.js
    services/
      authService.js
      tokenService.js
      attendanceService.js
    validations/
      authValidation.js
      adminSettingsValidation.js
      employeeValidation.js
      attendanceValidation.js
      commonValidation.js
    utils/
      apiResponse.js
      apiError.js
      asyncHandler.js
      constants.js
      dateUtils.js
      sendEmail.js
```

### Frontend
```text
frontend/
  .env
  .env.example
  src/
    main.jsx
    index.css
    components/
      layout/
        TopBar.jsx
      ui/
        Button.jsx
        Input.jsx
        Card.jsx
        Table.jsx
        Loader.jsx
        EmptyState.jsx
        ToastContainer.jsx
      AttendanceTable.jsx
      WeekHeader.jsx
      ProfileCard.jsx
    context/
      AuthContext.jsx
      ToastContext.jsx
    pages/
      AdminLogin.jsx
      EmployeeLogin.jsx
      AdminDashboard.jsx
      AdminSettings.jsx
      EmployeeDashboard.jsx
      ChangePassword.jsx
    routes/
      AppRoutes.jsx
      ProtectedRoute.jsx
      PublicOnlyRoute.jsx
    services/
      api.js
      authService.js
      adminSettingsService.js
      employeeService.js
      attendanceService.js
```

## Environment Setup

### Backend `.env`
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=jrf_timesheet
JWT_SECRET=supersecret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
RESEND_API_KEY=
RESEND_FROM_EMAIL=onboarding@resend.dev
ADMIN_EMAIL=launchmyportfolio@gmail.com
OTP_EXPIRY_MINUTES=5
OTP_RESEND_COOLDOWN_SECONDS=30
OTP_MAX_ATTEMPTS=5
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:5000
```

## Run Locally

### 1. Backend
```bash
cd backend
npm install
npm run seed
npm start
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Default Admin
- username: `admin`
- password: `admin123`

## Core URLs
- Admin login: `/admin/login`
- Admin dashboard: `/admin/dashboard`
- Admin settings: `/admin/settings`
- Employee login: `/employee/login`
- Employee dashboard: `/employee/dashboard`

## API Routes

### Auth
- `POST /api/admin/login`
- `POST /api/admin/verify-otp`
- `POST /api/admin/resend-otp`
- `POST /api/employee/login`
- `POST /api/employee/verify-otp`
- `POST /api/employee/resend-otp`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/employee/change-password`
- `POST /api/admin/create-admin` (admin protected)

Login response contract:
- Step 1 (`/login`) returns `requiresOtp: true`
- Step 2 (`/verify-otp`) returns JWT token + profile in `data`

### Admin Settings (admin protected)
- `POST /api/admin/settings/send-otp`
  - body: none
- `POST /api/admin/settings/change-username`
  - body: `{ "otp": "123456", "currentPassword": "...", "newUsername": "..." }`
- `POST /api/admin/settings/change-password`
  - body: `{ "otp": "123456", "currentPassword": "...", "newPassword": "..." }`

### Employees (admin protected)
- `POST /api/admin/employees`
- `GET /api/admin/employees`
- `PUT /api/admin/employees/:id`
- `DELETE /api/admin/employees/:id`

### Attendance
- `POST /api/attendance/mark-week` (employee)
- `GET /api/attendance/week/:employeeId?startDate=&endDate=` (employee)
- `GET /api/admin/attendance/week?startDate=&endDate=` (admin)
- `GET /api/admin/reports/monthly?month=&year=` (admin)

## Notes
- If backend fails with `MongooseServerSelectionError` or `EPERM 127.0.0.1:27017`, MongoDB is not reachable. Start MongoDB or point `MONGO_URI` to your hosted cluster.
- JWT is sent in HttpOnly cookie and also mirrored via Authorization header support.
- OTP is delivered through Resend email API.
- If Resend credentials are missing, OTP send endpoint fails gracefully with a clear configuration error.
- Login requires password + OTP verification before JWT is issued.

## Resend Email OTP Setup
1. Create a Resend account and generate API key.
2. Set sender email (`RESEND_FROM_EMAIL`) to a verified sender/domain in Resend.
3. Add these variables in backend `.env`:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `ADMIN_EMAIL`
   - `OTP_EXPIRY_MINUTES`
   - `OTP_RESEND_COOLDOWN_SECONDS`
   - `OTP_MAX_ATTEMPTS`
4. Restart backend after updating env values.
