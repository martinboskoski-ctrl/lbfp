import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listReportsApi, getReportApi, createReportApi, updateReportApi, deleteReportApi, summaryApi,
} from '../api/productionReport.api.js';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const QK = ['production-reports'];
const onErr = (e) => toast.error(e?.response?.data?.message || 'Error');

export const useProductionReports = (params) =>
  useQuery({
    queryKey: [...QK, params],
    queryFn: () => listReportsApi(params).then((r) => r.data.reports),
  });

export const useProductionReport = (year, month) =>
  useQuery({
    queryKey: [...QK, year, month],
    queryFn: () => getReportApi(year, month).then((r) => r.data.report),
    enabled: !!year && !!month,
  });

export const useProductionSummary = (params) =>
  useQuery({
    queryKey: [...QK, 'summary', params],
    queryFn: () => summaryApi(params).then((r) => r.data.data),
  });

export const useCreateProductionReport = () => {
  const qc = useQueryClient();
  const { t } = useTranslation('production');
  return useMutation({
    mutationFn: createReportApi,
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK }); toast.success(t('created')); },
    onError: onErr,
  });
};

export const useUpdateProductionReport = () => {
  const qc = useQueryClient();
  const { t } = useTranslation('production');
  return useMutation({
    mutationFn: ({ year, month, ...data }) => updateReportApi(year, month, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK }); toast.success(t('updated')); },
    onError: onErr,
  });
};

export const useDeleteProductionReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ year, month }) => deleteReportApi(year, month),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
    onError: onErr,
  });
};
