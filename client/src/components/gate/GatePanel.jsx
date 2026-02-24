import { useAuth } from '../../context/AuthContext.jsx';
import ApproveRejectBar from './ApproveRejectBar.jsx';
import CommentThread from './CommentThread.jsx';
import { useSubmitProject, useDispatchFeedback, useAcknowledgeGate } from '../../hooks/useProjects.js';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { canManage } from '../../utils/userTier.js';

const GATE_LABELS = [
  'Порта 0 — Поставување на проект',
  'Порта 1 — Внатрешен преглед',
  'Порта 2 — Регулаторен преглед',
  'Порта 3 — Дизајн на пакување',
  'Порта 4 — Одобрување од клиент',
];

const STATUS_LABELS = {
  pending:     'На чекање',
  in_progress: 'Во тек',
  approved:    'Одобрено',
  rejected:    'Одбиено',
};

const statusColors = {
  pending:     'text-gray-500',
  in_progress: 'text-blue-600',
  approved:    'text-green-600',
  rejected:    'text-red-600',
};

const GatePanel = ({ project }) => {
  const { user } = useAuth();
  const { currentGate, gates, _id: projectId, status } = project;

  const submitProject = useSubmitProject(projectId);
  const dispatchFeedback = useDispatchFeedback(projectId);
  const acknowledgeGate = useAcknowledgeGate(projectId);

  const currentGateData = gates?.[currentGate];
  if (!currentGateData) return null;

  const isManager = canManage(user);
  const isClient = user.role === 'client';
  const gateInProgress = currentGateData.status === 'in_progress';
  const gateRejected = currentGateData.status === 'rejected';

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-gray-700">Активна порта</h2>
        <span className={`text-xs font-medium ${statusColors[currentGateData.status]}`}>
          {STATUS_LABELS[currentGateData.status] || currentGateData.status}
        </span>
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-3">{GATE_LABELS[currentGate]}</h3>

      {currentGate === 0 && status === 'draft' && isManager && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Пополнете ги сите задолжителни полиња, потоа поднесете го проектот за да го започнете процесот на преглед.
          </p>
          <button
            onClick={() => submitProject.mutate()}
            disabled={submitProject.isPending}
            className="btn-primary"
          >
            {submitProject.isPending ? 'Поднесување…' : 'Поднеси проект → Порта 1'}
          </button>
        </div>
      )}

      {gateRejected && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <strong>Барање за промена:</strong> {currentGateData.rejectionReason}
          </div>
        </div>
      )}

      {gateRejected && isManager && currentGate > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">
            Адресирајте ги коментарите погоре и повторно поднесете за преглед.
          </p>
          <button
            onClick={() => submitProject.mutate()}
            disabled={submitProject.isPending}
            className="btn-primary"
          >
            {submitProject.isPending ? 'Повторно поднесување…' : 'Повторно поднеси'}
          </button>
        </div>
      )}

      {gateInProgress && currentGate >= 1 && currentGate <= 3 && isManager && (
        <ApproveRejectBar projectId={projectId} gateNumber={currentGate} />
      )}

      {currentGate === 4 && gateInProgress && isManager && !project.clientFeedbackDispatched && (
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-3">
            Соберете ги сите коментари од прегледувачите и испратете ги до клиентот за финално потврдување.
          </p>
          <button
            onClick={() => dispatchFeedback.mutate()}
            disabled={dispatchFeedback.isPending}
            className="btn-primary"
          >
            {dispatchFeedback.isPending ? 'Испраќање…' : 'Испрати до клиент'}
          </button>
        </div>
      )}

      {currentGate === 4 && project.clientFeedbackDispatched && !project.clientAcknowledged && isManager && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <AlertCircle size={14} />
          Се чека потврда од клиентот…
        </div>
      )}

      {currentGate === 4 && project.clientFeedbackDispatched && !project.clientAcknowledged && isClient && (
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-3">
            Прегледајте ги материјалите за пакување и потврдете го одобрувањето.
          </p>
          <button
            onClick={() => acknowledgeGate.mutate()}
            disabled={acknowledgeGate.isPending}
            className="btn-primary"
          >
            <CheckCircle2 size={16} className="mr-1.5" />
            {acknowledgeGate.isPending ? 'Потврдување…' : 'Потврди и одобри'}
          </button>
        </div>
      )}

      {status === 'locked' && (
        <div className="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg p-3">
          <CheckCircle2 size={16} />
          Сите порти се одобрени — проектот е завршен.
        </div>
      )}

      {gateInProgress && currentGate >= 1 && currentGate <= 3 && !isManager && (
        <div className="mt-2 text-sm text-gray-500">
          Се чека прегледувачот да ја одобри или одбие оваа порта.
        </div>
      )}

      <CommentThread
        projectId={projectId}
        gateNumber={currentGate}
        comments={currentGateData.comments || []}
      />
    </div>
  );
};

export default GatePanel;
