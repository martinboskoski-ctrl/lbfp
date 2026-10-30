import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';
import { PACKAGING_SECTORS } from '../../utils/userTier.js';

const STATUS_CLS = {
  in_review:        'bg-blue-50 text-blue-700 ring-blue-200',
  approved:         'bg-green-50 text-green-700 ring-green-200',
  changes_required: 'bg-amber-50 text-amber-700 ring-amber-200',
};

export const CheckStatusBadge = ({ status }) => {
  const { t } = useTranslation('packaging');
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ${STATUS_CLS[status]}`}>
      {t(`status.${status}`)}
    </span>
  );
};

// Sectors that have not approved their part of the email yet; `pendingBySector` = { sector: n }.
export const SectorPending = ({ pendingBySector, highlight }) => {
  const { t } = useTranslation('packaging');
  const { t: tc } = useTranslation('common');
  const sectors = PACKAGING_SECTORS.filter((s) => pendingBySector[s]);

  if (!sectors.length) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-700">
        <CheckCircle2 size={13} /> {t('allAnswered')}
      </span>
    );
  }
  return (
    <div className="flex flex-wrap gap-1">
      {sectors.map((s) => (
        <span
          key={s}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] ${
            s === highlight ? 'bg-amber-100 text-amber-800 font-semibold' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {tc(`dept.${s}`)} <span className="opacity-70">{pendingBySector[s]}</span>
        </span>
      ))}
    </div>
  );
};
