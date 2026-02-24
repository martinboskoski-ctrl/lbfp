import api from './axios.js';

export const approveGateApi = (projectId, gateNumber) =>
  api.post(`/projects/${projectId}/gates/${gateNumber}/approve`);

export const rejectGateApi = (projectId, gateNumber, reason) =>
  api.post(`/projects/${projectId}/gates/${gateNumber}/reject`, { reason });

export const addCommentApi = (projectId, gateNumber, text) =>
  api.post(`/projects/${projectId}/gates/${gateNumber}/comments`, { text });

export const dispatchFeedbackApi = (projectId) =>
  api.post(`/projects/${projectId}/gates/dispatch-feedback`);

export const acknowledgeGateApi = (projectId) =>
  api.post(`/projects/${projectId}/gates/acknowledge`);
