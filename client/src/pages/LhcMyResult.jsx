import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { useLhcMyResult, useLhcCategories } from '../hooks/useLhc.js';
import { fmtDate } from '../utils/formatDate.js';
import { qText, qArticle, qRecommendation, oLabel, isApprox } from '../utils/lhcLang.js';

const formatAnswer = (a, q, t) => {
  if (a === null || a === undefined || a === '') return '—';
  if (Array.isArray(a)) return a.join(', ');
  if (typeof a === 'object') {
    const opts = q.options || [];
    const checked = opts.filter((o) => a[o.value]).map((o) => oLabel(o));
    return checked.length ? checked.join('; ') : '—';
  }
  if (q.options?.length) {
    const opt = q.options.find((o) => o.value === a);
    if (opt) return oLabel(opt);
  }
  const builtin = ['yes','no','partial','na','not_applicable','true','false'];
  if (builtin.includes(a)) return t(`options.${a === 'not_applicable' ? 'na' : a}`);
  return String(a);
};

const SeverityPill = ({ level, t }) => {
  const map = {
    high:   'bg-red-50 text-red-800 border border-red-200',
    medium: 'bg-amber-50 text-amber-800 border border-amber-200',
    low:    'bg-slate-100 text-slate-700',
    none:   'bg-slate-50 text-slate-500',
  };
  return <span className={`text-[11px] px-2 py-0.5 rounded ${map[level] || map.none}`}>
    {t(`sanction.${level}`, { defaultValue: level })}
  </span>;
};

const Bar = ({ pct }) => (
  <div className="h-2 bg-slate-100 rounded-full overflow-hidden w-full">
    <div className="h-full bg-slate-700" style={{ width: `${Math.min(100, pct)}%` }} />
  </div>
);

const LhcMyResult = () => {
  const { t } = useTranslation('lhc');
  const { t: tc } = useTranslation('common');
  const { id } = useParams();
  const { data, isLoading, error } = useLhcMyResult(id);
  const { data: categories = [] } = useLhcCategories();

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
  if (error || !data) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar title={t('myResult.title')} />
          <main className="flex-1 p-4 sm:p-6">
            <div className="card p-6 max-w-xl mx-auto text-center">
              <p className="text-slate-700 mb-3">
                {error?.response?.data?.message || tc('noResults')}
              </p>
              <Link to="/lhc" className="btn-secondary inline-flex items-center gap-1">
                <ArrowLeft size={14} /> {tc('back')}
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { campaign, assignment, findings } = data;
  const catName = (k) => t(`categoryNames.${k}`, {
    defaultValue: categories.find((c) => c.key === k)?.name || k,
  });

  const incorrect = findings.filter((f) => f.isCorrect === false);
  const correctCount = findings.filter((f) => f.isCorrect === true).length;
  const overallPct = assignment.maxScore ? Math.round((assignment.score / assignment.maxScore) * 100) : 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={t('myResult.title')} />
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-3xl mx-auto">
            <Link to={`/lhc/campaigns/${id}`} className="text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 mb-3">
              <ArrowLeft size={14} /> {tc('back')}
            </Link>

            <div className="card p-4 sm:p-5 mb-4">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900">{campaign.title}</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {campaign.status === 'closed'
                  ? `${t('campaign.fields.closedOn')} ${fmtDate(campaign.closedAt)}`
                  : t('myResult.stillOpen')}
              </p>
            </div>

            <div className="card p-4 sm:p-5 mb-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">{t('myResult.yourScore')}</div>
                  <div className="text-3xl font-semibold text-slate-900 mt-1">{overallPct}%</div>
                  <div className="text-sm text-slate-500 mt-1">
                    {t('myResult.summaryLine', {
                      score: Math.round(assignment.score),
                      max: Math.round(assignment.maxScore),
                      correct: correctCount,
                      violations: incorrect.length,
                    })}
                  </div>
                </div>
              </div>
              <div className="mt-3"><Bar pct={overallPct} /></div>
            </div>

            {/* Per-category */}
            {assignment.categoryBreakdown && Object.keys(assignment.categoryBreakdown).length > 0 && (
              <div className="card p-4 sm:p-5 mb-4">
                <h3 className="section-title mb-3">{t('myResult.byCategory')}</h3>
                <div className="space-y-3">
                  {Object.entries(assignment.categoryBreakdown).map(([cat, b]) => {
                    const pct = b.maxScore ? Math.round((b.score / b.maxScore) * 100) : 0;
                    return (
                      <div key={cat}>
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-sm font-medium text-slate-800">{catName(cat)}</span>
                          <span className="text-xs text-slate-500">
                            {t('results.categoryLine', {
                              score: Math.round(b.score),
                              max: Math.round(b.maxScore),
                              pct,
                              violations: b.violations || 0,
                            })}
                          </span>
                        </div>
                        <Bar pct={pct} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Incorrect findings with recommendations */}
            <div className="card p-4 sm:p-5 mb-4">
              <h3 className="section-title mb-3 inline-flex items-center gap-2">
                <ShieldAlert size={14} /> {t('myResult.improvements')} ({incorrect.length})
              </h3>
              {incorrect.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                  <CheckCircle size={14} /> {t('myResult.noImprovements')}
                </div>
              ) : (
                <ul className="space-y-3">
                  {incorrect.map((f) => {
                    const approx = isApprox(f);
                    return (
                      <li key={f.qid} className="border border-slate-200 rounded-md p-3">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <SeverityPill level={f.sanctionLevel} t={t} />
                          <span className="text-xs text-slate-500">{catName(f.category)}</span>
                          <span className="text-xs text-slate-400 font-mono">{f.qid}</span>
                          {approx && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500" title={t('approxNote')}>
                              {t('answer.approxBadge')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-900">{qText(f)}</p>
                        {qArticle(f) && <p className="text-xs text-slate-500 mt-0.5 italic">{qArticle(f)}</p>}
                        <div className="mt-2 text-xs text-slate-700">
                          <strong className="text-[11px] uppercase tracking-wide text-slate-500">{t('myResult.yourAnswer')}: </strong>
                          <span className="inline-flex items-center gap-1 text-red-700">
                            <XCircle size={12} /> {formatAnswer(f.userAnswer, f, t)}
                          </span>
                        </div>
                        {qRecommendation(f) && (
                          <p className="mt-2 text-xs text-slate-700 bg-slate-50 border-l-2 border-slate-300 px-2 py-1.5">
                            <strong className="block text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">{t('results.recommendation')}</strong>
                            {qRecommendation(f)}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-2">{t('myResult.privacyNote')}</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LhcMyResult;
