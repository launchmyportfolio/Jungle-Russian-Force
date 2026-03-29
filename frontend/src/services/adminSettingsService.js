import api from './api';

export const sendOtp = async () => {
  const response = await api.post('/api/admin/settings/send-otp');
  return response.data;
};

export const changeUsername = async (payload) => {
  const response = await api.post('/api/admin/settings/change-username', payload);
  return response.data;
};

export const changePassword = async (payload) => {
  const response = await api.post('/api/admin/settings/change-password', payload);
  return response.data;
};
