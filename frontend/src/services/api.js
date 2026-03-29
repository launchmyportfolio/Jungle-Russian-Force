import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
});

let unauthorizedHandler = null;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jrf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || '';
    const authEndpoints = [
      '/api/admin/login',
      '/api/admin/verify-otp',
      '/api/admin/resend-otp',
      '/api/employee/login',
      '/api/employee/verify-otp',
      '/api/employee/resend-otp',
    ];
    const isAuthEndpoint = authEndpoints.some((endpoint) => requestUrl.includes(endpoint));
    const isPasswordChangeEndpoint = requestUrl.includes('/change-password');

    if (
      status === 401
      && !isAuthEndpoint
      && !isPasswordChangeEndpoint
      && typeof unauthorizedHandler === 'function'
    ) {
      unauthorizedHandler();
    }

    return Promise.reject(error);
  }
);

export default api;
