import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCheck } from 'lucide-react';
import { useNotifications, useMarkRead, useMarkAllRead } from '../../hooks/useNotifications.js';

const timeAgo = (date, t) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return t('notifications:justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('notifications:minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('notifications:hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  return t('notifications:daysAgo', { count: days });
};

const NotificationPanel = ({ onClose }) => {
  const { t } = useTranslation(['notifications', 'common']);
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const { data } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleClick = (n) => {
    if (!n.read) markRead.mutate(n._id);
    if (n.link) navigate(n.link);
    onClose();
  };

  const notifications = data?.notifications || [];

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-1 w-80 max-h-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">{t('notifications:title')}</h3>
        {notifications.length > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <CheckCheck size={14} />
            {t('notifications:markAllRead')}
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            {t('notifications:empty')}
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n._id}
              onClick={() => handleClick(n)}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                !n.read ? 'bg-blue-50/50' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                  {n.message && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt, t)}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
