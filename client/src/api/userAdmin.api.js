import api from './axios.js';

export const listAdminUsersApi   = (params = {}) => api.get('/users/admin', { params });
export const getAdminUserApi     = (id)          => api.get(`/users/admin/${id}`);
export const updateAdminUserApi  = (id, data)    => api.patch(`/users/admin/${id}`, data);
export const suspendUserApi      = (id, data)    => api.post(`/users/admin/${id}/suspend`, data);
export const reactivateUserApi   = (id)          => api.post(`/users/admin/${id}/reactivate`);
export const deleteAdminUserApi  = (id)          => api.delete(`/users/admin/${id}`);
export const resetUserPasswordApi = (id)         => api.post(`/users/admin/${id}/reset-password`);
