import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { X, RefreshCw } from 'lucide-react';
import { useCreateAgreement, useUpdateAgreement, useRenewAgreement } from '../../hooks/useAgreements.js';
import { useDirectory } from '../../hooks/useUsers.js';

export const CATEGORIES = [
  { value: 'nda' },
  { value: 'service' },
  { value: 'supply' },
  { value: 'lease' },
  { value: 'employment' },
  { value: 'partnership' },
  { value: 'distribution' },
  { value: 'license' },
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

  const baseDefaults = {
    contractNumber:        initial?.contractNumber ?? '',
    title:                 initial?.title ?? '',
    description:           initial?.description ?? '',
    otherParty:            initial?.otherParty ?? '',
    cpName:                initial?.counterpartyContact?.name ?? '',
    cpEmail:               initial?.counterpartyContact?.email ?? '',
    cpPhone:               initial?.counterpartyContact?.phone ?? '',
    cpTaxNo:               initial?.counterpartyContact?.taxNo ?? '',
    cpAddress:             initial?.counterpartyContact?.address ?? '',
    category:              initial?.category ?? 'other',
    tagsText:              (initial?.tags || []).join(', '),
    startDate:             isRenew ? new Date().toISOString().slice(0, 10) : (initial?.startDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)),
    endDate:               isRenew ? '' : (initial?.endDate?.slice(0, 10) ?? ''),
    signedDate:            initial?.signedDate?.slice(0, 10) ?? '',
    autoRenew:             initial?.autoRenew ?? false,
    autoRenewMonths:       initial?.autoRenewMonths ?? 12,
    reminderDays:          initial?.reminderDays ?? 30,
    terminationNoticeDays: initial?.terminationNoticeDays ?? 30,
    value:                 initial?.value ?? '',
    currency:              initial?.currency ?? 'MKD',
    paymentTerms:          initial?.paymentTerms ?? 'one_time',
    paymentAmount:         initial?.paymentAmount ?? '',
    riskLevel:             initial?.riskLevel ?? 'low',
    confidentiality:       initial?.confidentiality ?? 'restricted',
    owner:                 initial?.owner?._id ?? initial?.owner ?? '',
    notes:                 isRenew ? '' : (initial?.notes ?? ''),
  };

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: baseDefaults,
  });

  const directoryDept = dept || initial?.department;
  const { data: directory = [] } = useDirectory(directoryDept);


  const onSubmit = async (data) => {
    const tags = data.tagsText
      ? data.tagsText.split(',').map((t) => t.trim()).filter(Boolean)
      : [];
    const payload = {
      contractNumber:        data.contractNumber || null,
      title:                 data.title,
      description:           data.description || '',
      otherParty:            data.otherParty,
      counterpartyContact: {
        name:    data.cpName    || '',
        email:   data.cpEmail   || '',
        phone:   data.cpPhone   || '',
        taxNo:   data.cpTaxNo   || '',
        address: data.cpAddress || '',
      },
      category:              data.category,
      tags,
      startDate:             data.startDate,
      endDate:               openEnded ? null : (data.endDate || null),
      signedDate:            data.signedDate || null,
      autoRenew:             !!data.autoRenew,
      autoRenewMonths:       Number(data.autoRenewMonths) || 12,
      reminderDays:          Number(data.reminderDays) || 30,
      terminationNoticeDays: Number(data.terminationNoticeDays) || 30,
      value:                 data.value ? Number(data.value) : null,
      currency:              data.currency,
      paymentTerms:          data.paymentTerms,
      paymentAmount:         data.paymentAmount ? Number(data.paymentAmount) : null,
      riskLevel:             data.riskLevel,
      confidentiality:       data.confidentiality,
      owner:                 data.owner || null,
      notes:                 data.notes || '',
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
      <div className="bg-white rounded-md border border-slate-200 shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {isRenew && <RefreshCw size={18} className="text-slate-700" />}
            <h2 className="font-semibold text-slate-900">{titles[mode]}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 sm:py-5 space-y-4">

          {isRenew && (
            <div className="text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-md px-3 py-2">
              {t('modal.renewNote')}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Бр. на договор">
              <input className="input" placeholder="напр. 2026-001" {...register('contractNumber')} />
            </Field>
            <Field label={t('modal.titleLabel')} error={errors.title?.message}>
              <input className={`input ${errors.title ? 'border-red-400' : ''}`}
                placeholder={t('modal.titlePlaceholder')}
                {...register('title', { required: t('modal.titleRequired') })} />
            </Field>
            <Field label={t('modal.categoryLabel')} error={errors.category?.message}>
              <select className="input" {...register('category', { required: true })}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{t(`category.${c.value}`, c.value)}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t('modal.otherPartyLabel')} error={errors.otherParty?.message}>
            <input className={`input ${errors.otherParty ? 'border-red-400' : ''}`}
              placeholder={t('modal.otherPartyPlaceholder')}
              {...register('otherParty', { required: tc('validation.required') })} />
          </Field>

          {/* Counterparty contact */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Контакт лице кај другата страна</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Име"><input className="input" {...register('cpName')} /></Field>
              <Field label="Даночен бр."><input className="input" {...register('cpTaxNo')} /></Field>
              <Field label="Мејл"><input type="email" className="input" {...register('cpEmail')} /></Field>
              <Field label="Телефон"><input className="input" {...register('cpPhone')} /></Field>
            </div>
            <Field label="Адреса">
              <input className="input" {...register('cpAddress')} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('modal.startDateLabel')} error={errors.startDate?.message}>
              <input type="date" className={`input ${errors.startDate ? 'border-red-400' : ''}`}
                {...register('startDate', { required: tc('validation.required') })} />
            </Field>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">{t('modal.endDateLabel')}</label>
                <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
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
                className="w-full accent-slate-700"
                {...register('reminderDays')} />
              <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                <span>{t('modal.reminderDays7')}</span><span>30</span><span>60</span><span>{t('modal.reminderDays90')}</span>
              </div>
            </Field>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Датум на потпис">
              <input type="date" className="input" {...register('signedDate')} />
            </Field>
            <Field label="Откажен рок (денови)">
              <input type="number" min={0} className="input" {...register('terminationNoticeDays')} />
            </Field>
            <Field label="Месеци за авто-обнова">
              <input type="number" min={1} className="input" {...register('autoRenewMonths')} />
            </Field>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="autoRenew" className="rounded accent-slate-700" {...register('autoRenew')} />
            <label htmlFor="autoRenew" className="text-sm text-slate-700 cursor-pointer">
              {t('modal.autoRenewLabel')}
            </label>
          </div>

          {/* Value & payment */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Вредност и плаќање</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label={t('modal.valueLabel')}>
                <input type="number" min={0} className="input" placeholder={t('modal.valuePlaceholder')}
                  {...register('value')} />
              </Field>
              <Field label={t('modal.currencyLabel')}>
                <select className="input" {...register('currency')}>
                  <option value="MKD">MKD</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </Field>
              <Field label="Услови">
                <select className="input" {...register('paymentTerms')}>
                  <option value="one_time">Еднократно</option>
                  <option value="monthly">Месечно</option>
                  <option value="quarterly">Квартално</option>
                  <option value="biannual">Полугодишно</option>
                  <option value="annual">Годишно</option>
                  <option value="on_milestone">По етапи</option>
                  <option value="other">Друго</option>
                </select>
              </Field>
            </div>
            <Field label="Износ по циклус (опционално)">
              <input type="number" min={0} className="input" placeholder="ако периодично" {...register('paymentAmount')} />
            </Field>
          </div>

          {/* Governance */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Управување и ризик</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Ризик">
                <select className="input" {...register('riskLevel')}>
                  <option value="low">Низок</option>
                  <option value="medium">Среден</option>
                  <option value="high">Висок</option>
                  <option value="critical">Критичен</option>
                </select>
              </Field>
              <Field label="Ниво на доверливост">
                <select className="input" {...register('confidentiality')}>
                  <option value="public">Јавен</option>
                  <option value="restricted">Ограничен (секторски)</option>
                  <option value="confidential">Доверлив (мгмт+HR+власник)</option>
                </select>
              </Field>
              <Field label="Одговорно лице">
                <select className="input" {...register('owner')}>
                  <option value="">— нема —</option>
                  {directory.map((u) => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Тагови (одделени со запирка)">
              <input className="input" placeholder="напр. ISO, гл. добавувач" {...register('tagsText')} />
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
        <div className="flex gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100">
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
