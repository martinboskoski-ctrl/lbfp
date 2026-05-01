import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { useProcedure, useDeleteProcedure } from '../hooks/useProcedures.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isTopManagement } from '../utils/userTier.js';
import { DeptBadges } from './Procedures.jsx';

const ProcedureDetail = () => {
  const { t } = useTranslation('common');
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: procedure, isLoading } = useProcedure(id);
  const deleteMut = useDeleteProcedure();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleDelete = () => {
    if (!window.confirm(t('confirmDeleteProcedure'))) return;
    deleteMut.mutate(id, { onSuccess: () => navigate('/procedures') });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={t('procedures')} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => navigate('/procedures')}
              className="text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 mb-3"
            >
              ← {t('back')}
            </button>

            {isLoading ? (
              <p className="text-slate-400 text-sm">{t('loading')}</p>
            ) : !procedure ? (
              <p className="text-slate-400 text-sm">{t('noResults')}</p>
            ) : (
              <article className="card overflow-hidden">
                {/* Header */}
                <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg sm:text-xl font-semibold text-slate-900 leading-tight">
                        {procedure.title}
                      </h1>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <DeptBadges departments={procedure.departments} t={t} />
                      </div>
                      <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          {procedure.createdBy?.name ?? '—'}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="inline-flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {new Date(procedure.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {isTopManagement(user) && (
                      <button
                        onClick={handleDelete}
                        disabled={deleteMut.isPending}
                        className="btn-danger text-sm shrink-0"
                      >
                        {t('delete')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="px-5 sm:px-6 md:px-8 py-6 md:py-8">
                  <div className="whitespace-pre-wrap text-[15px] leading-[1.8] text-slate-700 max-w-none">
                    {procedure.content}
                  </div>
                </div>
              </article>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProcedureDetail;
