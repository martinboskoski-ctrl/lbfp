import api from './axios.js';

export const initiateUploadApi = (data) => api.post('/files/upload', data);
export const confirmUploadApi = (id, size) => api.patch(`/files/${id}/confirm`, { size });
export const getDownloadUrlApi = (id) => api.get(`/files/${id}/url`);
