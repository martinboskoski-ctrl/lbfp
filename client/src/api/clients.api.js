import api from './axios.js';

export const listClientsApi   = ()                  => api.get('/clients');
export const createClientApi  = (data)              => api.post('/clients', data);
export const updateClientApi  = (id, data)          => api.put(`/clients/${id}`, data);
export const deleteClientApi  = (id)                => api.delete(`/clients/${id}`);

export const addOrderApi      = (id, data)          => api.post(`/clients/${id}/orders`, data);
export const updateOrderApi   = (id, orderId, data) => api.put(`/clients/${id}/orders/${orderId}`, data);
export const deleteOrderApi   = (id, orderId)       => api.delete(`/clients/${id}/orders/${orderId}`);

export const addClientActivityApi = (id, data)      => api.post(`/clients/${id}/activities`, data);
