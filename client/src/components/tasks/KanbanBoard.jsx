import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { canManage, isTopManagement } from '../../utils/userTier.js';
import KanbanColumn from './KanbanColumn.jsx';
import AddTaskModal from './AddTaskModal.jsx';

const STATUSES = ['todo', 'in_progress', 'done', 'approved'];

const KanbanBoard = ({ dept }) => {
  const { user }       = useAuth();
  const [showModal, setShowModal] = useState(false);
  const isManager      = canManage(user);
  const isTopMgmt      = isTopManagement(user);

  const fetchDept = isTopMgmt ? dept : undefined;
  const { data: tasks = [], isLoading, error } = useTasks(fetchDept);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return <p className="text-center py-16 text-red-500 text-sm">Грешка при вчитување на задачите.</p>;
  }

  const byStatus = (status) => tasks.filter((t) => t.status === status);

  return (
    <div>
      {/* Board toolbar */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Тековни задачи</h2>
          <p className="text-xs text-gray-400 mt-0.5">{tasks.length} вкупно</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={15} />
          Нова задача
        </button>
      </div>

      {/* Kanban — 4 columns side by side, full width */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
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
