import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Loader2, Save, Pencil, Trash2,
  CheckCircle2, Calendar, Flag, User as UserIcon, Folder, Clock,
} from 'lucide-react';
import {
  useUpdateTask, useSetTaskStatus, useDeleteTask,
} from '../../hooks/useTasks.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { fmtDateShort } from '../../utils/formatDate.js';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES   = ['todo', 'in_progress', 'done', 'approved'];

const PRIORITY_TONE = {
  low:    'bg-slate-100 text-slate-600',
  medium: 'bg-blue-50 text-blue-700',
  high:   'bg-amber-50 text-amber-700',
  urgent: 'bg-red-50 text-red-700 font-semibold',
};

const STATUS_TONE = {
  todo:        'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-50 text-blue-700',
  done:        'bg-emerald-50 text-emerald-700',
  approved:    'bg-emerald-100 text-emerald-800',
};

const toDateInput = (d) => {
  if (!d) return '';
  const x = new Date(d);
  if (isNaN(x.getTime())) return '';
  return x.toISOString().slice(0, 10);
};

const TaskDetailModal = ({ task, onClose }) => {
  const { t }     = useTranslation('tasks');
  const { t: tc } = useTranslation('common');
  const { user }  = useAuth();

  const updateTask = useUpdateTask();
  const setStatus  = useSetTaskStatus();
  const deleteTask = useDeleteTask();

  // Permissions — mirrors server-side gates.
  const isTopMgmt  = user?.department === 'top_management';
  const isAssignee = String(task.assignedTo?._id || task.assignedTo) === String(user?._id);
  const isCreator  = String(task.createdBy?._id  || task.createdBy)  === String(user?._id);
  const isDeptMgr  = user?.isManager && user?.department === task.department;
  const isManager  = isDeptMgr || isTopMgmt;
  const canEdit    = isCreator || isManager;
  const canDelete  = isCreator || isTopMgmt;

  // Owners may change status (but never into/out of 'approved'); managers set anything.
  const canSetStatus     = isManager || (isAssignee && task.status !== 'approved');
  const settableStatuses = isManager ? STATUSES : STATUSES.filter((s) => s !== 'approved');

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title:       task.title || '',
    description: task.description || '',
    priority:    task.priority || 'medium',
    deadline:    toDateInput(task.deadline),
  });

  useEffect(() => {
    setForm({
      title:       task.title || '',
      description: task.description || '',
      priority:    task.priority || 'medium',
      deadline:    toDateInput(task.deadline),
    });
  }, [task._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!form.title.trim()) return;
    await updateTask.mutateAsync({
      id: task._id,
      title:       form.title.trim(),
      description: form.description.trim(),
      priority:    form.priority,
      deadline:    form.deadline || null,
    });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(t('deleteConfirm', { defaultValue: 'Delete this task?' }))) return;
    await deleteTask.mutateAsync(task._id);
    onClose();
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date()
    && task.status !== 'approved' && task.status !== 'done';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className={`text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_TONE[task.status]}`}>
              {t(`column.${task.status}`, { defaultValue: task.status })}
            </span>
            {isOverdue && (
              <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                {t('overdue', { defaultValue: 'overdue' })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {canEdit && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 text-slate-400 hover:text-slate-700"
                title={t('edit', { defaultValue: 'Edit' })}
              >
                <Pencil size={14} />
              </button>
            )}
            {canDelete && !editing && (
              <button
                onClick={handleDelete}
                disabled={deleteTask.isPending}
                className="p-1.5 text-slate-400 hover:text-red-600"
                title={t('deleteTooltip')}
              >
                <Trash2 size={14} />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {editing ? (
            <>
              <div>
                <label className="label">{t('modal.titleLabel')}</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  autoFocus
                />
              </div>

              <div>
                <label className="label">{t('modal.descriptionLabel')}</label>
                <textarea
                  className="input resize-none"
                  rows={4}
                  placeholder={t('modal.descriptionPlaceholder')}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">{t('modal.priorityLabel')}</label>
                  <select
                    className="input"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{tc(`priority.${p}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{t('modal.deadlineLabel')}</label>
                  <input
                    type="date"
                    className="input"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button onClick={() => setEditing(false)} className="btn-secondary">
                  {tc('cancel')}
                </button>
                <button
                  onClick={save}
                  disabled={updateTask.isPending || !form.title.trim()}
                  className="btn-primary flex items-center gap-2"
                >
                  {updateTask.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {tc('save', { defaultValue: 'Save' })}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-slate-900 leading-snug">{task.title}</h2>

              {task.description ? (
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
                    {t('modal.descriptionLabel')}
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{task.description}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  {t('noDescription', { defaultValue: 'No description.' })}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Flag size={14} className="text-slate-400 flex-shrink-0" />
                  <span className={`px-2 py-0.5 rounded ${PRIORITY_TONE[task.priority]}`}>
                    {tc(`priority.${task.priority}`)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-slate-400 flex-shrink-0" />
                  <span className={isOverdue ? 'text-red-600 font-medium' : 'text-slate-700'}>
                    {task.deadline ? fmtDateShort(task.deadline) : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <UserIcon size={14} className="text-slate-400 flex-shrink-0" />
                  <span className="text-slate-700 truncate">{task.assignedTo?.name || '—'}</span>
                </div>
                {task.project?.title && (
                  <div className="flex items-center gap-2 text-sm">
                    <Folder size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="text-slate-700 truncate">{task.project.title}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock size={13} className="text-slate-400 flex-shrink-0" />
                  {t('createdBy', { defaultValue: 'Created by' })} {task.createdBy?.name || '—'}
                  {' · '}
                  {fmtDateShort(task.createdAt)}
                </div>
                {task.status === 'approved' && task.approvedBy && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700">
                    <CheckCircle2 size={13} className="flex-shrink-0" />
                    {t('approvedBy', { name: task.approvedBy.name })}
                    {' · '}
                    {fmtDateShort(task.approvedAt)}
                  </div>
                )}
              </div>

              {/* Status controls — direct set via pills */}
              {canSetStatus && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">
                    {t('statusLabel')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {settableStatuses.map((s) => {
                      const active = task.status === s;
                      return (
                        <button
                          key={s}
                          onClick={() => !active && setStatus.mutate({ id: task._id, status: s })}
                          disabled={active || setStatus.isPending}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            active
                              ? 'bg-blue-600 text-white border-blue-600 cursor-default'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-700'
                          }`}
                        >
                          {t(`column.${s}`)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
