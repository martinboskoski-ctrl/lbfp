import { useState } from 'react';
import TaskCard from './TaskCard.jsx';

const VISIBLE_DEFAULT = 5;

const COLUMN_CFG = {
  todo:        { label: 'За работа',  headerCls: 'bg-gray-100 text-gray-600',   dotCls: 'bg-gray-400'   },
  in_progress: { label: 'Во тек',     headerCls: 'bg-blue-50 text-blue-700',    dotCls: 'bg-blue-500'   },
  done:        { label: 'Завршено',   headerCls: 'bg-purple-50 text-purple-700', dotCls: 'bg-purple-500' },
  approved:    { label: 'Одобрено',   headerCls: 'bg-green-50 text-green-700',  dotCls: 'bg-green-500'  },
};

const KanbanColumn = ({ status, tasks, currentUser, isManager }) => {
  const [expanded, setExpanded] = useState(false);

  const cfg     = COLUMN_CFG[status];
  const visible = expanded ? tasks : tasks.slice(0, VISIBLE_DEFAULT);
  const hidden  = tasks.length - VISIBLE_DEFAULT;

  return (
    <div className="flex flex-col min-w-0">
      {/* Column header */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-2 ${cfg.headerCls}`}>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dotCls}`} />
        <span className="text-xs font-semibold uppercase tracking-wide flex-1">{cfg.label}</span>
        <span className="text-xs font-bold opacity-70">{tasks.length}</span>
      </div>

      {/* Cards */}
      <div className="space-y-1.5 flex-1">
        {visible.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            currentUser={currentUser}
            isManager={isManager}
          />
        ))}
      </div>

      {/* Show more / less */}
      {tasks.length > VISIBLE_DEFAULT && (
        <button
          onClick={() => setExpanded((x) => !x)}
          className="mt-2 text-xs text-gray-400 hover:text-gray-700 py-2.5 rounded-lg border border-dashed border-gray-200 hover:border-gray-400 transition-colors w-full"
        >
          {expanded
            ? 'Прикажи помалку ↑'
            : `Прикажи уште ${hidden} ↓`}
        </button>
      )}

      {tasks.length === 0 && (
        <div className="flex items-center justify-center py-6">
          <p className="text-xs text-gray-300">Нема задачи</p>
        </div>
      )}
    </div>
  );
};

export default KanbanColumn;
