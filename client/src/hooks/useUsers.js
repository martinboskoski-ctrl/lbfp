import { useQuery } from '@tanstack/react-query';
import { listDirectoryApi } from '../api/users.api.js';

export const useDirectory = (dept) =>
  useQuery({
    queryKey: ['directory', dept || 'all'],
    queryFn: () => listDirectoryApi(dept).then((r) => r.data.users),
    enabled: true,
  });
