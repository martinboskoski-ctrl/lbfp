import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  X, Loader2, Save, Pencil, Trash2,
  CheckCircle2, Calendar, Flag, User as UserIcon, Folder, Clock, MessageSquarePlus,
} from 'lucide-react';
import {
  useUpdateTask, useSetTaskStatus, useDeleteTask,
  useRequestTaskChange, useResolveTaskChange,
} from '../../hooks/useTasks.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { fmtDateShort } from '../../utils/formatDate.js';
import EditHistory from '../common/EditHistory.jsx';

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
  const requestChange = useRequestTaskChange();
  const resolveChange = useResolveTaskChange();

  // Permissions — mirrors server-side gates.
  const isTopMgmt  = user?.department === 'top_management';
  const isAssignee = String(task.assignedTo?._id || task.assignedTo) === String(user?._id);
  const isCreator  = String(task.createdBy?._id  || task.createdBy)  === String(user?._id);
  const isDeptMgr  = user?.isManager && user?.department === task.department;
  const isManager  = isDeptMgr || isTopMgmt;
  // Only the task-giver (creator or a manager) may edit content / delete.
  const canEdit    = isCreator || isManager;
  const canDelete  = isCreator || isTopMgmt;
  // The assignee can't edit, but may request a change (deadline/description/goals…).
  const canRequestChange = isAssignee && !canEdit;

  // Owners may change status (but never into/out of 'approved'); managers set anything.
  const canSetStatus     = isManager || (isAssignee && task.status !== 'approved');
  const settableStatuses = isManager ? STATUSES : STATUSES.filter((s) => s !== 'approved');

  const [editing, setEditing] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [crText, setCrText] = useState('');
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

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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

  const sendChange = () => {
    if (!crText.trim()) return;
    requestChange.mutate(
      { id: task._id, message: crText.trim() },
      { onSuccess: () => { setCrText(''); setRequesting(false); } }
    );
  };

  const changeRequests = task.changeRequests || [];

  const isOverdue = task.deadline && new Date(task.deadline) < new Date()
    && task.status !== 'approved' && task.status !== 'done';

  // Rendered through a portal to document.body so it is NOT a descendant of the
  // draggable task card — otherwise the drag handle swallows clicks (e.g. the X).
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      // Backdrop click closes. stopPropagation prevents the click from bubbling
      // through the React tree to the parent card's onClick (which would reopen it).
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >

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
                  <EditHistory history={task.editHistory} className="ml-1" />
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

              {/* Change requests — assignee asks the task-giver to change it */}
              {(changeRequests.length > 0 || canRequestChange) && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">
                    {t('changeReq.title')}
                  </div>

                  {changeRequests.length > 0 && (
                    <ul className="space-y-2 mb-3">
                      {changeRequests.map((cr) => (
                        <li key={cr._id} className="flex items-start gap-2 text-sm">
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${cr.status === 'open' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-700 whitespace-pre-wrap">{cr.message}</p>
                            <p className="text-xs text-slate-400">
                              {cr.requestedBy?.name} · {fmtDateShort(cr.createdAt)} · {t(`changeReq.${cr.status}`)}
                            </p>
                          </div>
                          {canEdit && cr.status === 'open' && (
                            <button
                              onClick={() => resolveChange.mutate({ id: task._id, crId: cr._id })}
                              disabled={resolveChange.isPending}
                              className="text-xs font-medium text-blue-600 hover:underline flex-shrink-0"
                            >
                              {t('changeReq.resolve')}
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {canRequestChange && (
                    requesting ? (
                      <div className="space-y-2">
                        <textarea
                          className="input resize-none text-sm"
                          rows={2}
                          placeholder={t('changeReq.placeholder')}
                          value={crText}
                          onChange={(e) => setCrText(e.target.value)}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button onClick={sendChange} disabled={!crText.trim() || requestChange.isPending} className="btn-primary text-sm py-1.5">
                            {t('changeReq.send')}
                          </button>
                          <button onClick={() => { setRequesting(false); setCrText(''); }} className="btn-secondary text-sm py-1.5">
                            {tc('cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRequesting(true)}
                        className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        <MessageSquarePlus size={14} /> {t('changeReq.request')}
                      </button>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TaskDetailModal;
