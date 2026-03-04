import { ChevronLeft, ChevronRight, CheckCircle2, Trash2, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUpdateTaskStatus, useApproveTask, useDeleteTask } from '../../hooks/useTasks.js';
import { fmtDateShort } from '../../utils/formatDate.js';

const PRIORITY_CLS = {
  low:    'bg-gray-100 text-gray-500',
  medium: 'bg-blue-50 text-blue-600',
  high:   'bg-orange-50 text-orange-600',
  urgent: 'bg-red-50 text-red-600 font-semibold',
};

const STATUSES = ['todo', 'in_progress', 'done', 'approved'];

const TaskCard = ({ task, currentUser, isManager }) => {
  const { t } = useTranslation('tasks');
  const { t: tc } = useTranslation('common');

  const updateStatus = useUpdateTaskStatus();
  const approveTask  = useApproveTask();
  const deleteTask   = useDeleteTask();

  const statusIdx  = STATUSES.indexOf(task.status);
  const isAssignee = String(task.assignedTo?._id || task.assignedTo) === String(currentUser._id);
  const isCreator  = String(task.createdBy?._id  || task.createdBy)  === String(currentUser._id);
  const isTopMgmt  = currentUser.department === 'top_management';

  const canMove      = isAssignee || isManager;
  const canGoBack    = canMove && statusIdx > 0 && !(isAssignee && !isManager && task.status === 'approved');
  const canGoForward = canMove && statusIdx < STATUSES.length - 1
    && !(isAssignee && !isManager && statusIdx >= 2);

  const canApprove = isManager && task.status === 'done';
  const canDelete  = isCreator || isTopMgmt;

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'approved';
  const priorityCls = PRIORITY_CLS[task.priority] || PRIORITY_CLS.medium;
  const priorityLabel = tc(`priority.${task.priority}`) || tc('priority.medium');

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">

      {/* Title row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
        {canDelete && (
          <button
            onClick={() => deleteTask.mutate(task._id)}
            disabled={deleteTask.isPending}
            className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors mt-0.5"
            title={t('deleteTooltip')}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{task.description}</p>
      )}

      {/* Chips */}
      <div className="flex flex-wrap gap-1 mb-2">
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${priorityCls}`}>
          {priorityLabel}
        </span>
        {task.deadline && (
          <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ${
            isOverdue ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'
          }`}>
            <Calendar size={10} />
            {fmtDateShort(task.deadline)}
          </span>
        )}
        {task.project?.title && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 truncate max-w-[90px]">
            {task.project.title}
          </span>
        )}
      </div>

      {/* Assignee */}
      <div className="flex items-center gap-1.5 mb-2">
        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
          {task.assignedTo?.name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <span className="text-xs text-gray-500 truncate">{task.assignedTo?.name}</span>
      </div>

      {/* Approved by */}
      {task.status === 'approved' && task.approvedBy && (
        <p className="text-xs text-green-600 mb-2">{'✓ ' + t('approvedBy', { name: task.approvedBy.name })}</p>
      )}

      {/* Actions row */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <button
          onClick={() => updateStatus.mutate({ id: task._id, direction: 'backward' })}
          disabled={!canGoBack || updateStatus.isPending}
          className={`p-2 rounded transition-colors ${
            canGoBack ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-800' : 'text-gray-200 cursor-not-allowed'
          }`}
          title={t('backTooltip')}
        >
          <ChevronLeft size={16} />
        </button>

        {canApprove && (
          <button
            onClick={() => approveTask.mutate(task._id)}
            disabled={approveTask.isPending}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs font-medium transition-colors"
            title={t('approveTooltip')}
          >
            <CheckCircle2 size={13} />
            {t('approve')}
          </button>
        )}

        <button
          onClick={() => updateStatus.mutate({ id: task._id, direction: 'forward' })}
          disabled={!canGoForward || updateStatus.isPending}
          className={`p-2 rounded transition-colors ${
            canGoForward ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-800' : 'text-gray-200 cursor-not-allowed'
          }`}
          title={t('forwardTooltip')}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
