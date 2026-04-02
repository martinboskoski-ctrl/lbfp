import { useTranslation } from 'react-i18next';
import { ClipboardList, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useRequestStats } from '../../hooks/useRequests.js';
import { useAllBalances } from '../../hooks/useLeaveBalances.js';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card p-4 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  </div>
);

const RequestsDashboard = () => {
  const { t } = useTranslation('requests');
  const { data: stats, isLoading } = useRequestStats();
  const year = new Date().getFullYear();
  const { data: balances = [] } = useAllBalances(year);

  if (isLoading) return <div className="text-center text-gray-400 py-8">{t('loading')}</div>;
  if (!stats) return null;

  const lowBalance = balances.filter((b) => b.remainingDays <= 3 && b.user);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={ClipboardList} label={t('stats.total')} value={stats.total} color="bg-blue-100 text-blue-600" />
        <StatCard icon={Clock} label={t('stats.pending')} value={stats.pending + stats.inProgress} color="bg-yellow-100 text-yellow-600" />
        <StatCard icon={CheckCircle2} label={t('stats.approved')} value={stats.approved} color="bg-green-100 text-green-600" />
        <StatCard icon={XCircle} label={t('stats.rejected')} value={stats.rejected} color="bg-red-100 text-red-600" />
      </div>

      {/* By type */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('stats.byType')}</h3>
        <div className="space-y-2">
          {stats.byType.map((item) => {
            const maxCount = Math.max(...stats.byType.map((i) => i.count), 1);
            const pct = Math.round((item.count / maxCount) * 100);
            return (
              <div key={item._id} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-28 shrink-0">{t(`type.${item._id}`)}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-medium text-gray-700 w-8 text-right">{item.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Low balance employees */}
      {lowBalance.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('stats.lowBalance')}</h3>
          <div className="space-y-1">
            {lowBalance.map((b) => (
              <div key={b._id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-700">{b.user.name}</span>
                <span className={`font-medium ${b.remainingDays <= 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                  {b.remainingDays} {t('daysRemaining')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsDashboard;
