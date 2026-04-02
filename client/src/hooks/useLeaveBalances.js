import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { myBalanceApi, allBalancesApi, updateBalanceApi, initYearApi } from '../api/leaveBalances.api.js';
import toast from 'react-hot-toast';

const onErr = (e) => toast.error(e?.response?.data?.message || 'Something went wrong');

export const useMyBalance = (year) =>
  useQuery({
    queryKey: ['leave-balances', 'mine', year],
    queryFn: () => myBalanceApi(year).then((r) => r.data.balance),
  });

export const useAllBalances = (year) =>
  useQuery({
    queryKey: ['leave-balances', 'all', year],
    queryFn: () => allBalancesApi(year).then((r) => r.data.balances),
  });

export const useUpdateBalance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, ...body }) => updateBalanceApi(userId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-balances'] });
      toast.success('Balance updated');
    },
    onError: onErr,
  });
};

export const useInitYear = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: initYearApi,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['leave-balances'] });
      toast.success(res.data.message);
    },
    onError: onErr,
  });
};
