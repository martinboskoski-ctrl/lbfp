import api from './axios.js';

export const listEmployeesApi = (params = {}) =>
  api.get('/employees', { params });

export const getEmployeeFileApi = (id) =>
  api.get(`/employees/${id}`);
