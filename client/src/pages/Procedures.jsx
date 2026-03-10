import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';

const Procedures = () => {
  const { t } = useTranslation('common');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={t('procedures')} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center py-16 text-gray-400 text-sm">
              {t('comingSoon')}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Procedures;
