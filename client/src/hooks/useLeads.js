import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listLeadsApi,
  createLeadApi,
  updateLeadApi,
  addActivityApi,
  deleteLeadApi,
} from '../api/leads.api.js';
import toast from 'react-hot-toast';

const onErr = (e) => toast.error(e?.response?.data?.message || 'Нешто тргна наопаку');
const invalidateAll = (qc) => qc.invalidateQueries({ queryKey: ['leads'] });

export const useLeads = () =>
  useQuery({
    queryKey: ['leads'],
    queryFn:  () => listLeadsApi().then((r) => r.data.leads),
  });

export const useCreateLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLeadApi,
    onSuccess: () => { invalidateAll(qc); toast.success('Лидот е додаден'); },
    onError: onErr,
  });
};

export const useUpdateLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateLeadApi(id, data),
    onSuccess: () => { invalidateAll(qc); toast.success('Лидот е зачуван'); },
    onError: onErr,
  });
};

export const useAddActivity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => addActivityApi(id, data),
    onSuccess: () => { invalidateAll(qc); toast.success('Активноста е додадена'); },
    onError: onErr,
  });
};

export const useDeleteLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLeadApi,
    onSuccess: () => { invalidateAll(qc); toast.success('Лидот е избришан'); },
    onError: onErr,
  });
};
