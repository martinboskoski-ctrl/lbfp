import api from './axios.js';

export const listLeadsApi    = ()         => api.get('/leads');
export const createLeadApi   = (data)     => api.post('/leads', data);
export const updateLeadApi   = (id, data) => api.put(`/leads/${id}`, data);
export const addActivityApi  = (id, data) => api.post(`/leads/${id}/activities`, data);
export const deleteLeadApi   = (id)       => api.delete(`/leads/${id}`);
