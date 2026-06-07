import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ListChecks, FileText, AlarmClock, ChevronRight, Loader2, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useEmployeeTasks } from '../../hooks/useTasks.js';
import { useMyRequests } from '../../hooks/useRequests.js';
import RequestCard from '../requests/RequestCard.jsx';
import Whiteboard from '../Whiteboard.jsx';
import { fmtDate } from '../../utils/formatDate.js';

const PRIORITY_DOT = {
  low:    'bg-gray-300',
  medium: 'bg-blue-400',
  high:   'bg-amber-500',
  urgent: 'bg-red-500',
};

const TASK_STATUS_COLORS = {
  todo:        'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  done:        'bg-green-100 text-green-700',
  approved:    'bg-green-100 text-green-700',
};

const ACTIVE_TASK_STATUSES   = ['todo', 'in_progress'];
const ACTIVE_REQUEST_STATUSES = ['pending', 'in_progress'];

// Midnight today, used to bucket deadlines into overdue / today / upcoming.
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const daysUntil = (date) =>
  Math.round((new Date(date).setHours(0, 0, 0, 0) - startOfToday()) / 86400000);

const SectionCard = ({ title, icon: Icon, count, action, children }) => (
  <section className="card p-5">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={17} className="text-gray-400" />}
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {count > 0 && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const EmptyState = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-10 text-gray-300">
    <CheckCircle2 size={28} className="mb-2 opacity-50" />
    <p className="text-xs">{text}</p>
  </div>
);

const Spinner = () => (
  <div className="flex justify-center py-10">
    <Loader2 size={22} className="animate-spin text-blue-500" />
  </div>
);

const DeadlineLabel = ({ date, t }) => {
  const d = daysUntil(date);
  if (d < 0)  return <span className="text-red-600 font-medium">{t('home.overdue')} · {fmtDate(date)}</span>;
  if (d === 0) return <span className="text-amber-600 font-medium">{t('home.dueToday')}</span>;
  return <span className="text-gray-500">{fmtDate(date)}</span>;
};

const HomeDashboard = () => {
  const { t } = useTranslation('dashboard');
  const { t: tt } = useTranslation('tasks');
  const { user } = useAuth();

  const { data: tasks = [], isLoading: tasksLoading } = useEmployeeTasks(user?._id);
  const { data: requests = [], isLoading: reqLoading } = useMyRequests();

  const firstName = user?.name?.split(' ')[0] ?? '';

  const activeTasks = tasks
    .filter((task) => ACTIVE_TASK_STATUSES.includes(task.status))
    .sort((a, b) => {
      if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
      return a.deadline ? -1 : b.deadline ? 1 : 0;
    });

  const activeRequests = requests.filter((r) => ACTIVE_REQUEST_STATUSES.includes(r.status));

  // Reminders: active tasks with a deadline that is overdue or within the next 7 days.
  const reminders = activeTasks
    .filter((task) => task.deadline && daysUntil(task.deadline) <= 7)
    .slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {t('home.greeting', { name: firstName })}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">{t('home.subtitle')}</p>
      </div>

      {/* Deadline reminder strip */}
      {reminders.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex items-center gap-2 mb-3 text-amber-800">
            <AlarmClock size={16} />
            <h3 className="text-sm font-semibold">{t('home.deadlines')}</h3>
          </div>
          <ul className="space-y-2">
            {reminders.map((task) => (
              <li key={task._id} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-gray-800">{task.title}</span>
                <span className="flex-shrink-0 text-xs">
                  <DeadlineLabel date={task.deadline} t={t} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tasks + Requests */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* My tasks */}
        <SectionCard
          icon={ListChecks}
          title={t('home.myTasks')}
          count={activeTasks.length}
        >
          {tasksLoading ? (
            <Spinner />
          ) : activeTasks.length === 0 ? (
            <EmptyState text={t('home.myTasksEmpty')} />
          ) : (
            <ul className="divide-y divide-gray-100 -my-2">
              {activeTasks.slice(0, 6).map((task) => (
                <li key={task._id} className="flex items-center gap-3 py-2.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority] || PRIORITY_DOT.medium}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-800 truncate">{task.title}</p>
                    {task.deadline && (
                      <p className="text-[11px] mt-0.5">
                        <DeadlineLabel date={task.deadline} t={t} />
                      </p>
                    )}
                  </div>
                  <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${TASK_STATUS_COLORS[task.status]}`}>
                    {tt(`column.${task.status}`)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* My requests */}
        <SectionCard
          icon={FileText}
          title={t('home.myRequests')}
          count={activeRequests.length}
          action={
            <Link to="/requests" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
              {t('home.viewAll')} <ChevronRight size={13} />
            </Link>
          }
        >
          {reqLoading ? (
            <Spinner />
          ) : activeRequests.length === 0 ? (
            <EmptyState text={t('home.myRequestsEmpty')} />
          ) : (
            <div className="space-y-3">
              {activeRequests.slice(0, 4).map((request) => (
                <RequestCard key={request._id} request={request} />
              ))}
            </div>
          )}
        </SectionCard>

      </div>

      {/* Announcements — Огласна табла */}
      <div className="pt-2 border-t border-gray-100">
        <Whiteboard />
      </div>

    </div>
  );
};

export default HomeDashboard;
