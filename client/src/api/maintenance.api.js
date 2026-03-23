import api from './axios.js';

export const listMaintenanceApi  = (params) => api.get('/maintenance', { params });
export const createMaintenanceApi = (data)  => api.post('/maintenance', data);
export const getMaintenanceApi   = (id)     => api.get(`/maintenance/${id}`);
export const updateMaintenanceApi = ({ id, ...data }) => api.put(`/maintenance/${id}`, data);
