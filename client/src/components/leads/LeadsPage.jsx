import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, Plus, Search, Trash2, Edit2, Eye,
  AlertTriangle, TrendingUp, Clock, UserPlus,
  Phone, Mail, Calendar, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useLeads, useDeleteLead } from '../../hooks/useLeads.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { canManage } from '../../utils/userTier.js';
import { fmtDate } from '../../utils/formatDate.js';
import AddLeadModal, { STAGE_VALUES, SOURCE_VALUES, PRIORITY_VALUES, useStages, useSources, usePriorities } from './AddLeadModal.jsx';
import LeadDetailModal from './LeadDetailModal.jsx';

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGE_COLOR = {
  new:         'bg-blue-100 text-blue-700',
  contacted:   'bg-sky-100 text-sky-700',
  qualified:   'bg-indigo-100 text-indigo-700',
  proposal:    'bg-violet-100 text-violet-700',
  negotiation: 'bg-amber-100 text-amber-700',
  won:         'bg-green-100 text-green-700',
  lost:        'bg-red-100 text-red-700',
};

const PRIORITY_COLOR = {
  low:    'bg-gray-100 text-gray-600',
  medium: 'bg-amber-100 text-amber-700',
  high:   'bg-red-100 text-red-700',
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

// ─── Funnel stages (pipeline order, excluding won/lost which show as outcomes) ─

const FUNNEL_STAGE_VALUES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation'];
const FUNNEL_STAGE_COLORS = {
  new:         { color: 'bg-blue-500',   light: 'bg-blue-50 text-blue-700' },
  contacted:   { color: 'bg-sky-500',    light: 'bg-sky-50 text-sky-700' },
  qualified:   { color: 'bg-indigo-500', light: 'bg-indigo-50 text-indigo-700' },
  proposal:    { color: 'bg-violet-500', light: 'bg-violet-50 text-violet-700' },
  negotiation: { color: 'bg-amber-500',  light: 'bg-amber-50 text-amber-700' },
};

const OUTCOME_STAGE_VALUES = ['won', 'lost'];
const OUTCOME_STAGE_COLORS = {
  won:  { color: 'bg-green-500', light: 'bg-green-50 text-green-700' },
  lost: { color: 'bg-red-400',   light: 'bg-red-50 text-red-700' },
};

// ─── Sales Funnel Chart ──────────────────────────────────────────────────────

const SalesFunnel = ({ leads, onStageClick, activeStage }) => {
  const { t } = useTranslation('leads');

  const funnelStages = useMemo(() =>
    FUNNEL_STAGE_VALUES.map((v) => ({
      value: v,
      label: t(`stage.${v}`),
      ...FUNNEL_STAGE_COLORS[v],
    })), [t]);

  const outcomeStages = useMemo(() =>
    OUTCOME_STAGE_VALUES.map((v) => ({
      value: v,
      label: t(`stage.${v}`),
      ...OUTCOME_STAGE_COLORS[v],
    })), [t]);

  const funnelData = useMemo(() => {
    const max = Math.max(...funnelStages.map((s) => leads.filter((l) => l.stage === s.value).length), 1);
    return funnelStages.map((s) => {
      const items = leads.filter((l) => l.stage === s.value);
      const count = items.length;
      const totalVal = items.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
      const pct = Math.max((count / max) * 100, 8); // min 8% so empty stages still show
      return { ...s, count, totalVal, pct };
    });
  }, [leads, funnelStages]);

  const outcomes = useMemo(() =>
    outcomeStages.map((s) => {
      const items = leads.filter((l) => l.stage === s.value);
      return { ...s, count: items.length, totalVal: items.reduce((sum, l) => sum + (l.estimatedValue || 0), 0) };
    }), [leads, outcomeStages]);

  const totalValue = leads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

  const fmtValue = (v) => {
    if (!v) return '';
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return v.toLocaleString('mk-MK');
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{t('funnel.title')}</h3>
        {totalValue > 0 && (
          <span className="text-xs text-gray-500">
            {t('funnel.totalValue')} <span className="font-semibold text-gray-700">{totalValue.toLocaleString('mk-MK')} EUR</span>
          </span>
        )}
      </div>

      {/* Funnel bars */}
      <div className="space-y-1.5">
        {funnelData.map((s) => (
          <button
            key={s.value}
            onClick={() => onStageClick(s.value)}
            className={`w-full group transition-all ${activeStage === s.value ? 'scale-[1.01]' : ''}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-24 text-right flex-shrink-0 truncate">{s.label}</span>
              <div className="flex-1 flex items-center">
                <div
                  className={`h-8 rounded-md transition-all relative flex items-center justify-center ${s.color} ${
                    activeStage === s.value ? 'ring-2 ring-offset-1 ring-blue-400' : 'group-hover:opacity-90'
                  }`}
                  style={{ width: `${s.pct}%`, minWidth: '2.5rem' }}
                >
                  <span className="text-xs font-bold text-white drop-shadow-sm">{s.count}</span>
                </div>
                {s.totalVal > 0 && (
                  <span className="ml-2 text-xs text-gray-400 flex-shrink-0">
                    {fmtValue(s.totalVal)} EUR
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Outcomes row */}
      <div className="flex gap-3 pt-2 border-t border-gray-100">
        {outcomes.map((s) => (
          <button
            key={s.value}
            onClick={() => onStageClick(s.value)}
            className={`flex-1 rounded-lg p-3 text-center transition-all ${s.light} ${
              activeStage === s.value ? 'ring-2 ring-blue-400' : 'hover:opacity-80'
            }`}
          >
            <p className="text-lg font-bold">{s.count}</p>
            <p className="text-xs font-medium">{s.label}</p>
            {s.totalVal > 0 && <p className="text-xs opacity-70 mt-0.5">{fmtValue(s.totalVal)} EUR</p>}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Lead Card ────────────────────────────────────────────────────────────────

const LeadCard = ({ lead, canAct, onDetail, onEdit, onDelete, t, tc, stageLabel, priorityLabel, sourceLabel }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="card p-4 space-y-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 p-2 rounded-lg bg-gray-50 flex-shrink-0">
            <Users size={16} className="text-gray-500" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">{lead.companyName}</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{lead.contactName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLOR[lead.stage]}`}>
            {stageLabel[lead.stage]}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLOR[lead.priority]}`}>
            {priorityLabel[lead.priority]}
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
          {sourceLabel[lead.source]}
        </span>
        {lead.estimatedValue && (
          <span className="font-medium text-gray-700">
            {Number(lead.estimatedValue).toLocaleString('mk-MK')} {lead.currency}
          </span>
        )}
        {lead.assignedTo && (
          <span className="inline-flex items-center gap-1">
            <UserPlus size={11} /> {lead.assignedTo.name}
          </span>
        )}
      </div>

      {/* Contact info chips */}
      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
        {lead.email && (
          <span className="inline-flex items-center gap-1">
            <Mail size={11} /> {lead.email}
          </span>
        )}
        {lead.phone && (
          <span className="inline-flex items-center gap-1">
            <Phone size={11} /> {lead.phone}
          </span>
        )}
      </div>

      {/* Follow-up indicator */}
      {lead.nextFollowUp && (
        <div className={`flex items-center gap-1 text-xs ${lead.isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
          <Calendar size={11} className={lead.isOverdue ? 'text-red-500' : 'text-gray-400'} />
          {t('nextFollowUp', { date: fmtDate(lead.nextFollowUp) })}
          {lead.isOverdue && ` ${t('overdueTag')}`}
        </div>
      )}

      {/* Actions */}
      <div className="pt-1 border-t border-gray-100">
        {confirmDelete ? (
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelete(false)} className="btn-secondary flex-1 text-xs py-1.5">{tc('cancel')}</button>
            <button
              onClick={() => onDelete(lead._id)}
              className="flex-1 text-xs py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              {tc('delete')}
            </button>
          </div>
        ) : (
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => onDetail(lead)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <Eye size={11} /> {t('details')}
            </button>
            {canAct && (
              <button onClick={() => onEdit(lead)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <Edit2 size={11} /> {tc('edit')}
              </button>
            )}
            {canAct && (
              <button onClick={() => setConfirmDelete(true)}
                className="ml-auto flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                <Trash2 size={11} /> {tc('delete')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const { t } = useTranslation('leads');
  const { t: tc } = useTranslation('common');
  const { user } = useAuth();
  const { data: leads = [], isLoading } = useLeads();
  const remove = useDeleteLead();

  const stages = useStages();
  const sources = useSources();
  const priorities = usePriorities();

  const STAGE_LABEL = useMemo(() => Object.fromEntries(stages.map((s) => [s.value, s.label])), [stages]);
  const PRIORITY_LABEL = useMemo(() => Object.fromEntries(priorities.map((p) => [p.value, p.label])), [priorities]);
  const SOURCE_LABEL = useMemo(() => Object.fromEntries(sources.map((s) => [s.value, s.label])), [sources]);

  const STAGE_FILTER_OPTIONS = useMemo(() => [
    { value: '', label: t('allStages') },
    ...stages,
  ], [stages, t]);

  const PRIORITY_FILTER_OPTIONS = useMemo(() => [
    { value: '', label: t('allPriorities') },
    ...priorities,
  ], [priorities, t]);

  const [modal, setModal]               = useState(null); // null | { mode, initial }
  const [detailLead, setDetailLead]     = useState(null);
  const [searchQ, setSearchQ]           = useState('');
  const [filterStage, setFilterStage]   = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [statFilter, setStatFilter]     = useState(''); // stat card quick filter
  const [showFunnel, setShowFunnel]     = useState(true);

  const userCanManage = canManage(user);
  // Employees can edit their own leads
  const canEditLead = (lead) =>
    userCanManage || lead.assignedTo?._id === user._id || lead.assignedTo === user._id;

  // Stats
  const stats = useMemo(() => ({
    total:       leads.length,
    new:         leads.filter((l) => l.stage === 'new').length,
    negotiation: leads.filter((l) => ['negotiation', 'proposal'].includes(l.stage)).length,
    overdue:     leads.filter((l) => l.isOverdue).length,
  }), [leads]);

  // Filtered list
  const filtered = useMemo(() => {
    let list = leads;
    // Stat card filter
    if (statFilter === 'new')         list = list.filter((l) => l.stage === 'new');
    if (statFilter === 'negotiation') list = list.filter((l) => ['negotiation', 'proposal'].includes(l.stage));
    if (statFilter === 'overdue')     list = list.filter((l) => l.isOverdue);
    // Dropdown filters
    if (filterStage)    list = list.filter((l) => l.stage === filterStage);
    if (filterPriority) list = list.filter((l) => l.priority === filterPriority);
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter((l) =>
        l.companyName.toLowerCase().includes(q) ||
        l.contactName.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [leads, statFilter, filterStage, filterPriority, searchQ]);

  const toggleStat = (key) => setStatFilter(statFilter === key ? '' : key);

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
          <h2 className="text-xl font-bold text-gray-900">{t('title')}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{t('leadCount', { count: leads.length })}</p>
        </div>
        <button onClick={() => setModal({ mode: 'create', initial: null })} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> {t('newLead')}
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        <StatCard label={t('stat.total')} count={stats.total} color="bg-gray-100 text-gray-600"
          icon={Users}
          onClick={() => setStatFilter('')}
          active={statFilter === ''} />
        <StatCard label={t('stat.new')} count={stats.new} color="bg-blue-100 text-blue-600"
          icon={UserPlus}
          onClick={() => toggleStat('new')}
          active={statFilter === 'new'} />
        <StatCard label={t('stat.inNegotiation')} count={stats.negotiation} color="bg-amber-100 text-amber-600"
          icon={TrendingUp}
          onClick={() => toggleStat('negotiation')}
          active={statFilter === 'negotiation'} />
        <StatCard label={t('stat.overdue')} count={stats.overdue} color="bg-red-100 text-red-600"
          icon={AlertTriangle}
          onClick={() => toggleStat('overdue')}
          active={statFilter === 'overdue'} />
      </div>

      {/* Funnel toggle + chart */}
      <div>
        <button
          onClick={() => setShowFunnel(!showFunnel)}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 mb-2 transition-colors"
        >
          {showFunnel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showFunnel ? t('funnel.hideFunnel') : t('funnel.showFunnel')}
        </button>
        {showFunnel && (
          <SalesFunnel
            leads={leads}
            activeStage={filterStage}
            onStageClick={(stage) => setFilterStage(filterStage === stage ? '' : stage)}
          />
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-8 text-sm"
            placeholder={t('searchPlaceholder')}
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>
        <select className="input sm:w-44 text-sm" value={filterStage} onChange={(e) => setFilterStage(e.target.value)}>
          {STAGE_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="input sm:w-44 text-sm" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          {PRIORITY_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Users size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm mb-4">
            {leads.length === 0 ? t('noLeads') : t('noFilterMatch')}
          </p>
          {leads.length === 0 && (
            <button onClick={() => setModal({ mode: 'create', initial: null })} className="btn-primary">
              {t('addFirstLead')}
            </button>
          )}
        </div>
      )}

      {/* Lead list */}
      <div className="space-y-3">
        {filtered.map((l) => (
          <LeadCard
            key={l._id}
            lead={l}
            canAct={canEditLead(l)}
            onDetail={(lead) => setDetailLead(lead)}
            onEdit={(lead) => setModal({ mode: 'edit', initial: lead })}
            onDelete={(id) => remove.mutate(id)}
            t={t}
            tc={tc}
            stageLabel={STAGE_LABEL}
            priorityLabel={PRIORITY_LABEL}
            sourceLabel={SOURCE_LABEL}
          />
        ))}
      </div>

      {/* Modals */}
      {modal && (
        <AddLeadModal
          mode={modal.mode}
          initial={modal.initial}
          onClose={() => setModal(null)}
        />
      )}
      {detailLead && (
        <LeadDetailModal
          lead={detailLead}
          onClose={() => setDetailLead(null)}
        />
      )}
    </div>
  );
}
