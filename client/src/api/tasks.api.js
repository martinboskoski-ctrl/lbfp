import api from './axios.js';

export const listTasksApi   = (dept) => api.get('/tasks', { params: dept ? { dept } : {} });
export const listTasksForUserApi = (userId) => api.get('/tasks', { params: { assignedTo: userId } });
export const createTaskApi  = (data) => api.post('/tasks', data);
export const updateTaskApi  = (id, data) => api.patch(`/tasks/${id}`, data);
export const updateStatusApi = (id, payload) => api.patch(`/tasks/${id}/status`, payload);
export const approveTaskApi = (id)   => api.patch(`/tasks/${id}/approve`);
export const deleteTaskApi  = (id)   => api.delete(`/tasks/${id}`);
export const requestTaskChangeApi = (id, data) => api.post(`/tasks/${id}/change-requests`, data);
export const resolveTaskChangeApi = (id, crId) => api.patch(`/tasks/${id}/change-requests/${crId}/resolve`);
