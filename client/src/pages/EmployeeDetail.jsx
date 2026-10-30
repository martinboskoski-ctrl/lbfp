import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, User as UserIcon, ListChecks } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { useEmployeeFile } from '../hooks/useEmployees.js';
import { useAuth } from '../context/AuthContext.jsx';
import { canViewEmployeeCards, isTopManagement } from '../utils/userTier.js';
import EmployeeTasksTab from '../components/employee/EmployeeTasksTab.jsx';
import LeaveCard from '../components/employee/LeaveCard.jsx';
import DisciplineCard from '../components/employee/DisciplineCard.jsx';

const Field = ({ label, children }) => (
  <div className="min-w-0">
    <div className="text-[11px] text-slate-500 uppercase tracking-wide">{label}</div>
    <div className="text-sm text-slate-900 truncate">{children || '—'}</div>
  </div>
);

const Shell = ({ title, children }) => (
  <div className="flex min-h-screen">
    <Sidebar />
    <div className="flex-1 flex flex-col">
      <Topbar title={title} />
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  </div>
);

const EmployeeCard = () => {
  const { id } = useParams();
  const { t } = useTranslation('employees');
  const { t: tc } = useTranslation('common');
  const { user: viewer } = useAuth();
  const { data, isLoading, error } = useEmployeeFile(id);
  const [tab, setTab] = useState('overview');

  if (isLoading) {
    return (
      <Shell title={t('detail.topbarTitle')}>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell title={t('detail.errorTitle')}>
        <div className="card p-6 max-w-xl mx-auto text-center">
          <p className="text-red-600 mb-3">{t('detail.noAccess')}</p>
          <Link to="/employees" className="btn-secondary inline-flex items-center gap-1">
            <ArrowLeft size={14} /> {t('detail.backToAll')}
          </Link>
        </div>
      </Shell>
    );
  }

  const f = data.file;
  const perms = data.permissions;
  const u = f.user;
  const p = f.profile || {};
  // Tasks are scoped to the viewer's own department unless they are top management.
  const tabs = [
    { key: 'overview', icon: UserIcon },
    ...(isTopManagement(viewer) ? [{ key: 'tasks', icon: ListChecks }] : []),
  ];

  return (
    <Shell title={t('detail.topbarTitle')}>
      <div className="max-w-5xl mx-auto">
        <Link to="/employees" className="text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 mb-3">
          <ArrowLeft size={14} /> {t('detail.allEmployees')}
        </Link>

        {/* Who */}
        <div className="card p-4 sm:p-5 mb-4">
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div className="w-12 h-12 rounded-md bg-slate-100 flex items-center justify-center text-slate-700 font-semibold flex-shrink-0">
              {u.name?.split(' ').map((s) => s[0]).slice(0, 2).join('')}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">{u.name}</h1>
              {u.isManager && <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 text-slate-800">{t('detail.pillManager')}</span>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
            <Field label={t('detail.email')}>{u.email}</Field>
            <Field label={t('detail.fPosition')}>{p.position}</Field>
            <Field label={t('detail.sector')}>{tc(`dept.${u.department}`)}</Field>
            <Field label={t('detail.managerLabel')}>{f.manager?.name}</Field>
          </div>
        </div>

        {tabs.length > 1 && (
          <div className="border-b border-slate-200 mb-4 flex gap-1">
            {tabs.map(({ key, icon }) => {
              const IconCmp = icon;
              return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-3 py-2 text-sm flex items-center gap-1.5 border-b-2 transition-colors ${
                  tab === key ? 'border-slate-800 text-slate-900 font-medium' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <IconCmp size={14} /> {t(`detail.tab.${key}`)}
              </button>
              );
            })}
          </div>
        )}

        {tab === 'overview' && (
          <>
            <LeaveCard employeeId={u._id} leave={f.leave} canManage={perms.canManage} canEditEntitlement={perms.canEdit} />
            <DisciplineCard employeeId={u._id} records={f.discipline || []} canManage={perms.canManage} canDelete={perms.canEdit} />
          </>
        )}

        {tab === 'tasks' && <EmployeeTasksTab employee={u} canAddTasks />}
      </div>
    </Shell>
  );
};

// Top management + HR only; everyone else is sent back before anything is fetched.
const EmployeeDetail = () => {
  const { user } = useAuth();
  return canViewEmployeeCards(user) ? <EmployeeCard /> : <Navigate to="/dashboard" replace />;
};

export default EmployeeDetail;
