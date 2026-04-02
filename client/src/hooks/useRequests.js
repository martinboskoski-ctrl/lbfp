import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createRequestApi, myRequestsApi, pendingRequestsApi,
  getRequestApi, approveRequestApi, rejectRequestApi, requestStatsApi,
} from '../api/requests.api.js';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const onErr = (e) => toast.error(e?.response?.data?.message || 'Something went wrong');

export const useMyRequests = () =>
  useQuery({
    queryKey: ['requests', 'mine'],
    queryFn: () => myRequestsApi().then((r) => r.data.requests),
  });

export const usePendingRequests = () =>
  useQuery({
    queryKey: ['requests', 'pending'],
    queryFn: () => pendingRequestsApi().then((r) => r.data.requests),
  });

export const useRequest = (id) =>
  useQuery({
    queryKey: ['requests', id],
    queryFn: () => getRequestApi(id).then((r) => r.data.request),
    enabled: !!id,
  });

export const useCreateRequest = () => {
  const qc = useQueryClient();
  const { t } = useTranslation('requests');
  return useMutation({
    mutationFn: createRequestApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests'] });
      toast.success(t('requestCreated'));
    },
    onError: onErr,
  });
};

export const useApproveRequest = () => {
  const qc = useQueryClient();
  const { t } = useTranslation('requests');
  return useMutation({
    mutationFn: ({ id, note }) => approveRequestApi(id, { note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests'] });
      toast.success(t('requestApproved'));
    },
    onError: onErr,
  });
};

export const useRequestStats = () =>
  useQuery({
    queryKey: ['requests', 'stats'],
    queryFn: () => requestStatsApi().then((r) => r.data),
  });

export const useRejectRequest = () => {
  const qc = useQueryClient();
  const { t } = useTranslation('requests');
  return useMutation({
    mutationFn: ({ id, note }) => rejectRequestApi(id, { note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests'] });
      toast.success(t('requestRejected'));
    },
    onError: onErr,
  });
};
