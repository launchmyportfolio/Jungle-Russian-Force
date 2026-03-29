import api from './api';

export const employeeQueryKeys = {
  all: ['admin-employees'],
  list: (params = {}) => ['admin-employees', params],
};

export const fetchEmployees = async (params = {}) => {
  const response = await api.get('/api/admin/employees', { params });
  return response.data;
};

export const createEmployee = async (payload) => {
  const response = await api.post('/api/admin/employees', payload);
  return response.data;
};

export const editEmployee = async (id, payload) => {
  const response = await api.put(`/api/admin/employees/${id}`, payload);
  return response.data;
};

export const removeEmployee = async (id) => {
  const response = await api.delete(`/api/admin/employees/${id}`);
  return response.data;
};
