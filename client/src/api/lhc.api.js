import api from './axios.js';

export const listLhcCategoriesApi = () => api.get('/lhc/categories');
export const listLhcQuestionsApi  = (params = {}) => api.get('/lhc/questions', { params });
export const getLhcOverviewApi    = () => api.get('/lhc/overview');

// Campaigns
export const createCampaignApi    = (data) => api.post('/lhc/campaigns', data);
export const updateCampaignApi    = (id, data) => api.patch(`/lhc/campaigns/${id}`, data);
export const getCampaignApi       = (id) => api.get(`/lhc/campaigns/${id}`);
export const openCampaignApi      = (id) => api.post(`/lhc/campaigns/${id}/open`);
export const closeCampaignApi     = (id) => api.post(`/lhc/campaigns/${id}/close`);
export const deleteCampaignApi    = (id) => api.delete(`/lhc/campaigns/${id}`);
export const getCampaignResultsApi = (id) => api.get(`/lhc/campaigns/${id}/results`);

// Participant
export const getMyAssignmentApi   = (id) => api.get(`/lhc/campaigns/${id}/my-assignment`);
export const saveLhcAnswerApi     = (id, data) => api.put(`/lhc/campaigns/${id}/my-assignment/answer`, data);
export const submitAssignmentApi  = (id) => api.post(`/lhc/campaigns/${id}/my-assignment/submit`);
export const getMyLhcResultApi    = (id) => api.get(`/lhc/campaigns/${id}/my-result`);

// Question admin
export const createLhcQuestionApi = (data) => api.post('/lhc/questions', data);
export const updateLhcQuestionApi = (qid, data) => api.patch(`/lhc/questions/${qid}`, data);
export const deleteLhcQuestionApi = (qid) => api.delete(`/lhc/questions/${qid}`);

// Reopen / archive
export const reopenCampaignApi    = (id) => api.post(`/lhc/campaigns/${id}/reopen`);
export const archiveCampaignApi   = (id) => api.post(`/lhc/campaigns/${id}/archive`);

// Export CSV — returns a blob URL through axios responseType: 'blob'
export const exportCampaignCsvUrl = (id) => `/api/lhc/campaigns/${id}/export.csv`;
