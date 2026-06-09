import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listClientsApi, createClientApi, updateClientApi, deleteClientApi,
  addOrderApi, updateOrderApi, deleteOrderApi, addClientActivityApi, editClientActivityApi,
} from '../api/clients.api.js';
import toast from 'react-hot-toast';

const onErr = (e) => toast.error(e?.response?.data?.message || 'Нешто тргна наопаку');
const invalidateAll = (qc) => qc.invalidateQueries({ queryKey: ['clients'] });

export const useClients = () =>
  useQuery({
    queryKey: ['clients'],
    queryFn:  () => listClientsApi().then((r) => r.data.clients),
  });

export const useCreateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createClientApi,
    onSuccess: () => { invalidateAll(qc); toast.success('Клиентот е додаден'); },
    onError: onErr,
  });
};

export const useUpdateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateClientApi(id, data),
    onSuccess: () => { invalidateAll(qc); toast.success('Клиентот е зачуван'); },
    onError: onErr,
  });
};

export const useDeleteClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteClientApi,
    onSuccess: () => { invalidateAll(qc); toast.success('Клиентот е избришан'); },
    onError: onErr,
  });
};

export const useAddOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => addOrderApi(id, data),
    onSuccess: () => { invalidateAll(qc); toast.success('Нарачката е додадена'); },
    onError: onErr,
  });
};

export const useUpdateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, orderId, data }) => updateOrderApi(id, orderId, data),
    onSuccess: () => invalidateAll(qc),
    onError: onErr,
  });
};

export const useDeleteOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, orderId }) => deleteOrderApi(id, orderId),
    onSuccess: () => { invalidateAll(qc); toast.success('Нарачката е избришана'); },
    onError: onErr,
  });
};

export const useAddClientActivity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => addClientActivityApi(id, data),
    onSuccess: () => invalidateAll(qc),
    onError: onErr,
  });
};

export const useEditClientActivity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activityId, data }) => editClientActivityApi(id, activityId, data),
    onSuccess: () => { invalidateAll(qc); toast.success('Белешката е изменета'); },
    onError: onErr,
  });
};
