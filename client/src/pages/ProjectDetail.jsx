import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Calendar, DollarSign, Users, CheckSquare, Square,
  Target, Building2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useProject, useProjectFiles, useUpdateProject } from '../hooks/useProjects.js';
import Sidebar, { DEPARTMENTS } from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import FileUploader from '../components/files/FileUploader.jsx';
import FileVersionList from '../components/files/FileVersionList.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { canManage } from '../utils/userTier.js';

const STATUS_CONFIG = {
  draft:     { label: 'Нацрт',     color: 'bg-gray-100 text-gray-600' },
  active:    { label: 'Активен',   color: 'bg-blue-100 text-blue-700' },
  on_hold:   { label: 'Пауза',     color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Завршен',   color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Откажан',   color: 'bg-red-100 text-red-600' },
};

const PRIORITY_CONFIG = {
  low:    { label: 'Ниска',  color: 'text-gray-500' },
  medium: { label: 'Средна', color: 'text-blue-600' },
  high:   { label: 'Висока', color: 'text-orange-500' },
  urgent: { label: 'Итна',   color: 'text-red-600 font-semibold' },
};

const TASK_STATUS_LABELS = {
  todo:        'На чекање',
  in_progress: 'Во тек',
  done:        'Завршено',
};

// ── Sub-components ─────────────────────────────────────────────────────────

const SectionCard = ({ title, icon: Icon, children }) => (
  <div className="card p-5">
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon size={15} className="text-gray-400" />}
      <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
    </div>
    {children}
  </div>
);

const TaskItem = ({ task, onToggleSubtask, onChangeStatus, canEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const doneSubtasks = task.subtasks?.filter((s) => s.done).length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <div className="flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors">
        {canEdit ? (
          <button
            type="button"
            onClick={() => onChangeStatus(task._id, task.status === 'done' ? 'todo' : 'done')}
            className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-green-600"
          >
            {task.status === 'done'
              ? <CheckSquare size={16} className="text-green-600" />
              : <Square size={16} />}
          </button>
        ) : (
          <div className="mt-0.5 flex-shrink-0">
            {task.status === 'done'
              ? <CheckSquare size={16} className="text-green-600" />
              : <Square size={16} className="text-gray-300" />}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {task.title}
            </span>
            <span className={`text-xs ${priority.color}`}>{priority.label}</span>
            {task.deadline && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar size={10} />
                {new Date(task.deadline).toLocaleDateString('mk-MK')}
              </span>
            )}
          </div>
          {task.assignedTo?.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {task.assignedTo.map((u) => u.name || u).join(', ')}
            </p>
          )}
          {totalSubtasks > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((x) => !x)}
              className="text-xs text-blue-600 mt-1 flex items-center gap-1"
            >
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {doneSubtasks}/{totalSubtasks} подзадачи
            </button>
          )}
        </div>
        {canEdit && (
          <select
            value={task.status}
            onChange={(e) => onChangeStatus(task._id, e.target.value)}
            className="text-xs border border-gray-200 rounded px-1.5 py-0.5 text-gray-600 bg-white flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {Object.entries(TASK_STATUS_LABELS).map(([val, lbl]) => (
              <option key={val} value={val}>{lbl}</option>
            ))}
          </select>
        )}
      </div>

      {expanded && task.subtasks?.length > 0 && (
        <div className="border-t border-gray-100 px-8 py-2 space-y-1.5">
          {task.subtasks.map((sub, i) => (
            <div key={i} className="flex items-center gap-2">
              {canEdit ? (
                <button type="button" onClick={() => onToggleSubtask(task._id, i)}>
                  {sub.done
                    ? <CheckSquare size={13} className="text-green-600" />
                    : <Square size={13} className="text-gray-400" />}
                </button>
              ) : (
                sub.done
                  ? <CheckSquare size={13} className="text-green-600" />
                  : <Square size={13} className="text-gray-300" />
              )}
              <span className={`text-xs ${sub.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {sub.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────

const ProjectDetail = () => {
  const { id } = useParams();
  const { data: project, isLoading, error } = useProject(id);
  const { data: files } = useProjectFiles(id);
  const { user } = useAuth();
  const updateProject = useUpdateProject(id);

  const isManager = canManage(user);

  const handleToggleSubtask = (taskId, subtaskIdx) => {
    const updatedTasks = project.tasks.map((t) => {
      if (String(t._id) !== String(taskId)) return t;
      return {
        ...t,
        subtasks: t.subtasks.map((s, i) => i === subtaskIdx ? { ...s, done: !s.done } : s),
      };
    });
    updateProject.mutate({ tasks: updatedTasks });
  };

  const handleChangeTaskStatus = (taskId, newStatus) => {
    const updatedTasks = project.tasks.map((t) =>
      String(t._id) === String(taskId) ? { ...t, status: newStatus } : t
    );
    updateProject.mutate({ tasks: updatedTasks });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-red-500">
          Проектот не е пронајден.
        </div>
      </div>
    );
  }

  const status   = STATUS_CONFIG[project.status]   || STATUS_CONFIG.draft;
  const priority = PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG.medium;
  const deptLabel = DEPARTMENTS.find((d) => d.value === project.department)?.label || project.department;

  const doneTasks  = project.tasks?.filter((t) => t.status === 'done').length ?? 0;
  const totalTasks = project.tasks?.length ?? 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={project.title} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">

            {/* Header strip */}
            <div className="flex items-start gap-3 mb-6 flex-wrap">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
              <span className={`text-xs font-medium ${priority.color}`}>
                Приоритет: {priority.label}
              </span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{deptLabel}</span>
              {project.owner?.name && (
                <span className="text-xs text-gray-400 ml-auto">Носител: {project.owner.name}</span>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* ── Left column ─────────────────────────────────────── */}
              <div className="lg:col-span-1 space-y-4">

                {/* Key info */}
                <SectionCard title="Информации" icon={Building2}>
                  <dl className="space-y-2.5 text-sm">
                    {project.description && (
                      <div>
                        <dt className="text-xs text-gray-400 mb-0.5">Опис</dt>
                        <dd className="text-gray-700 whitespace-pre-wrap">{project.description}</dd>
                      </div>
                    )}
                    {(project.startDate || project.endDate) && (
                      <div className="flex gap-4">
                        {project.startDate && (
                          <div>
                            <dt className="text-xs text-gray-400">Почеток</dt>
                            <dd className="flex items-center gap-1 text-gray-700">
                              <Calendar size={12} />
                              {new Date(project.startDate).toLocaleDateString('mk-MK')}
                            </dd>
                          </div>
                        )}
                        {project.endDate && (
                          <div>
                            <dt className="text-xs text-gray-400">Рок</dt>
                            <dd className="flex items-center gap-1 text-gray-700">
                              <Calendar size={12} />
                              {new Date(project.endDate).toLocaleDateString('mk-MK')}
                            </dd>
                          </div>
                        )}
                      </div>
                    )}
                    {project.budget != null && (
                      <div>
                        <dt className="text-xs text-gray-400">Буџет</dt>
                        <dd className="flex items-center gap-1 text-gray-700">
                          <DollarSign size={12} />
                          {project.budget.toLocaleString('mk-MK')} МКД
                        </dd>
                      </div>
                    )}
                  </dl>
                </SectionCard>

                {/* Goals */}
                {project.goals?.length > 0 && (
                  <SectionCard title="Цели" icon={Target}>
                    <ul className="space-y-1.5">
                      {project.goals.map((g, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                )}

                {/* Team */}
                {project.assignedUsers?.length > 0 && (
                  <SectionCard title="Тим" icon={Users}>
                    <div className="space-y-1.5">
                      {project.assignedUsers.map((u) => (
                        <div key={u._id} className="flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
                            {u.name?.[0]?.toUpperCase()}
                          </div>
                          <span className="text-gray-700">{u.name}</span>
                          <span className="text-xs text-gray-400">
                            {DEPARTMENTS.find((d) => d.value === u.department)?.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* Involved departments */}
                {project.involvedDepartments?.length > 0 && (
                  <SectionCard title="Вклучени одделенија" icon={Building2}>
                    <div className="space-y-3">
                      {project.involvedDepartments.map((inv) => {
                        const label = DEPARTMENTS.find((d) => d.value === inv.department)?.label || inv.department;
                        return (
                          <div key={inv.department} className="bg-blue-50 rounded-lg p-3 text-xs space-y-1.5">
                            <div className="font-semibold text-blue-800">{label}</div>
                            {inv.reason && (
                              <div>
                                <span className="text-gray-500">Причина: </span>
                                <span className="text-gray-700">{inv.reason}</span>
                              </div>
                            )}
                            {inv.expected && (
                              <div>
                                <span className="text-gray-500">Очекувања: </span>
                                <span className="text-gray-700">{inv.expected}</span>
                              </div>
                            )}
                            {inv.deadline && (
                              <div className="flex items-center gap-1 text-gray-500">
                                <Calendar size={10} />
                                Рок: {new Date(inv.deadline).toLocaleDateString('mk-MK')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </SectionCard>
                )}
              </div>

              {/* ── Right column ─────────────────────────────────────── */}
              <div className="lg:col-span-2 space-y-4">

                {/* Tasks */}
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckSquare size={15} className="text-gray-400" />
                      <h2 className="text-sm font-semibold text-gray-700">Задачи</h2>
                    </div>
                    {totalTasks > 0 && (
                      <span className="text-xs text-gray-400">{doneTasks}/{totalTasks} завршени</span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {totalTasks > 0 && (
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                      <div
                        className="bg-green-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.round((doneTasks / totalTasks) * 100)}%` }}
                      />
                    </div>
                  )}

                  {project.tasks?.length === 0 && (
                    <p className="text-sm text-gray-400 py-4 text-center">Нема задачи.</p>
                  )}

                  <div className="space-y-2">
                    {project.tasks?.map((task) => (
                      <TaskItem
                        key={task._id}
                        task={task}
                        canEdit={isManager}
                        onToggleSubtask={handleToggleSubtask}
                        onChangeStatus={handleChangeTaskStatus}
                      />
                    ))}
                  </div>
                </div>

                {/* Files */}
                {isManager && (
                  <FileUploader projectId={project._id} gateNumber={0} />
                )}
                <FileVersionList files={files || []} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectDetail;
