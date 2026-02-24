import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listProjectsApi, createProjectApi, getProjectApi,
  updateProjectApi, getProjectFilesApi,
} from '../api/projects.api.js';
import { initiateUploadApi, confirmUploadApi, getDownloadUrlApi } from '../api/files.api.js';
import toast from 'react-hot-toast';

const handleError = (error) => {
  const msg = error?.response?.data?.message || 'Нешто тргна наопаку';
  toast.error(msg);
};

export const useProjects = (dept) =>
  useQuery({
    queryKey: ['projects', dept || 'all'],
    queryFn: () => listProjectsApi(dept).then((r) => r.data.projects),
  });

export const useProject = (id) =>
  useQuery({
    queryKey: ['project', id],
    queryFn: () => getProjectApi(id).then((r) => r.data.project),
    enabled: !!id,
  });

export const useProjectFiles = (id) =>
  useQuery({
    queryKey: ['project-files', id],
    queryFn: () => getProjectFilesApi(id).then((r) => r.data.files),
    enabled: !!id,
  });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProjectApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Проектот е креиран');
    },
    onError: handleError,
  });
};

export const useUpdateProject = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => updateProjectApi(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: handleError,
  });
};

export const useInitiateUpload = () =>
  useMutation({ mutationFn: initiateUploadApi, onError: handleError });

export const useConfirmUpload = () =>
  useMutation({
    mutationFn: ({ id, size }) => confirmUploadApi(id, size),
    onError: handleError,
  });

export const useDownloadUrl = () =>
  useMutation({
    mutationFn: (id) => getDownloadUrlApi(id).then((r) => r.data.url),
    onError: handleError,
  });
