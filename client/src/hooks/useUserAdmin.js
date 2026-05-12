import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  listAdminUsersApi, getAdminUserApi, updateAdminUserApi,
  suspendUserApi, reactivateUserApi, deleteAdminUserApi, resetUserPasswordApi,
} from '../api/userAdmin.api.js';

const onErr = (e) => toast.error(e?.response?.data?.message || 'Something went wrong');

const LIST_KEY = ['admin-users'];
const userKey  = (id) => ['admin-user', id];

export const useAdminUsers = (params = {}) =>
  useQuery({
    queryKey: [...LIST_KEY, params],
    queryFn:  () => listAdminUsersApi(params).then((r) => r.data.users),
  });

export const useAdminUser = (id) =>
  useQuery({
    queryKey: userKey(id),
    queryFn:  () => getAdminUserApi(id).then((r) => r.data.user),
    enabled:  !!id,
  });

const invalidate = (qc, id) => {
  qc.invalidateQueries({ queryKey: LIST_KEY });
  if (id) qc.invalidateQueries({ queryKey: userKey(id) });
};

export const useUpdateAdminUser = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => updateAdminUserApi(id, data),
    onSuccess: () => { invalidate(qc, id); toast.success('User updated'); },
    onError: onErr,
  });
};

export const useSuspendUser = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => suspendUserApi(id, data),
    onSuccess: () => { invalidate(qc, id); toast.success('User suspended'); },
    onError: onErr,
  });
};

export const useReactivateUser = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => reactivateUserApi(id),
    onSuccess: () => { invalidate(qc, id); toast.success('User reactivated'); },
    onError: onErr,
  });
};

export const useDeleteAdminUser = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteAdminUserApi(id),
    onSuccess: () => { invalidate(qc, id); toast.success('User deleted'); },
    onError: onErr,
  });
};

export const useResetUserPassword = (id) =>
  useMutation({
    mutationFn: () => resetUserPasswordApi(id).then((r) => r.data),
    onError: onErr,
  });
