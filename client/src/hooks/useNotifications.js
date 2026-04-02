import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  listNotificationsApi, unreadCountApi, markReadApi, markAllReadApi,
} from '../api/notifications.api.js';
import { useSocket } from '../context/SocketContext.jsx';

export const useNotifications = (page = 1) =>
  useQuery({
    queryKey: ['notifications', page],
    queryFn: () => listNotificationsApi(page).then((r) => r.data),
  });

export const useUnreadCount = () => {
  const qc = useQueryClient();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    };
    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, [socket, qc]);

  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => unreadCountApi().then((r) => r.data.count),
    refetchInterval: 60_000,
  });
};

export const useMarkRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markReadApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllReadApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};
