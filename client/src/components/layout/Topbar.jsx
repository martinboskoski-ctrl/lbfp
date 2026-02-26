import { Menu } from 'lucide-react';

const Topbar = ({ title, onMenuClick }) => (
  <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-3">
    <button
      onClick={onMenuClick}
      className="md:hidden p-2 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
      aria-label="Open menu"
    >
      <Menu size={20} />
    </button>
    <h1 className="text-base font-semibold text-gray-800">{title}</h1>
  </header>
);

export default Topbar;
