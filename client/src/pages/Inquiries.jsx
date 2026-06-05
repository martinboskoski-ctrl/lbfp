import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import InquiryHub from '../components/po/InquiryHub.jsx';

const Inquiries = () => {
  const { t } = useTranslation('po');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={t('title')} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <InquiryHub />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Inquiries;
