import api from './axios.js';

export const listShiftsApi  = (params) => api.get('/shifts', { params });
export const createShiftApi = (data)   => api.post('/shifts', data);
export const updateShiftApi = ({ id, ...data }) => api.put(`/shifts/${id}`, data);
export const deleteShiftApi = (id)     => api.delete(`/shifts/${id}`);
