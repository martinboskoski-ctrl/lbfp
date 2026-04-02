import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import ApprovalStepper from './ApprovalStepper.jsx';

const STATUS_COLORS = {
  pending:     'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  approved:    'bg-green-100 text-green-700',
  rejected:    'bg-red-100 text-red-700',
};

const RequestCard = ({ request }) => {
  const { t } = useTranslation('requests');
  const navigate = useNavigate();

  const date = new Date(request.createdAt).toLocaleDateString('mk-MK', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <button
      onClick={() => navigate(`/requests/${request._id}`)}
      className="w-full text-left card p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[request.status]}`}>
              {t(`status.${request.status}`)}
            </span>
            <span className="text-xs font-medium text-gray-600">
              {t(`type.${request.type}`)}
            </span>
          </div>

          <p className="text-sm text-gray-500 mb-2">
            {request.requester?.name ?? '—'} · {t(`dept.${request.department}`, request.department)}
          </p>

          <ApprovalStepper request={request} />

          <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
            <span className="flex items-center gap-1"><Calendar size={12} />{date}</span>
            <span className="flex items-center gap-1"><Clock size={12} />#{request._id.slice(-6)}</span>
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-300 shrink-0 mt-1" />
      </div>
    </button>
  );
};

export default RequestCard;
