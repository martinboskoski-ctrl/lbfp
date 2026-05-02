import { useState } from 'react';
import { Menu, Bell } from 'lucide-react';
import { useUnreadCount } from '../../hooks/useNotifications.js';
import NotificationPanel from './NotificationPanel.jsx';
import UserMenu from './UserMenu.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';

const Topbar = ({ title, onMenuClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { data: unread = 0 } = useUnreadCount();

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center px-3 sm:px-4 gap-2 sm:gap-3">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-1 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <h1 className="text-sm sm:text-base font-semibold text-slate-800 truncate">{title}</h1>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <div className="relative">
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-slate-700 text-white text-[10px] font-semibold leading-none">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          {showNotifications && (
            <NotificationPanel onClose={() => setShowNotifications(false)} />
          )}
        </div>

        <LanguageSwitcher />
        <UserMenu />
      </div>
    </header>
  );
};

export default Topbar;
