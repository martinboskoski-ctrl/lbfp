import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText, Plus, Search, XCircle, AlertTriangle,
  CheckCircle, Clock, Ban, Bell, RefreshCw, ExternalLink, ShieldAlert,
} from 'lucide-react';
import Sidebar, { DEPARTMENTS } from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { useAgreements, useDispatchReminders } from '../hooks/useAgreements.js';
import { useAuth } from '../context/AuthContext.jsx';
import { canManage, isTopManagement } from '../utils/userTier.js';
import { fmtDate } from '../utils/formatDate.js';
import AddAgreementModal from '../components/agreements/AddAgreementModal.jsx';
import { STATUS_LABEL, DOC_TYPE_LABEL, REGISTER_STATUSES } from '../constants/contractRegister.js';

// Tabs are the operating sectors (every department except top management).
const SECTORS = DEPARTMENTS.filter((d) => d.value !== 'top_management');

const STATUS_META = {
  active:        { cls: 'bg-emerald-50 text-emerald-800 border border-emerald-200', icon: CheckCircle   },
  expiring_soon: { cls: 'bg-amber-50 text-amber-800 border border-amber-200',       icon: AlertTriangle },
  expired:       { cls: 'bg-red-50 text-red-800 border border-red-200',             icon: XCircle       },
  negotiating:   { cls: 'bg-sky-50 text-sky-800 border border-sky-200',             icon: Clock         },
  for_renewal:   { cls: 'bg-violet-50 text-violet-800 border border-violet-200',    icon: RefreshCw     },
  renewing:      { cls: 'bg-violet-50 text-violet-800 border border-violet-200',    icon: RefreshCw     },
  terminated:    { cls: 'bg-slate-100 text-slate-600',                              icon: Ban           },
  renewed:       { cls: 'bg-slate-100 text-slate-700',                              icon: RefreshCw     },
  archived:      { cls: 'bg-slate-100 text-slate-500',                              icon: Clock         },
  draft:         { cls: 'bg-slate-100 text-slate-500',                              icon: Clock         },
};

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.draft;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap ${m.cls}`}>
      <Icon size={11} /> {STATUS_LABEL[status] || status}
    </span>
  );
};

const ExpiryHint = ({ days, status }) => {
  if (status === 'terminated' || status === 'renewed' || status === 'archived') return null;
  if (days === null || days === undefined) return <span className="text-xs text-slate-400">∞</span>;
  if (days < 0)   return <span className="text-xs font-medium text-red-600">пред {Math.abs(days)}д</span>;
  if (days === 0) return <span className="text-xs font-medium text-red-600">денес</span>;
  if (days <= 30) return <span className="text-xs font-medium text-amber-600">за {days}д</span>;
  return <span className="text-xs text-slate-400">{days}д</span>;
};

const StatCard = ({ label, count, color, icon: Icon, onClick, active }) => (
  <button
    onClick={onClick}
    className={`flex-1 min-w-[110px] sm:min-w-[140px] card p-3 sm:p-4 flex flex-col gap-1 transition-colors hover:bg-slate-50 text-left ${active ? 'ring-1 ring-slate-700 border-slate-700' : ''}`}
  >
    <div className={`w-7 h-7 rounded flex items-center justify-center ${color}`}>
      <Icon size={14} />
    </div>
    <p className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">{count}</p>
    <p className="text-xs text-slate-500">{label}</p>
  </button>
);

const Th = ({ children, className = '' }) => (
  <th className={`text-left font-medium text-slate-500 px-3 py-2 whitespace-nowrap ${className}`}>{children}</th>
);
const Td = ({ children, className = '' }) => (
  <td className={`px-3 py-2.5 align-top ${className}`}>{children}</td>
);

const Agreements = () => {
  const { t: tc } = useTranslation('common');
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = isTopManagement(user);
  const userCanManage = canManage(user);

  // Active sector tab: '' = all (admin default), otherwise a department value.
  const [activeSector, setActiveSector] = useState(isAdmin ? '' : (user?.department ?? ''));
  const [searchQ, setSearchQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState(null);

  const params = useMemo(() => {
    const p = {};
    if (activeSector) p.dept = activeSector;
    if (searchQ.trim()) p.q = searchQ.trim();
    return p;
  }, [activeSector, searchQ]);

  const { data: agreements = [], isLoading } = useAgreements(params);
  const dispatchReminders = useDispatchReminders();

  const stats = useMemo(() => ({
    total:         agreements.length,
    active:        agreements.filter((a) => a.effectiveStatus === 'active').length,
    expiring_soon: agreements.filter((a) => a.effectiveStatus === 'expiring_soon').length,
    expired:       agreements.filter((a) => a.effectiveStatus === 'expired').length,
  }), [agreements]);

  const filtered = useMemo(() => {
    if (!filterStatus) return agreements;
    return agreements.filter((a) => a.effectiveStatus === filterStatus);
  }, [agreements, filterStatus]);

  // When viewing "all", group rows by sector; otherwise a single flat list.
  const grouped = useMemo(() => {
    if (activeSector) return { [activeSector]: filtered };
    const g = {};
    for (const a of filtered) (g[a.department] ||= []).push(a);
    return g;
  }, [filtered, activeSector]);

  // Can the current user add to the active sector?
  const canAddHere = userCanManage && (isAdmin || activeSector === user?.department);

  const openCreate = () => setModal({
    mode: 'create',
    initial: null,
    dept: isAdmin ? (activeSector || null) : user.department,
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title="Регистар на договори" />
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Регистар на договори</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Единствен извор на вистина за договорите. Гледате сите сектори; уредувате во својот.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => dispatchReminders.mutate()}
                      className="btn-secondary flex items-center gap-1.5 text-sm"
                      disabled={dispatchReminders.isPending}
                    >
                      <Bell size={14} />
                      <span className="hidden sm:inline">{dispatchReminders.isPending ? 'Праќа...' : 'Испрати потсетници'}</span>
                    </button>
                  )}
                  {canAddHere && (
                    <button onClick={openCreate} className="btn-primary flex items-center gap-1.5">
                      <Plus size={16} /> Нов договор
                    </button>
                  )}
                </div>
              </div>

              {/* Sector tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                {isAdmin && (
                  <button
                    onClick={() => setActiveSector('')}
                    className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors ${activeSector === '' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Сите сектори
                  </button>
                )}
                {SECTORS.map((d) => {
                  const own = d.value === user?.department;
                  return (
                    <button
                      key={d.value}
                      onClick={() => setActiveSector(d.value)}
                      className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors inline-flex items-center gap-1.5 ${activeSector === d.value ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {tc(`dept.${d.value}`, d.value)}
                      {own && <span className={`w-1.5 h-1.5 rounded-full ${activeSector === d.value ? 'bg-emerald-300' : 'bg-emerald-500'}`} title="Вашиот сектор" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 mb-4">
              <StatCard label="Вкупно"     count={stats.total}         color="bg-slate-100 text-slate-600"    icon={FileText}      onClick={() => setFilterStatus('')}                                                      active={filterStatus === ''} />
              <StatCard label="Активни"     count={stats.active}        color="bg-emerald-50 text-emerald-700" icon={CheckCircle}   onClick={() => setFilterStatus(filterStatus === 'active' ? '' : 'active')}               active={filterStatus === 'active'} />
              <StatCard label="Истекуваат"  count={stats.expiring_soon} color="bg-amber-50 text-amber-700"     icon={AlertTriangle} onClick={() => setFilterStatus(filterStatus === 'expiring_soon' ? '' : 'expiring_soon')} active={filterStatus === 'expiring_soon'} />
              <StatCard label="Истечени"    count={stats.expired}       color="bg-red-50 text-red-700"         icon={XCircle}       onClick={() => setFilterStatus(filterStatus === 'expired' ? '' : 'expired')}             active={filterStatus === 'expired'} />
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
              <select className="input sm:w-48 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">Сите статуси</option>
                {REGISTER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                <option value="expiring_soon">Истекува наскоро</option>
              </select>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div className="text-center py-16 card">
                <FileText size={36} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-400 text-sm mb-4">Нема договори за прикажување.</p>
                {canAddHere && (
                  <button onClick={openCreate} className="btn-primary">Додади прв договор</button>
                )}
              </div>
            )}

            {/* Register tables (one per sector group) */}
            {!isLoading && Object.keys(grouped).map((deptKey) => (
              <div key={deptKey} className="mb-6">
                {!activeSector && (
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert size={14} className="text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-700">{tc(`dept.${deptKey}`, deptKey)}</h3>
                    <span className="text-xs text-slate-400">({grouped[deptKey].length})</span>
                  </div>
                )}
                <div className="card overflow-x-auto p-0">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100 text-xs">
                      <tr>
                        <Th className="w-10">№</Th>
                        <Th>Тип</Th>
                        <Th>Класа / Предмет</Th>
                        <Th>Назив</Th>
                        <Th>Договорна страна</Th>
                        <Th>Потпишан</Th>
                        <Th>Истек</Th>
                        <Th>Статус</Th>
                        <Th>Архивски бр.</Th>
                        <Th>Одговорен</Th>
                        <Th className="text-center">Drive</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {grouped[deptKey].map((a) => (
                        <tr
                          key={a._id}
                          onClick={() => navigate(`/agreements/${a._id}`)}
                          className="hover:bg-slate-50 cursor-pointer"
                        >
                          <Td className="text-slate-400 font-mono text-xs">{a.sequenceNumber ?? '—'}</Td>
                          <Td className="whitespace-nowrap text-slate-600 text-xs">{DOC_TYPE_LABEL[a.documentType] || '—'}</Td>
                          <Td className="text-slate-700 max-w-[180px] truncate" title={a.contractClass}>{a.contractClass || '—'}</Td>
                          <Td className="font-medium text-slate-900 max-w-[200px] truncate" title={a.title}>{a.title || '—'}</Td>
                          <Td className="text-slate-700 max-w-[180px] truncate" title={a.otherParty}>{a.otherParty}</Td>
                          <Td className="whitespace-nowrap text-slate-500 text-xs">{fmtDate(a.signedDate)}</Td>
                          <Td className="whitespace-nowrap">
                            <div className="text-xs text-slate-600">{a.endDate ? fmtDate(a.endDate) : '∞'}</div>
                            <ExpiryHint days={a.daysUntilExpiry} status={a.effectiveStatus} />
                          </Td>
                          <Td><StatusBadge status={a.effectiveStatus} /></Td>
                          <Td className="whitespace-nowrap text-slate-500 text-xs font-mono">{a.archiveNumber || '—'}</Td>
                          <Td className="whitespace-nowrap text-slate-600 text-xs">{a.owner?.name || '—'}</Td>
                          <Td className="text-center">
                            {a.driveLink ? (
                              <a
                                href={a.driveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex text-slate-400 hover:text-slate-700"
                                title="Отвори папка во Google Drive"
                              >
                                <ExternalLink size={14} />
                              </a>
                            ) : <span className="text-slate-300">—</span>}
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </main>
        {modal && (
          <AddAgreementModal
            mode={modal.mode}
            initial={modal.initial}
            dept={modal.dept}
            onClose={() => setModal(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Agreements;
