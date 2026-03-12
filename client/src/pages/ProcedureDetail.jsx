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
        <main className="flex-1 p-6 md:p-10">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => navigate('/procedures')}
              className="btn-secondary mb-6"
            >
              ← {t('back')}
            </button>

            {isLoading ? (
              <p className="text-gray-400 text-sm">{t('loading')}</p>
            ) : !procedure ? (
              <p className="text-gray-400 text-sm">{t('noResults')}</p>
            ) : (
              <article className="card overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                        {procedure.title}
                      </h1>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <DeptBadges departments={procedure.departments} t={t} />
                      </div>
                      <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1.5">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          {procedure.createdBy?.name ?? '—'}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="inline-flex items-center gap-1.5">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                        className="btn-danger shrink-0"
                      >
                        {t('delete')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="px-8 py-8 md:px-10 md:py-10">
                  <div className="whitespace-pre-wrap text-[15px] leading-[1.8] text-gray-700 tracking-wide max-w-none">
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
