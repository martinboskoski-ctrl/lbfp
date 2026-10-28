import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageShell from '../components/layout/PageShell.jsx';
import ClientsPage from '../components/clients/ClientsPage.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { hasSalesAccess } from '../utils/userTier.js';

const Clients = () => {
  const { t } = useTranslation('dashboard');
  const { user } = useAuth();
  if (!hasSalesAccess(user)) return <Navigate to="/dashboard" replace />;

  return (
    <PageShell title={t('tabs.clients')}>
      <div className="max-w-3xl mx-auto">
        <ClientsPage />
      </div>
    </PageShell>
  );
};

export default Clients;
