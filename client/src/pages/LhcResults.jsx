import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, AlertTriangle, FileText, Download } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { useLhcCampaignResults, useLhcCategories } from '../hooks/useLhc.js';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isTopManagement } from '../utils/userTier.js';
import { fmtDate } from '../utils/formatDate.js';

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

const LhcResults = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, isLoading } = useLhcCampaignResults(id);
  const { data: categories = [] } = useLhcCategories();

  if (!isTopManagement(user)) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-slate-500">Forbidden</div>
      </div>
    );
  }

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

  const { campaign: c, summary, assignments } = data;
  const catName = (k) => categories.find((x) => x.key === k)?.name || k;

  if (!summary) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar title="Резултати" />
          <main className="flex-1 p-4 sm:p-6">
            <div className="max-w-3xl mx-auto">
              <Link to={`/lhc/campaigns/${id}`} className="text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 mb-3">
                <ArrowLeft size={14} /> Назад
              </Link>
              <div className="card p-6 text-center text-slate-500">
                Резултатите ќе бидат достапни по затворање на кампањата.
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const overallPct = summary.overallPercent ?? 0;
  const completedAsn = (assignments || []).filter((a) => a.status === 'completed');

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title="Резултати — Усогласеност" />
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-5xl mx-auto">
            <Link to={`/lhc/campaigns/${id}`} className="text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 mb-3">
              <ArrowLeft size={14} /> Назад
            </Link>

            <div className="card p-4 sm:p-5 mb-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold text-slate-900">{c.title}</h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Затворена {fmtDate(c.closedAt)} · {summary.participation.completed}/{summary.participation.invited} учесници ја пополниле
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const r = await api.get(`/lhc/campaigns/${id}/export.csv`, { responseType: 'blob' });
                      const url = URL.createObjectURL(r.data);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `lhc-${id}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch { /* toast already covered upstream if needed */ }
                  }}
                  className="btn-secondary text-sm inline-flex items-center gap-1.5"
                >
                  <Download size={13} /> Експорт CSV
                </button>
              </div>
            </div>

            {/* Overall */}
            <div className="card p-4 sm:p-5 mb-4">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Вкупна усогласеност</div>
                  <div className="text-3xl font-semibold text-slate-900 mt-1">{overallPct}%</div>
                  <div className="text-sm text-slate-500 mt-1">
                    {Math.round(summary.overallScore)} од {Math.round(summary.overallMaxScore)} поени
                  </div>
                </div>
              </div>
              <div className="mt-3"><Bar pct={overallPct} /></div>
            </div>

            {/* By category */}
            <div className="card p-4 sm:p-5 mb-4">
              <h3 className="section-title mb-3">Преглед по област</h3>
              <div className="space-y-3">
                {Object.entries(summary.categoryBreakdown || {}).map(([cat, b]) => {
                  const pct = b.maxScore ? Math.round((b.score / b.maxScore) * 100) : 0;
                  return (
                    <div key={cat}>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-sm font-medium text-slate-800">{catName(cat)}</span>
                        <span className="text-xs text-slate-500">
                          {Math.round(b.score)}/{Math.round(b.maxScore)} ({pct}%) · {b.violations} прекршоци
                        </span>
                      </div>
                      <Bar pct={pct} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top violations */}
            <div className="card p-4 sm:p-5 mb-4">
              <h3 className="section-title mb-3 inline-flex items-center gap-2">
                <ShieldAlert size={14} /> Главни прекршоци
              </h3>
              {(!summary.topViolations || summary.topViolations.length === 0) && (
                <p className="text-sm text-slate-500">Нема прекршоци.</p>
              )}
              <ul className="space-y-3">
                {(summary.topViolations || []).map((v) => (
                  <li key={v.qid} className="border border-slate-200 rounded-md p-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <SeverityPill level={v.sanctionLevel} />
                          <span className="text-xs text-slate-500">{catName(v.category)}</span>
                          <span className="text-xs text-slate-400 font-mono">{v.qid}</span>
                          <span className="text-xs text-slate-700">×{v.count}</span>
                        </div>
                        <p className="text-sm text-slate-900 mt-1">{v.text}</p>
                        {v.article && <p className="text-xs text-slate-500 mt-0.5 italic">{v.article}</p>}
                        {v.recommendation && (
                          <p className="text-xs text-slate-700 mt-2 bg-slate-50 border-l-2 border-slate-300 px-2 py-1.5">
                            <strong className="block text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">Препорака</strong>
                            {v.recommendation}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Per-user breakdown */}
            <div className="card p-4 sm:p-5">
              <h3 className="section-title mb-3 inline-flex items-center gap-2">
                <FileText size={14} /> По вработен
              </h3>
              {completedAsn.length === 0 ? (
                <p className="text-sm text-slate-500">Никој не го комплетирал прегледот.</p>
              ) : (
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 uppercase tracking-wide">
                        <th className="text-left px-2 py-2">Вработен</th>
                        <th className="text-left px-2 py-2">Сектор</th>
                        <th className="text-right px-2 py-2">Усогласеност</th>
                        <th className="text-right px-2 py-2">Прекршоци</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {completedAsn.map((a) => {
                        const pct = a.maxScore ? Math.round((a.score / a.maxScore) * 100) : 0;
                        return (
                          <tr key={a._id}>
                            <td className="px-2 py-2 text-slate-900">{a.user?.name || '—'}</td>
                            <td className="px-2 py-2 text-slate-600">{a.user?.department}</td>
                            <td className="px-2 py-2 text-right font-medium">{pct}%</td>
                            <td className="px-2 py-2 text-right">
                              {a.violations > 0
                                ? <span className="inline-flex items-center gap-1 text-amber-700"><AlertTriangle size={12} /> {a.violations}</span>
                                : <span className="text-slate-500">0</span>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LhcResults;
