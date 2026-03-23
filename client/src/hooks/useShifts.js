import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listShiftsApi, createShiftApi, updateShiftApi, deleteShiftApi,
} from '../api/shifts.api.js';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const onErr = (e) => toast.error(e?.response?.data?.message || 'Error');

export const useShifts = (params) =>
  useQuery({
    queryKey: ['shifts', params],
    queryFn: () => listShiftsApi(params).then((r) => r.data.shifts),
  });

export const useCreateShift = () => {
  const qc = useQueryClient();
  const { t } = useTranslation('shifts');
  return useMutation({
    mutationFn: createShiftApi,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shifts'] }); toast.success(t('created')); },
    onError: onErr,
  });
};

export const useUpdateShift = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateShiftApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shifts'] }),
    onError: onErr,
  });
};

export const useDeleteShift = () => {
  const qc = useQueryClient();
  const { t } = useTranslation('shifts');
  return useMutation({
    mutationFn: deleteShiftApi,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shifts'] }); toast.success(t('deleted')); },
    onError: onErr,
  });
};
