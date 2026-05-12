import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, ShieldOff, Trash2, CheckCircle2, ChevronRight, Users as UsersIcon, UserPlus } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { useAdminUsers } from '../hooks/useUserAdmin.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDateShort } from '../utils/formatDate.js';

const STATUS_FILTERS = ['all', 'active', 'suspended', 'deleted'];

const STATUS_STYLE = {
  active:    'bg-green-50 text-green-700',
  suspended: 'bg-amber-50 text-amber-700',
  deleted:   'bg-gray-100 text-gray-500',
};

const UserManagement = () => {
  const { t }    = useTranslation('userMgmt');
  const { t: tc } = useTranslation('common');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');

  const includeDeleted = filter === 'all' || filter === 'deleted' ? 1 : 0;
  const { data: users = [], isLoading } = useAdminUsers({ includeDeleted });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (filter !== 'all' && u.status !== filter) return false;
      if (!q) return true;
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q)
      );
    });
  }, [users, filter, search]);

  if (user?.department !== 'top_management') {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        {t('topMgmtOnly')}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={t('title')} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <UsersIcon size={20} className="text-blue-600" />
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900">{t('title')}</h1>
                <p className="text-xs text-gray-400">{t('subtitle', { count: users.length })}</p>
              </div>
              <button
                onClick={() => navigate('/register')}
                className="btn-primary flex items-center gap-2"
              >
                <UserPlus size={14} />
                {t('addUser')}
              </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative flex-1 min-w-[220px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-9"
                  placeholder={t('searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto">
                {STATUS_FILTERS.map((s) => {
                  const count = s === 'all' ? users.length : users.filter((u) => u.status === s).length;
                  return (
                    <button
                      key={s}
                      onClick={() => setFilter(s)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filter === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {s === 'all' ? t('filter.all') : t(`status.${s}`)}
                      {count > 0 && <span className="ml-1.5 opacity-75">{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-300 text-sm">{t('empty')}</div>
            ) : (
              <div className="space-y-2">
                {filtered.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => navigate(`/admin/user-management/${u._id}`)}
                    className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-3 hover:shadow-md transition-shadow flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                      {u.name?.[0]?.toUpperCase() || '?'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900 truncate">{u.name}</span>
                        <span className="text-xs text-gray-400 truncate">{u.email}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-gray-500">
                        <span>{tc(`dept.${u.department}`, { defaultValue: u.department })}</span>
                        {u.isManager && (
                          <span className="text-blue-600 font-medium">· {tc('manager')}</span>
                        )}
                        {u.role === 'admin' && (
                          <span className="text-purple-600 font-medium">· admin</span>
                        )}
                        {u.createdAt && (
                          <span className="text-gray-400">· {t('joined')} {fmtDateShort(u.createdAt)}</span>
                        )}
                      </div>
                    </div>

                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[u.status] || 'bg-gray-100'}`}>
                      {u.status === 'active'    && <span className="inline-flex items-center gap-1"><CheckCircle2 size={11} /> {t('status.active')}</span>}
                      {u.status === 'suspended' && <span className="inline-flex items-center gap-1"><ShieldOff size={11} /> {t('status.suspended')}</span>}
                      {u.status === 'deleted'   && <span className="inline-flex items-center gap-1"><Trash2 size={11} /> {t('status.deleted')}</span>}
                    </span>
                    <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserManagement;
