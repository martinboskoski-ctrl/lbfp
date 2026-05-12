import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listPOsApi, createPOApi, getPOApi, updatePOApi, toggleStatusApi,
  addQuestionApi, answerQuestionApi, resolveQuestionApi, deletePOApi,
  postThreadApi, markFinalApi, salesReviewApi, clientApprovalApi,
  deptInboxApi, digestApi,
} from '../api/po.api.js';
import toast from 'react-hot-toast';

const onErr = (e) => toast.error(e?.response?.data?.message || 'Something went wrong');
const LIST_KEY  = ['pos'];
const INBOX_KEY = ['po-inbox'];
const poKey     = (id) => ['po', id];

export const usePOs = () =>
  useQuery({ queryKey: LIST_KEY, queryFn: () => listPOsApi().then((r) => r.data.pos) });

export const usePO = (id) =>
  useQuery({ queryKey: poKey(id), queryFn: () => getPOApi(id).then((r) => r.data.po), enabled: !!id });

export const useDeptInbox = (params = {}) =>
  useQuery({
    queryKey: [...INBOX_KEY, params],
    queryFn: () => deptInboxApi(params).then((r) => r.data.items),
  });

export const useCreatePO = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPOApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY });
      qc.invalidateQueries({ queryKey: INBOX_KEY });
      toast.success('Pre-Order Inquiry created');
    },
    onError: onErr,
  });
};

const invalidatePO = (qc, id) => {
  qc.invalidateQueries({ queryKey: poKey(id) });
  qc.invalidateQueries({ queryKey: LIST_KEY });
  qc.invalidateQueries({ queryKey: INBOX_KEY });
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
    onSuccess: () => { invalidatePO(qc, id); toast.success('Reply posted'); },
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

export const usePostThread = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ qid, body }) => postThreadApi(id, qid, { body }),
    onSuccess: () => invalidatePO(qc, id),
    onError: onErr,
  });
};

export const useMarkFinal = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ qid, ...data }) => markFinalApi(id, qid, data),
    onSuccess: () => { invalidatePO(qc, id); toast.success('Final answer submitted for sales review'); },
    onError: onErr,
  });
};

export const useSalesReview = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ qid, ...data }) => salesReviewApi(id, qid, data),
    onSuccess: () => { invalidatePO(qc, id); toast.success('Review saved'); },
    onError: onErr,
  });
};

export const useClientApproval = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ qid, ...data }) => clientApprovalApi(id, qid, data),
    onSuccess: () => { invalidatePO(qc, id); toast.success('Client decision logged'); },
    onError: onErr,
  });
};

export const useDigest = (id) =>
  useMutation({
    mutationFn: () => digestApi(id).then((r) => r.data),
    onError: onErr,
  });

export const useDeletePO = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePOApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY });
      qc.invalidateQueries({ queryKey: INBOX_KEY });
      toast.success('Pre-Order Inquiry deleted');
    },
    onError: onErr,
  });
};
