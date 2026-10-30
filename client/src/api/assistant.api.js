import api from './axios.js';

export const assistantStatusApi = ()         => api.get('/assistant/status');
export const assistantChatApi   = (messages) => api.post('/assistant/chat', { messages });
