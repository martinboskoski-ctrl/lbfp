import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Play, Square, Trash2, BarChart3, ClipboardList } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import {
  useLhcCampaign,
  useOpenLhcCampaign,
  useCloseLhcCampaign,
  useDeleteLhcCampaign,
  useReopenLhcCampaign,
  useArchiveLhcCampaign,
} from '../hooks/useLhc.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isTopManagement } from '../utils/userTier.js';
import { fmtDate } from '../utils/formatDate.js';
import { useState } from 'react';

const StatusPill = ({ status, t }) => {
  const map = {
    draft:    'bg-slate-100 text-slate-700',
    open:     'bg-emerald-50 text-emerald-800 border border-emerald-200',
    closed:   'bg-slate-100 text-slate-700',
    archived: 'bg-slate-50 text-slate-500',
  };
  return <span className={`text-xs px-2 py-0.5 rounded ${map[status] || map.draft}`}>{t(`status.${status}`, { defaultValue: status })}</span>;
};

const LhcCampaignDetail = () => {
  const { t } = useTranslation('lhc');
  const { t: tc } = useTranslation('common');
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = isTopManagement(user);
  const { data, isLoading } = useLhcCampaign(id);
  const open = useOpenLhcCampaign();
  const close = useCloseLhcCampaign();
  const remove = useDeleteLhcCampaign();
  const reopen = useReopenLhcCampaign();
  const archive = useArchiveLhcCampaign();
  const [confirmDel, setConfirmDel] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-slate-700" />
        </div>
      </div>
    );
  }
  if (!data?.campaign) return null;
  const c = data.campaign;
  const stats = data.stats || {};

  const localizedCategories = (c.categories || [])
    .map((k) => t(`categoryNames.${k}`, { defaultValue: k }))
    .join(', ');

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={t('campaign.title')} />
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <Link to="/lhc" className="text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 mb-3">
              <ArrowLeft size={14} /> {tc('back')}
            </Link>

            <div className="card p-4 sm:p-5 mb-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg sm:text-xl font-semibold text-slate-900">{c.title}</h1>
                    <StatusPill status={c.status} t={t} />
                  </div>
                  {c.description && <p className="text-sm text-slate-600 mt-1">{c.description}</p>}
                  <div className="text-sm text-slate-500 mt-2">
                    {c.createdBy?.name} · {fmtDate(c.createdAt)}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex flex-wrap gap-2">
                    {c.status === 'draft' && (
                      <button onClick={() => open.mutate(c._id)} className="btn-primary inline-flex items-center gap-1.5 text-sm">
                        <Play size={13} /> {t('campaign.open')}
                      </button>
                    )}
                    {c.status === 'open' && (
                      <button onClick={() => close.mutate(c._id)} className="btn-secondary inline-flex items-center gap-1.5 text-sm">
                        <Square size={13} /> {t('campaign.closeNow')}
                      </button>
                    )}
                    {c.status === 'closed' && (
                      <>
                        <Link to={`/lhc/campaigns/${c._id}/results`} className="btn-primary inline-flex items-center gap-1.5 text-sm">
                          <BarChart3 size={13} /> {t('campaign.results')}
                        </Link>
                        <button onClick={() => reopen.mutate(c._id)} className="btn-secondary inline-flex items-center gap-1.5 text-sm">
                          <Play size={13} /> {t('campaign.reopen')}
                        </button>
                        <button onClick={() => archive.mutate(c._id)} className="btn-secondary inline-flex items-center gap-1.5 text-sm">
                          {t('campaign.archive')}
                        </button>
                      </>
                    )}
                    {(c.status === 'draft' || c.status === 'archived') && (
                      <button onClick={() => setConfirmDel(true)} className="btn-secondary inline-flex items-center gap-1.5 text-sm text-red-700">
                        <Trash2 size={13} /> {tc('delete')}
                      </button>
                    )}
                  </div>
                )}
              </div>
              {confirmDel && (
                <div className="mt-3 p-3 rounded bg-red-50 border border-red-200 flex items-center gap-2 justify-end">
                  <span className="text-sm text-red-800 mr-auto">{t('campaign.deleteConfirm')}</span>
                  <button onClick={() => setConfirmDel(false)} className="btn-secondary text-sm">{tc('cancel')}</button>
                  <button onClick={() => remove.mutate(c._id, { onSuccess: () => navigate('/lhc') })} className="btn-danger text-sm">{tc('delete')}</button>
                </div>
              )}
            </div>

            {/* Properties */}
            <div className="card p-4 sm:p-5 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Field label={t('campaign.props.categories')}>{localizedCategories}</Field>
              <Field label={t('campaign.props.audience')}>
                {t(`audience.${c.audienceMode}`, { defaultValue: c.audienceMode })}
                {c.audienceDepartments?.length ? ` · ${c.audienceDepartments.map((d) => tc(`dept.${d}`, { defaultValue: d })).join(', ')}` : ''}
              </Field>
              <Field label={t('campaign.props.questionsPerCategory')}>
                {c.pickStrategy === 'all' ? t('campaign.props.all') : c.questionsPerCategory}
              </Field>
              <Field label={t('campaign.props.strategy')}>{t(`pickStrategy.${c.pickStrategy}`, { defaultValue: c.pickStrategy })}</Field>
              <Field label={t('campaign.fields.openedOn')}>{fmtDate(c.openAt)}</Field>
              <Field label={t('campaign.fields.closedOn')}>{fmtDate(c.closeAt)}</Field>
            </div>

            {/* Participation */}
            <div className="card p-4 sm:p-5 mb-4">
              <h3 className="section-title mb-3 inline-flex items-center gap-2">
                <ClipboardList size={14} /> {t('campaign.participation.title')}
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <Stat label={t('campaign.participation.invited')} value={stats.invited ?? 0} />
                <Stat label={t('campaign.participation.started')} value={stats.started ?? 0} />
                <Stat label={t('campaign.participation.completed')} value={stats.completed ?? 0} />
              </div>
            </div>

            {/* Quick link to take it (any user with assignment) */}
            {c.status === 'open' && (
              <Link to={`/lhc/campaigns/${c._id}/answer`} className="btn-primary w-full inline-flex items-center justify-center gap-2">
                {t('campaign.fillSurvey')}
              </Link>
            )}
            {c.status === 'closed' && (
              <Link to={`/lhc/campaigns/${c._id}/my-result`} className="btn-secondary w-full inline-flex items-center justify-center gap-2">
                {t('campaign.myResultBtn')}
              </Link>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
    <div className="text-slate-900">{children || '—'}</div>
  </div>
);

const Stat = ({ label, value }) => (
  <div className="border border-slate-200 rounded-md py-3">
    <div className="text-2xl font-semibold text-slate-900">{value}</div>
    <div className="text-xs text-slate-500 mt-0.5">{label}</div>
  </div>
);

export default LhcCampaignDetail;
