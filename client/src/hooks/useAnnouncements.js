import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAnnouncementsApi, createAnnouncementApi, deleteAnnouncementApi,
  markReadApi, togglePinApi,
} from '../api/announcements.api.js';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const QK = ['announcements'];
const onErr = (e) => toast.error(e?.response?.data?.message || 'Error');

export const useAnnouncements = () =>
  useQuery({
    queryKey: QK,
    queryFn: () => listAnnouncementsApi().then((r) => r.data.announcements),
  });

export const useCreateAnnouncement = () => {
  const qc = useQueryClient();
  const { t } = useTranslation('announcements');
  return useMutation({
    mutationFn: createAnnouncementApi,
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK }); toast.success(t('created')); },
    onError: onErr,
  });
};

export const useMarkAnnouncementRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markReadApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
};

export const useTogglePin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: togglePinApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
    onError: onErr,
  });
};

export const useDeleteAnnouncement = () => {
  const qc = useQueryClient();
  const { t } = useTranslation('announcements');
  return useMutation({
    mutationFn: deleteAnnouncementApi,
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK }); toast.success(t('deleted')); },
    onError: onErr,
  });
};
