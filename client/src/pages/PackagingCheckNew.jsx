import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2 } from 'lucide-react';
import PageShell from '../components/layout/PageShell.jsx';
import RoundInputs from '../components/packaging/RoundInputs.jsx';
import { emptyRound, appendRound } from '../components/packaging/roundForm.js';
import { useCreatePackagingCheck } from '../hooks/usePackaging.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isPackagingLead } from '../utils/userTier.js';

const PackagingCheckNew = () => {
  const { t } = useTranslation('packaging');
  const { user } = useAuth();
  const navigate = useNavigate();
  const create = useCreatePackagingCheck();
  const [client, setClient] = useState('');
  const [product, setProduct] = useState('');
  const [markets, setMarkets] = useState('');
  const [round, setRound] = useState(emptyRound());

  if (!isPackagingLead(user)) return <Navigate to="/tools/packaging" replace />;

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('client', client.trim());
    form.append('product', product.trim());
    form.append('markets', markets.trim());
    appendRound(form, round);
    create.mutate(form, { onSuccess: (data) => navigate(`/tools/packaging/${data.check._id}`) });
  };

  return (
    <PageShell title={t('title')}>
      <div className="max-w-2xl mx-auto">
        <Link to="/tools/packaging" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4">
          <ArrowLeft size={15} /> {t('detail.back')}
        </Link>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          <h2 className="text-lg font-bold text-slate-900">{t('newCheck')}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('form.client')}</label>
              <input className="input" value={client} onChange={(e) => setClient(e.target.value)} placeholder={t('form.clientPlaceholder')} autoFocus />
            </div>
            <div>
              <label className="label">{t('form.product')}</label>
              <input className="input" value={product} onChange={(e) => setProduct(e.target.value)} placeholder={t('form.productPlaceholder')} />
            </div>
          </div>

          <div>
            <label className="label">{t('form.markets')}</label>
            <input className="input" value={markets} onChange={(e) => setMarkets(e.target.value)} placeholder={t('form.marketsPlaceholder')} />
            <p className="text-xs text-slate-400 mt-1">{t('form.marketsHint')}</p>
          </div>

          <RoundInputs value={round} onChange={setRound} />

          <div className="flex justify-end gap-2 pt-2">
            <Link to="/tools/packaging" className="btn-secondary">{t('detail.cancel')}</Link>
            <button type="submit" disabled={create.isPending} className="btn-primary flex items-center gap-2">
              {create.isPending && <Loader2 size={15} className="animate-spin" />}
              {create.isPending ? t('form.submitting') : t('form.submit')}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
};

export default PackagingCheckNew;
