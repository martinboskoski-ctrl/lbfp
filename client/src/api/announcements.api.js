import api from './axios.js';

export const listAnnouncementsApi  = ()        => api.get('/announcements');
export const createAnnouncementApi = (content) => api.post('/announcements', { content });
export const deleteAnnouncementApi = (id)      => api.delete(`/announcements/${id}`);
