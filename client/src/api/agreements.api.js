import api from './axios.js';

export const listAgreementsApi    = (params = {}) => api.get('/agreements', { params });
export const getAgreementApi      = (id) => api.get(`/agreements/${id}`);
export const createAgreementApi   = (data) => api.post('/agreements', data);
export const updateAgreementApi   = (id, data) => api.put(`/agreements/${id}`, data);
export const renewAgreementApi    = (id, data) => api.post(`/agreements/${id}/renew`, data);
export const terminateAgreementApi = (id, reason) => api.post(`/agreements/${id}/terminate`, { reason });
export const deleteAgreementApi   = (id) => api.delete(`/agreements/${id}`);
export const addAgreementNoteApi  = (id, text) => api.post(`/agreements/${id}/notes`, { text });

export const initiateAgreementFileApi = (id, data) => api.post(`/agreements/${id}/files/initiate`, data);
export const confirmAgreementFileApi  = (id, fileId, size) => api.patch(`/agreements/${id}/files/${fileId}/confirm`, { size });
export const getAgreementFileUrlApi   = (id, fileId) => api.get(`/agreements/${id}/files/${fileId}/url`);
export const deleteAgreementFileApi   = (id, fileId) => api.delete(`/agreements/${id}/files/${fileId}`);

export const dispatchRemindersApi = () => api.post('/agreements/dispatch-reminders');
