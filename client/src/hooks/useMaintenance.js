import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listMaintenanceApi, createMaintenanceApi, getMaintenanceApi, updateMaintenanceApi,
} from '../api/maintenance.api.js';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const onErr = (e) => toast.error(e?.response?.data?.message || 'Error');

export const useMaintenanceRequests = (params) =>
  useQuery({
    queryKey: ['maintenance', params],
    queryFn: () => listMaintenanceApi(params).then((r) => r.data.requests),
  });

export const useMaintenanceRequest = (id) =>
  useQuery({
    queryKey: ['maintenance', id],
    queryFn: () => getMaintenanceApi(id).then((r) => r.data.request),
    enabled: !!id,
  });

export const useCreateMaintenance = () => {
  const qc = useQueryClient();
  const { t } = useTranslation('maintenance');
  return useMutation({
    mutationFn: createMaintenanceApi,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenance'] }); toast.success(t('created')); },
    onError: onErr,
  });
};

export const useUpdateMaintenance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateMaintenanceApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maintenance'] }),
    onError: onErr,
  });
};
