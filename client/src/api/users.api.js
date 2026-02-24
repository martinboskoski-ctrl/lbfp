import api from './axios.js';

export const listDirectoryApi = (dept) =>
  api.get('/users/directory', { params: dept ? { dept } : {} });
