import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText, Plus, Search, RefreshCw, XCircle, AlertTriangle,
  CheckCircle, Clock, Ban, Bell, ShieldAlert, Building2,
} from 'lucide-react';
import Sidebar, { DEPARTMENTS } from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { useAgreements, useDispatchReminders } from '../hooks/useAgreements.js';
import { useAuth } from '../context/AuthContext.jsx';
import { canManage, isTopManagement } from '../utils/userTier.js';
import { fmtDate } from '../utils/formatDate.js';
import AddAgreementModal, { CATEGORIES } from '../components/agreements/AddAgreementModal.jsx';

const STATUS_META = {
  active:        { color: 'bg-emerald-50 text-emerald-800 border border-emerald-200', icon: CheckCircle    },
  expiring_soon: { color: 'bg-amber-50 text-amber-800 border border-amber-200',       icon: AlertTriangle  },
  expired:       { color: 'bg-red-50 text-red-800 border border-red-200',             icon: XCircle        },
  terminated:    { color: 'bg-slate-100 text-slate-600',                              icon: Ban            },
  renewed:       { color: 'bg-slate-100 text-slate-700',                              icon: RefreshCw      },
  draft:         { color: 'bg-slate-100 text-slate-500',                              icon: Clock          },
};

const RISK_META = {
  low:      { label: 'Низок ризик', cls: 'bg-slate-100 text-slate-600' },
  medium:   { label: 'Среден',      cls: 'bg-amber-50 text-amber-800 border border-amber-200' },
  high:     { label: 'Висок',       cls: 'bg-red-50 text-red-800 border border-red-200' },
  critical: { label: 'Критичен',    cls: 'bg-red-100 text-red-900 border border-red-300' },
};

const DaysChip = ({ days, status, t }) => {
  if (days === null || days === undefined) return <span className="text-xs text-slate-400">{t('daysChip.openEnded')}</span>;
  if (status === 'terminated' || status === 'renewed') return null;
  if (days < 0)   return <span className="text-xs font-medium text-red-600">Истекол пред {Math.abs(days)} денови</span>;
  if (days === 0) return <span className="text-xs font-medium text-red-600">Истекува денес</span>;
  if (days <= 30) return <span className="text-xs font-medium text-amber-600">Истекува за {days}д</span>;
  return <span className="text-xs text-slate-400">Преостанато {days}д</span>;
};

const StatCard = ({ label, count, color, icon, onClick, active }) => {
  const IconCmp = icon;
  return (
  <button
    onClick={onClick}
    className={`flex-1 min-w-[110px] sm:min-w-[140px] card p-3 sm:p-4 flex flex-col gap-1 transition-colors hover:bg-slate-50 text-left ${active ? 'ring-1 ring-slate-700 border-slate-700' : ''}`}
  >
    <div className={`w-7 h-7 rounded flex items-center justify-center ${color}`}>
      <IconCmp size={14} />
    </div>
    <p className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">{count}</p>
    <p className="text-xs text-slate-500">{label}</p>
  </button>
  );
};

const AgreementRow = ({ a, t, tc }) => {
  const s = STATUS_META[a.effectiveStatus] || STATUS_META.draft;
  const StatusIcon = s.icon;
  return (
    <Link to={`/agreements/${a._id}`} className="card p-3 sm:p-4 hover:bg-slate-50 transition-colors block">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="mt-0.5 p-2 rounded bg-slate-100 flex-shrink-0">
            <FileText size={15} className="text-slate-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {a.contractNumber && (
                <span className="text-xs text-slate-400 font-mono">#{a.contractNumber}</span>
              )}
              <h3 className="font-semibold text-slate-900 text-sm leading-snug truncate">{a.title}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {a.otherParty}
              {a.owner?.name && <span> · одговорен: {a.owner.name}</span>}
            </p>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 mt-1.5">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                {tc(`dept.${a.department}`, a.department)}
              </span>
              <span>{fmtDate(a.startDate)} → {a.endDate ? fmtDate(a.endDate) : '∞'}</span>
              {a.value && (
                <span className="font-medium text-slate-700">
                  {Number(a.value).toLocaleString('mk-MK')} {a.currency}
                </span>
              )}
              {a.riskLevel && a.riskLevel !== 'low' && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${RISK_META[a.riskLevel]?.cls}`}>
                  {RISK_META[a.riskLevel]?.label}
                </span>
              )}
              {a.confidentiality === 'confidential' && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 inline-flex items-center gap-1">
                  <ShieldAlert size={10} /> Доверливо
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${s.color}`}>
            <StatusIcon size={11} />
            {t(`status.${a.effectiveStatus}`, a.effectiveStatus)}
          </span>
          <DaysChip days={a.daysUntilExpiry} status={a.effectiveStatus} t={t} />
        </div>
      </div>
    </Link>
  );
};

const Agreements = () => {
  const { t } = useTranslation('agreements');
  const { t: tc } = useTranslation('common');
  const { user } = useAuth();

  const [searchQ, setSearchQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [modal, setModal] = useState(null);

  const params = useMemo(() => {
    const p = {};
    if (filterDept) p.dept = filterDept;
    if (filterCategory) p.category = filterCategory;
    if (filterRisk) p.riskLevel = filterRisk;
    if (searchQ.trim()) p.q = searchQ.trim();
    return p;
  }, [filterDept, filterCategory, filterRisk, searchQ]);

  const { data: agreements = [], isLoading } = useAgreements(params);
  const dispatchReminders = useDispatchReminders();
  const isAdmin = isTopManagement(user);
  const userCanManage = canManage(user);

  const stats = useMemo(() => ({
    total:         agreements.length,
    active:        agreements.filter((a) => a.effectiveStatus === 'active').length,
    expiring_soon: agreements.filter((a) => a.effectiveStatus === 'expiring_soon').length,
    expired:       agreements.filter((a) => a.effectiveStatus === 'expired').length,
  }), [agreements]);

  const totalValue = useMemo(() =>
    agreements.reduce((sum, a) => sum + (a.value && a.currency === 'MKD' ? Number(a.value) : 0), 0)
  , [agreements]);

  const filtered = useMemo(() => {
    if (!filterStatus) return agreements;
    return agreements.filter((a) => a.effectiveStatus === filterStatus);
  }, [agreements, filterStatus]);

  const grouped = useMemo(() => {
    if (!isAdmin || filterDept) return { _all: filtered };
    const g = {};
    for (const a of filtered) (g[a.department] ||= []).push(a);
    return g;
  }, [filtered, isAdmin, filterDept]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title="Договори — Менаџмент" />
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col gap-3 mb-4 sm:mb-5">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Сите договори</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {isAdmin
                    ? 'Преглед на сите договори во компанијата.'
                    : `Договори за секторот ${tc(`dept.${user?.department}`, user?.department)}.`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => dispatchReminders.mutate()}
                    className="btn-secondary flex items-center gap-1.5 text-sm"
                    disabled={dispatchReminders.isPending}
                  >
                    <Bell size={14} />
                    <span className="hidden sm:inline">{dispatchReminders.isPending ? 'Праќа...' : 'Испрати потсетници'}</span>
                    <span className="sm:hidden">{dispatchReminders.isPending ? '...' : 'Потсетници'}</span>
                  </button>
                )}
                {userCanManage && (
                  <button onClick={() => setModal({ mode: 'create', initial: null })} className="btn-primary flex items-center gap-1.5 ml-auto sm:ml-0">
                    <Plus size={16} /> Нов договор
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 mb-4">
              <StatCard label="Вкупно"        count={stats.total}         color="bg-slate-100 text-slate-600"     icon={FileText}      onClick={() => setFilterStatus('')}                                                       active={filterStatus === ''} />
              <StatCard label="Активни"       count={stats.active}        color="bg-emerald-50 text-emerald-700"  icon={CheckCircle}   onClick={() => setFilterStatus(filterStatus === 'active' ? '' : 'active')}                active={filterStatus === 'active'} />
              <StatCard label="Истекуваат"    count={stats.expiring_soon} color="bg-amber-50 text-amber-700"      icon={AlertTriangle} onClick={() => setFilterStatus(filterStatus === 'expiring_soon' ? '' : 'expiring_soon')}  active={filterStatus === 'expiring_soon'} />
              <StatCard label="Истечени"      count={stats.expired}       color="bg-red-50 text-red-700"          icon={XCircle}       onClick={() => setFilterStatus(filterStatus === 'expired' ? '' : 'expired')}              active={filterStatus === 'expired'} />
              {totalValue > 0 && (
                <div className="flex-1 min-w-[140px] sm:min-w-[160px] card p-3 sm:p-4">
                  <p className="text-xs text-slate-500">Вкупна вредност (MKD)</p>
                  <p className="text-lg sm:text-xl font-semibold text-slate-900 mt-1">{totalValue.toLocaleString('mk-MK')}</p>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-8 text-sm"
                  placeholder="Барај по наслов, страна, бр. на договор..."
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                />
              </div>
              {isAdmin && (
                <select className="input sm:w-44 text-sm" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                  <option value="">Сите сектори</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d.value} value={d.value}>{tc(`dept.${d.value}`, d.value)}</option>
                  ))}
                </select>
              )}
              <select className="input sm:w-44 text-sm" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="">Сите категории</option>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{t(`categoryShort.${c.value}`, c.value)}</option>)}
              </select>
              <select className="input sm:w-40 text-sm" value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
                <option value="">Сите ризици</option>
                <option value="low">Низок</option>
                <option value="medium">Среден</option>
                <option value="high">Висок</option>
                <option value="critical">Критичен</option>
              </select>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div className="text-center py-16">
                <FileText size={36} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-400 text-sm mb-4">Нема договори за прикажување.</p>
                {userCanManage && (
                  <button onClick={() => setModal({ mode: 'create', initial: null })} className="btn-primary">
                    Додади прв договор
                  </button>
                )}
              </div>
            )}

            {!isLoading && Object.keys(grouped).map((deptKey) => (
              <div key={deptKey} className="mb-5">
                {deptKey !== '_all' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 size={14} className="text-slate-400" />
                    <h3 className="section-title">
                      {tc(`dept.${deptKey}`, deptKey)}
                    </h3>
                    <span className="text-xs text-slate-400">({grouped[deptKey].length})</span>
                  </div>
                )}
                <div className="space-y-2">
                  {grouped[deptKey].map((a) => (
                    <AgreementRow key={a._id} a={a} t={t} tc={tc} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
        {modal && (
          <AddAgreementModal
            mode={modal.mode}
            initial={modal.initial}
            dept={isAdmin ? (filterDept || null) : user.department}
            onClose={() => setModal(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Agreements;
