import { useState } from 'react';
import { Menu, Bell } from 'lucide-react';
import { useUnreadCount } from '../../hooks/useNotifications.js';
import NotificationPanel from './NotificationPanel.jsx';

const Topbar = ({ title, onMenuClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { data: unread = 0 } = useUnreadCount();

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-3">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <h1 className="text-base font-semibold text-gray-800">{title}</h1>

      <div className="ml-auto relative">
        <button
          onClick={() => setShowNotifications((prev) => !prev)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors relative"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>

        {showNotifications && (
          <NotificationPanel onClose={() => setShowNotifications(false)} />
        )}
      </div>
    </header>
  );
};

export default Topbar;
