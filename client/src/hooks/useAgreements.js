import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAgreementsApi,
  getAgreementApi,
  createAgreementApi,
  updateAgreementApi,
  renewAgreementApi,
  terminateAgreementApi,
  deleteAgreementApi,
  addAgreementNoteApi,
  dispatchRemindersApi,
} from '../api/agreements.api.js';
import toast from 'react-hot-toast';
import i18next from 'i18next';

const t = (key, opts) => i18next.t(key, { ns: 'agreements', ...opts });
const onErr = (e) => toast.error(e?.response?.data?.message || t('toast.error'));
const invalidateAll = (qc) => qc.invalidateQueries({ queryKey: ['agreements'] });

// `params` may be a string (legacy: dept) or object: { dept, status, q, category, riskLevel }.
export const useAgreements = (params) => {
  const normalized = typeof params === 'string'
    ? (params ? { dept: params } : {})
    : (params || {});
  return useQuery({
    queryKey: ['agreements', 'list', normalized],
    queryFn:  () => listAgreementsApi(normalized).then((r) => r.data.agreements),
  });
};

export const useAgreement = (id) =>
  useQuery({
    queryKey: ['agreements', 'detail', id],
    queryFn:  () => getAgreementApi(id).then((r) => r.data.agreement),
    enabled: !!id,
  });

export const useCreateAgreement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAgreementApi,
    onSuccess: () => { invalidateAll(qc); toast.success(t('toast.added')); },
    onError: onErr,
  });
};

export const useUpdateAgreement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateAgreementApi(id, data),
    onSuccess: () => { invalidateAll(qc); toast.success(t('toast.saved')); },
    onError: onErr,
  });
};

export const useRenewAgreement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => renewAgreementApi(id, data),
    onSuccess: () => { invalidateAll(qc); toast.success(t('toast.renewed')); },
    onError: onErr,
  });
};

export const useTerminateAgreement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => terminateAgreementApi(id, reason),
    onSuccess: () => { invalidateAll(qc); toast.success(t('toast.terminated')); },
    onError: onErr,
  });
};

export const useDeleteAgreement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAgreementApi,
    onSuccess: () => { invalidateAll(qc); toast.success(t('toast.deleted')); },
    onError: onErr,
  });
};

export const useAddAgreementNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, text }) => addAgreementNoteApi(id, text),
    onSuccess: () => { invalidateAll(qc); },
    onError: onErr,
  });
};

export const useDispatchReminders = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dispatchRemindersApi,
    onSuccess: (r) => { invalidateAll(qc); toast.success(t('toast.remindersSent', { count: r.data.dispatched })); },
    onError: onErr,
  });
};
