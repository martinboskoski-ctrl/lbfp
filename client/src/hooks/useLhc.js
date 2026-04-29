import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listLhcCategoriesApi,
  listLhcQuestionsApi,
  getLhcOverviewApi,
  createCampaignApi,
  updateCampaignApi,
  getCampaignApi,
  openCampaignApi,
  closeCampaignApi,
  deleteCampaignApi,
  getCampaignResultsApi,
  getMyAssignmentApi,
  saveLhcAnswerApi,
  submitAssignmentApi,
  getMyLhcResultApi,
  createLhcQuestionApi,
  updateLhcQuestionApi,
  deleteLhcQuestionApi,
  reopenCampaignApi,
  archiveCampaignApi,
} from '../api/lhc.api.js';
import toast from 'react-hot-toast';

const onErr = (e) => toast.error(e?.response?.data?.message || 'Нешто тргна наопаку');
const invalidateAll = (qc) => qc.invalidateQueries({ queryKey: ['lhc'] });

export const useLhcCategories = () =>
  useQuery({
    queryKey: ['lhc', 'categories'],
    queryFn: () => listLhcCategoriesApi().then((r) => r.data.categories),
  });

export const useLhcQuestions = (params = {}) =>
  useQuery({
    queryKey: ['lhc', 'questions', params],
    queryFn: () => listLhcQuestionsApi(params).then((r) => r.data),
    enabled: !!params.category,
  });

export const useLhcOverview = () =>
  useQuery({
    queryKey: ['lhc', 'overview'],
    queryFn: () => getLhcOverviewApi().then((r) => r.data),
  });

export const useLhcCampaign = (id) =>
  useQuery({
    queryKey: ['lhc', 'campaign', id],
    queryFn: () => getCampaignApi(id).then((r) => r.data),
    enabled: !!id,
  });

export const useLhcCampaignResults = (id) =>
  useQuery({
    queryKey: ['lhc', 'campaign', id, 'results'],
    queryFn: () => getCampaignResultsApi(id).then((r) => r.data),
    enabled: !!id,
  });

export const useLhcMyAssignment = (id) =>
  useQuery({
    queryKey: ['lhc', 'campaign', id, 'my-assignment'],
    queryFn: () => getMyAssignmentApi(id).then((r) => r.data),
    enabled: !!id,
  });

export const useLhcMyResult = (id) =>
  useQuery({
    queryKey: ['lhc', 'campaign', id, 'my-result'],
    queryFn: () => getMyLhcResultApi(id).then((r) => r.data),
    enabled: !!id,
    retry: false,
  });

export const useCreateLhcCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCampaignApi,
    onSuccess: () => { invalidateAll(qc); toast.success('Кампањата е креирана'); },
    onError: onErr,
  });
};

export const useUpdateLhcCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateCampaignApi(id, data),
    onSuccess: () => { invalidateAll(qc); toast.success('Зачувано'); },
    onError: onErr,
  });
};

export const useOpenLhcCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: openCampaignApi,
    onSuccess: (r) => { invalidateAll(qc); toast.success(`Отворена — поканети ${r.data.invited}`); },
    onError: onErr,
  });
};

export const useCloseLhcCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: closeCampaignApi,
    onSuccess: () => { invalidateAll(qc); toast.success('Кампањата е затворена'); },
    onError: onErr,
  });
};

export const useDeleteLhcCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCampaignApi,
    onSuccess: () => { invalidateAll(qc); toast.success('Избришано'); },
    onError: onErr,
  });
};

export const useSaveLhcAnswer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, qid, answer }) => saveLhcAnswerApi(id, { qid, answer }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['lhc', 'campaign', vars.id, 'my-assignment'] });
    },
    onError: onErr,
  });
};

export const useSubmitLhcAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitAssignmentApi,
    onSuccess: () => { invalidateAll(qc); toast.success('Прегледот е поднесен'); },
    onError: onErr,
  });
};

export const useCreateLhcQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLhcQuestionApi,
    onSuccess: () => { invalidateAll(qc); toast.success('Прашањето е додадено'); },
    onError: onErr,
  });
};

export const useUpdateLhcQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ qid, data }) => updateLhcQuestionApi(qid, data),
    onSuccess: () => { invalidateAll(qc); toast.success('Зачувано'); },
    onError: onErr,
  });
};

export const useDeleteLhcQuestion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLhcQuestionApi,
    onSuccess: () => { invalidateAll(qc); toast.success('Прашањето е деактивирано'); },
    onError: onErr,
  });
};

export const useReopenLhcCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reopenCampaignApi,
    onSuccess: () => { invalidateAll(qc); toast.success('Кампањата е повторно отворена'); },
    onError: onErr,
  });
};

export const useArchiveLhcCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: archiveCampaignApi,
    onSuccess: () => { invalidateAll(qc); toast.success('Архивирано'); },
    onError: onErr,
  });
};
