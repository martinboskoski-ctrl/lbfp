import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listTasksApi, createTaskApi, updateStatusApi, approveTaskApi, deleteTaskApi,
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

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTaskApi,
    onSuccess: () => { invalidateAll(qc); toast.success('Задачата е додадена'); },
    onError: onErr,
  });
};

export const useUpdateTaskStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, direction }) => updateStatusApi(id, direction),
    onSuccess: () => invalidateAll(qc),
    onError: onErr,
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
