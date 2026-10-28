import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlusCircle } from 'lucide-react';
import PageShell from '../components/layout/PageShell.jsx';
import ProjectCard from '../components/project/ProjectCard.jsx';
import { DEPARTMENTS } from '../components/layout/Sidebar.jsx';
import { useProjects } from '../hooks/useProjects.js';
import { useAuth } from '../context/AuthContext.jsx';
import { canManage, isTopManagement } from '../utils/userTier.js';

const Projects = () => {
  const { t } = useTranslation('dashboard');
  const { t: tc } = useTranslation('common');
  const { user } = useAuth();
  const isTopMgmt = isTopManagement(user);

  // Top management can narrow to one department; everyone else gets the
  // server-scoped list (own dept + projects their dept is involved in).
  const [dept, setDept] = useState('');
  const { data: projects, isLoading, error } = useProjects(dept || undefined);

  const deptLabel = dept ? tc('dept.' + dept) : null;
  const newProjectLink = dept ? `/projects/new?dept=${dept}` : '/projects/new';

  return (
    <PageShell title={t('tabs.projects')}>
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t('tabs.projects')}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {t('projectCount', { count: projects?.length ?? 0 })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isTopMgmt && (
              <select className="input py-1.5 w-48" value={dept} onChange={(e) => setDept(e.target.value)}>
                <option value="">{tc('allDepartments')}</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.value} value={d.value}>{tc(`dept.${d.value}`)}</option>
                ))}
              </select>
            )}
            {canManage(user) && (
              <Link to={newProjectLink} className="btn-primary flex items-center gap-2">
                <PlusCircle size={16} />
                {t('newProject')}
              </Link>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {error && (
          <div className="text-center py-16 text-red-500">{t('loadProjectsFailed')}</div>
        )}

        {!isLoading && !error && projects?.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm mb-4">
              {deptLabel ? t('noProjectsInDept', { dept: deptLabel }) : t('noProjectsYet')}
            </p>
            {canManage(user) && (
              <Link to={newProjectLink} className="btn-primary">
                {t('createFirstProject')}
              </Link>
            )}
          </div>
        )}

        <div className="space-y-3">
          {projects?.map((p) => (
            <ProjectCard key={p._id} project={p} />
          ))}
        </div>
      </div>
    </PageShell>
  );
};

export default Projects;
