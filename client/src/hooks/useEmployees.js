import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import i18next from 'i18next';
import {
  listEmployeesApi, getEmployeeFileApi,
  addLeaveEntryApi, deleteLeaveEntryApi, setLeaveEntitlementApi, addDisciplineApi, deleteDisciplineApi,
} from '../api/employees.api.js';

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

// Card mutations answer with the refreshed file: write it into the cache and
// refresh the list (its leave column changes too).
const useFileMutation = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...vars }) => mutationFn(id, vars).then((r) => r.data),
    onSuccess: (data, { id }) => {
      qc.setQueryData(['employees', 'file', id], data);
      qc.invalidateQueries({ queryKey: ['employees'], exact: false, predicate: (q) => q.queryKey[1] !== 'file' });
    },
    onError: (e) => toast.error(e?.response?.data?.message || i18next.t('employees:detail.error')),
  });
};

export const useAddLeaveEntry = () => useFileMutation((id, body) => addLeaveEntryApi(id, body));
export const useDeleteLeaveEntry = () => useFileMutation((id, { entryId }) => deleteLeaveEntryApi(id, entryId));
export const useSetLeaveEntitlement = () => useFileMutation((id, { year, totalDays }) => setLeaveEntitlementApi(id, year, { totalDays }));
export const useAddDiscipline = () => useFileMutation((id, body) => addDisciplineApi(id, body));
export const useDeleteDiscipline = () => useFileMutation((id, { actionId }) => deleteDisciplineApi(id, actionId));
