import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, X } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import ApprovalStepper from '../components/requests/ApprovalStepper.jsx';
import { useRequest, useApproveRequest, useRejectRequest } from '../hooks/useRequests.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isTopManagement } from '../utils/userTier.js';

const STATUS_COLORS = {
  pending:     'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  approved:    'bg-green-100 text-green-700',
  rejected:    'bg-red-100 text-red-700',
};

const DATA_LABELS = {
  startDate: 'field.startDate', endDate: 'field.endDate', reason: 'field.reason',
  date: 'field.date', hours: 'field.hours', itemName: 'field.itemName',
  quantity: 'field.quantity', estimatedCost: 'field.estimatedCost',
  destination: 'field.destination', purpose: 'field.purpose',
  subject: 'field.subject', description: 'field.description', anonymous: 'field.anonymous',
};

const RequestDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation('requests');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [note, setNote] = useState('');

  const { data: request, isLoading } = useRequest(id);
  const approveMut = useApproveRequest();
  const rejectMut = useRejectRequest();

  const canAct = request &&
    !['approved', 'rejected'].includes(request.status) &&
    request.requester?._id !== user?._id;

  const handleApprove = () => approveMut.mutate({ id, note });
  const handleReject = () => rejectMut.mutate({ id, note });

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <Topbar title={t('title')} onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex-1 flex items-center justify-center text-gray-400">{t('loading')}</div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <Topbar title={t('title')} onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex-1 flex items-center justify-center text-gray-400">Not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={t('title')} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => navigate('/requests')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
              <ArrowLeft size={16} />
              {t('backToList')}
            </button>

            <div className="card p-6 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[request.status]}`}>
                      {t(`status.${request.status}`)}
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                      {t(`type.${request.type}`)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {request.requester?.name} · {t(`dept.${request.department}`, request.department)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    #{request._id.slice(-6)} · {new Date(request.createdAt).toLocaleDateString('mk-MK')}
                  </p>
                </div>
              </div>

              {/* Stepper */}
              <ApprovalStepper request={request} />

              {/* Data fields */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {Object.entries(request.data || {}).map(([key, val]) => {
                  if (val === undefined || val === null || val === '') return null;
                  const label = DATA_LABELS[key] ? t(DATA_LABELS[key]) : key;
                  const display = typeof val === 'boolean' ? (val ? t('yes') : t('no')) : String(val);
                  return (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className="text-gray-800 font-medium text-right max-w-[60%]">{display}</span>
                    </div>
                  );
                })}
              </div>

              {/* Step History */}
              {request.stepHistory?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('approvalHistory')}</h3>
                  <div className="space-y-2">
                    {request.stepHistory.map((step, idx) => (
                      <div key={idx} className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                        step.action === 'approved' ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        {step.action === 'approved' ? (
                          <Check size={16} className="text-green-600 mt-0.5 shrink-0" />
                        ) : (
                          <X size={16} className="text-red-600 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-gray-700">
                            {step.label} — {step.actionBy?.name ?? '—'}
                          </p>
                          {step.note && <p className="text-gray-500 mt-0.5">{step.note}</p>}
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {new Date(step.actionAt).toLocaleString('mk-MK')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action area */}
              {canAct && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <textarea
                    className="input min-h-[60px]"
                    placeholder={t('notePlaceholder')}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleApprove}
                      disabled={approveMut.isPending}
                      className="btn-primary flex items-center gap-1.5 flex-1"
                    >
                      <Check size={16} />
                      {t('approve')}
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={rejectMut.isPending}
                      className="btn-danger flex items-center gap-1.5 flex-1"
                    >
                      <X size={16} />
                      {t('reject')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RequestDetail;
