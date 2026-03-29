import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import employeeAuthRoutes from './routes/employeeAuthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import adminAttendanceRoutes from './routes/adminAttendanceRoutes.js';
import adminReportRoutes from './routes/adminReportRoutes.js';
import adminSettingsRoutes from './routes/adminSettingsRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import { sendSuccess } from './utils/apiResponse.js';

const app = express();

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS blocked by server'));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  return sendSuccess(res, { time: new Date().toISOString() }, 'API is healthy');
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/employee', employeeAuthRoutes);
app.use('/api/admin/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin/attendance', adminAttendanceRoutes);
app.use('/api/admin/reports', adminReportRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
