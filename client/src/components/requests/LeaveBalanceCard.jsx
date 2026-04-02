import { useTranslation } from 'react-i18next';
import { useMyBalance } from '../../hooks/useLeaveBalances.js';

const LeaveBalanceCard = () => {
  const { t } = useTranslation('requests');
  const year = new Date().getFullYear();
  const { data: balance, isLoading } = useMyBalance(year);

  if (isLoading) return null;
  if (!balance) return null;

  const pct = balance.totalDays > 0
    ? Math.round((balance.usedDays / balance.totalDays) * 100)
    : 0;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700">{t('leaveBalance')} {year}</h4>
        <span className="text-xs text-gray-400">{balance.usedDays}/{balance.totalDays} {t('daysUsed')}</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1.5">
        {balance.remainingDays} {t('daysRemaining')}
      </p>
    </div>
  );
};

export default LeaveBalanceCard;
