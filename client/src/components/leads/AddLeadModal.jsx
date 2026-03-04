import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCreateLead, useUpdateLead } from '../../hooks/useLeads.js';
import { useDirectory } from '../../hooks/useUsers.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { canManage } from '../../utils/userTier.js';

export const STAGE_VALUES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
export const SOURCE_VALUES = ['referral', 'website', 'cold_call', 'exhibition', 'linkedin', 'existing_client', 'other'];
export const PRIORITY_VALUES = ['low', 'medium', 'high'];

// Translated option arrays — call these inside a component that has `t`
export const useStages = () => {
  const { t } = useTranslation('leads');
  return STAGE_VALUES.map((v) => ({ value: v, label: t(`stage.${v}`) }));
};
export const useSources = () => {
  const { t } = useTranslation('leads');
  return SOURCE_VALUES.map((v) => ({ value: v, label: t(`source.${v}`) }));
};
export const usePriorities = () => {
  const { t } = useTranslation('leads');
  return PRIORITY_VALUES.map((v) => ({ value: v, label: t(`leadPriority.${v}`) }));
};

// Keep legacy named exports so existing imports don't break
export const STAGES = STAGE_VALUES.map((v) => ({ value: v, label: v }));
export const SOURCES = SOURCE_VALUES.map((v) => ({ value: v, label: v }));
export const PRIORITIES = PRIORITY_VALUES.map((v) => ({ value: v, label: v }));

const Field = ({ label, error, children }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

export default function AddLeadModal({ onClose, initial = null, mode = 'create' }) {
  const { t } = useTranslation('leads');
  const { t: tc } = useTranslation('common');
  const isEdit = mode === 'edit';
  const { user } = useAuth();
  const userCanManage = canManage(user);

  const create = useCreateLead();
  const update = useUpdateLead();
  const { data: salesUsers = [] } = useDirectory('sales');

  const stages = useStages();
  const sources = useSources();
  const priorities = usePriorities();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: isEdit ? {
      contactName:    initial?.contactName ?? '',
      companyName:    initial?.companyName ?? '',
      email:          initial?.email ?? '',
      phone:          initial?.phone ?? '',
      stage:          initial?.stage ?? 'new',
      source:         initial?.source ?? 'other',
      priority:       initial?.priority ?? 'medium',
      estimatedValue: initial?.estimatedValue ?? '',
      currency:       initial?.currency ?? 'EUR',
      productInterest: initial?.productInterest ?? '',
      nextFollowUp:   initial?.nextFollowUp?.slice(0, 10) ?? '',
      assignedTo:     initial?.assignedTo?._id ?? initial?.assignedTo ?? '',
      lostReason:     initial?.lostReason ?? '',
    } : {
      contactName: '', companyName: '', email: '', phone: '',
      stage: 'new', source: 'other', priority: 'medium',
      estimatedValue: '', currency: 'EUR', productInterest: '',
      nextFollowUp: '', assignedTo: user._id, lostReason: '',
    },
  });

  const watchStage = watch('stage');

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      estimatedValue: data.estimatedValue ? Number(data.estimatedValue) : null,
      nextFollowUp: data.nextFollowUp || null,
    };

    if (isEdit) {
      await update.mutateAsync({ id: initial._id, data: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{isEdit ? t('modal.editTitle') : t('modal.createTitle')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('modal.contactNameLabel')} error={errors.contactName?.message}>
              <input className={`input ${errors.contactName ? 'border-red-400' : ''}`}
                placeholder={t('modal.contactNamePlaceholder')}
                {...register('contactName', { required: tc('validation.required') })} />
            </Field>
            <Field label={t('modal.companyLabel')} error={errors.companyName?.message}>
              <input className={`input ${errors.companyName ? 'border-red-400' : ''}`}
                placeholder={t('modal.companyPlaceholder')}
                {...register('companyName', { required: tc('validation.required') })} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('modal.emailLabel')}>
              <input type="email" className="input" placeholder="email@example.com"
                {...register('email')} />
            </Field>
            <Field label={t('modal.phoneLabel')}>
              <input className="input" placeholder="+389 7X XXX XXX"
                {...register('phone')} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label={t('modal.stageLabel')}>
              <select className="input" {...register('stage')}>
                {stages.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label={t('modal.sourceLabel')}>
              <select className="input" {...register('source')}>
                {sources.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label={t('modal.priorityLabel')}>
              <select className="input" {...register('priority')}>
                {priorities.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('modal.estimatedValueLabel')}>
              <input type="number" min={0} className="input" placeholder={t('modal.estimatedValuePlaceholder')}
                {...register('estimatedValue')} />
            </Field>
            <Field label={t('modal.currencyLabel')}>
              <select className="input" {...register('currency')}>
                <option value="EUR">{t('modal.currencyEUR')}</option>
                <option value="MKD">{t('modal.currencyMKD')}</option>
                <option value="USD">{t('modal.currencyUSD')}</option>
              </select>
            </Field>
          </div>

          <Field label={t('modal.productInterestLabel')}>
            <textarea rows={2} className="input resize-none"
              placeholder={t('modal.productInterestPlaceholder')}
              {...register('productInterest')} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('modal.nextFollowUpLabel')}>
              <input type="date" className="input" {...register('nextFollowUp')} />
            </Field>
            {userCanManage && (
              <Field label={t('modal.assignedToLabel')}>
                <select className="input" {...register('assignedTo')}>
                  {salesUsers.map((u) => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          {watchStage === 'lost' && (
            <Field label={t('modal.lostReasonLabel')}>
              <textarea rows={2} className="input resize-none"
                placeholder={t('modal.lostReasonPlaceholder')}
                {...register('lostReason')} />
            </Field>
          )}

        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">{tc('cancel')}</button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || create.isPending || update.isPending}
            className="btn-primary flex-1"
          >
            {isEdit ? t('modal.submitEdit') : t('modal.submitCreate')}
          </button>
        </div>
      </div>
    </div>
  );
}
