import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, AlertTriangle, ShieldAlert, Calendar, Building2 } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { useEmployees } from '../hooks/useEmployees.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isHRAdmin } from '../utils/userTier.js';
import { DEPARTMENTS } from '../components/layout/Sidebar.jsx';

const StatusBadge = ({ status, t }) => {
  const cls = {
    open_ended:    'bg-slate-100 text-slate-600',
    active:        'bg-slate-100 text-slate-700',
    expiring_soon: 'bg-amber-50 text-amber-800 border border-amber-200',
    expired:       'bg-red-50 text-red-800 border border-red-200',
    unknown:       'bg-slate-50 text-slate-400',
  };
  const key = cls[status] ? status : 'unknown';
  return <span className={`text-xs px-2 py-0.5 rounded ${cls[key]}`}>{t(`contractBadge.${key}`)}</span>;
};

const SanitaryBadge = ({ status, t }) => {
  if (status !== 'overdue' && status !== 'due_soon') return null;
  const cls = {
    overdue:  'bg-red-50 text-red-800 border border-red-200',
    due_soon: 'bg-amber-50 text-amber-800 border border-amber-200',
  };
  return <span className={`text-xs px-2 py-0.5 rounded inline-flex items-center gap-1 ${cls[status]}`}><AlertTriangle size={12} />{t(`sanitaryBadge.${status}`)}</span>;
};

const Employees = () => {
  const { t } = useTranslation('employees');
  const { t: tc } = useTranslation('common');
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const params = deptFilter ? { dept: deptFilter } : {};
  const { data: employees, isLoading } = useEmployees(params);

  const filtered = useMemo(() => {
    if (!employees) return [];
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.position || '').toLowerCase().includes(q),
    );
  }, [employees, search]);

  const grouped = useMemo(() => {
    const g = {};
    for (const e of filtered) (g[e.department] ||= []).push(e);
    return g;
  }, [filtered]);

  const showAll = isHRAdmin(user);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={t('list.topbarTitle')} />
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col gap-3 mb-5">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">{t('list.heading')}</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {showAll ? t('list.subtitleAll') : t('list.subtitleDept')}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('list.searchPlaceholder')}
                    className="input pl-9"
                  />
                </div>
                {showAll && (
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="input sm:w-56"
                  >
                    <option value="">{t('list.allSectors')}</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {tc(`dept.${d.value}`, { defaultValue: d.value })}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-slate-700" />
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div className="card p-10 text-center text-slate-500">
                {t('list.empty')}
              </div>
            )}

            {!isLoading && Object.keys(grouped).map((dept) => (
              <div key={dept} className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 size={14} className="text-slate-400" />
                  <h3 className="section-title">
                    {tc(`dept.${dept}`, { defaultValue: dept })}
                  </h3>
                  <span className="text-xs text-slate-400">({grouped[dept].length})</span>
                </div>
                <div className="card overflow-hidden divide-y divide-slate-100">
                  {grouped[dept].map((e) => (
                    <Link
                      key={e._id}
                      to={`/employees/${e._id}`}
                      className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-900 truncate">{e.name}</span>
                          {e.isManager && (
                            <span className="text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                              {t('list.manager')}
                            </span>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                          {e.position || <span className="italic">{t('list.noPosition')}</span>} · <span className="hidden sm:inline">{e.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {e.leaveTotal != null && (
                          <span className="hidden sm:inline-flex text-xs text-slate-500 items-center gap-1" title={t('list.leaveTitle')}>
                            <Calendar size={12} />
                            {e.leaveRemaining}/{e.leaveTotal}
                          </span>
                        )}
                        <SanitaryBadge status={e.sanitaryCheckStatus} t={t} />
                        <span className="hidden sm:inline">
                          <StatusBadge status={e.contractStatus} t={t} />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-8 flex items-start gap-2 text-xs text-slate-500">
              <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
              <span>
                {t('list.visibilityPrefix')} {showAll ? t('list.visibilityAll') : t('list.visibilityDept')}{' '}
                {t('list.salaryHidden')}
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Employees;
