import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Filter, FileText, ArrowUpRight, CalendarDays, Download } from 'lucide-react';
import { fmtDateLong } from '../utils/formatDate.js';
import { DEPARTMENTS } from '../components/layout/Sidebar.jsx';
import PageShell from '../components/layout/PageShell.jsx';
import { useProcedures, useCreateProcedure, useDownloadProcedurePdf } from '../hooks/useProcedures.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isTopManagement } from '../utils/userTier.js';

const BADGE_CLS = 'inline-block px-1.5 py-0.5 rounded text-[10px] text-slate-500 bg-slate-50 border border-slate-200';

// `compact` mode: caps at 2 visible chips and adds a "+N" tail.
// "All depts" (length === total - 1, excluding top_management) collapses to one neutral pill.
export const DeptBadges = ({ departments, t, compact = false, max = 2 }) => {
  if (!departments?.length) {
    return <span className={BADGE_CLS}>{t('allEmployees')}</span>;
  }
  const totalDepts = DEPARTMENTS.filter((d) => d.value !== 'top_management').length;
  if (departments.length >= totalDepts) {
    return <span className={BADGE_CLS}>{t('allDepartments', { defaultValue: t('allEmployees') })}</span>;
  }
  if (compact && departments.length > max) {
    const shown = departments.slice(0, max);
    const rest = departments.length - shown.length;
    return (
      <>
        {shown.map((d) => (
          <span key={d} className={BADGE_CLS}>{t(`dept.${d}`)}</span>
        ))}
        <span className={BADGE_CLS}>+{rest}</span>
      </>
    );
  }
  return departments.map((d) => (
    <span key={d} className={BADGE_CLS}>
      {t(`dept.${d}`)}
    </span>
  ));
};

const DocIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

// Sector filter: everything, general procedures (no sector tag), then each sector.
const ALL = 'all';
const GENERAL = 'general';

const matchesFilter = (p, filter) => {
  if (filter === ALL) return true;
  if (filter === GENERAL) return !p.departments?.length;
  return p.departments?.includes(filter);
};

// Readable cards: full title, adoption date, no sector tags (sections/filter carry that).
const ProcedureGrid = ({ procedures, onOpen }) => {
  const { t } = useTranslation('common');
  const download = useDownloadProcedurePdf();
  return (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {procedures.map((p) => (
      <div
        key={p._id}
        role="link"
        tabIndex={0}
        onClick={() => onOpen(p._id)}
        onKeyDown={(e) => { if (e.key === 'Enter') onOpen(p._id); }}
        className="group card p-4 text-left flex flex-col gap-3 cursor-pointer transition-all hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
      >
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center transition-colors group-hover:bg-slate-800 group-hover:text-white">
            <FileText size={17} strokeWidth={1.75} />
          </div>
          <ArrowUpRight size={16} className="text-slate-300 transition-colors group-hover:text-slate-600" />
        </div>
        <h3 className="text-[15px] font-semibold text-slate-900 leading-snug">
          {p.title}
        </h3>
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500">
          <CalendarDays size={13} className="text-slate-400" />
          {fmtDateLong(p.createdAt)}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); download.mutate({ id: p._id, title: p.title }); }}
            disabled={download.isPending && download.variables?.id === p._id}
            className="ml-auto p-1.5 -m-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
            title={t('downloadPdf')}
            aria-label={t('downloadPdf')}
          >
            <Download size={14} />
          </button>
        </div>
      </div>
    ))}
  </div>
  );
};

const Procedures = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: procedures, isLoading } = useProcedures();
  const createMut = useCreateProcedure();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState(ALL);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedDepts, setSelectedDepts] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    createMut.mutate({ title, content, departments: selectedDepts }, {
      onSuccess: () => { setShowForm(false); setTitle(''); setContent(''); setSelectedDepts([]); },
    });
  };

  const all = procedures || [];
  const q = search.trim().toLowerCase();
  const visible = all.filter((p) =>
    matchesFilter(p, filter) && (!q || p.title.toLowerCase().includes(q)));

  // Only offer sectors that actually have procedures tagged.
  const filterOptions = [
    { value: ALL,     label: t('all') },
    { value: GENERAL, label: t('generalProcedures') },
    ...DEPARTMENTS.filter((d) => d.value !== 'top_management')
      .map((d) => ({ value: d.value, label: t(`dept.${d.value}`) })),
  ]
    .map((c) => ({ ...c, count: all.filter((p) => matchesFilter(p, c.value)).length }))
    .filter((c) => c.value === ALL || c.count > 0);

  return (
    <PageShell title={t('procedures')}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchProcedures')}
                className="input pl-8 py-1.5 w-64"
              />
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input pl-8 py-1.5 w-56 cursor-pointer"
              >
                {filterOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label} ({o.count})</option>
                ))}
              </select>
            </div>
          </div>
          {isTopManagement(user) && !showForm && (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              + {t('addProcedure')}
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="card p-5 mb-8 space-y-4">
            <div>
              <label className="label">{t('procedureTitle')}</label>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('procedureTitlePlaceholder')}
                required
              />
            </div>
            <div>
              <label className="label">{t('procedureContent')}</label>
              <textarea
                className="input min-h-[200px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('procedureContentPlaceholder')}
                required
              />
            </div>
            <div>
              <label className="label">{t('procedureDepartments')}</label>
              <p className="text-xs text-gray-400 mb-2">{t('procedureDepartmentsHint')}</p>
              <div className="flex flex-wrap gap-2">
                {DEPARTMENTS.filter((d) => d.value !== 'top_management').map((d) => (
                  <label key={d.value} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDepts.includes(d.value)}
                      onChange={(e) =>
                        setSelectedDepts((prev) =>
                          e.target.checked ? [...prev, d.value] : prev.filter((v) => v !== d.value)
                        )
                      }
                      className="rounded border-slate-300 accent-slate-700 focus:ring-slate-300"
                    />
                    {t(`dept.${d.value}`)}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={createMut.isPending} className="btn-primary">
                {t('create')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                {t('cancel')}
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <p className="text-gray-400 text-sm">{t('loading')}</p>
        ) : !visible.length ? (
          <div className="text-center py-20">
            <DocIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              {all.length ? t('noProceduresMatch') : t('noProcedures')}
            </p>
          </div>
        ) : (
          // Default view separates the two kinds; a selected filter shows one flat list.
          filter === ALL ? (
            <div className="space-y-8">
              {[
                { key: 'general', label: t('generalProceduresSection'), items: visible.filter((p) => !p.departments?.length) },
                { key: 'sector',  label: t('sectorProceduresSection'),  items: visible.filter((p) => p.departments?.length) },
              ].filter((g) => g.items.length).map((g) => (
                <section key={g.key}>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    {g.label} <span className="text-slate-400 font-normal">· {g.items.length}</span>
                  </h2>
                  <ProcedureGrid procedures={g.items} onOpen={(id) => navigate(`/procedures/${id}`)} />
                </section>
              ))}
            </div>
          ) : (
            <ProcedureGrid procedures={visible} onOpen={(id) => navigate(`/procedures/${id}`)} />
          )
        )}
      </div>
    </PageShell>
  );
};

export default Procedures;
