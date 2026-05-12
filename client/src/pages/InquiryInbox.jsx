import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Inbox, ChevronRight, Clock, Flag } from 'lucide-react';
import { useDeptInbox } from '../hooks/usePO.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDateShort } from '../utils/formatDate.js';

const STATUS_COLORS = {
  pending:               'bg-gray-100 text-gray-600',
  in_progress:           'bg-blue-50 text-blue-700',
  awaiting_sales_review: 'bg-amber-50 text-amber-700',
  needs_more:            'bg-orange-50 text-orange-700',
  sent_to_client:        'bg-indigo-50 text-indigo-700',
  client_approved:       'bg-green-50 text-green-700',
  client_rejected:       'bg-red-50 text-red-700',
};

const STATUS_FILTERS = [
  'all',
  'pending',
  'in_progress',
  'needs_more',
  'awaiting_sales_review',
  'sent_to_client',
];

const InquiryInbox = () => {
  const { t }    = useTranslation('po');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');

  const { data: items = [], isLoading } = useDeptInbox();

  const filtered = filter === 'all' ? items : items.filter((i) => i.question.status === filter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <Inbox size={20} className="text-blue-600" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">{t('inbox.title')}</h1>
            <p className="text-xs text-gray-400">
              {t('inbox.subtitle', { dept: user?.department, count: items.length })}
            </p>
          </div>
        </div>

        {/* Status filter chips */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {STATUS_FILTERS.map((s) => {
            const count = s === 'all' ? items.length : items.filter((i) => i.question.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s === 'all' ? t('inbox.allStatuses') : t(`qstatus.${s}`)}
                {count > 0 && <span className="ml-1.5 opacity-75">{count}</span>}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-300">
            <Inbox size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">{t('inbox.empty')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => {
              const q = item.question;
              return (
                <button
                  key={q._id}
                  onClick={() => navigate(`/po/${item.poId}`)}
                  className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-3 hover:shadow-md transition-shadow flex items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {item.stage === 'pre_order' ? 'INQ' : 'PO'}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 truncate">{item.clientName}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_COLORS[q.status] || 'bg-gray-100'}`}>
                        {t(`qstatus.${q.status}`)}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                        {t(`deptTab.${q.targetDepartment}`)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{q.text}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                      <span>{t(`phase.${q.phase}`)}</span>
                      {q.productRef && <span>· {q.productRef}</span>}
                      {q.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {fmtDateShort(q.deadline)}
                        </span>
                      )}
                      {q.priority && q.priority !== 'normal' && (
                        <span className={`flex items-center gap-1 ${q.priority === 'high' ? 'text-red-500' : ''}`}>
                          <Flag size={10} /> {t(`priority.${q.priority}`)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-1" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InquiryInbox;
