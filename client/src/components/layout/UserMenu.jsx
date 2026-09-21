import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, KeyRound, Users, LogOut, Database, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import { isTopManagement } from '../../utils/userTier.js';
import { downloadBackupApi } from '../../api/backup.api.js';
import ChangePasswordModal from './ChangePasswordModal.jsx';

const initials = (name) =>
  (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('');

const UserMenu = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const ref = useRef(null);

  const handleBackup = async () => {
    if (backingUp) return;
    setBackingUp(true);
    const toastId = toast.loading(t('backup.inProgress'));
    try {
      const res = await downloadBackupApi();
      const cd = res.headers['content-disposition'] || '';
      const match = cd.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `backup-${new Date().toISOString().slice(0, 10)}.zip`;

      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/zip' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t('backup.done'), { id: toastId });
    } catch {
      toast.error(t('backup.error'), { id: toastId });
    } finally {
      setBackingUp(false);
    }
  };

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-2 py-1 rounded-md text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="User menu"
        >
          <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center">
            {initials(user.name)}
          </span>
          <span className="hidden sm:inline text-sm font-medium max-w-[160px] truncate">
            {user.name}
          </span>
          <ChevronDown size={14} className={`text-slate-400 hidden sm:inline transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-md shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="text-sm font-medium text-slate-900 truncate">{user.name}</div>
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {t(`dept.${user.department}`, { defaultValue: user.department })}
                {user.isManager && <span className="ml-1 text-slate-400">· {t('manager')}</span>}
              </div>
            </div>

            <div className="py-1">
              <button
                onClick={() => { setShowPasswordModal(true); setOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <KeyRound size={14} className="text-slate-400" />
                {t('changePassword')}
              </button>

              {isTopManagement(user) && (
                <Link
                  to="/admin/user-management"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Users size={14} className="text-slate-400" />
                  {t('userManagement')}
                </Link>
              )}

              {isTopManagement(user) && (
                <button
                  onClick={handleBackup}
                  disabled={backingUp}
                  title={t('backup.tooltip')}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-wait"
                >
                  {backingUp
                    ? <Loader2 size={14} className="text-slate-400 animate-spin" />
                    : <Database size={14} className="text-slate-400" />}
                  {t('backup.label')}
                </button>
              )}
            </div>

            <div className="py-1 border-t border-slate-100">
              <button
                onClick={() => { setOpen(false); logout(); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <LogOut size={14} className="text-slate-400" />
                {t('logout')}
              </button>
            </div>
          </div>
        )}
      </div>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </>
  );
};

export default UserMenu;
