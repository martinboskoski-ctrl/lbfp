import { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Trash2, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDeleteTask } from '../../hooks/useTasks.js';
import { fmtDateShort } from '../../utils/formatDate.js';
import TaskDetailModal from './TaskDetailModal.jsx';
import EditHistory from '../common/EditHistory.jsx';

const PRIORITY_CLS = {
  low:    'bg-gray-100 text-gray-500',
  medium: 'bg-blue-50 text-blue-600',
  high:   'bg-orange-50 text-orange-600',
  urgent: 'bg-red-50 text-red-600 font-semibold',
};

const PRIORITY_ACCENT = {
  low:    'border-l-gray-300',
  medium: 'border-l-blue-400',
  high:   'border-l-orange-400',
  urgent: 'border-l-red-500',
};

const TaskCard = ({ task, index, currentUser, isManager }) => {
  const { t }  = useTranslation('tasks');
  const { t: tc } = useTranslation('common');
  const [showDetail, setShowDetail] = useState(false);
  const deleteTask = useDeleteTask();

  const stop = (e) => e.stopPropagation();

  const isAssignee = String(task.assignedTo?._id || task.assignedTo) === String(currentUser._id);
  const isCreator  = String(task.createdBy?._id  || task.createdBy)  === String(currentUser._id);
  const isTopMgmt  = currentUser.department === 'top_management';

  const canMove   = isManager || (isAssignee && task.status !== 'approved');
  const canDelete = isCreator || isTopMgmt;

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'approved';
  const priorityCls   = PRIORITY_CLS[task.priority] || PRIORITY_CLS.medium;
  const priorityLabel = tc(`priority.${task.priority}`) || tc('priority.medium');

  return (
    <Draggable draggableId={task._id} index={index} isDragDisabled={!canMove}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => setShowDetail(true)}
          className={`group bg-white border border-gray-200 border-l-4 ${PRIORITY_ACCENT[task.priority] || PRIORITY_ACCENT.medium} rounded-lg p-2.5 transition-shadow ${
            snapshot.isDragging
              ? 'shadow-lg ring-2 ring-blue-200 rotate-[1deg]'
              : 'shadow-sm hover:shadow-md'
          } ${canMove ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
        >
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">{task.title}</p>
            {canDelete && (
              <button
                onClick={(e) => { stop(e); deleteTask.mutate(task._id); }}
                disabled={deleteTask.isPending}
                className="flex-shrink-0 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                title={t('deleteTooltip')}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>

          {/* Compact meta — priority + deadline on the left, edited marker + assignee on the right */}
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${priorityCls}`}>{priorityLabel}</span>
            {task.deadline && (
              <span className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full ${
                isOverdue ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'
              }`}>
                <Calendar size={10} />
                {fmtDateShort(task.deadline)}
              </span>
            )}
            <span className="ml-auto flex items-center gap-1.5">
              <span onClick={stop}><EditHistory history={task.editHistory} /></span>
              <span
                className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-bold flex-shrink-0"
                title={task.assignedTo?.name}
              >
                {task.assignedTo?.name?.[0]?.toUpperCase() ?? '?'}
              </span>
            </span>
          </div>

          {showDetail && (
            <TaskDetailModal task={task} onClose={() => setShowDetail(false)} />
          )}
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;
