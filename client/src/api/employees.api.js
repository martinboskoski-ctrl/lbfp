import api from './axios.js';

export const listEmployeesApi = (params = {}) =>
  api.get('/employees', { params });

export const getEmployeeFileApi = (id) =>
  api.get(`/employees/${id}`);

export const addLeaveEntryApi      = (id, body)        => api.post(`/employees/${id}/leave`, body);
export const deleteLeaveEntryApi   = (id, entryId)     => api.delete(`/employees/${id}/leave/${entryId}`);
export const setLeaveEntitlementApi = (id, year, body) => api.put(`/employees/${id}/leave/entitlement/${year}`, body);
export const addDisciplineApi      = (id, body)        => api.post(`/employees/${id}/discipline`, body);
export const deleteDisciplineApi   = (id, actionId)    => api.delete(`/employees/${id}/discipline/${actionId}`);
