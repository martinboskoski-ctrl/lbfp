import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listProceduresApi, createProcedureApi, getProcedureApi, deleteProcedureApi,
} from '../api/procedures.api.js';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const onErr = (e) => toast.error(e?.response?.data?.message || 'Нешто тргна наопаку');

export const useProcedures = () =>
  useQuery({
    queryKey: ['procedures'],
    queryFn:  () => listProceduresApi().then((r) => r.data.procedures),
  });

export const useProcedure = (id) =>
  useQuery({
    queryKey: ['procedures', id],
    queryFn:  () => getProcedureApi(id).then((r) => r.data.procedure),
    enabled:  !!id,
  });

export const useCreateProcedure = () => {
  const qc = useQueryClient();
  const { t } = useTranslation('common');
  return useMutation({
    mutationFn: createProcedureApi,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['procedures'] }); toast.success(t('procedureCreated')); },
    onError: onErr,
  });
};

export const useDeleteProcedure = () => {
  const qc = useQueryClient();
  const { t } = useTranslation('common');
  return useMutation({
    mutationFn: deleteProcedureApi,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['procedures'] }); toast.success(t('procedureDeleted')); },
    onError: onErr,
  });
};
