import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listTasksApi, listTasksForUserApi, createTaskApi, updateTaskApi,
  updateStatusApi, approveTaskApi, deleteTaskApi,
} from '../api/tasks.api.js';
import toast from 'react-hot-toast';

const onErr = (e) => toast.error(e?.response?.data?.message || 'Нешто тргна наопаку');

// Invalidate ALL task queries regardless of dept filter
const invalidateAll = (qc) => qc.invalidateQueries({ queryKey: ['tasks'] });

export const useTasks = (dept) =>
  useQuery({
    queryKey: ['tasks', dept ?? 'all'],
    queryFn:  () => listTasksApi(dept).then((r) => r.data.tasks),
  });

export const useEmployeeTasks = (userId) =>
  useQuery({
    queryKey: ['tasks', 'user', userId],
    queryFn:  () => listTasksForUserApi(userId).then((r) => r.data.tasks),
    enabled:  !!userId,
  });

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTaskApi,
    onSuccess: () => { invalidateAll(qc); toast.success('Задачата е додадена'); },
    onError: onErr,
  });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => updateTaskApi(id, data),
    onSuccess: () => { invalidateAll(qc); toast.success('Задачата е ажурирана'); },
    onError: onErr,
  });
};

export const useUpdateTaskStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, direction }) => updateStatusApi(id, { direction }),
    onSuccess: () => invalidateAll(qc),
    onError: onErr,
  });
};

// Direct status set (drag & drop) with optimistic update for a snappy, no-flicker
// board. Patches every cached ['tasks', …] variant in place, rolls back on error.
export const useSetTaskStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => updateStatusApi(id, { status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const snapshots = qc.getQueriesData({ queryKey: ['tasks'] });
      snapshots.forEach(([key, tasks]) => {
        if (!Array.isArray(tasks)) return;
        qc.setQueryData(key, tasks.map((t) => (t._id === id ? { ...t, status } : t)));
      });
      return { snapshots };
    },
    onError: (e, _vars, ctx) => {
      ctx?.snapshots?.forEach(([key, data]) => qc.setQueryData(key, data));
      onErr(e);
    },
    onSettled: () => invalidateAll(qc),
  });
};

export const useApproveTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => approveTaskApi(id),
    onSuccess: () => { invalidateAll(qc); toast.success('Задачата е одобрена'); },
    onError: onErr,
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteTaskApi(id),
    onSuccess: () => { invalidateAll(qc); toast.success('Задачата е избришана'); },
    onError: onErr,
  });
};
