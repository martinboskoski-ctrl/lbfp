import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Calendar, Users } from 'lucide-react';
import { fmtDateShort } from '../../utils/formatDate.js';

const ProjectCard = ({ project }) => {
  const { t } = useTranslation('projects');
  const { t: tc } = useTranslation('common');

  const STATUS_CONFIG = {
    draft:      { label: t('projectStatus.draft'),     color: 'bg-gray-100 text-gray-600' },
    active:     { label: t('projectStatus.active'),   color: 'bg-blue-100 text-blue-700' },
    on_hold:    { label: t('projectStatus.on_hold'),     color: 'bg-yellow-100 text-yellow-700' },
    completed:  { label: t('projectStatus.completed'),   color: 'bg-green-100 text-green-700' },
    cancelled:  { label: t('projectStatus.cancelled'),   color: 'bg-red-100 text-red-600' },
  };

  const PRIORITY_CONFIG = {
    low:    { label: tc('priority.low'),  color: 'bg-gray-100 text-gray-500' },
    medium: { label: tc('priority.medium'), color: 'bg-blue-50 text-blue-600' },
    high:   { label: tc('priority.high'), color: 'bg-orange-50 text-orange-600' },
    urgent: { label: tc('priority.urgent'),   color: 'bg-red-50 text-red-600' },
  };

  const status   = STATUS_CONFIG[project.status]   || STATUS_CONFIG.draft;
  const priority = PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG.medium;
  const deptLabel = tc(`dept.${project.department}`, { defaultValue: project.department });

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
              {fmtDateShort(project.endDate)}
            </span>
          )}

          {project.assignedUsers?.length > 0 && (
            <span className="flex items-center gap-1">
              <Users size={11} />
              {project.assignedUsers.length}
            </span>
          )}

          {totalTasks > 0 && (
            <span>{doneTasks}/{totalTasks} {t('tasksLabel')}</span>
          )}

          {project.owner?.name && <span>{t('by', { name: project.owner.name })}</span>}
        </div>
      </div>
      <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600 flex-shrink-0 ml-4" />
    </Link>
  );
};

export default ProjectCard;
