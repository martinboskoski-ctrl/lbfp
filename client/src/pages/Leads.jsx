import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageShell from '../components/layout/PageShell.jsx';
import LeadsPage from '../components/leads/LeadsPage.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { hasSalesAccess } from '../utils/userTier.js';

const Leads = () => {
  const { t } = useTranslation('dashboard');
  const { user } = useAuth();
  if (!hasSalesAccess(user)) return <Navigate to="/dashboard" replace />;

  return (
    <PageShell title={t('tabs.leads')}>
      <div className="max-w-3xl mx-auto">
        <LeadsPage />
      </div>
    </PageShell>
  );
};

export default Leads;
