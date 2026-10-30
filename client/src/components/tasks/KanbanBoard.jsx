import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DragDropContext } from '@hello-pangea/dnd';
import { Plus, Search, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTasks, useSetTaskStatus, useSetTaskTime } from '../../hooks/useTasks.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { canManage, isTopManagement } from '../../utils/userTier.js';
import { DEPARTMENTS } from '../layout/Sidebar.jsx';
import KanbanColumn from './KanbanColumn.jsx';
import AddTaskModal from './AddTaskModal.jsx';
import { TimeToast } from './TimeSpent.jsx';

const STATUSES = ['todo', 'in_progress', 'done', 'approved'];

const ALL_DEPTS = 'all';

const ownerId = (task) => String(task.assignedTo?._id || task.assignedTo);

const KanbanBoard = () => {
  const { t }     = useTranslation('tasks');
  const { t: tc } = useTranslation('common');
  const { user }  = useAuth();
  const isManager = canManage(user);
  const isTopMgmt = isTopManagement(user);

  const [showModal, setShowModal] = useState(false);
  const [search, setSearch]       = useState('');
  // Employees and managers start on their own cards; top management start on the
  // full company overview. The toggle switches between the two.
  const [onlyMine, setOnlyMine]   = useState(!isTopMgmt);

  // Top management pick a department via ?dept= (default: every department).
  // Everyone else is locked to their own department server-side.
  const [searchParams, setSearchParams] = useSearchParams();
  const dept = isTopMgmt ? searchParams.get('dept') || ALL_DEPTS : '';
  const allDepts = dept === ALL_DEPTS;
  const setDept = (value) => {
    const next = new URLSearchParams(searchParams);
    next.set('dept', value);
    setSearchParams(next, { replace: true });
  };

  const { data: tasks = [], isLoading, error } = useTasks(dept && !allDepts ? dept : undefined);
  const setStatus = useSetTaskStatus();
  const setTime   = useSetTaskTime();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return <p className="text-center py-16 text-red-500 text-sm">{t('loadError')}</p>;
  }

  const q = search.trim().toLowerCase();
  const filtered = tasks.filter((task) => {
    if (onlyMine && ownerId(task) !== String(user._id)) return false;
    if (q && !`${task.title} ${task.description || ''}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const byStatus = (status) => filtered.filter((task) => task.status === status);

  // A move is allowed if you manage the board, or you own the card and you're not
  // touching the 'approved' lane (approval is a manager-only transition).
  const canMoveTo = (task, target) =>
    isManager || (ownerId(task) === String(user._id)
      && target !== 'approved' && task.status !== 'approved');

  const onDragEnd = ({ draggableId, source, destination }) => {
    if (!destination || destination.droppableId === source.droppableId) return;
    const task   = tasks.find((x) => x._id === draggableId);
    const target = destination.droppableId;
    if (!task) return;
    if (!canMoveTo(task, target)) {
      toast.error(t('moveNotAllowed'));
      return;
    }
    setStatus.mutate({ id: task._id, status: target });

    // Finished your own task without a time yet → a small, skippable prompt.
    if (target === 'done' && ownerId(task) === String(user._id) && !task.timeSpentMinutes) {
      toast.custom((tt) => (
        <TimeToast
          visible={tt.visible}
          onPick={(minutes) => { setTime.mutate({ id: task._id, minutes }); toast.dismiss(tt.id); }}
          onDismiss={() => toast.dismiss(tt.id)}
        />
      ), { id: `time-${task._id}`, duration: 12000 });
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Board toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{t('title')}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t('totalCount', { count: filtered.length })}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isTopMgmt && (
            <select className="input py-1.5 w-44" value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value={ALL_DEPTS}>{tc('allDepartments')}</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.value} value={d.value}>{tc(`dept.${d.value}`)}</option>
              ))}
            </select>
          )}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="input pl-8 py-1.5 w-44 sm:w-56"
            />
          </div>
          <button
            onClick={() => setOnlyMine((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              onlyMine
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            <UserIcon size={14} /> {t('onlyMine')}
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> {t('newTask')}
          </button>
        </div>
      </div>

      {/* Kanban — 4 columns, horizontal scroll on small screens */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 min-h-0 flex gap-3 overflow-x-auto pb-2">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={byStatus(status)}
              currentUser={user}
              isManager={isManager}
              showDept={allDepts}
            />
          ))}
        </div>
      </DragDropContext>

      {/* Add task modal */}
      {showModal && (
        <AddTaskModal
          onClose={() => setShowModal(false)}
          defaultDept={dept && !allDepts ? dept : user?.department}
          isTopMgmt={isTopMgmt}
          isManager={isManager}
          currentUser={user}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
