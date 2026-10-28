import { useTranslation } from 'react-i18next';
import PageShell from '../components/layout/PageShell.jsx';
import TerkoviGallery from '../components/terkovi/TerkoviGallery.jsx';

const Terkovi = () => {
  const { t } = useTranslation('dashboard');
  return (
    <PageShell title={t('tabs.terkovi')}>
      <div className="max-w-3xl mx-auto">
        <TerkoviGallery />
      </div>
    </PageShell>
  );
};

export default Terkovi;
