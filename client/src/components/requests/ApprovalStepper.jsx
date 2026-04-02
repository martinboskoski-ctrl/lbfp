import { Check, X, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const STEP_CONFIG = {
  day_off:   ['Department Manager', 'HR'],
  overtime:  ['Department Manager'],
  equipment: ['Department Manager', 'Administration'],
  travel:    ['Department Manager', 'Finance'],
  complaint: ['Department Manager', 'HR', 'Top Management'],
};

const ApprovalStepper = ({ request }) => {
  const { t } = useTranslation('requests');
  const steps = STEP_CONFIG[request.type] || [];

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {steps.map((label, idx) => {
        const historyEntry = request.stepHistory?.find((h) => h.stepIndex === idx);
        const isCurrent = request.currentStep === idx && !['approved', 'rejected'].includes(request.status);
        const isRejectedHere = historyEntry?.action === 'rejected';
        const isApprovedHere = historyEntry?.action === 'approved';

        let bg = 'bg-gray-100 text-gray-400';
        let icon = <Clock size={12} />;

        if (isApprovedHere) {
          bg = 'bg-green-100 text-green-700';
          icon = <Check size={12} />;
        } else if (isRejectedHere) {
          bg = 'bg-red-100 text-red-700';
          icon = <X size={12} />;
        } else if (isCurrent) {
          bg = 'bg-blue-100 text-blue-700 ring-2 ring-blue-300';
          icon = <Clock size={12} className="animate-pulse" />;
        }

        return (
          <div key={idx} className="flex items-center gap-1">
            {idx > 0 && <div className="w-4 h-px bg-gray-300" />}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${bg}`}>
              {icon}
              <span>{t(`step.${label}`, label)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ApprovalStepper;
