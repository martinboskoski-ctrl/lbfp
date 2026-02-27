import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAgreementsApi,
  createAgreementApi,
  updateAgreementApi,
  renewAgreementApi,
  terminateAgreementApi,
  deleteAgreementApi,
} from '../api/agreements.api.js';
import toast from 'react-hot-toast';

const onErr = (e) => toast.error(e?.response?.data?.message || 'Нешто тргна наопаку');
const invalidateAll = (qc) => qc.invalidateQueries({ queryKey: ['agreements'] });

export const useAgreements = (dept) =>
  useQuery({
    queryKey: ['agreements', dept ?? 'all'],
    queryFn:  () => listAgreementsApi(dept).then((r) => r.data.agreements),
  });

export const useCreateAgreement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAgreementApi,
    onSuccess: () => { invalidateAll(qc); toast.success('Договорот е додаден'); },
    onError: onErr,
  });
};

export const useUpdateAgreement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateAgreementApi(id, data),
    onSuccess: () => { invalidateAll(qc); toast.success('Договорот е зачуван'); },
    onError: onErr,
  });
};

export const useRenewAgreement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => renewAgreementApi(id, data),
    onSuccess: () => { invalidateAll(qc); toast.success('Договорот е обновен'); },
    onError: onErr,
  });
};

export const useTerminateAgreement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => terminateAgreementApi(id, reason),
    onSuccess: () => { invalidateAll(qc); toast.success('Договорот е раскинат'); },
    onError: onErr,
  });
};

export const useDeleteAgreement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAgreementApi,
    onSuccess: () => { invalidateAll(qc); toast.success('Договорот е избришан'); },
    onError: onErr,
  });
};
