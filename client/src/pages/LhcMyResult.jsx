import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { useLhcMyResult, useLhcCategories } from '../hooks/useLhc.js';
import { fmtDate } from '../utils/formatDate.js';

const ANSWER_LABELS = {
  yes: 'Да', no: 'Не', partial: 'Делумно',
  na: 'Не е применливо', not_applicable: 'Не е применливо',
  true: 'Точно', false: 'Неточно',
};

const formatAnswer = (a, q) => {
  if (a === null || a === undefined || a === '') return '—';
  if (Array.isArray(a)) return a.join(', ');
  if (typeof a === 'object') {
    const opts = q.options || [];
    const checked = opts.filter((o) => a[o.value]).map((o) => o.label);
    return checked.length ? checked.join('; ') : 'нема означени';
  }
  if (q.options?.length) {
    const opt = q.options.find((o) => o.value === a);
    if (opt) return opt.label;
  }
  return ANSWER_LABELS[a] || String(a);
};

const SeverityPill = ({ level }) => {
  const map = {
    high:   'bg-red-50 text-red-800 border border-red-200',
    medium: 'bg-amber-50 text-amber-800 border border-amber-200',
    low:    'bg-slate-100 text-slate-700',
    none:   'bg-slate-50 text-slate-500',
  };
  return <span className={`text-[11px] px-2 py-0.5 rounded ${map[level] || map.none}`}>{level}</span>;
};

const Bar = ({ pct }) => (
  <div className="h-2 bg-slate-100 rounded-full overflow-hidden w-full">
    <div className="h-full bg-slate-700" style={{ width: `${Math.min(100, pct)}%` }} />
  </div>
);

const LhcMyResult = () => {
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
          <Topbar title="Резултат" />
          <main className="flex-1 p-4 sm:p-6">
            <div className="card p-6 max-w-xl mx-auto text-center">
              <p className="text-slate-700 mb-3">
                {error?.response?.data?.message || 'Резултатот не е достапен.'}
              </p>
              <Link to="/lhc" className="btn-secondary inline-flex items-center gap-1">
                <ArrowLeft size={14} /> Назад
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { campaign, assignment, findings } = data;
  const catName = (k) => categories.find((c) => c.key === k)?.name || k;

  const incorrect = findings.filter((f) => f.isCorrect === false);
  const correctCount = findings.filter((f) => f.isCorrect === true).length;
  const overallPct = assignment.maxScore ? Math.round((assignment.score / assignment.maxScore) * 100) : 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title="Мој резултат" />
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-3xl mx-auto">
            <Link to={`/lhc/campaigns/${id}`} className="text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 mb-3">
              <ArrowLeft size={14} /> Назад
            </Link>

            <div className="card p-4 sm:p-5 mb-4">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900">{campaign.title}</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {campaign.status === 'closed'
                  ? `Затворена ${fmtDate(campaign.closedAt)}`
                  : 'Прегледот е сè уште отворен — резултатите ги гледа само Топ менаџментот.'}
              </p>
            </div>

            <div className="card p-4 sm:p-5 mb-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Ваш резултат</div>
                  <div className="text-3xl font-semibold text-slate-900 mt-1">{overallPct}%</div>
                  <div className="text-sm text-slate-500 mt-1">
                    {Math.round(assignment.score)} од {Math.round(assignment.maxScore)} поени · {correctCount} точни / {incorrect.length} прекршоци
                  </div>
                </div>
              </div>
              <div className="mt-3"><Bar pct={overallPct} /></div>
            </div>

            {/* Per-category */}
            {assignment.categoryBreakdown && Object.keys(assignment.categoryBreakdown).length > 0 && (
              <div className="card p-4 sm:p-5 mb-4">
                <h3 className="section-title mb-3">По област</h3>
                <div className="space-y-3">
                  {Object.entries(assignment.categoryBreakdown).map(([cat, b]) => {
                    const pct = b.maxScore ? Math.round((b.score / b.maxScore) * 100) : 0;
                    return (
                      <div key={cat}>
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-sm font-medium text-slate-800">{catName(cat)}</span>
                          <span className="text-xs text-slate-500">
                            {Math.round(b.score)}/{Math.round(b.maxScore)} ({pct}%) · {b.violations || 0} прекршоци
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
                <ShieldAlert size={14} /> Точки за подобрување ({incorrect.length})
              </h3>
              {incorrect.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                  <CheckCircle size={14} /> Сите ваши одговори се во согласност.
                </div>
              ) : (
                <ul className="space-y-3">
                  {incorrect.map((f) => (
                    <li key={f.qid} className="border border-slate-200 rounded-md p-3">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <SeverityPill level={f.sanctionLevel} />
                        <span className="text-xs text-slate-500">{catName(f.category)}</span>
                        <span className="text-xs text-slate-400 font-mono">{f.qid}</span>
                      </div>
                      <p className="text-sm text-slate-900">{f.text}</p>
                      {f.article && <p className="text-xs text-slate-500 mt-0.5 italic">{f.article}</p>}
                      <div className="mt-2 text-xs text-slate-700">
                        <strong className="text-[11px] uppercase tracking-wide text-slate-500">Ваш одговор: </strong>
                        <span className="inline-flex items-center gap-1 text-red-700">
                          <XCircle size={12} /> {formatAnswer(f.userAnswer, f)}
                        </span>
                      </div>
                      {f.recommendation && (
                        <p className="mt-2 text-xs text-slate-700 bg-slate-50 border-l-2 border-slate-300 px-2 py-1.5">
                          <strong className="block text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">Препорака</strong>
                          {f.recommendation}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Овие резултати се видливи само за Вас. Топ менаџментот ги гледа агрегираните податоци, не индивидуалните идентитети надвор од нивниот преглед.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LhcMyResult;
