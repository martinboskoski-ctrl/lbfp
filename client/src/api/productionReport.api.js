import api from './axios.js';

export const listReportsApi   = (params) => api.get('/production-reports', { params });
export const getReportApi     = (year, month) => api.get(`/production-reports/${year}/${month}`);
export const createReportApi  = (data) => api.post('/production-reports', data);
export const updateReportApi  = (year, month, data) => api.put(`/production-reports/${year}/${month}`, data);
export const deleteReportApi  = (year, month) => api.delete(`/production-reports/${year}/${month}`);
export const summaryApi       = (params) => api.get('/production-reports/summary', { params });
