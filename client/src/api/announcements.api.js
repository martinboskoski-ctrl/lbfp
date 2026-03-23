import api from './axios.js';

export const listAnnouncementsApi  = ()       => api.get('/announcements');
export const createAnnouncementApi = (data)   => api.post('/announcements', data);
export const markReadApi           = (id)     => api.patch(`/announcements/${id}/read`);
export const togglePinApi          = (id)     => api.patch(`/announcements/${id}/pin`);
export const deleteAnnouncementApi = (id)     => api.delete(`/announcements/${id}`);
