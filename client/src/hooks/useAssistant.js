import { useQuery, useMutation } from '@tanstack/react-query';
import { assistantStatusApi, assistantChatApi } from '../api/assistant.api.js';

export const useAssistantStatus = (userId) =>
  useQuery({
    queryKey: ['assistant', 'status', userId],
    enabled: !!userId,
    queryFn: () => assistantStatusApi().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

export const useAssistantChat = () =>
  useMutation({
    mutationFn: (messages) => assistantChatApi(messages).then((r) => r.data),
  });
