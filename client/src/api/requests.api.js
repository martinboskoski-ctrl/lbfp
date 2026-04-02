import api from './axios.js';

export const createRequestApi  = (data)     => api.post('/requests', data);
export const myRequestsApi     = ()         => api.get('/requests/mine');
export const pendingRequestsApi = ()        => api.get('/requests/pending');
export const getRequestApi     = (id)       => api.get(`/requests/${id}`);
export const approveRequestApi = (id, body) => api.patch(`/requests/${id}/approve`, body);
export const rejectRequestApi  = (id, body) => api.patch(`/requests/${id}/reject`, body);
export const requestStatsApi   = ()         => api.get('/requests/stats/overview');
