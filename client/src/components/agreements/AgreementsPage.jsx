import { useState, useMemo } from 'react';
import {
  FileText, Plus, Search, RefreshCw, XCircle, Trash2,
  Edit2, AlertTriangle, CheckCircle, Clock, Ban, ChevronRight,
} from 'lucide-react';
import { useAgreements, useTerminateAgreement, useDeleteAgreement } from '../../hooks/useAgreements.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { canManage } from '../../utils/userTier.js';
import AddAgreementModal, { CATEGORIES } from './AddAgreementModal.jsx';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META = {
  active:         { label: 'Активен',        color: 'bg-green-100 text-green-700',  icon: CheckCircle,     dot: 'bg-green-500' },
  expiring_soon:  { label: 'Истекува',        color: 'bg-amber-100 text-amber-700',  icon: AlertTriangle,   dot: 'bg-amber-500' },
  expired:        { label: 'Истечен',         color: 'bg-red-100 text-red-700',      icon: XCircle,         dot: 'bg-red-500'   },
  terminated:     { label: 'Раскинат',        color: 'bg-gray-100 text-gray-600',    icon: Ban,             dot: 'bg-gray-400'  },
  renewed:        { label: 'Обновен',         color: 'bg-blue-100 text-blue-700',    icon: RefreshCw,       dot: 'bg-blue-500'  },
  draft:          { label: 'Нацрт',           color: 'bg-gray-100 text-gray-500',    icon: Clock,           dot: 'bg-gray-300'  },
};

const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label.split(' — ')[0]]));

const STATUS_FILTER_OPTIONS = [
  { value: '',               label: 'Сите статуси' },
  { value: 'active',         label: 'Активни' },
  { value: 'expiring_soon',  label: 'Истекуваат' },
  { value: 'expired',        label: 'Истечени' },
  { value: 'terminated',     label: 'Раскинати' },
  { value: 'renewed',        label: 'Обновени' },
  { value: 'draft',          label: 'Нацрти' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('mk-MK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const DaysChip = ({ days, status }) => {
  if (days === null || days === undefined) return <span className="text-xs text-gray-400">Неодреден</span>;
  if (status === 'terminated' || status === 'renewed') return null;
  if (days < 0)  return <span className="text-xs font-medium text-red-600">Истечен пред {Math.abs(days)} ден{Math.abs(days) !== 1 ? 'а' : ''}</span>;
  if (days === 0) return <span className="text-xs font-medium text-red-600">Истекува денес</span>;
  if (days <= 30) return <span className="text-xs font-medium text-amber-600">Уште {days} ден{days !== 1 ? 'а' : ''}</span>;
  return <span className="text-xs text-gray-400">{days} дена</span>;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, count, color, icon: Icon, onClick, active }) => (
  <button
    onClick={onClick}
    className={`flex-1 min-w-0 card p-4 flex flex-col gap-1 transition-shadow hover:shadow-md text-left ${active ? 'ring-2 ring-blue-500' : ''}`}
  >
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
      <Icon size={16} />
    </div>
    <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </button>
);

// ─── Agreement Card ───────────────────────────────────────────────────────────

const AgreementCard = ({ agreement, canAct, onEdit, onRenew, onTerminate, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmTerminate, setConfirmTerminate] = useState(false);
  const [termReason, setTermReason] = useState('');

  const s = STATUS_META[agreement.effectiveStatus] ?? STATUS_META.draft;
  const StatusIcon = s.icon;

  const isTerminatable = !['terminated', 'renewed', 'expired'].includes(agreement.effectiveStatus);

  return (
    <div className="card p-4 space-y-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 p-2 rounded-lg bg-gray-50 flex-shrink-0">
            <FileText size={16} className="text-gray-500" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">{agreement.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{agreement.otherParty}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${s.color}`}>
          <StatusIcon size={11} />
          {s.label}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
          {CATEGORY_LABEL[agreement.category] ?? 'Друго'}
        </span>
        <span>{fmtDate(agreement.startDate)} → {agreement.endDate ? fmtDate(agreement.endDate) : 'Неодреден'}</span>
        {agreement.value && (
          <span className="font-medium text-gray-700">
            {Number(agreement.value).toLocaleString('mk-MK')} {agreement.currency}
          </span>
        )}
      </div>

      {/* Expiry indicator */}
      <div className="flex items-center justify-between">
        <DaysChip days={agreement.daysUntilExpiry} status={agreement.effectiveStatus} />
        {agreement.autoRenew && (
          <span className="text-xs text-blue-600 flex items-center gap-0.5">
            <RefreshCw size={10} /> Авто-обнова
          </span>
        )}
      </div>

      {agreement.description && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{agreement.description}</p>
      )}

      {/* Actions */}
      {canAct && (
        <div className="pt-1 border-t border-gray-100">
          {confirmTerminate ? (
            <div className="space-y-2">
              <input
                className="input text-xs"
                placeholder="Причина за раскинување (опционално)…"
                value={termReason}
                onChange={(e) => setTermReason(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={() => setConfirmTerminate(false)} className="btn-secondary flex-1 text-xs py-1.5">Откажи</button>
                <button
                  onClick={() => { onTerminate(agreement._id, termReason); setConfirmTerminate(false); }}
                  className="flex-1 text-xs py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Потврди раскинување
                </button>
              </div>
            </div>
          ) : confirmDelete ? (
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary flex-1 text-xs py-1.5">Откажи</button>
              <button
                onClick={() => onDelete(agreement._id)}
                className="flex-1 text-xs py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Избриши
              </button>
            </div>
          ) : (
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => onEdit(agreement)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <Edit2 size={11} /> Уреди
              </button>
              {isTerminatable && (
                <button onClick={() => onRenew(agreement)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  <RefreshCw size={11} /> Обнови
                </button>
              )}
              {isTerminatable && (
                <button onClick={() => setConfirmTerminate(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">
                  <Ban size={11} /> Раскини
                </button>
              )}
              <button onClick={() => setConfirmDelete(true)}
                className="ml-auto flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                <Trash2 size={11} /> Избриши
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgreementsPage({ dept }) {
  const { user } = useAuth();
  const { data: agreements = [], isLoading } = useAgreements(dept);
  const terminate = useTerminateAgreement();
  const remove    = useDeleteAgreement();

  const [modal, setModal]           = useState(null); // null | { mode, initial }
  const [searchQ, setSearchQ]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const userCanManage = canManage(user);

  // Stats computed from full list
  const stats = useMemo(() => ({
    total:         agreements.length,
    active:        agreements.filter((a) => a.effectiveStatus === 'active').length,
    expiring_soon: agreements.filter((a) => a.effectiveStatus === 'expiring_soon').length,
    expired:       agreements.filter((a) => a.effectiveStatus === 'expired').length,
  }), [agreements]);

  // Filtered list
  const filtered = useMemo(() => {
    let list = agreements;
    if (filterStatus)   list = list.filter((a) => a.effectiveStatus === filterStatus);
    if (filterCategory) list = list.filter((a) => a.category === filterCategory);
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter((a) =>
        a.title.toLowerCase().includes(q) ||
        a.otherParty.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [agreements, filterStatus, filterCategory, searchQ]);

  if (isLoading) return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Договори</h2>
          <p className="text-sm text-gray-500 mt-0.5">{agreements.length} договор{agreements.length !== 1 ? 'и' : ''}</p>
        </div>
        {userCanManage && (
          <button onClick={() => setModal({ mode: 'create', initial: null })} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Нов договор
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        <StatCard label="Вкупно" count={stats.total} color="bg-gray-100 text-gray-600"
          icon={FileText}
          onClick={() => setFilterStatus('')}
          active={filterStatus === ''} />
        <StatCard label="Активни" count={stats.active} color="bg-green-100 text-green-600"
          icon={CheckCircle}
          onClick={() => setFilterStatus(filterStatus === 'active' ? '' : 'active')}
          active={filterStatus === 'active'} />
        <StatCard label="Истекуваат" count={stats.expiring_soon} color="bg-amber-100 text-amber-600"
          icon={AlertTriangle}
          onClick={() => setFilterStatus(filterStatus === 'expiring_soon' ? '' : 'expiring_soon')}
          active={filterStatus === 'expiring_soon'} />
        <StatCard label="Истечени" count={stats.expired} color="bg-red-100 text-red-600"
          icon={XCircle}
          onClick={() => setFilterStatus(filterStatus === 'expired' ? '' : 'expired')}
          active={filterStatus === 'expired'} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-8 text-sm"
            placeholder="Пребарај по наслов или страна…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>
        <select className="input sm:w-44 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          {STATUS_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="input sm:w-48 text-sm" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">Сите категории</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{CATEGORY_LABEL[c.value]}</option>)}
        </select>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <FileText size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm mb-4">
            {agreements.length === 0
              ? 'Нема евидентирани договори.'
              : 'Нема договори кои одговараат на филтерот.'}
          </p>
          {userCanManage && agreements.length === 0 && (
            <button onClick={() => setModal({ mode: 'create', initial: null })} className="btn-primary">
              Додај го првиот договор
            </button>
          )}
        </div>
      )}

      {/* Agreement list */}
      <div className="space-y-3">
        {filtered.map((a) => (
          <AgreementCard
            key={a._id}
            agreement={a}
            canAct={userCanManage}
            onEdit={(ag)      => setModal({ mode: 'edit',      initial: ag })}
            onRenew={(ag)     => setModal({ mode: 'renew',     initial: ag })}
            onTerminate={(id, reason) => terminate.mutate({ id, reason })}
            onDelete={(id)    => remove.mutate(id)}
          />
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <AddAgreementModal
          mode={modal.mode}
          initial={modal.initial}
          dept={dept}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
