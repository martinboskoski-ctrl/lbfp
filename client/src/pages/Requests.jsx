import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import RequestCard from '../components/requests/RequestCard.jsx';
import NewRequestModal from '../components/requests/NewRequestModal.jsx';
import { useMyRequests, usePendingRequests } from '../hooks/useRequests.js';
import LeaveBalanceCard from '../components/requests/LeaveBalanceCard.jsx';
import RequestsDashboard from '../components/requests/RequestsDashboard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { canManage, isTopManagement } from '../utils/userTier.js';

const Requests = () => {
  const { t } = useTranslation('requests');
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState('mine');

  const { data: myRequests = [], isLoading: loadingMine } = useMyRequests();
  const { data: pendingRequests = [], isLoading: loadingPending } = usePendingRequests();

  const showPendingTab = canManage(user) || isTopManagement(user);
  const showDashboard = isTopManagement(user) || user?.department === 'hr';
  const requests = tab === 'mine' ? myRequests : pendingRequests;
  const loading = tab === 'mine' ? loadingMine : loadingPending;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={t('title')} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
            {/* Tabs + New button */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setTab('mine')}
                  className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
                    tab === 'mine' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('myRequests')}
                </button>
                {showPendingTab && (
                  <button
                    onClick={() => setTab('pending')}
                    className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors relative ${
                      tab === 'pending' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t('pendingApprovals')}
                    {pendingRequests.length > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                        {pendingRequests.length}
                      </span>
                    )}
                  </button>
                )}
                {showDashboard && (
                  <button
                    onClick={() => setTab('dashboard')}
                    className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
                      tab === 'dashboard' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t('dashboard')}
                  </button>
                )}
              </div>

              <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5">
                <Plus size={16} />
                {t('newRequest')}
              </button>
            </div>

            {tab === 'dashboard' ? (
              <RequestsDashboard />
            ) : (
              <>
                {/* Leave balance card */}
                {tab === 'mine' && <div className="mb-4"><LeaveBalanceCard /></div>}

                {/* List */}
                {loading ? (
                  <div className="text-center text-gray-400 py-12">{t('loading')}</div>
                ) : requests.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    {tab === 'mine' ? t('noRequests') : t('noPending')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map((r) => (
                      <RequestCard key={r._id} request={r} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {showModal && <NewRequestModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default Requests;
