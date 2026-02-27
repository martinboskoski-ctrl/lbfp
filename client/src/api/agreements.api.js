import api from './axios.js';

export const listAgreementsApi    = (dept) => api.get('/agreements', { params: dept ? { dept } : {} });
export const createAgreementApi   = (data) => api.post('/agreements', data);
export const updateAgreementApi   = (id, data) => api.put(`/agreements/${id}`, data);
export const renewAgreementApi    = (id, data) => api.post(`/agreements/${id}/renew`, data);
export const terminateAgreementApi = (id, reason) => api.post(`/agreements/${id}/terminate`, { reason });
export const deleteAgreementApi   = (id) => api.delete(`/agreements/${id}`);
