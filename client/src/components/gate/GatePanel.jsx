import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import ApproveRejectBar from './ApproveRejectBar.jsx';
import CommentThread from './CommentThread.jsx';
import { useSubmitProject, useDispatchFeedback, useAcknowledgeGate } from '../../hooks/useProjects.js';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { canManage } from '../../utils/userTier.js';

const statusColors = {
  pending:     'text-gray-500',
  in_progress: 'text-blue-600',
  approved:    'text-green-600',
  rejected:    'text-red-600',
};

const GatePanel = ({ project }) => {
  const { t } = useTranslation('projects');
  const { user } = useAuth();
  const { currentGate, gates, _id: projectId, status } = project;

  const submitProject = useSubmitProject(projectId);
  const dispatchFeedback = useDispatchFeedback(projectId);
  const acknowledgeGate = useAcknowledgeGate(projectId);

  const gateLabels = t('gate.labels', { returnObjects: true });

  const currentGateData = gates?.[currentGate];
  if (!currentGateData) return null;

  const isManager = canManage(user);
  const isClient = user.role === 'client';
  const gateInProgress = currentGateData.status === 'in_progress';
  const gateRejected = currentGateData.status === 'rejected';

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-gray-700">{t('gate.activeGate')}</h2>
        <span className={`text-xs font-medium ${statusColors[currentGateData.status]}`}>
          {t(`gate.status.${currentGateData.status}`) || currentGateData.status}
        </span>
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-3">{gateLabels[currentGate]}</h3>

      {currentGate === 0 && status === 'draft' && isManager && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            {t('gate.submitDescription')}
          </p>
          <button
            onClick={() => submitProject.mutate()}
            disabled={submitProject.isPending}
            className="btn-primary"
          >
            {submitProject.isPending ? t('gate.submitting') : t('gate.submitButton')}
          </button>
        </div>
      )}

      {gateRejected && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <strong>{t('gate.changeRequest')}</strong> {currentGateData.rejectionReason}
          </div>
        </div>
      )}

      {gateRejected && isManager && currentGate > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">
            {t('gate.resubmitDescription')}
          </p>
          <button
            onClick={() => submitProject.mutate()}
            disabled={submitProject.isPending}
            className="btn-primary"
          >
            {submitProject.isPending ? t('gate.resubmitting') : t('gate.resubmitButton')}
          </button>
        </div>
      )}

      {gateInProgress && currentGate >= 1 && currentGate <= 3 && isManager && (
        <ApproveRejectBar projectId={projectId} gateNumber={currentGate} />
      )}

      {currentGate === 4 && gateInProgress && isManager && !project.clientFeedbackDispatched && (
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-3">
            {t('gate.dispatchDescription')}
          </p>
          <button
            onClick={() => dispatchFeedback.mutate()}
            disabled={dispatchFeedback.isPending}
            className="btn-primary"
          >
            {dispatchFeedback.isPending ? t('gate.dispatching') : t('gate.dispatchButton')}
          </button>
        </div>
      )}

      {currentGate === 4 && project.clientFeedbackDispatched && !project.clientAcknowledged && isManager && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <AlertCircle size={14} />
          {t('gate.awaitingClient')}
        </div>
      )}

      {currentGate === 4 && project.clientFeedbackDispatched && !project.clientAcknowledged && isClient && (
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-3">
            {t('gate.clientReviewDescription')}
          </p>
          <button
            onClick={() => acknowledgeGate.mutate()}
            disabled={acknowledgeGate.isPending}
            className="btn-primary"
          >
            <CheckCircle2 size={16} className="mr-1.5" />
            {acknowledgeGate.isPending ? t('gate.acknowledging') : t('gate.acknowledgeButton')}
          </button>
        </div>
      )}

      {status === 'locked' && (
        <div className="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg p-3">
          <CheckCircle2 size={16} />
          {t('gate.allGatesApproved')}
        </div>
      )}

      {gateInProgress && currentGate >= 1 && currentGate <= 3 && !isManager && (
        <div className="mt-2 text-sm text-gray-500">
          {t('gate.awaitingReviewer')}
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
