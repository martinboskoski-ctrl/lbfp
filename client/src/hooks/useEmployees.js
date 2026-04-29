import { useQuery } from '@tanstack/react-query';
import { listEmployeesApi, getEmployeeFileApi } from '../api/employees.api.js';

export const useEmployees = (params = {}) =>
  useQuery({
    queryKey: ['employees', params],
    queryFn: () => listEmployeesApi(params).then((r) => r.data.employees),
  });

export const useEmployeeFile = (id) =>
  useQuery({
    queryKey: ['employees', 'file', id],
    queryFn: () => getEmployeeFileApi(id).then((r) => r.data),
    enabled: !!id,
  });
