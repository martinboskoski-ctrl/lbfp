import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAnnouncementsApi, createAnnouncementApi, deleteAnnouncementApi,
} from '../api/announcements.api.js';
import toast from 'react-hot-toast';

const QK = ['announcements'];

export const useAnnouncements = () =>
  useQuery({
    queryKey: QK,
    queryFn:  () => listAnnouncementsApi().then((r) => r.data.announcements),
  });

export const useCreateAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAnnouncementApi,
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK }); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Грешка'),
  });
};

export const useDeleteAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAnnouncementApi,
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK }); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Грешка'),
  });
};
