import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { X, RefreshCw } from 'lucide-react';
import { useCreateAgreement, useUpdateAgreement, useRenewAgreement } from '../../hooks/useAgreements.js';

export const CATEGORIES = [
  { value: 'nda' },
  { value: 'service' },
  { value: 'supply' },
  { value: 'lease' },
  { value: 'employment' },
  { value: 'partnership' },
  { value: 'other' },
];

const Field = ({ label, error, children }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

// mode: 'create' | 'edit' | 'renew'
export default function AddAgreementModal({ onClose, initial = null, mode = 'create', dept = null }) {
  const { t } = useTranslation('agreements');
  const { t: tc } = useTranslation('common');

  const isRenew  = mode === 'renew';
  const isEdit   = mode === 'edit';

  const create    = useCreateAgreement();
  const update    = useUpdateAgreement();
  const renew     = useRenewAgreement();

  const [openEnded, setOpenEnded] = useState(
    isRenew ? !initial?.endDate : isEdit ? !initial?.endDate : false
  );

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: isEdit ? {
      title:        initial?.title ?? '',
      description:  initial?.description ?? '',
      otherParty:   initial?.otherParty ?? '',
      category:     initial?.category ?? 'other',
      startDate:    initial?.startDate?.slice(0, 10) ?? '',
      endDate:      initial?.endDate?.slice(0, 10) ?? '',
      autoRenew:    initial?.autoRenew ?? false,
      reminderDays: initial?.reminderDays ?? 30,
      value:        initial?.value ?? '',
      currency:     initial?.currency ?? 'MKD',
      notes:        initial?.notes ?? '',
    } : isRenew ? {
      title:        initial?.title ?? '',
      description:  initial?.description ?? '',
      otherParty:   initial?.otherParty ?? '',
      category:     initial?.category ?? 'other',
      startDate:    new Date().toISOString().slice(0, 10),
      endDate:      '',
      autoRenew:    initial?.autoRenew ?? false,
      reminderDays: initial?.reminderDays ?? 30,
      value:        initial?.value ?? '',
      currency:     initial?.currency ?? 'MKD',
      notes:        '',
    } : {
      title: '', description: '', otherParty: '', category: 'other',
      startDate: new Date().toISOString().slice(0, 10), endDate: '',
      autoRenew: false, reminderDays: 30, value: '', currency: 'MKD', notes: '',
    },
  });

  const watchValue = watch('value');

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      endDate:    openEnded ? null : (data.endDate || null),
      value:      data.value ? Number(data.value) : null,
      reminderDays: Number(data.reminderDays),
      // Pass the currently-viewed department so agreements are saved under the right dept
      ...(dept && { department: dept }),
    };

    if (isRenew) {
      await renew.mutateAsync({ id: initial._id, data: payload });
    } else if (isEdit) {
      await update.mutateAsync({ id: initial._id, data: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  };

  const titles = {
    create: t('modal.createTitle'),
    edit:   t('modal.editTitle'),
    renew:  t('modal.renewTitle'),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {isRenew && <RefreshCw size={18} className="text-blue-600" />}
            <h2 className="font-semibold text-gray-900">{titles[mode]}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {isRenew && (
            <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              {t('modal.renewNote')}
            </div>
          )}

          <Field label={t('modal.titleLabel')} error={errors.title?.message}>
            <input className={`input ${errors.title ? 'border-red-400' : ''}`}
              placeholder={t('modal.titlePlaceholder')}
              {...register('title', { required: t('modal.titleRequired') })} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('modal.categoryLabel')} error={errors.category?.message}>
              <select className="input" {...register('category', { required: true })}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{t(`category.${c.value}`)}</option>
                ))}
              </select>
            </Field>

            <Field label={t('modal.otherPartyLabel')} error={errors.otherParty?.message}>
              <input className={`input ${errors.otherParty ? 'border-red-400' : ''}`}
                placeholder={t('modal.otherPartyPlaceholder')}
                {...register('otherParty', { required: tc('validation.required') })} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('modal.startDateLabel')} error={errors.startDate?.message}>
              <input type="date" className={`input ${errors.startDate ? 'border-red-400' : ''}`}
                {...register('startDate', { required: tc('validation.required') })} />
            </Field>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">{t('modal.endDateLabel')}</label>
                <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                  <input type="checkbox" className="rounded"
                    checked={openEnded}
                    onChange={(e) => { setOpenEnded(e.target.checked); if (e.target.checked) setValue('endDate', ''); }} />
                  {t('modal.openEnded')}
                </label>
              </div>
              <input type="date" className="input disabled:opacity-40"
                disabled={openEnded}
                {...register('endDate')} />
            </div>
          </div>

          {!openEnded && (
            <Field label={t('modal.reminderLabel', { days: watch('reminderDays') })}>
              <input type="range" min={7} max={90} step={1}
                className="w-full accent-blue-600"
                {...register('reminderDays')} />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>{t('modal.reminderDays7')}</span><span>30</span><span>60</span><span>{t('modal.reminderDays90')}</span>
              </div>
            </Field>
          )}

          <div className="flex items-center gap-2">
            <input type="checkbox" id="autoRenew" className="rounded accent-blue-600" {...register('autoRenew')} />
            <label htmlFor="autoRenew" className="text-sm text-gray-700 cursor-pointer">
              {t('modal.autoRenewLabel')}
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('modal.valueLabel')}>
              <input type="number" min={0} className="input" placeholder={t('modal.valuePlaceholder')}
                {...register('value')} />
            </Field>
            <Field label={t('modal.currencyLabel')}>
              <select className={`input ${!watchValue ? 'opacity-40' : ''}`}
                disabled={!watchValue}
                {...register('currency')}>
                <option value="MKD">{t('modal.currencyMKD')}</option>
                <option value="EUR">{t('modal.currencyEUR')}</option>
                <option value="USD">{t('modal.currencyUSD')}</option>
              </select>
            </Field>
          </div>

          <Field label={t('modal.descriptionLabel')}>
            <textarea rows={2} className="input resize-none" placeholder={t('modal.descriptionPlaceholder')}
              {...register('description')} />
          </Field>

          <Field label={t('modal.notesLabel')}>
            <textarea rows={2} className="input resize-none" placeholder={t('modal.notesPlaceholder')}
              {...register('notes')} />
          </Field>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">{tc('cancel')}</button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || create.isPending || update.isPending || renew.isPending}
            className="btn-primary flex-1"
          >
            {isRenew ? t('modal.submitRenew') : isEdit ? t('modal.submitEdit') : t('modal.submitCreate')}
          </button>
        </div>
      </div>
    </div>
  );
}
