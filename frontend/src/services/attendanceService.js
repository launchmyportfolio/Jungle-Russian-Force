import api from './api';

export const attendanceQueryKeys = {
  employeeWeek: (employeeId, params = {}) => ['employee-week-attendance', employeeId || 'self', params],
  adminWeekAll: ['admin-week-attendance'],
  adminWeek: (params = {}) => ['admin-week-attendance', params],
  monthlyReportAll: ['admin-monthly-report'],
  monthlyReport: (params = {}) => ['admin-monthly-report', params],
};

export const markWeekAttendance = async (entries) => {
  const response = await api.post('/api/attendance/mark-week', { entries });
  return response.data;
};

export const fetchEmployeeWeekAttendance = async (employeeId, params = {}) => {
  const response = await api.get(`/api/attendance/week/${employeeId || ''}`, { params });
  return response.data;
};

export const fetchAdminWeekAttendance = async (params = {}) => {
  const response = await api.get('/api/admin/attendance/week', { params });
  return response.data;
};

export const fetchMonthlyReport = async (params) => {
  const response = await api.get('/api/admin/reports/monthly', { params });
  return response.data;
};
