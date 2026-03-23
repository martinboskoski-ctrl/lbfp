import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { canManage } from '../utils/userTier.js';
import { useMaintenanceRequests, useCreateMaintenance, useUpdateMaintenance } from '../hooks/useMaintenance.js';
import { AlertTriangle, Wrench, CheckCircle, ChevronDown } from 'lucide-react';

const STATUS_CONFIG = {
  reported:    { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' },
  in_progress: { icon: Wrench,       color: 'text-blue-500',  bg: 'bg-blue-50 border-blue-200' },
  resolved:    { icon: CheckCircle,   color: 'text-green-500', bg: 'bg-green-50 border-green-200' },
};

const PRIORITY_DOT = {
  low: 'bg-gray-300',
  medium: 'bg-blue-400',
  high: 'bg-amber-500',
  urgent: 'bg-red-500',
};

const Maintenance = () => {
  const { t } = useTranslation('maintenance');
  const { t: tc } = useTranslation('common');
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Create form
  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fMachine, setFMachine] = useState('');
  const [fPriority, setFPriority] = useState('medium');

  const { data: requests, isLoading } = useMaintenanceRequests(statusFilter ? { status: statusFilter } : {});
  const createMut = useCreateMaintenance();
  const updateMut = useUpdateMaintenance();

  const handleCreate = (e) => {
    e.preventDefault();
    createMut.mutate(
      { title: fTitle, description: fDesc, machineId: fMachine, priority: fPriority },
      {
        onSuccess: () => {
          setShowForm(false);
          setFTitle(''); setFDesc(''); setFMachine(''); setFPriority('medium');
        },
      }
    );
  };

  const handleStatusChange = (id, newStatus) => {
    const payload = { id, status: newStatus };
    if (newStatus === 'resolved') payload.resolvedAt = new Date().toISOString();
    updateMut.mutate(payload);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={t('title')} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Top bar */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              {!showForm && (
                <button onClick={() => setShowForm(true)} className="btn-primary">
                  + {t('create')}
                </button>
              )}
              <div className="flex items-center gap-1 ml-auto">
                {['', 'reported', 'in_progress', 'resolved'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                      statusFilter === s
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s ? t(`statusValues.${s}`) : t('filterAll')}
                  </button>
                ))}
              </div>
            </div>

            {/* Create form */}
            {showForm && (
              <form onSubmit={handleCreate} className="card p-5 mb-6 space-y-4">
                <div>
                  <label className="label">{t('titleLabel')}</label>
                  <input className="input" value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder={t('titlePlaceholder')} required />
                </div>
                <div>
                  <label className="label">{t('descriptionLabel')}</label>
                  <textarea className="input min-h-[100px]" value={fDesc} onChange={(e) => setFDesc(e.target.value)} placeholder={t('descriptionPlaceholder')} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('machineId')}</label>
                    <input className="input" value={fMachine} onChange={(e) => setFMachine(e.target.value)} placeholder={t('machineIdPlaceholder')} />
                  </div>
                  <div>
                    <label className="label">{t('priority')}</label>
                    <select className="input" value={fPriority} onChange={(e) => setFPriority(e.target.value)}>
                      {['low', 'medium', 'high', 'urgent'].map((p) => (
                        <option key={p} value={p}>{t(`priorityValues.${p}`)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={createMut.isPending} className="btn-primary">{tc('create')}</button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{tc('cancel')}</button>
                </div>
              </form>
            )}

            {/* List */}
            {isLoading ? (
              <p className="text-gray-400 text-sm">{tc('loading')}</p>
            ) : !requests?.length ? (
              <div className="text-center py-20 text-gray-400 text-sm">{t('noRequests')}</div>
            ) : (
              <div className="space-y-3">
                {requests.map((r) => {
                  const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.reported;
                  const StatusIcon = sc.icon;
                  const isOpen = expandedId === r._id;

                  return (
                    <div key={r._id} className={`card border overflow-hidden ${sc.bg}`}>
                      <button
                        onClick={() => setExpandedId(isOpen ? null : r._id)}
                        className="w-full p-4 text-left flex items-start gap-3"
                      >
                        <StatusIcon size={18} className={`${sc.color} shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[r.priority]}`} />
                            <h3 className="font-semibold text-gray-800 text-sm truncate">{r.title}</h3>
                            <span className="text-[10px] font-medium text-gray-500 bg-white/60 px-1.5 py-0.5 rounded-full">
                              {t(`statusValues.${r.status}`)}
                            </span>
                            <span className="text-[10px] text-gray-400 ml-auto shrink-0">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {r.machineId && <span className="mr-3">{r.machineId}</span>}
                            <span>{r.reportedBy?.name}</span>
                            {r.assignedTo && <span className="ml-3">{t('assignedTo')}: {r.assignedTo.name}</span>}
                          </div>
                        </div>
                        <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isOpen && (
                        <div className="border-t border-gray-200/50 px-4 pb-4 pt-3 space-y-3">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.description}</p>

                          {r.resolvedAt && (
                            <p className="text-xs text-gray-500">
                              {t('resolvedAt')}: {new Date(r.resolvedAt).toLocaleString()}
                            </p>
                          )}
                          {r.resolutionNotes && (
                            <div className="bg-white/60 rounded p-2.5 text-sm text-gray-600">
                              <span className="font-medium text-gray-700">{t('resolutionNotes')}:</span> {r.resolutionNotes}
                            </div>
                          )}

                          {/* Manager actions */}
                          {canManage(user) && r.status !== 'resolved' && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {r.status === 'reported' && (
                                <button
                                  onClick={() => handleStatusChange(r._id, 'in_progress')}
                                  className="btn-primary text-xs !py-1 !px-3"
                                >
                                  {t('statusValues.in_progress')}
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  const notes = prompt(t('resolutionPlaceholder'));
                                  if (notes !== null) {
                                    updateMut.mutate({ id: r._id, status: 'resolved', resolutionNotes: notes, resolvedAt: new Date().toISOString() });
                                  }
                                }}
                                className="btn-secondary text-xs !py-1 !px-3"
                              >
                                {t('statusValues.resolved')}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Maintenance;
