import api from './axios.js';

export const listNotificationsApi = (page = 1) => api.get(`/notifications?page=${page}`);
export const unreadCountApi       = ()         => api.get('/notifications/unread-count');
export const markReadApi          = (id)       => api.patch(`/notifications/${id}/read`);
export const markAllReadApi       = ()         => api.patch('/notifications/read-all');
