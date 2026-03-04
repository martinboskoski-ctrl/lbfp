import { useQuery, useMutation } from '@tanstack/react-query';
import { listDirectoryApi, updateLanguageApi } from '../api/users.api.js';

export const useDirectory = (dept) =>
  useQuery({
    queryKey: ['directory', dept || 'all'],
    queryFn: () => listDirectoryApi(dept).then((r) => r.data.users),
    enabled: true,
  });

export const useUpdateLanguage = () =>
  useMutation({
    mutationFn: (language) => updateLanguageApi(language).then((r) => r.data.user),
  });
