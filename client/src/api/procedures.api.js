import api from './axios.js';

export const listProceduresApi  = ()     => api.get('/procedures');
export const createProcedureApi = (data) => api.post('/procedures', data);
export const getProcedureApi    = (id)   => api.get(`/procedures/${id}`);
export const deleteProcedureApi = (id)   => api.delete(`/procedures/${id}`);
