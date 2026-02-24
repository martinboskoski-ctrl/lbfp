import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listPOsApi, createPOApi, getPOApi, updatePOApi, toggleStatusApi,
  addQuestionApi, answerQuestionApi, resolveQuestionApi, deletePOApi,
} from '../api/po.api.js';
import toast from 'react-hot-toast';

const onErr = (e) => toast.error(e?.response?.data?.message || 'Something went wrong');
const LIST_KEY = ['pos'];
const poKey    = (id) => ['po', id];

export const usePOs = () =>
  useQuery({ queryKey: LIST_KEY, queryFn: () => listPOsApi().then((r) => r.data.pos) });

export const usePO = (id) =>
  useQuery({ queryKey: poKey(id), queryFn: () => getPOApi(id).then((r) => r.data.po), enabled: !!id });

export const useCreatePO = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPOApi,
    onSuccess: () => { qc.invalidateQueries({ queryKey: LIST_KEY }); toast.success('Purchase Order created'); },
    onError: onErr,
  });
};

const invalidatePO = (qc, id) => {
  qc.invalidateQueries({ queryKey: poKey(id) });
  qc.invalidateQueries({ queryKey: LIST_KEY });
};

export const useUpdatePO = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => updatePOApi(id, data),
    onSuccess: () => invalidatePO(qc, id),
    onError: onErr,
  });
};

export const useToggleStatus = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => toggleStatusApi(id),
    onSuccess: () => invalidatePO(qc, id),
    onError: onErr,
  });
};

export const useAddQuestion = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => addQuestionApi(id, data),
    onSuccess: () => invalidatePO(qc, id),
    onError: onErr,
  });
};

export const useAnswerQuestion = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ qid, answer }) => answerQuestionApi(id, qid, { answer }),
    onSuccess: () => { invalidatePO(qc, id); toast.success('Answer submitted'); },
    onError: onErr,
  });
};

export const useResolveQuestion = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (qid) => resolveQuestionApi(id, qid),
    onSuccess: () => invalidatePO(qc, id),
    onError: onErr,
  });
};

export const useDeletePO = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePOApi,
    onSuccess: () => { qc.invalidateQueries({ queryKey: LIST_KEY }); toast.success('Purchase Order deleted'); },
    onError: onErr,
  });
};
