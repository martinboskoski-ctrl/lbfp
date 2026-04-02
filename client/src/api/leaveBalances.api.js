import api from './axios.js';

export const myBalanceApi    = (year)         => api.get(`/leave-balances/mine?year=${year}`);
export const allBalancesApi  = (year)         => api.get(`/leave-balances/all?year=${year}`);
export const updateBalanceApi = (userId, body) => api.put(`/leave-balances/user/${userId}`, body);
export const initYearApi     = (body)         => api.post('/leave-balances/init-year', body);
