import api from './axios.js';

export const listPOsApi          = ()              => api.get('/po');
export const createPOApi         = (data)          => api.post('/po', data);
export const getPOApi            = (id)            => api.get(`/po/${id}`);
export const updatePOApi         = (id, data)      => api.patch(`/po/${id}`, data);
export const toggleStatusApi     = (id)            => api.patch(`/po/${id}/status`);
export const addQuestionApi      = (id, data)      => api.post(`/po/${id}/questions`, data);
export const answerQuestionApi   = (id, qid, data) => api.patch(`/po/${id}/questions/${qid}/answer`, data);
export const resolveQuestionApi  = (id, qid)       => api.patch(`/po/${id}/questions/${qid}/resolve`);
export const deletePOApi         = (id)            => api.delete(`/po/${id}`);

export const editQuestionApi     = (id, qid, data) => api.patch(`/po/${id}/questions/${qid}`, data);
export const postThreadApi       = (id, qid, data) => api.post(`/po/${id}/questions/${qid}/thread`, data);
export const editThreadApi       = (id, qid, entryId, data) => api.patch(`/po/${id}/questions/${qid}/thread/${entryId}`, data);
export const markFinalApi        = (id, qid, data) => api.patch(`/po/${id}/questions/${qid}/final`, data);
export const salesReviewApi      = (id, qid, data) => api.patch(`/po/${id}/questions/${qid}/review`, data);
export const clientApprovalApi   = (id, qid, data) => api.patch(`/po/${id}/questions/${qid}/approval`, data);

export const deptInboxApi        = (params = {})   => api.get('/po/inbox', { params });
export const digestApi           = (id)            => api.get(`/po/${id}/digest`);
