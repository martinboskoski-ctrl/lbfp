import { Link } from 'react-router-dom';
import { ChevronRight, Calendar, Users } from 'lucide-react';
import { DEPARTMENTS } from '../layout/Sidebar.jsx';

const STATUS_CONFIG = {
  draft:      { label: 'Нацрт',     color: 'bg-gray-100 text-gray-600' },
  active:     { label: 'Активен',   color: 'bg-blue-100 text-blue-700' },
  on_hold:    { label: 'Пауза',     color: 'bg-yellow-100 text-yellow-700' },
  completed:  { label: 'Завршен',   color: 'bg-green-100 text-green-700' },
  cancelled:  { label: 'Откажан',   color: 'bg-red-100 text-red-600' },
};

const PRIORITY_CONFIG = {
  low:    { label: 'Ниска',  color: 'bg-gray-100 text-gray-500' },
  medium: { label: 'Средна', color: 'bg-blue-50 text-blue-600' },
  high:   { label: 'Висока', color: 'bg-orange-50 text-orange-600' },
  urgent: { label: 'Итна',   color: 'bg-red-50 text-red-600' },
};

const ProjectCard = ({ project }) => {
  const status   = STATUS_CONFIG[project.status]   || STATUS_CONFIG.draft;
  const priority = PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG.medium;
  const deptLabel = DEPARTMENTS.find((d) => d.value === project.department)?.label || project.department;

  const doneTasks  = project.tasks?.filter((t) => t.status === 'done').length ?? 0;
  const totalTasks = project.tasks?.length ?? 0;

  return (
    <Link
      to={`/projects/${project._id}`}
      className="card p-4 hover:shadow-md transition-shadow flex items-center justify-between group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="font-semibold text-gray-900 truncate">{project.title}</h3>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priority.color}`}>
            {priority.label}
          </span>
        </div>

        {project.description && (
          <p className="text-sm text-gray-500 truncate mb-1.5">{project.description}</p>
        )}

        <div className="flex items-center gap-3 flex-wrap text-xs text-gray-400">
          <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{deptLabel}</span>

          {project.endDate && (
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {new Date(project.endDate).toLocaleDateString('mk-MK')}
            </span>
          )}

          {project.assignedUsers?.length > 0 && (
            <span className="flex items-center gap-1">
              <Users size={11} />
              {project.assignedUsers.length}
            </span>
          )}

          {totalTasks > 0 && (
            <span>{doneTasks}/{totalTasks} задачи</span>
          )}

          {project.owner?.name && <span>од {project.owner.name}</span>}
        </div>
      </div>
      <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600 flex-shrink-0 ml-4" />
    </Link>
  );
};

export default ProjectCard;
