import { useTranslation } from 'react-i18next';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard.jsx';

const COLUMN_CFG = {
  todo:        { key: 'column.todo',        headerCls: 'bg-gray-100 text-gray-600',    dotCls: 'bg-gray-400'   },
  in_progress: { key: 'column.in_progress', headerCls: 'bg-blue-50 text-blue-700',     dotCls: 'bg-blue-500'   },
  done:        { key: 'column.done',         headerCls: 'bg-purple-50 text-purple-700', dotCls: 'bg-purple-500' },
  approved:    { key: 'column.approved',    headerCls: 'bg-green-50 text-green-700',   dotCls: 'bg-green-500'  },
};

const KanbanColumn = ({ status, tasks, currentUser, isManager }) => {
  const { t } = useTranslation('tasks');
  const cfg   = COLUMN_CFG[status];

  return (
    <div className="flex flex-col min-w-[270px] flex-1 bg-gray-50 rounded-xl border border-gray-100">
      {/* Column header */}
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-xl ${cfg.headerCls}`}>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dotCls}`} />
        <span className="text-xs font-semibold uppercase tracking-wide flex-1">{t(cfg.key)}</span>
        <span className="text-xs font-bold opacity-70">{tasks.length}</span>
      </div>

      {/* Droppable card area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-[120px] overflow-y-auto p-2 space-y-2 rounded-b-xl transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-100/50' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task._id}
                task={task}
                index={index}
                currentUser={currentUser}
                isManager={isManager}
              />
            ))}
            {provided.placeholder}

            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center py-8 text-xs text-gray-300 select-none">
                {t('noTasks')}
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
