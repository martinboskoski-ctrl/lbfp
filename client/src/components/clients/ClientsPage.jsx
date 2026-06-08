import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, Plus, Search, Trash2, Edit2, Eye,
  TrendingUp, CheckCircle2, Package, Building2, UserPlus,
  Mail, Phone,
} from 'lucide-react';
import { useClients, useDeleteClient } from '../../hooks/useClients.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { canManage } from '../../utils/userTier.js';
import AddClientModal from './AddClientModal.jsx';
import ClientDetailModal from './ClientDetailModal.jsx';

const CLIENT_STATUS_VALUES = ['active', 'prospect', 'inactive'];

const STATUS_COLOR = {
  active:   'bg-green-100 text-green-700',
  prospect: 'bg-blue-100 text-blue-700',
  inactive: 'bg-gray-100 text-gray-600',
};

const eurShort = (v) => {
  if (!v) return '0';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return Number(v).toLocaleString('mk-MK');
};

// ─── Order aggregates per client ───────────────────────────────────────────────
const liveOrders = (c) => (c.orders || []).filter((o) => o.status !== 'cancelled');
const clientForecast  = (c) => liveOrders(c).reduce((s, o) => s + (o.forecastEUR || 0), 0);
const clientItems     = (c) => liveOrders(c).reduce((s, o) => s + (o.itemCount || 0), 0);
const clientDelivered = (c) => (c.orders || [])
  .filter((o) => o.status === 'delivered')
  .reduce((s, o) => s + (o.forecastEUR || 0), 0);

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon: Icon, onClick, active }) => (
  <button
    onClick={onClick}
    className={`flex-1 min-w-0 card p-4 flex flex-col gap-1 transition-shadow hover:shadow-md text-left ${active ? 'ring-2 ring-blue-500' : ''}`}
  >
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
      <Icon size={16} />
    </div>
    <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </button>
);

// ─── Client Card ──────────────────────────────────────────────────────────────
const ClientCard = ({ client, canAct, onDetail, onEdit, onDelete, t, tc }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const forecast = clientForecast(client);
  const items    = clientItems(client);

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 p-2 rounded-lg bg-gray-50 flex-shrink-0">
            <Building2 size={16} className="text-gray-500" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">{client.companyName}</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{client.contactName || t('noContact')}</p>
          </div>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLOR[client.status]}`}>
          {t(`status.${client.status}`)}
        </span>
      </div>

      {/* Aggregates */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs">
        <span className="inline-flex items-center gap-1 text-gray-700 font-medium">
          <TrendingUp size={12} className="text-blue-500" /> {Number(forecast).toLocaleString('mk-MK')} EUR
        </span>
        <span className="inline-flex items-center gap-1 text-gray-500">
          <Package size={12} className="text-gray-400" /> {items}
        </span>
        <span className="text-gray-400">{client.openOrderCount ?? liveOrders(client).length} {t('orders.title').toLowerCase()}</span>
        {client.assignedTo && (
          <span className="inline-flex items-center gap-1 text-gray-500">
            <UserPlus size={11} /> {client.assignedTo.name}
          </span>
        )}
      </div>

      {/* Contact chips */}
      {(client.email || client.phone) && (
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
          {client.email && <span className="inline-flex items-center gap-1"><Mail size={11} /> {client.email}</span>}
          {client.phone && <span className="inline-flex items-center gap-1"><Phone size={11} /> {client.phone}</span>}
        </div>
      )}

      {/* Actions */}
      <div className="pt-1 border-t border-gray-100">
        {confirmDelete ? (
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelete(false)} className="btn-secondary flex-1 text-xs py-1.5">{tc('cancel')}</button>
            <button
              onClick={() => onDelete(client._id)}
              className="flex-1 text-xs py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              {tc('delete')}
            </button>
          </div>
        ) : (
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => onDetail(client)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <Eye size={11} /> {t('details')}
            </button>
            {canAct && (
              <button onClick={() => onEdit(client)}
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
export default function ClientsPage() {
  const { t } = useTranslation('clients');
  const { t: tc } = useTranslation('common');
  const { user } = useAuth();
  const { data: clients = [], isLoading } = useClients();
  const remove = useDeleteClient();

  const [modal, setModal]             = useState(null); // { mode, initial }
  const [detail, setDetail]           = useState(null);
  const [searchQ, setSearchQ]         = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [statFilter, setStatFilter]   = useState(''); // '' | 'active'

  const userCanManage = canManage(user);
  const canEditClient = (c) =>
    userCanManage || c.assignedTo?._id === user._id || c.assignedTo === user._id;

  const stats = useMemo(() => ({
    total:     clients.length,
    active:    clients.filter((c) => c.status === 'active').length,
    forecast:  clients.reduce((s, c) => s + clientForecast(c), 0),
    delivered: clients.reduce((s, c) => s + clientDelivered(c), 0),
    items:     clients.reduce((s, c) => s + clientItems(c), 0),
  }), [clients]);

  const filtered = useMemo(() => {
    let list = clients;
    if (statFilter === 'active') list = list.filter((c) => c.status === 'active');
    if (filterStatus) list = list.filter((c) => c.status === filterStatus);
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter((c) =>
        c.companyName.toLowerCase().includes(q) ||
        c.contactName?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [clients, statFilter, filterStatus, searchQ]);

  const STATUS_FILTER_OPTIONS = useMemo(() => [
    { value: '', label: t('allStatuses') },
    ...CLIENT_STATUS_VALUES.map((s) => ({ value: s, label: t(`status.${s}`) })),
  ], [t]);

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
          <p className="text-sm text-gray-500 mt-0.5">{t('clientCount', { count: clients.length })}</p>
        </div>
        <button onClick={() => setModal({ mode: 'create', initial: null })} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> {t('newClient')}
        </button>
      </div>

      {/* Overview — the whole sales picture */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        <StatCard label={t('stat.total')} value={stats.total} color="bg-gray-100 text-gray-600" icon={Users}
          onClick={() => setStatFilter('')} active={statFilter === ''} />
        <StatCard label={t('stat.active')} value={stats.active} color="bg-green-100 text-green-600" icon={CheckCircle2}
          onClick={() => setStatFilter(statFilter === 'active' ? '' : 'active')} active={statFilter === 'active'} />
        <StatCard label={t('stat.forecast')} value={eurShort(stats.forecast)} color="bg-blue-100 text-blue-600" icon={TrendingUp}
          onClick={() => {}} />
        <StatCard label={t('stat.delivered')} value={eurShort(stats.delivered)} color="bg-emerald-100 text-emerald-600" icon={CheckCircle2}
          onClick={() => {}} />
        <StatCard label={t('stat.items')} value={stats.items} color="bg-amber-100 text-amber-600" icon={Package}
          onClick={() => {}} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8 text-sm" placeholder={t('searchPlaceholder')}
            value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
        </div>
        <select className="input sm:w-44 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          {STATUS_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Users size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm mb-4">
            {clients.length === 0 ? t('noClients') : t('noFilterMatch')}
          </p>
          {clients.length === 0 && (
            <button onClick={() => setModal({ mode: 'create', initial: null })} className="btn-primary">
              {t('addFirstClient')}
            </button>
          )}
        </div>
      )}

      {/* Client list */}
      <div className="space-y-3">
        {filtered.map((c) => (
          <ClientCard
            key={c._id}
            client={c}
            canAct={canEditClient(c)}
            onDetail={(client) => setDetail(client)}
            onEdit={(client) => setModal({ mode: 'edit', initial: client })}
            onDelete={(id) => remove.mutate(id)}
            t={t}
            tc={tc}
          />
        ))}
      </div>

      {/* Modals */}
      {modal && (
        <AddClientModal mode={modal.mode} initial={modal.initial} onClose={() => setModal(null)} />
      )}
      {detail && (
        <ClientDetailModal client={detail} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}
