import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Bot, Loader2, Lock, Trash2, RefreshCw, FilePlus2, CheckSquare, AlertTriangle, MessageSquare, ImageOff, Reply } from 'lucide-react';
import PageShell from '../components/layout/PageShell.jsx';
import ArtworkPreview from '../components/packaging/ArtworkPreview.jsx';
import AttachmentsGallery from '../components/packaging/AttachmentsGallery.jsx';
import RemarkCard from '../components/packaging/RemarkCard.jsx';
import AddRemarkForm from '../components/packaging/AddRemarkForm.jsx';
import { CloseRoundModal, NewRoundModal } from '../components/packaging/RoundModals.jsx';
import ClientEmail from '../components/packaging/ClientEmail.jsx';
import { CheckStatusBadge } from '../components/packaging/badges.jsx';
import {
  usePackagingCheck, usePackagingRules, useRerunPackagingAi, useDeletePackagingCheck,
} from '../hooks/usePackaging.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  canUsePackagingTool, isPackagingLead, isTopManagement, PACKAGING_SECTORS,
} from '../utils/userTier.js';
import { fmtDate, fmtDateTime } from '../utils/formatDate.js';

const SectorProgress = ({ remarks, mySector }) => {
  const { t: tc } = useTranslation('common');
  const sectors = PACKAGING_SECTORS.filter((s) => remarks.some((r) => r.sector === s));
  return (
    <div className="grid grid-cols-2 gap-2">
      {sectors.map((s) => {
        const all = remarks.filter((r) => r.sector === s);
        const done = all.filter((r) => r.status !== 'pending').length;
        const complete = done === all.length;
        return (
          <div key={s} className={`rounded-lg border px-2.5 py-2 ${s === mySector ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 truncate">{tc(`dept.${s}`)}</span>
              <span className={complete ? 'text-green-700 font-semibold' : 'text-slate-500'}>{done}/{all.length}</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full ${complete ? 'bg-green-500' : 'bg-amber-400'}`} style={{ width: `${(done / all.length) * 100}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PackagingCheckDetail = () => {
  const { t } = useTranslation('packaging');
  const { t: tc } = useTranslation('common');
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading } = usePackagingCheck(id);
  const { data: rules = [] } = usePackagingRules();
  const rerunAi = useRerunPackagingAi();
  const deleteCheck = useDeletePackagingCheck();
  const [roundNo, setRoundNo] = useState(null);
  const [modal, setModal] = useState(null); // 'close' | 'round'

  if (!canUsePackagingTool(user)) return <Navigate to="/dashboard" replace />;

  const check = data?.check;
  if (isLoading || !check) {
    return (
      <PageShell title={t('title')}>
        <div className="flex justify-center py-20">
          {isLoading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /> : <p className="text-sm text-slate-400">{tc('noResults')}</p>}
        </div>
      </PageShell>
    );
  }

  const latest = check.rounds[check.rounds.length - 1];
  const round = check.rounds.find((r) => r.number === roundNo) || latest;
  const isLatest = round.number === latest.number;
  // Files / ingredients the AI used when this round had none: the latest earlier ones.
  const earlier = check.rounds.filter((r) => r.number <= round.number).reverse();
  const artworkSource = earlier.find((r) => r.attachments?.length);
  const ingredientsSource = earlier.find((r) => r.ingredientsText || r.ingredientsFile);
  const heading = [check.client, check.product].filter(Boolean);
  const open = isLatest && check.status === 'in_review';
  const lead = isPackagingLead(user);
  const topMgmt = isTopManagement(user);
  const mySector = PACKAGING_SECTORS.includes(user.department) ? user.department : null;
  const canDelete = topMgmt || String(check.createdBy?._id) === String(user._id);
  const canRunAi = data.aiConfigured && open && (lead || user.department === 'quality_assurance');

  // Own sector first, then the usual order.
  const sectorOrder = [...PACKAGING_SECTORS].sort((a, b) => (b === mySector) - (a === mySector));
  const groups = sectorOrder
    .map((s) => ({ sector: s, remarks: round.remarks.filter((r) => r.sector === s) }))
    .filter((g) => g.remarks.length);

  return (
    <PageShell title={t('title')}>
      <div className="max-w-7xl mx-auto">
        <Link to="/tools/packaging" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3">
          <ArrowLeft size={15} /> {t('detail.back')}
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">{check.code}</span>
              <CheckStatusBadge status={check.status} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              {heading.length ? (
                <>{heading[0]}{heading[1] && <span className="font-normal text-slate-500"> · {heading[1]}</span>}</>
              ) : t('untitled')}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {check.markets && <span className="text-slate-600">{t('detail.markets')}: {check.markets} · </span>}
              {t('detail.startedBy')} {check.createdBy?.name} · {fmtDate(check.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canRunAi && (
              <button onClick={() => rerunAi.mutate(check._id)} disabled={rerunAi.isPending} className="btn-secondary flex items-center gap-1.5 text-sm">
                {rerunAi.isPending ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                {rerunAi.isPending ? t('detail.aiRunning') : t('detail.aiRun')}
              </button>
            )}
            {lead && open && (
              <button onClick={() => setModal('close')} className="btn-primary flex items-center gap-1.5">
                <CheckSquare size={15} /> {t('detail.closeRound')}
              </button>
            )}
            {lead && (
              <button onClick={() => setModal('round')} className="btn-primary flex items-center gap-1.5">
                <FilePlus2 size={15} /> {t('detail.newRound')}
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => { if (window.confirm(t('detail.confirmDelete'))) deleteCheck.mutate(check._id, { onSuccess: () => navigate('/tools/packaging') }); }}
                className="p-2 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
                title={t('detail.deleteCheck')}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Round tabs */}
        {check.rounds.length > 1 && (
          <div className="flex gap-1 border-b border-slate-200 mb-4 overflow-x-auto">
            {check.rounds.map((r) => (
              <button
                key={r.number}
                onClick={() => setRoundNo(r.number)}
                className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
                  r.number === round.number ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {t('round', { n: r.number })}
                {r.outcome?.decision && (
                  <span className={`ml-1.5 inline-block w-1.5 h-1.5 rounded-full ${r.outcome.decision === 'approved' ? 'bg-green-500' : 'bg-amber-500'}`} />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-5">
          {/* Left — artwork + inputs */}
          <div className="lg:col-span-3 space-y-4">
            {round.clientMessage && (
              <section className="card p-4 border-l-4 border-l-blue-400">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-2">
                  <MessageSquare size={15} className="text-blue-500" /> {t('detail.clientMessage')}
                </h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{round.clientMessage}</p>
              </section>
            )}

            <section className="card p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">
                {t('detail.artwork')}
                {round.attachments.length > 1 && <span className="font-normal text-slate-400"> · {round.attachments.length}</span>}
              </h3>
              {round.attachments.length ? (
                <AttachmentsGallery key={round.number} checkId={check._id} files={round.attachments} />
              ) : (
                <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">
                  <ImageOff size={16} className="mt-0.5 shrink-0 text-slate-400" />
                  <span>
                    {t('detail.noAttachments')}
                    {artworkSource && (
                      <>
                        {' '}{t('detail.usesEarlierArtwork', { n: artworkSource.number })}{' '}
                        <button onClick={() => setRoundNo(artworkSource.number)} className="text-blue-600 hover:underline">
                          {t('round', { n: artworkSource.number })}
                        </button>
                      </>
                    )}
                  </span>
                </div>
              )}
            </section>

            {(round.ingredientsText || round.ingredientsFile || round.note || ingredientsSource) && (
              <section className="card p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">{t('detail.ingredients')}</h3>
                {round.ingredientsText && (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{round.ingredientsText}</p>
                )}
                {round.ingredientsFile && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-slate-500 mb-1.5">{t('detail.ingredientsFile')}</p>
                    <ArtworkPreview key={round.ingredientsFile.fileId} checkId={check._id} file={round.ingredientsFile} tall={false} />
                  </div>
                )}
                {!round.ingredientsText && !round.ingredientsFile && (
                  <p className="text-sm text-slate-500">
                    {ingredientsSource ? (
                      <>
                        {t('detail.usesEarlierIngredients')}{' '}
                        <button onClick={() => setRoundNo(ingredientsSource.number)} className="text-blue-600 hover:underline">
                          {t('round', { n: ingredientsSource.number })}
                        </button>
                      </>
                    ) : t('detail.noIngredients')}
                  </p>
                )}
                {round.note && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs font-medium text-slate-500 mb-1">{t('detail.note')}</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{round.note}</p>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Right — AI, progress, remarks */}
          <div className="lg:col-span-2 space-y-4">
            {round.outcome?.decision && (
              <section className={`card p-4 border-l-4 ${round.outcome.decision === 'approved' ? 'border-l-green-500' : 'border-l-amber-500'}`}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-800">{t('detail.outcome')}</h3>
                  <CheckStatusBadge status={round.outcome.decision} />
                </div>
                {round.outcome.summary && <p className="text-sm text-slate-700 whitespace-pre-wrap mt-2">{round.outcome.summary}</p>}
                <p className="text-xs text-slate-400 mt-2">{round.outcome.by?.name} · {fmtDateTime(round.outcome.at)}</p>
              </section>
            )}

            <section className="card p-4">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-2">
                <Bot size={15} className="text-slate-400" /> {t('detail.ai')}
              </h3>
              {round.ai.status === 'done' ? (
                <>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{round.ai.summary}</p>
                  {round.ai.answer && (
                    <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2">
                      <p className="flex items-center gap-1 text-xs font-semibold text-blue-800 mb-1"><Reply size={13} /> {t('detail.aiAnswer')}</p>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap">{round.ai.answer}</p>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1.5">{round.ai.model} · {fmtDateTime(round.ai.ranAt)}</p>
                </>
              ) : round.ai.status === 'failed' ? (
                <p className="flex items-start gap-1.5 text-sm text-red-600">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {t('detail.aiFailed')}: {round.ai.error}
                </p>
              ) : round.ai.status === 'skipped' ? (
                <p className="text-sm text-slate-500">{t('detail.aiSkipped')}</p>
              ) : (
                <p className="text-sm text-slate-500">{t('detail.aiNotConfigured')}</p>
              )}
            </section>

            {round.remarks.length > 0 && (
              <section className="card p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">{t('detail.progress')}</h3>
                <SectorProgress remarks={round.remarks} mySector={mySector} />
              </section>
            )}

            <section className="card p-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">
                {t('detail.remarks')} <span className="font-normal text-slate-400">· {round.remarks.length}</span>
              </h3>

              {!open && (
                <p className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                  <Lock size={12} /> {t('detail.readOnly')}
                </p>
              )}

              <div className="space-y-4">
                {groups.length === 0 && <p className="text-sm text-slate-400">{t('detail.noRemarks')}</p>}
                {groups.map((g) => (
                  <div key={g.sector}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      {tc(`dept.${g.sector}`)}
                      {g.sector === mySector && <span className="ml-1.5 normal-case tracking-normal font-medium text-amber-600">· {t('detail.yourSector')}</span>}
                    </p>
                    <div className="space-y-2">
                      {g.remarks.map((r) => (
                        <RemarkCard key={r._id} checkId={check._id} remark={r} open={open} user={user} />
                      ))}
                    </div>
                  </div>
                ))}
                {open && <AddRemarkForm checkId={check._id} rules={rules} defaultSector={mySector || 'quality_assurance'} />}
              </div>
            </section>

            {(round.remarks.length > 0 || round.outcome?.decision || round.ai.answer) && (
              <ClientEmail key={round.number} check={check} round={round} senderName={user.name} />
            )}
          </div>
        </div>
      </div>

      {modal === 'close' && <CloseRoundModal check={check} round={latest} isTopMgmt={topMgmt} onClose={() => setModal(null)} />}
      {modal === 'round' && <NewRoundModal check={check} onClose={() => { setModal(null); setRoundNo(null); }} />}
    </PageShell>
  );
};

export default PackagingCheckDetail;
