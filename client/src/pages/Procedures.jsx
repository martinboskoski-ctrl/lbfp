import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar, { DEPARTMENTS } from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { useProcedures, useCreateProcedure } from '../hooks/useProcedures.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isTopManagement } from '../utils/userTier.js';

const BADGE_CLS = 'inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200';

export const DeptBadges = ({ departments, t }) => {
  if (!departments?.length) {
    return <span className={BADGE_CLS}>{t('allEmployees')}</span>;
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

const Procedures = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: procedures, isLoading } = useProcedures();
  const createMut = useCreateProcedure();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedDepts, setSelectedDepts] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    createMut.mutate({ title, content, departments: selectedDepts }, {
      onSuccess: () => { setShowForm(false); setTitle(''); setContent(''); setSelectedDepts([]); },
    });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={t('procedures')} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto">
            {isTopManagement(user) && !showForm && (
              <button onClick={() => setShowForm(true)} className="btn-primary mb-6">
                + {t('addProcedure')}
              </button>
            )}

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
            ) : !procedures?.length ? (
              <div className="text-center py-20">
                <DocIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">{t('noProcedures')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {procedures.map((p) => (
                  <div
                    key={p._id}
                    onClick={() => navigate(`/procedures/${p._id}`)}
                    className="group card p-4 cursor-pointer transition-colors hover:bg-slate-50 hover:border-slate-300 flex flex-col items-center text-center"
                  >
                    <div className="w-12 h-12 rounded-md bg-slate-100 flex items-center justify-center mb-3">
                      <DocIcon className="w-6 h-6 text-slate-600" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 leading-snug line-clamp-2 mb-2">
                      {p.title}
                    </h3>
                    <div className="flex flex-wrap justify-center gap-1 mb-1.5">
                      <DeptBadges departments={p.departments} t={t} />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-auto leading-tight">
                      {p.createdBy?.name ?? '—'}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Procedures;
