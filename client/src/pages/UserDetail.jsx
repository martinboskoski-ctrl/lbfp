import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Loader2, Save, ShieldOff, ShieldCheck,
  Trash2, KeyRound, Copy, Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import {
  useAdminUser, useUpdateAdminUser, useSuspendUser,
  useReactivateUser, useDeleteAdminUser, useResetUserPassword,
} from '../hooks/useUserAdmin.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDateShort } from '../utils/formatDate.js';

const DEPARTMENTS = [
  'sales', 'finance', 'administration', 'hr', 'quality_assurance',
  'facility', 'machines', 'r_and_d', 'production',
  'top_management', 'carina', 'nabavki',
];

const ROLES = ['reviewer', 'owner', 'admin', 'client'];

const STATUS_STYLE = {
  active:    'bg-green-50 text-green-700',
  suspended: 'bg-amber-50 text-amber-700',
  deleted:   'bg-gray-100 text-gray-500',
};

const UserDetail = () => {
  const { t }     = useTranslation('userMgmt');
  const { t: tc } = useTranslation('common');
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user: me } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: user, isLoading } = useAdminUser(id);
  const update     = useUpdateAdminUser(id);
  const suspend    = useSuspendUser(id);
  const reactivate = useReactivateUser(id);
  const del        = useDeleteAdminUser(id);
  const reset      = useResetUserPassword(id);

  const [form, setForm] = useState({
    name: '', department: '', isManager: false, role: 'reviewer', language: 'mk',
  });
  const [suspendReason, setSuspendReason] = useState('');
  const [resetResult, setResetResult]     = useState(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        department: user.department || '',
        isManager: !!user.isManager,
        role: user.role || 'reviewer',
        language: user.language || 'mk',
      });
    }
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isSelf = user && me && String(user._id) === String(me._id);

  if (me?.department !== 'top_management') {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        {t('topMgmtOnly')}
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const submit = () => update.mutate(form);

  const doSuspend = async () => {
    if (!window.confirm(t('confirm.suspend', { name: user.name }))) return;
    await suspend.mutateAsync({ reason: suspendReason.trim() });
    setSuspendReason('');
  };

  const doDelete = async () => {
    if (!window.confirm(t('confirm.delete', { name: user.name }))) return;
    await del.mutateAsync();
    navigate('/admin/user-management');
  };

  const doReset = async () => {
    if (!window.confirm(t('confirm.resetPassword', { name: user.name }))) return;
    const res = await reset.mutateAsync();
    setResetResult(res.tempPassword);
  };

  const copyTemp = async () => {
    try { await navigator.clipboard.writeText(resetResult); toast.success(t('passwordCopied')); }
    catch { toast.error('Copy failed'); }
  };

  const log = [...(user.activityLog || [])].reverse(); // newest first

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={user.name} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-5xl mx-auto">
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 mb-3 flex items-center gap-1 text-xs">
              <ArrowLeft size={14} /> {t('backToList')}
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: profile + actions */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-bold text-gray-900">{user.name}</h2>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[user.status]}`}>
                      {t(`status.${user.status}`)}
                    </span>
                  </div>

                  {user.status === 'suspended' && (
                    <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                      {t('suspendedBanner', {
                        by:   user.suspendedBy?.name || '—',
                        date: fmtDateShort(user.suspendedAt),
                      })}
                      {user.suspendedReason && <div className="mt-1 italic">— {user.suspendedReason}</div>}
                    </div>
                  )}

                  {user.status === 'deleted' && (
                    <div className="mb-4 rounded-lg bg-gray-100 border border-gray-200 p-3 text-xs text-gray-700">
                      {t('deletedBanner', {
                        by:   user.deletedBy?.name || '—',
                        date: fmtDateShort(user.deletedAt),
                      })}
                    </div>
                  )}

                  {/* Edit form */}
                  <div className="space-y-3">
                    <div>
                      <label className="label">{t('fields.name')}</label>
                      <input
                        className="input"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        disabled={user.status === 'deleted'}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">{t('fields.department')}</label>
                        <select
                          className="input"
                          value={form.department}
                          onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                          disabled={user.status === 'deleted'}
                        >
                          {DEPARTMENTS.map((d) => (
                            <option key={d} value={d}>{tc(`dept.${d}`, { defaultValue: d })}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label">{t('fields.role')}</label>
                        <select
                          className="input"
                          value={form.role}
                          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                          disabled={user.status === 'deleted'}
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="isManager"
                        type="checkbox"
                        checked={form.isManager}
                        onChange={(e) => setForm((f) => ({ ...f, isManager: e.target.checked }))}
                        disabled={user.status === 'deleted'}
                      />
                      <label htmlFor="isManager" className="text-sm text-gray-700">{t('fields.isManager')}</label>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={submit}
                        disabled={update.isPending || user.status === 'deleted'}
                        className="btn-primary flex items-center gap-2"
                      >
                        {update.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {t('saveChanges')}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dangerous actions */}
                {!isSelf && user.status !== 'deleted' && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-800">{t('dangerZone')}</h3>

                    {user.status === 'active' ? (
                      <div className="rounded-lg border border-amber-200 p-3">
                        <p className="text-xs text-gray-600 mb-2">{t('suspendIntro')}</p>
                        <input
                          className="input text-sm mb-2"
                          placeholder={t('suspendReasonPlaceholder')}
                          value={suspendReason}
                          onChange={(e) => setSuspendReason(e.target.value)}
                        />
                        <button
                          onClick={doSuspend}
                          disabled={suspend.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700"
                        >
                          <ShieldOff size={12} /> {t('actions.suspend')}
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-green-200 p-3">
                        <p className="text-xs text-gray-600 mb-2">{t('reactivateIntro')}</p>
                        <button
                          onClick={() => reactivate.mutate()}
                          disabled={reactivate.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700"
                        >
                          <ShieldCheck size={12} /> {t('actions.reactivate')}
                        </button>
                      </div>
                    )}

                    <div className="rounded-lg border border-blue-200 p-3">
                      <p className="text-xs text-gray-600 mb-2">{t('resetIntro')}</p>
                      <button
                        onClick={doReset}
                        disabled={reset.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                      >
                        <KeyRound size={12} /> {t('actions.resetPassword')}
                      </button>
                      {resetResult && (
                        <div className="mt-2 flex items-center gap-2 rounded bg-blue-50 px-2 py-1.5">
                          <code className="text-xs font-mono text-blue-800 flex-1">{resetResult}</code>
                          <button onClick={copyTemp} className="text-blue-700 hover:text-blue-900">
                            <Copy size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border border-red-200 p-3">
                      <p className="text-xs text-gray-600 mb-2">{t('deleteIntro')}</p>
                      <button
                        onClick={doDelete}
                        disabled={del.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700"
                      >
                        <Trash2 size={12} /> {t('actions.delete')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: activity log */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={16} className="text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-800">{t('activityLog')}</h3>
                  <span className="text-xs text-gray-400 ml-auto">{log.length}</span>
                </div>
                {log.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">{t('noActivity')}</p>
                ) : (
                  <ul className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {log.map((entry, i) => (
                      <li key={i} className="border-l-2 border-blue-100 pl-3 py-1">
                        <p className="text-xs font-medium text-gray-800">{t(`action.${entry.action}`, { defaultValue: entry.action })}</p>
                        <p className="text-[10px] text-gray-400">{new Date(entry.at).toLocaleString()}</p>
                        {entry.target && <p className="text-[10px] text-gray-500 truncate">{entry.target}</p>}
                        {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                          <details className="mt-1">
                            <summary className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-600">{t('details')}</summary>
                            <pre className="text-[10px] text-gray-600 mt-1 whitespace-pre-wrap break-all">
                              {JSON.stringify(entry.metadata, null, 1)}
                            </pre>
                          </details>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDetail;
