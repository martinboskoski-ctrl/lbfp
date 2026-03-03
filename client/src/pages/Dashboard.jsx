import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PlusCircle, ShieldCheck } from 'lucide-react';
import KanbanBoard from '../components/tasks/KanbanBoard.jsx';
import Whiteboard from '../components/Whiteboard.jsx';
import POList from '../components/po/POList.jsx';
import TerkoviGallery from '../components/terkovi/TerkoviGallery.jsx';
import AgreementsPage from '../components/agreements/AgreementsPage.jsx';
import LeadsPage from '../components/leads/LeadsPage.jsx';
import { useProjects } from '../hooks/useProjects.js';
import { useDirectory } from '../hooks/useUsers.js';
import ProjectCard from '../components/project/ProjectCard.jsx';
import Sidebar, { DEPARTMENTS } from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { canManage } from '../utils/userTier.js';

const DEPT_TABS = [
  { value: 'terkovi',    label: 'Теркови' },
  { value: 'projects',   label: 'Проекти' },
  { value: 'tasks',      label: 'Тековни задачи' },
  { value: 'nabavki',    label: 'Набавки' },
  { value: 'dogovori',   label: 'Договори' },
  { value: 'vraboteni',  label: 'Вработени' },
];

// Departments that have the Purchase Order tab
const PO_DEPTS = ['sales', 'quality_assurance', 'r_and_d', 'nabavki'];

// Departments that have the Leads (Потенцијални клиенти) tab
const LEADS_DEPTS = ['sales', 'top_management'];

const EmployeeList = ({ dept }) => {
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
        Нема регистрирани вработени во ова одделение.
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
                  <ShieldCheck size={10} /> Менаџер
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {DEPARTMENTS.find((d) => d.value === u.department)?.label || u.department}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const dept = searchParams.get('dept') || '';
  const tab  = searchParams.get('tab')  || 'projects';
  const { user } = useAuth();

  const { data: projects, isLoading, error } = useProjects(dept);

  const deptLabel = dept
    ? DEPARTMENTS.find((d) => d.value === dept)?.label || dept
    : null;

  const title = deptLabel || 'Огласна табла';
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

        {/* Department sub-tabs — only shown when a specific dept is selected */}
        {dept && (
          <div className="border-b border-gray-200 bg-white px-4">
            <nav className="flex gap-1 overflow-x-auto">
              {[
                ...DEPT_TABS,
                ...(PO_DEPTS.includes(dept) ? [{ value: 'po', label: 'Purchase Order' }] : []),
                ...(LEADS_DEPTS.includes(dept) ? [{ value: 'leads', label: 'Потенцијални клиенти' }] : []),
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => switchTab(t.value)}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    tab === t.value
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
        )}

        <main className="flex-1 p-6">

          {/* Kanban board — full width, no max-w constraint */}
          {dept && tab === 'tasks' && (
            <KanbanBoard dept={dept} />
          )}

          {/* Purchase Order list */}
          {dept && tab === 'po' && (
            <div className="max-w-3xl mx-auto">
              <POList />
            </div>
          )}

          {/* All other tabs — constrained to readable width */}
          {!(dept && (tab === 'tasks' || tab === 'po')) && (
            <div className="max-w-3xl mx-auto">

              {/* No dept selected → Whiteboard */}
              {!dept && <Whiteboard />}

              {(dept && tab === 'projects') && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {projects?.length ?? 0} проект{projects?.length !== 1 ? 'и' : ''}
                      </p>
                    </div>
                    {canManage(user) && (
                      <Link to={newProjectLink} className="btn-primary flex items-center gap-2">
                        <PlusCircle size={16} />
                        Нов проект
                      </Link>
                    )}
                  </div>

                  {isLoading && (
                    <div className="flex items-center justify-center py-16">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  )}

                  {error && (
                    <div className="text-center py-16 text-red-500">Неуспешно вчитување на проектите.</div>
                  )}

                  {!isLoading && !error && projects?.length === 0 && (
                    <div className="text-center py-16">
                      <p className="text-gray-400 text-sm mb-4">
                        Сè уште нема проекти{deptLabel ? ` во ${deptLabel}` : ''}.
                      </p>
                      {canManage(user) && (
                        <Link to={newProjectLink} className="btn-primary">
                          Креирај го првиот проект
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

              {dept && tab === 'nabavki' && (
                <div className="text-center py-16 text-gray-400 text-sm">
                  Набавки — наскоро
                </div>
              )}

              {dept && tab === 'dogovori' && (
                <AgreementsPage dept={dept} />
              )}

              {dept && tab === 'leads' && (
                <LeadsPage />
              )}

              {dept && tab === 'vraboteni' && (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Вработени</h2>
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
