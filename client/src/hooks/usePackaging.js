import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listPackagingChecksApi, getPackagingCheckApi, createPackagingCheckApi, deletePackagingCheckApi,
  addPackagingRoundApi, rerunPackagingAiApi, closePackagingRoundApi, packagingFileApi,
  updatePackagingEmailApi, updatePackagingSectionApi, approvePackagingSectionApi, addPackagingCommentApi, deletePackagingCommentApi,
  listPackagingRulesApi, createPackagingRuleApi, updatePackagingRuleApi, deletePackagingRuleApi,
} from '../api/packaging.api.js';
import toast from 'react-hot-toast';
import i18next from 'i18next';

const t = (key, opts) => i18next.t(key, { ns: 'packaging', ...opts });
const onErr = (e) => toast.error(e?.response?.data?.message || t('toast.error'));

// Every check mutation returns the full check: write it straight into the
// detail cache and refresh the list.
const useCheckMutation = (mutationFn, successKey) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars) => mutationFn(vars).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(['packaging', 'detail', data.check._id], data);
      qc.invalidateQueries({ queryKey: ['packaging', 'list'] });
      if (successKey) toast.success(t(successKey));
    },
    onError: onErr,
  });
};

export const usePackagingChecks = () =>
  useQuery({
    queryKey: ['packaging', 'list'],
    queryFn: () => listPackagingChecksApi().then((r) => r.data),
  });

export const usePackagingCheck = (id) =>
  useQuery({
    queryKey: ['packaging', 'detail', id],
    queryFn: () => getPackagingCheckApi(id).then((r) => r.data),
    enabled: !!id,
  });

export const useCreatePackagingCheck = () => useCheckMutation(createPackagingCheckApi, 'toast.created');
export const useAddPackagingRound = () => useCheckMutation(({ id, form }) => addPackagingRoundApi(id, form), 'toast.roundAdded');
export const useRerunPackagingAi = () => useCheckMutation((id) => rerunPackagingAiApi(id), 'toast.aiDone');
export const useClosePackagingRound = () => useCheckMutation(({ id, ...body }) => closePackagingRoundApi(id, body), 'toast.closed');
export const useUpdatePackagingEmail = () => useCheckMutation(({ id, ...body }) => updatePackagingEmailApi(id, body), 'toast.saved');
export const useUpdatePackagingSection = () => useCheckMutation(({ id, key, ...body }) => updatePackagingSectionApi(id, key, body), 'toast.saved');
export const useApprovePackagingSection = () => useCheckMutation(({ id, key, ...body }) => approvePackagingSectionApi(id, key, body));
export const useAddPackagingComment = () => useCheckMutation(({ id, key, ...body }) => addPackagingCommentApi(id, key, body));
export const useDeletePackagingComment = () => useCheckMutation(({ id, key, commentId }) => deletePackagingCommentApi(id, key, commentId));

export const useDeletePackagingCheck = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deletePackagingCheckApi(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['packaging', 'list'] }); toast.success(t('toast.deleted')); },
    onError: onErr,
  });
};

// Files need the auth header, so they are fetched as blobs and shown via object URLs.
export const usePackagingFile = (checkId, fileId) =>
  useQuery({
    queryKey: ['packaging', 'file', fileId],
    queryFn: () => packagingFileApi(checkId, fileId).then((r) => URL.createObjectURL(r.data)),
    enabled: !!checkId && !!fileId,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
  });

export const usePackagingRules = () =>
  useQuery({
    queryKey: ['packaging', 'rules'],
    queryFn: () => listPackagingRulesApi().then((r) => r.data.rules),
  });

const useRuleMutation = (mutationFn, successKey) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['packaging', 'rules'] });
      if (successKey) toast.success(t(successKey));
    },
    onError: onErr,
  });
};

export const useCreatePackagingRule = () => useRuleMutation(createPackagingRuleApi, 'toast.ruleSaved');
export const useUpdatePackagingRule = () => useRuleMutation(({ ruleId, ...body }) => updatePackagingRuleApi(ruleId, body));
export const useDeletePackagingRule = () => useRuleMutation(deletePackagingRuleApi, 'toast.ruleDeleted');
