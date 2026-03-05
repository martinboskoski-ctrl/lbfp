import api from './axios.js';

export const listDirectoryApi = (dept) =>
  api.get('/users/directory', { params: dept ? { dept } : {} });

export const updateLanguageApi = (language) =>
  api.patch('/users/me/language', { language });

export const changePasswordApi = (data) =>
  api.patch('/users/me/password', data);
