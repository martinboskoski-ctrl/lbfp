import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import RoundInputs from './RoundInputs.jsx';
import { emptyRound, validateRound, appendRound } from './roundForm.js';
import { useClosePackagingRound, useAddPackagingRound } from '../../hooks/usePackaging.js';

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  </div>
);

export const CloseRoundModal = ({ check, round, isTopMgmt, onClose }) => {
  const { t } = useTranslation('packaging');
  const close = useClosePackagingRound();
  const pending = round.remarks.filter((r) => r.status === 'pending').length;
  const confirmed = round.remarks.some((r) => r.status === 'confirmed');
  const [decision, setDecision] = useState(confirmed ? 'changes_required' : 'approved');
  const [summary, setSummary] = useState('');
  const blocked = pending > 0 && !isTopMgmt;

  const submit = () => close.mutate({ id: check._id, decision, summary }, { onSuccess: onClose });

  return (
    <Modal title={t('close.title', { n: round.number })} onClose={onClose}>
      {pending > 0 && (
        <div className="flex items-start gap-2 mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div>
            {t('close.pendingWarning', { count: pending })}{' '}
            {isTopMgmt ? t('close.pendingOverride') : t('close.pendingBlocked')}
          </div>
        </div>
      )}
      <label className="label">{t('close.decision')}</label>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { value: 'approved', icon: CheckCircle2, cls: 'border-green-500 bg-green-50 text-green-800' },
          { value: 'changes_required', icon: AlertTriangle, cls: 'border-amber-500 bg-amber-50 text-amber-800' },
        ].map(({ value, icon, cls }) => {
          const IconCmp = icon;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setDecision(value)}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium ${
                decision === value ? cls : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <IconCmp size={16} /> {t(`status.${value}`)}
            </button>
          );
        })}
      </div>
      <label className="label">{t('close.summary')}</label>
      <textarea className="input min-h-[100px]" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder={t('close.summaryPlaceholder')} />
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="btn-secondary">{t('detail.cancel')}</button>
        <button onClick={submit} disabled={blocked || close.isPending} className="btn-primary">{t('close.submit')}</button>
      </div>
    </Modal>
  );
};

export const NewRoundModal = ({ check, onClose }) => {
  const { t } = useTranslation('packaging');
  const addRound = useAddPackagingRound();
  const last = check.rounds[check.rounds.length - 1];
  const [round, setRound] = useState(emptyRound(last?.ingredientsText || ''));
  const [errors, setErrors] = useState({});

  const submit = () => {
    const errs = validateRound(round, t);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const form = new FormData();
    appendRound(form, round);
    addRound.mutate({ id: check._id, form }, { onSuccess: onClose });
  };

  return (
    <Modal title={t('newRound.title', { n: check.rounds.length + 1 })} onClose={onClose}>
      <p className="text-sm text-slate-500 mb-4">{t('newRound.hint')}</p>
      <RoundInputs value={round} onChange={setRound} errors={errors} />
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="btn-secondary">{t('detail.cancel')}</button>
        <button onClick={submit} disabled={addRound.isPending} className="btn-primary flex items-center gap-2">
          {addRound.isPending && <Loader2 size={15} className="animate-spin" />}
          {addRound.isPending ? t('form.submitting') : t('newRound.submit')}
        </button>
      </div>
    </Modal>
  );
};
