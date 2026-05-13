import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus, Loader2, Clock, AlertTriangle, CheckCircle2, ListTodo, Timer,
  Flag, ExternalLink,
} from 'lucide-react';
import { useEmployeeTasks } from '../../hooks/useTasks.js';
import AddEmployeeTaskModal from './AddEmployeeTaskModal.jsx';

const DAY = 86_400_000;
const fmtShort = (d) => (d ? new Date(d).toLocaleDateString('mk-MK') : '—');

const PRIORITY_TONE = {
  low:    'bg-slate-100 text-slate-600',
  medium: 'bg-blue-50 text-blue-600',
  high:   'bg-amber-50 text-amber-700',
  urgent: 'bg-red-50 text-red-700',
};

const STATUS_LABEL = {
  todo:        { label: 'todo',        cls: 'bg-slate-200' },
  in_progress: { label: 'in progress', cls: 'bg-blue-400' },
  done:        { label: 'done',        cls: 'bg-emerald-400' },
  approved:    { label: 'approved',    cls: 'bg-emerald-600' },
};

// ── Compute KPI snapshot from a flat tasks array ─────────────────────────────
const computeKpis = (tasks) => {
  const now = new Date();
  const thirtyAgo = new Date(now.getTime() - 30 * DAY);

  const open = tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress');
  const completed30d = tasks.filter(
    (t) => (t.status === 'done' || t.status === 'approved') &&
           new Date(t.updatedAt) >= thirtyAgo
  );
  const overdue = open.filter((t) => t.deadline && new Date(t.deadline) < now);

  let onTime = null;
  if (completed30d.length > 0) {
    const withDeadline = completed30d.filter((t) => t.deadline);
    const hits = withDeadline.filter((t) => new Date(t.updatedAt) <= new Date(t.deadline)).length;
    onTime = withDeadline.length === 0 ? 100 : Math.round((hits / withDeadline.length) * 100);
  }

  let avgCycle = null;
  if (completed30d.length > 0) {
    const sum = completed30d.reduce(
      (acc, t) => acc + (new Date(t.updatedAt) - new Date(t.createdAt)),
      0
    );
    avgCycle = Math.round(sum / completed30d.length / DAY * 10) / 10;
  }

  return {
    open:           open.length,
    completed30d:   completed30d.length,
    overdue:        overdue.length,
    onTime,
    avgCycle,
  };
};

const KpiTile = ({ icon: Icon, label, value, sub, tone = 'default' }) => {
  const tones = {
    default: 'bg-white border-slate-200',
    warn:    'bg-amber-50/40 border-amber-200',
    danger:  'bg-red-50/40 border-red-200',
    good:    'bg-emerald-50/40 border-emerald-200',
  };
  return (
    <div className={`flex-1 min-w-[140px] rounded-xl border p-3 ${tones[tone]}`}>
      <div className="flex items-center gap-2 text-[11px] text-slate-500 uppercase tracking-wide">
        <Icon size={12} /> {label}
      </div>
      <div className="text-xl font-bold text-slate-900 mt-1">{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
};

// ── Stacked status mix bar ───────────────────────────────────────────────────
const StatusMixBar = ({ tasks, t, tt }) => {
  const counts = useMemo(() => {
    const c = { todo: 0, in_progress: 0, done: 0, approved: 0 };
    tasks.forEach((task) => { if (c[task.status] !== undefined) c[task.status] += 1; });
    return c;
  }, [tasks]);

  const total = counts.todo + counts.in_progress + counts.done + counts.approved;
  if (total === 0) {
    return <p className="text-xs text-slate-400 italic">{t('emptyMix')}</p>;
  }

  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        {['todo', 'in_progress', 'done', 'approved'].map((k) => (
          counts[k] > 0 && (
            <div
              key={k}
              className={STATUS_LABEL[k].cls}
              style={{ width: `${(counts[k] / total) * 100}%` }}
              title={`${k}: ${counts[k]}`}
            />
          )
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
        {['todo', 'in_progress', 'done', 'approved'].map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={`inline-block w-2 h-2 rounded-full ${STATUS_LABEL[k].cls}`} />
            {tt(`column.${k}`)} <span className="text-slate-400">· {counts[k]}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

// ── Task row (compact) ───────────────────────────────────────────────────────
const TaskRow = ({ task, accent = false, tc, tt }) => {
  const overdue = task.deadline && new Date(task.deadline) < new Date()
    && (task.status === 'todo' || task.status === 'in_progress');
  const dueToday = task.deadline &&
    new Date(task.deadline).toDateString() === new Date().toDateString();

  return (
    <div className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
      accent ? 'border-blue-100 bg-blue-50/30' : 'border-slate-200 bg-white'
    }`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 flex-wrap">
          <span className={`px-1.5 py-0.5 rounded ${PRIORITY_TONE[task.priority] || 'bg-slate-100'}`}>
            <Flag size={10} className="inline -mt-0.5 mr-0.5" /> {tc(`priority.${task.priority}`)}
          </span>
          {task.deadline && (
            <span className={`inline-flex items-center gap-1 ${
              overdue ? 'text-red-600 font-medium' : dueToday ? 'text-amber-700 font-medium' : ''
            }`}>
              <Clock size={10} /> {fmtShort(task.deadline)}
            </span>
          )}
          {task.project && (
            <span className="truncate">· {task.project.title}</span>
          )}
          <span className="ml-auto inline-flex items-center gap-1 text-slate-400">
            {tt(`column.${task.status}`)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Section wrapper ──────────────────────────────────────────────────────────
const Section = ({ title, count, children }) => (
  <div className="card p-4 sm:p-5 mb-3 sm:mb-4">
    <div className="flex items-center gap-2 mb-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {count != null && (
        <span className="text-[11px] text-slate-400">{count}</span>
      )}
    </div>
    {children}
  </div>
);

// ── Main tab ─────────────────────────────────────────────────────────────────
const EmployeeTasksTab = ({ employee, canAddTasks }) => {
  const { t }     = useTranslation('employeeTasks');
  const { t: tc } = useTranslation('common');
  const { t: tt } = useTranslation('tasks');
  const [showAdd, setShowAdd] = useState(false);

  const { data: tasks = [], isLoading, error } = useEmployeeTasks(employee?._id);

  const kpis = useMemo(() => computeKpis(tasks), [tasks]);

  const sortByPrioThenDeadline = (a, b) => {
    const prio = { urgent: 0, high: 1, medium: 2, low: 3 };
    const pa = prio[a.priority] ?? 9;
    const pb = prio[b.priority] ?? 9;
    if (pa !== pb) return pa - pb;
    const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
    const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
    return da - db;
  };

  const upcoming = useMemo(() => {
    const horizon = new Date(Date.now() + 14 * DAY);
    return tasks
      .filter((x) => (x.status === 'todo' || x.status === 'in_progress') && x.deadline && new Date(x.deadline) <= horizon)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 8);
  }, [tasks]);

  const active = useMemo(
    () => tasks.filter((x) => x.status === 'todo' || x.status === 'in_progress').sort(sortByPrioThenDeadline),
    [tasks]
  );

  const completed = useMemo(
    () => tasks
      .filter((x) => x.status === 'done' || x.status === 'approved')
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 10),
    [tasks]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-slate-400" size={20} />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{t('loadFailed')}</p>;
  }

  return (
    <div>
      {/* Top action row */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-xs text-slate-500">
          {t('subtitle', { count: tasks.length })}
        </div>
        {canAddTasks && (
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={14} />
            {t('addTask')}
          </button>
        )}
      </div>

      {/* KPI tiles */}
      <div className="flex flex-wrap gap-2 mb-4">
        <KpiTile icon={ListTodo}      label={t('kpi.open')}        value={kpis.open} />
        <KpiTile icon={CheckCircle2}  label={t('kpi.completed30')} value={kpis.completed30d} tone="good" />
        <KpiTile icon={AlertTriangle} label={t('kpi.overdue')}     value={kpis.overdue}      tone={kpis.overdue > 0 ? 'danger' : 'default'} />
        <KpiTile
          icon={CheckCircle2}
          label={t('kpi.onTime')}
          value={kpis.onTime == null ? '—' : `${kpis.onTime}%`}
          sub={t('kpi.onTimeSub')}
          tone={kpis.onTime != null && kpis.onTime < 70 ? 'warn' : 'default'}
        />
        <KpiTile
          icon={Timer}
          label={t('kpi.cycle')}
          value={kpis.avgCycle == null ? '—' : t('kpi.cycleDays', { days: kpis.avgCycle })}
          sub={t('kpi.cycleSub')}
        />
      </div>

      {/* Status mix */}
      <Section title={t('section.statusMix')}>
        <StatusMixBar tasks={tasks} t={t} tt={tt} />
      </Section>

      {/* Upcoming deadlines */}
      <Section title={t('section.upcoming')} count={upcoming.length}>
        {upcoming.length === 0 ? (
          <p className="text-xs text-slate-400 italic">{t('emptyUpcoming')}</p>
        ) : (
          <div className="space-y-1.5">
            {upcoming.map((task) => (
              <TaskRow key={task._id} task={task} accent tc={tc} tt={tt} />
            ))}
          </div>
        )}
      </Section>

      {/* Active */}
      <Section title={t('section.active')} count={active.length}>
        {active.length === 0 ? (
          <p className="text-xs text-slate-400 italic">{t('emptyActive')}</p>
        ) : (
          <div className="space-y-1.5">
            {active.map((task) => (
              <TaskRow key={task._id} task={task} tc={tc} tt={tt} />
            ))}
          </div>
        )}
      </Section>

      {/* Completed */}
      <Section title={t('section.completed')} count={completed.length}>
        {completed.length === 0 ? (
          <p className="text-xs text-slate-400 italic">{t('emptyCompleted')}</p>
        ) : (
          <div className="space-y-1.5">
            {completed.map((task) => (
              <TaskRow key={task._id} task={task} tc={tc} tt={tt} />
            ))}
            <Link
              to={`/dashboard?dept=${employee.department}&tab=tasks`}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2"
            >
              {t('viewAllOnKanban')} <ExternalLink size={11} />
            </Link>
          </div>
        )}
      </Section>

      {showAdd && (
        <AddEmployeeTaskModal
          employee={employee}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
};

export default EmployeeTasksTab;
