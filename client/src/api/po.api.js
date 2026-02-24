import api from './axios.js';

export const listPOsApi        = ()              => api.get('/po');
export const createPOApi       = (data)          => api.post('/po', data);
export const getPOApi          = (id)            => api.get(`/po/${id}`);
export const updatePOApi       = (id, data)      => api.patch(`/po/${id}`, data);
export const toggleStatusApi   = (id)            => api.patch(`/po/${id}/status`);
export const addQuestionApi    = (id, data)      => api.post(`/po/${id}/questions`, data);
export const answerQuestionApi = (id, qid, data) => api.patch(`/po/${id}/questions/${qid}/answer`, data);
export const resolveQuestionApi= (id, qid)       => api.patch(`/po/${id}/questions/${qid}/resolve`);
export const deletePOApi       = (id)            => api.delete(`/po/${id}`);
