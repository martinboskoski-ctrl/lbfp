import api from './axios.js';

export const listTasksApi   = (dept) => api.get('/tasks', { params: dept ? { dept } : {} });
export const createTaskApi  = (data) => api.post('/tasks', data);
export const updateStatusApi = (id, direction) => api.patch(`/tasks/${id}/status`, { direction });
export const approveTaskApi = (id)   => api.patch(`/tasks/${id}/approve`);
export const deleteTaskApi  = (id)   => api.delete(`/tasks/${id}`);
