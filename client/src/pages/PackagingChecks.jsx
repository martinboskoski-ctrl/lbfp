import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search, ListChecks, Bot, Clock, ChevronRight } from 'lucide-react';
import PageShell from '../components/layout/PageShell.jsx';
import { CheckStatusBadge, SectorPending } from '../components/packaging/badges.jsx';
import { usePackagingChecks } from '../hooks/usePackaging.js';
import { useAuth } from '../context/AuthContext.jsx';
import { canUsePackagingTool, isPackagingLead, PACKAGING_SECTORS } from '../utils/userTier.js';
import { fmtDate } from '../utils/formatDate.js';

const STATUSES = ['in_review', 'changes_required', 'approved'];

const PackagingChecks = () => {
  const { t } = useTranslation('packaging');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = usePackagingChecks();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const mySector = PACKAGING_SECTORS.includes(user?.department) ? user.department : null;
  const [onlyMine, setOnlyMine] = useState(false);

  if (!canUsePackagingTool(user)) return <Navigate to="/dashboard" replace />;

  const checks = data?.checks || [];
  const q = search.trim().toLowerCase();
  const visible = checks.filter((c) =>
    (!status || c.status === status) &&
    (!onlyMine || (c.status === 'in_review' && c.pendingBySector?.[mySector])) &&
    (!q || `${c.code} ${c.client} ${c.product}`.toLowerCase().includes(q)));

  const waitingForMe = mySector
    ? checks.filter((c) => c.status === 'in_review' && c.pendingBySector?.[mySector]).length
    : 0;

  return (
    <PageShell title={t('title')}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{t('title')}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/tools/packaging/rules" className="btn-secondary flex items-center gap-1.5 text-sm">
              <ListChecks size={15} /> {t('rules')}
            </Link>
            {isPackagingLead(user) && (
              <Link to="/tools/packaging/new" className="btn-primary flex items-center gap-1.5">
                <Plus size={15} /> {t('newCheck')}
              </Link>
            )}
          </div>
        </div>

        {data && !data.aiConfigured && (
          <div className="flex items-center gap-2 mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <Bot size={14} className="text-slate-400 shrink-0" /> {t('aiNotConnected')}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search')} className="input pl-8 py-1.5 w-72" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input py-1.5 w-48">
            <option value="">{t('status.all')}</option>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
          </select>
          {mySector && (
            <button
              onClick={() => setOnlyMine((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                onlyMine ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-300 hover:border-amber-400'
              }`}
            >
              <Clock size={14} /> {t('awaitingMySector')}
              {waitingForMe > 0 && (
                <span className={`text-[11px] font-bold px-1.5 rounded-full ${onlyMine ? 'bg-white/25' : 'bg-amber-100 text-amber-800'}`}>
                  {waitingForMe}
                </span>
              )}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : !visible.length ? (
          <div className="text-center py-16 text-sm text-slate-400">
            {checks.length ? t('emptyFilter') : t('empty')}
          </div>
        ) : (
          <div className="card divide-y divide-slate-100 overflow-hidden">
            {visible.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => navigate(`/tools/packaging/${c._id}`)}
                className="w-full text-left px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 hover:bg-slate-50 transition-colors group"
              >
                <div className="min-w-0 flex-1 basis-64">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">{c.code}</span>
                    <CheckStatusBadge status={c.status} />
                    <span className="text-[11px] text-slate-400">{t('round', { n: c.round })}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mt-1 truncate">
                    {c.client} <span className="font-normal text-slate-500">· {c.product}</span>
                  </p>
                  {c.markets && <p className="text-xs text-slate-400 truncate">{c.markets}</p>}
                </div>
                <div className="basis-56">
                  {c.status === 'in_review' ? (
                    <SectorPending pendingBySector={c.pendingBySector || {}} total={c.remarksTotal} highlight={mySector} />
                  ) : (
                    <span className="text-xs text-slate-400">{t('remarksCount', { count: c.remarksTotal })}</span>
                  )}
                </div>
                <div className="text-xs text-slate-400 w-24 text-right">{fmtDate(c.updatedAt)}</div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
              </button>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default PackagingChecks;
