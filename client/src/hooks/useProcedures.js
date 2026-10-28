import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listProceduresApi, createProcedureApi, getProcedureApi, deleteProcedureApi, procedurePdfApi,
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

// Downloads the server-rendered PDF, saved under the procedure's title.
export const useDownloadProcedurePdf = () =>
  useMutation({
    mutationFn: async ({ id, title }) => {
      const res = await procedurePdfApi(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/[\\/:*?"<>|]+/g, ' ').trim()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onError: onErr,
  });
