import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlusCircle, ShieldCheck } from 'lucide-react';
import KanbanBoard from '../components/tasks/KanbanBoard.jsx';
import HomeDashboard from '../components/home/HomeDashboard.jsx';
import TerkoviGallery from '../components/terkovi/TerkoviGallery.jsx';
import LeadsPage from '../components/leads/LeadsPage.jsx';
import { useProjects } from '../hooks/useProjects.js';
import { useDirectory } from '../hooks/useUsers.js';
import ProjectCard from '../components/project/ProjectCard.jsx';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { canManage } from '../utils/userTier.js';

// Unified sector nav — Тековни задачи is the central, default view; the rest are
// secondary resources. `procedures` jumps to its own page, the others switch tab.
const buildNavItems = (dept) => [
  { value: 'tasks',     key: 'tabs.tasks' },
  { value: 'projects',  key: 'tabs.projects' },
  { value: 'terkovi',   key: 'tabs.terkovi' },
  ...(LEADS_DEPTS.includes(dept) ? [{ value: 'leads', key: 'tabs.leads' }] : []),
  { value: 'vraboteni', key: 'tabs.vraboteni' },
  { value: 'procedures', key: 'tabs.procedures', to: '/procedures' },
];

// Departments that have the Leads (Потенцијални клиенти) entry
const LEADS_DEPTS = ['sales', 'top_management'];

const EmployeeList = ({ dept }) => {
  const { t } = useTranslation('dashboard');
  const { t: tc } = useTranslation('common');
  const { data: users = [], isLoading } = useDirectory(dept);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        {t('noEmployees')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {users.map((u) => (
        <div key={u._id} className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
            {u.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 text-sm">{u.name}</span>
              {u.isManager && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  <ShieldCheck size={10} /> {tc('manager')}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {tc('dept.' + u.department)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const { t } = useTranslation('dashboard');
  const { t: tc } = useTranslation('common');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const dept = searchParams.get('dept') || '';
  const tab  = searchParams.get('tab')  || 'tasks';
  const { user } = useAuth();

  const { data: projects, isLoading, error } = useProjects(dept);

  const deptLabel = dept ? tc('dept.' + dept) : null;

  const title = deptLabel || t('bulletin');
  const newProjectLink = dept ? `/projects/new?dept=${dept}` : '/projects/new';

  const switchTab = (val) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', val);
    next.delete('template');
    setSearchParams(next);
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />

        {/* Unified sector nav — one clean line bar, tasks first */}
        {dept && (
          <div className="border-b border-gray-200 bg-white px-4">
            <nav className="flex gap-1 overflow-x-auto">
              {buildNavItems(dept).map((item) =>
                item.to ? (
                  <Link
                    key={item.value}
                    to={item.to}
                    className="flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-colors whitespace-nowrap"
                  >
                    {t(item.key)}
                  </Link>
                ) : (
                  <button
                    key={item.value}
                    onClick={() => switchTab(item.value)}
                    className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      tab === item.value
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                    }`}
                  >
                    {t(item.key)}
                  </button>
                )
              )}
            </nav>
          </div>
        )}

        <main className="flex-1 p-6">

          {/* Kanban board — full width, no max-w constraint */}
          {dept && tab === 'tasks' && (
            <KanbanBoard dept={dept} />
          )}

          {/* No dept selected → quick-access home */}
          {!dept && <HomeDashboard />}

          {/* Department tabs — constrained to readable width */}
          {dept && tab !== 'tasks' && (
            <div className="max-w-3xl mx-auto">

              {(dept && tab === 'projects') && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {t('projectCount', { count: projects?.length ?? 0 })}
                      </p>
                    </div>
                    {canManage(user) && (
                      <Link to={newProjectLink} className="btn-primary flex items-center gap-2">
                        <PlusCircle size={16} />
                        {t('newProject')}
                      </Link>
                    )}
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
                </>
              )}

              {dept && tab === 'terkovi' && (
                <TerkoviGallery />
              )}

              {dept && tab === 'leads' && (
                <LeadsPage />
              )}

              {dept && tab === 'vraboteni' && (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">{t('employees')}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{deptLabel}</p>
                  </div>
                  <EmployeeList dept={dept} />
                </>
              )}

            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Dashboard;
