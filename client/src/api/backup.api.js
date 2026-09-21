import api from './axios.js';

// Downloads the full database backup as a ZIP blob (top management only).
export const downloadBackupApi = () => api.get('/backup', { responseType: 'blob' });
