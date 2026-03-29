import api from './api';

export const adminLogin = async (payload) => {
  const response = await api.post('/api/admin/login', payload);
  return response.data;
};

export const verifyAdminOtp = async (payload) => {
  const response = await api.post('/api/admin/verify-otp', payload);
  return response.data;
};

export const resendAdminOtp = async (payload) => {
  const response = await api.post('/api/admin/resend-otp', payload);
  return response.data;
};

export const employeeLogin = async (payload) => {
  const response = await api.post('/api/employee/login', payload);
  return response.data;
};

export const verifyEmployeeOtp = async (payload) => {
  const response = await api.post('/api/employee/verify-otp', payload);
  return response.data;
};

export const resendEmployeeOtp = async (payload) => {
  const response = await api.post('/api/employee/resend-otp', payload);
  return response.data;
};

export const getCurrentSession = async () => {
  const response = await api.get('/api/auth/me');
  return response.data;
};

export const logoutSession = async () => {
  const response = await api.post('/api/auth/logout');
  return response.data;
};

export const changeEmployeePassword = async (payload) => {
  const response = await api.post('/api/employee/change-password', payload);
  return response.data;
};

export const createAdmin = async (payload) => {
  const response = await api.post('/api/admin/create-admin', payload);
  return response.data;
};
