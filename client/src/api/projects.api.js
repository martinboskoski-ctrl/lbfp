import api from './axios.js';

export const listProjectsApi  = (dept) => api.get('/projects', { params: dept ? { dept } : {} });
export const createProjectApi = (data)  => api.post('/projects', data);
export const getProjectApi    = (id)    => api.get(`/projects/${id}`);
export const updateProjectApi = (id, data) => api.put(`/projects/${id}`, data);
export const getProjectFilesApi = (id)  => api.get(`/projects/${id}/files`);
