import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DragDropContext } from '@hello-pangea/dnd';
import { Plus, Search, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTasks, useSetTaskStatus } from '../../hooks/useTasks.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { canManage, isTopManagement } from '../../utils/userTier.js';
import KanbanColumn from './KanbanColumn.jsx';
import AddTaskModal from './AddTaskModal.jsx';

const STATUSES = ['todo', 'in_progress', 'done', 'approved'];

const ownerId = (task) => String(task.assignedTo?._id || task.assignedTo);

const KanbanBoard = ({ dept }) => {
  const { t }     = useTranslation('tasks');
  const { user }  = useAuth();
  const isManager = canManage(user);
  const isTopMgmt = isTopManagement(user);

  const [showModal, setShowModal] = useState(false);
  const [search, setSearch]       = useState('');
  const [onlyMine, setOnlyMine]   = useState(false);

  const fetchDept = isTopMgmt ? dept : undefined;
  const { data: tasks = [], isLoading, error } = useTasks(fetchDept);
  const setStatus = useSetTaskStatus();

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
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Board toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{t('title')}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t('totalCount', { count: tasks.length })}</p>
        </div>

        <div className="flex items-center gap-2">
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
          {isManager && (
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={15} /> {t('newTask')}
            </button>
          )}
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
            />
          ))}
        </div>
      </DragDropContext>

      {/* Add task modal */}
      {showModal && (
        <AddTaskModal
          onClose={() => setShowModal(false)}
          defaultDept={dept || user?.department}
          isTopMgmt={isTopMgmt}
          isManager={isManager}
          currentUser={user}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
