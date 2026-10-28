import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlarmClock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useEmployeeTasks } from '../../hooks/useTasks.js';
import { fmtDate } from '../../utils/formatDate.js';
import TaskDetailModal from '../tasks/TaskDetailModal.jsx';

const ACTIVE_STATUSES = ['todo', 'in_progress'];
const WINDOW_DAYS = 7;

const daysUntil = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(date).setHours(0, 0, 0, 0) - today) / 86400000);
};

// My active tasks that are overdue or due within the next WINDOW_DAYS days.
const DeadlinesPanel = () => {
  const { t } = useTranslation('dashboard');
  const { user } = useAuth();
  const { data: tasks = [], isLoading } = useEmployeeTasks(user?._id);
  const [openTask, setOpenTask] = useState(null);

  const upcoming = tasks
    .filter((task) => ACTIVE_STATUSES.includes(task.status) && task.deadline
      && daysUntil(task.deadline) <= WINDOW_DAYS)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  return (
    <section className="card p-3 flex flex-col min-h-0">
      <div className="flex items-center gap-2 mb-2 shrink-0 text-amber-700">
        <AlarmClock size={15} />
        <h3 className="text-sm font-semibold">{t('home.deadlines')}</h3>
        {upcoming.length > 0 && (
          <span className="ml-auto text-xs font-semibold text-amber-700">{upcoming.length}</span>
        )}
      </div>

      <div className="min-h-0 overflow-y-auto -mx-1 px-1">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="flex items-center gap-2 py-3 text-xs text-gray-400">
            <CheckCircle2 size={14} className="opacity-60" /> {t('home.noDeadlines')}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {upcoming.map((task) => {
              const d = daysUntil(task.deadline);
              return (
                <li key={task._id}>
                  <button
                    onClick={() => setOpenTask(task)}
                    className="w-full text-left py-2 px-1 rounded hover:bg-gray-50"
                  >
                    <p className="text-sm text-gray-800 truncate">{task.title}</p>
                    <p className="text-[11px] mt-0.5">
                      {d < 0 ? (
                        <span className="text-red-600 font-medium">{t('home.overdue')} · {fmtDate(task.deadline)}</span>
                      ) : d === 0 ? (
                        <span className="text-amber-600 font-medium">{t('home.dueToday')}</span>
                      ) : (
                        <span className="text-gray-500">{fmtDate(task.deadline)}</span>
                      )}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {openTask && <TaskDetailModal task={openTask} onClose={() => setOpenTask(null)} />}
    </section>
  );
};

export default DeadlinesPanel;
