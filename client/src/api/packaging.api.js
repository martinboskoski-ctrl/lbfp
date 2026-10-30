import api from './axios.js';

export const listPackagingChecksApi = ()         => api.get('/packaging');
export const getPackagingCheckApi   = (id)       => api.get(`/packaging/${id}`);
export const createPackagingCheckApi = (form)    => api.post('/packaging', form);
export const deletePackagingCheckApi = (id)      => api.delete(`/packaging/${id}`);
export const addPackagingRoundApi   = (id, form) => api.post(`/packaging/${id}/rounds`, form);
export const rerunPackagingAiApi    = (id)       => api.post(`/packaging/${id}/ai`);
export const closePackagingRoundApi = (id, body) => api.post(`/packaging/${id}/close`, body);
export const packagingFileApi       = (id, fileId) => api.get(`/packaging/${id}/files/${fileId}`, { responseType: 'blob' });

export const updatePackagingEmailApi   = (id, body)              => api.patch(`/packaging/${id}/email`, body);
export const updatePackagingSectionApi = (id, key, body)         => api.patch(`/packaging/${id}/email/sections/${key}`, body);
export const approvePackagingSectionApi = (id, key, body)        => api.post(`/packaging/${id}/email/sections/${key}/approve`, body);
export const addPackagingCommentApi    = (id, key, body)         => api.post(`/packaging/${id}/email/sections/${key}/comments`, body);
export const deletePackagingCommentApi = (id, key, commentId)    => api.delete(`/packaging/${id}/email/sections/${key}/comments/${commentId}`);

export const listPackagingRulesApi  = ()               => api.get('/packaging/rules');
export const createPackagingRuleApi = (body)           => api.post('/packaging/rules', body);
export const updatePackagingRuleApi = (ruleId, body)   => api.patch(`/packaging/rules/${ruleId}`, body);
export const deletePackagingRuleApi = (ruleId)         => api.delete(`/packaging/rules/${ruleId}`);
