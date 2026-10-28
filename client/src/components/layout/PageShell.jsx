import { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

// Standard authenticated page frame: sidebar + topbar + padded main area.
const PageShell = ({ title, children, mainClassName = 'p-6' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className={`flex-1 ${mainClassName}`}>{children}</main>
      </div>
    </div>
  );
};

export default PageShell;
