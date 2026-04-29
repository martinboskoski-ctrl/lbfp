import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, BookOpen, ChevronRight, AlertCircle } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { Pagination } from '../components/Pagination.jsx';
import { useLhcCategories, useLhcOverview } from '../hooks/useLhc.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isTopManagement } from '../utils/userTier.js';
import { fmtDate } from '../utils/formatDate.js';

const PAGE_SIZE = 5;
const usePaginated = (items) => {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const visible = useMemo(
    () => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [items, page]
  );
  return { page, setPage, pageCount, visible };
};

const StatusPill = ({ status }) => {
  const map = {
    draft:    { label: 'Драфт',     cls: 'bg-slate-100 text-slate-600' },
    open:     { label: 'Отворен',   cls: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
    closed:   { label: 'Затворен',  cls: 'bg-slate-100 text-slate-700' },
    archived: { label: 'Архивиран', cls: 'bg-slate-50 text-slate-500' },
  };
  const v = map[status] || map.draft;
  return <span className={`text-[11px] px-2 py-0.5 rounded ${v.cls}`}>{v.label}</span>;
};

const Lhc = () => {
  const { user } = useAuth();
  const isAdmin = isTopManagement(user);
  const { data: categories = [], isLoading: catsLoading } = useLhcCategories();
  const { data: overview, isLoading: ovLoading } = useLhcOverview();

  const myAssignments = overview?.myAssignments || [];
  const campaigns = overview?.campaigns || [];

  const openAssignments = myAssignments.filter((a) => a.campaign?.status === 'open' && a.status !== 'completed');

  const myAsnPager = usePaginated(myAssignments);
  const campaignsPager = usePaginated(campaigns);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title="Правен здравствен преглед" />
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex flex-col gap-3 mb-5">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Правен здравствен преглед</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Периодичен преглед на усогласеноста на компанијата со закони и интерни процедури.
                </p>
              </div>
              {isAdmin && (
                <div className="flex flex-wrap gap-2">
                  <Link to="/lhc/admin/questions" className="btn-secondary text-sm">
                    Управувај со прашања
                  </Link>
                  <Link to="/lhc/campaigns/new" className="btn-primary text-sm">
                    Креирај преглед
                  </Link>
                </div>
              )}
            </div>

            {/* Open assignments banner */}
            {openAssignments.length > 0 && (
              <div className="card p-4 mb-5 border-amber-200 bg-amber-50">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-700 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900">
                      Имате {openAssignments.length} отворен{openAssignments.length === 1 ? '' : 'и'} преглед{openAssignments.length === 1 ? '' : 'и'} за пополнување.
                    </p>
                    <ul className="mt-2 space-y-1">
                      {openAssignments.map((a) => (
                        <li key={a._id} className="text-sm text-slate-700">
                          • {a.campaign?.title || 'Преглед'} — рок: {fmtDate(a.campaign?.closeAt)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Categories overview */}
            <div className="mb-5">
              <h3 className="section-title mb-2 inline-flex items-center gap-2">
                <BookOpen size={14} /> Области на усогласеност
              </h3>
              {catsLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-slate-700" />
                </div>
              )}
              {!catsLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map((c) => {
                    const empty = c.questionCount === 0;
                    return (
                      <div key={c.key} className="card p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg" aria-hidden>{c.icon}</span>
                              <h4 className="font-medium text-slate-900 text-sm">{c.name}</h4>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description}</p>
                          </div>
                          <span className={`text-[11px] px-2 py-0.5 rounded ${empty ? 'bg-slate-50 text-slate-400' : 'bg-slate-100 text-slate-700'}`}>
                            {c.questionCount} прашања
                          </span>
                        </div>
                        {empty && (
                          <p className="mt-2 text-[11px] text-slate-400 italic">Прашања во подготовка.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Past assignments */}
            {myAssignments.length > 0 && (
              <div className="mb-5">
                <h3 className="section-title mb-2">Мои прегледи ({myAssignments.length})</h3>
                <div className="card divide-y divide-slate-100">
                  {myAsnPager.visible.map((a) => {
                    const target = a.campaign?.status === 'open' && a.status !== 'completed'
                      ? `/lhc/campaigns/${a.campaign?._id}/answer`
                      : `/lhc/campaigns/${a.campaign?._id}`;
                    return (
                      <Link key={a._id} to={target} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-slate-900 truncate">{a.campaign?.title || 'Преглед'}</div>
                          <div className="text-xs text-slate-500">
                            Статус: {a.status} · Рок: {fmtDate(a.campaign?.closeAt)}
                          </div>
                        </div>
                        <StatusPill status={a.campaign?.status} />
                      </Link>
                    );
                  })}
                </div>
                <Pagination page={myAsnPager.page} pageCount={myAsnPager.pageCount} onChange={myAsnPager.setPage} />
              </div>
            )}

            {/* Top mgmt: campaign list */}
            {isAdmin && (
              <div className="mb-5">
                <h3 className="section-title mb-2 inline-flex items-center gap-2">
                  <ShieldCheck size={14} /> Кампањи
                </h3>
                {ovLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-slate-700" />
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="card p-8 text-center text-slate-500 text-sm">
                    Сè уште нема креирани кампањи.
                  </div>
                ) : (
                  <>
                    <div className="card divide-y divide-slate-100">
                      {campaignsPager.visible.map((c) => (
                        <Link key={c._id} to={`/lhc/campaigns/${c._id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-slate-900 truncate">{c.title}</div>
                            <div className="text-xs text-slate-500">
                              {c.categories?.length || 0} области · {fmtDate(c.openAt)} → {fmtDate(c.closeAt)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusPill status={c.status} />
                            <ChevronRight size={14} className="text-slate-400" />
                          </div>
                        </Link>
                      ))}
                    </div>
                    <Pagination page={campaignsPager.page} pageCount={campaignsPager.pageCount} onChange={campaignsPager.setPage} />
                  </>
                )}
              </div>
            )}

            <p className="text-xs text-slate-500 mt-6">
              Резултатите од прегледот ги гледа само Топ менаџментот. Секој вработен ги гледа само своите одговори.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Lhc;
