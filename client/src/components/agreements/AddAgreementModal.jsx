import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { X, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useCreateAgreement, useUpdateAgreement, useRenewAgreement } from '../../hooks/useAgreements.js';
import { useDirectory } from '../../hooks/useUsers.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { isTopManagement } from '../../utils/userTier.js';
import { DEPARTMENTS } from '../layout/Sidebar.jsx';
import {
  classesForDept, DOCUMENT_TYPES, DURATION_TYPES, REGISTER_STATUSES,
} from '../../constants/contractRegister.js';

// Legacy generic categories (kept for back-compat / filtering on the old list view).
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

const Field = ({ label, error, children, hint }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

// mode: 'create' | 'edit' | 'renew'
export default function AddAgreementModal({ onClose, initial = null, mode = 'create', dept = null }) {
  const { t } = useTranslation('agreements');
  const { t: tc } = useTranslation('common');
  const { user } = useAuth();
  const isAdmin = isTopManagement(user);

  const isRenew  = mode === 'renew';
  const isEdit   = mode === 'edit';

  const create    = useCreateAgreement();
  const update    = useUpdateAgreement();
  const renew     = useRenewAgreement();

  // Department drives the sector-specific class dropdown. Top management may pick
  // the target sector when creating; everyone else is locked to their own.
  const [selectedDept, setSelectedDept] = useState(dept || initial?.department || (isAdmin ? '' : user?.department) || '');

  const [openEnded, setOpenEnded] = useState(
    isRenew ? true
      : isEdit ? (initial?.durationType === 'indefinite' || !initial?.endDate)
      : false
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  const baseDefaults = {
    documentType:          initial?.documentType ?? 'contract',
    contractClass:         initial?.contractClass ?? '',
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
    signedDate:            isRenew ? new Date().toISOString().slice(0, 10) : (initial?.signedDate?.slice(0, 10) ?? ''),
    startDate:             isRenew ? new Date().toISOString().slice(0, 10) : (initial?.startDate?.slice(0, 10) ?? ''),
    endDate:               isRenew ? '' : (initial?.endDate?.slice(0, 10) ?? ''),
    durationType:          initial?.durationType ?? 'fixed',
    status:                initial?.status ?? 'active',
    autoRenew:             initial?.autoRenew ?? false,
    autoRenewMonths:       initial?.autoRenewMonths ?? 12,
    reminderDays:          initial?.reminderDays ?? 30,
    terminationNoticeDays: initial?.terminationNoticeDays ?? 30,
    reviewDate:            initial?.reviewDate?.slice(0, 10) ?? '',
    reviewComment:         initial?.reviewComment ?? '',
    archiveNumber:         initial?.archiveNumber ?? '',
    driveLink:             initial?.driveLink ?? '',
    value:                 initial?.value ?? '',
    currency:              initial?.currency ?? 'MKD',
    paymentTerms:          initial?.paymentTerms ?? 'one_time',
    paymentAmount:         initial?.paymentAmount ?? '',
    riskLevel:             initial?.riskLevel ?? 'low',
    confidentiality:       initial?.confidentiality ?? 'restricted',
    owner:                 initial?.owner?._id ?? initial?.owner ?? '',
    notes:                 isRenew ? '' : (initial?.notes ?? ''),
  };

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: baseDefaults,
  });

  const directoryDept = selectedDept || dept || initial?.department;
  const { data: directory = [] } = useDirectory(directoryDept);
  const classOptions = classesForDept(selectedDept);

  const onSubmit = async (data) => {
    const tags = data.tagsText
      ? data.tagsText.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const payload = {
      documentType:          data.documentType,
      contractClass:         data.contractClass || '',
      contractNumber:        data.contractNumber || null,
      title:                 data.title || '',
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
      signedDate:            data.signedDate || null,
      startDate:             data.startDate || null,
      endDate:               openEnded ? null : (data.endDate || null),
      durationType:          openEnded ? 'indefinite' : 'fixed',
      autoRenew:             !!data.autoRenew,
      autoRenewMonths:       Number(data.autoRenewMonths) || 12,
      reminderDays:          Number(data.reminderDays) || 30,
      terminationNoticeDays: Number(data.terminationNoticeDays) || 30,
      reviewDate:            data.reviewDate || null,
      reviewComment:         data.reviewComment || '',
      archiveNumber:         data.archiveNumber || '',
      driveLink:             data.driveLink || '',
      value:                 data.value ? Number(data.value) : null,
      currency:              data.currency,
      paymentTerms:          data.paymentTerms,
      paymentAmount:         data.paymentAmount ? Number(data.paymentAmount) : null,
      riskLevel:             data.riskLevel,
      confidentiality:       data.confidentiality,
      owner:                 data.owner || null,
      notes:                 data.notes || '',
    };
    // Status is only user-editable when editing an existing record.
    if (isEdit) payload.status = data.status;
    // Department: locked to the prop when provided, else the picked sector (top mgmt).
    const targetDept = dept || selectedDept;
    if (targetDept) payload.department = targetDept;

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
    create: t('modal.createTitle', 'Нов договор'),
    edit:   t('modal.editTitle', 'Уреди договор'),
    renew:  t('modal.renewTitle', 'Обнови договор'),
  };

  // Top management may choose the sector only when creating a brand-new record.
  const showDeptPicker = isAdmin && !dept && mode === 'create';

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
              {t('modal.renewNote', 'Се креира нов запис; стариот се означува како „Обновен“.')}
            </div>
          )}

          {showDeptPicker && (
            <Field label="Сектор (таб во регистарот)">
              <select className="input" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                <option value="">— избери сектор —</option>
                {DEPARTMENTS.filter((d) => d.value !== 'top_management').map((d) => (
                  <option key={d.value} value={d.value}>{tc(`dept.${d.value}`, d.value)}</option>
                ))}
              </select>
            </Field>
          )}

          {/* Register essentials */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Тип на документ">
              <select className="input" {...register('documentType')}>
                {DOCUMENT_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </Field>
            <Field label="Класа / Предмет">
              <select className="input" {...register('contractClass')} disabled={!classOptions.length}>
                <option value="">— избери —</option>
                {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Бр. на договор">
              <input className="input" placeholder="напр. 2026-001" {...register('contractNumber')} />
            </Field>
          </div>

          <Field label="Договорна страна (полн назив)" error={errors.otherParty?.message}>
            <input className={`input ${errors.otherParty ? 'border-red-400' : ''}`}
              placeholder="Целосен правен назив на другата страна"
              {...register('otherParty', { required: 'Договорната страна е задолжителна' })} />
          </Field>

          <Field label="Назив / краток опис" hint="Опционално — пр. „Производство на приватна марка вафли“">
            <input className="input" {...register('title')} />
          </Field>

          {/* Dates & duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Датум на потпишување">
              <input type="date" className="input" {...register('signedDate')} />
            </Field>
            <Field label="Датум на стапување во сила" hint="ако се разликува од потпишувањето">
              <input type="date" className="input" {...register('startDate')} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Датум на истек</label>
                <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
                  <input type="checkbox" className="rounded"
                    checked={openEnded}
                    onChange={(e) => setOpenEnded(e.target.checked)} />
                  Неопределено
                </label>
              </div>
              <input type="date" className="input disabled:opacity-40"
                disabled={openEnded}
                {...register('endDate')} />
            </div>
            <Field label="Рок за отказ (денови)">
              <input type="number" min={0} className="input" {...register('terminationNoticeDays')} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Датум за преглед (пред истек)" hint="навремен преглед за нови понуди / преговори">
              <input type="date" className="input" {...register('reviewDate')} />
            </Field>
            {isEdit && (
              <Field label="Статус">
                <select className="input" {...register('status')}>
                  {REGISTER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
            )}
          </div>

          <Field label="Преглед — коментар">
            <input className="input" placeholder="забелешка за прегледот" {...register('reviewComment')} />
          </Field>

          {/* Archiving & responsibility */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Архивски број / печат">
              <input className="input" placeholder="напр. 03-118/2026" {...register('archiveNumber')} />
            </Field>
            <Field label="Линк до папка (Google Drive)">
              <input className="input" placeholder="https://drive.google.com/..." {...register('driveLink')} />
            </Field>
            <Field label="Одговорен (менаџер)">
              <select className="input" {...register('owner')}>
                <option value="">— нема —</option>
                {directory.map((u) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Auto-renew + reminders */}
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="autoRenew" className="rounded accent-slate-700" {...register('autoRenew')} />
              <span className="text-sm text-slate-700">Автоматско продолжување</span>
            </label>
            {watch('autoRenew') && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                на <input type="number" min={1} className="input w-16 py-1" {...register('autoRenewMonths')} /> месеци
              </div>
            )}
          </div>

          {!openEnded && (
            <Field label={`Потсетник пред истек: ${watch('reminderDays')} денови`}>
              <input type="range" min={7} max={90} step={1} className="w-full accent-slate-700" {...register('reminderDays')} />
              <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                <span>7</span><span>30</span><span>60</span><span>90</span>
              </div>
            </Field>
          )}

          <Field label="Забелешки">
            <textarea rows={2} className="input resize-none" {...register('notes')} />
          </Field>

          {/* ── Advanced / optional (financial, risk, contact) ───────────── */}
          <div className="pt-2 border-t border-slate-100">
            <button type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hover:text-slate-700">
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Дополнително (контакт, вредност, ризик)
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-4">
                {/* Counterparty contact */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Контакт лице кај другата страна</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Име"><input className="input" {...register('cpName')} /></Field>
                    <Field label="Даночен бр."><input className="input" {...register('cpTaxNo')} /></Field>
                    <Field label="Мејл"><input type="email" className="input" {...register('cpEmail')} /></Field>
                    <Field label="Телефон"><input className="input" {...register('cpPhone')} /></Field>
                  </div>
                  <Field label="Адреса"><input className="input" {...register('cpAddress')} /></Field>
                </div>

                {/* Value & payment */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Вредност">
                    <input type="number" min={0} className="input" {...register('value')} />
                  </Field>
                  <Field label="Валута">
                    <select className="input" {...register('currency')}>
                      <option value="MKD">MKD</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </Field>
                  <Field label="Услови на плаќање">
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

                {/* Governance */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Ризик">
                    <select className="input" {...register('riskLevel')}>
                      <option value="low">Низок</option>
                      <option value="medium">Среден</option>
                      <option value="high">Висок</option>
                      <option value="critical">Критичен</option>
                    </select>
                  </Field>
                  <Field label="Доверливост">
                    <select className="input" {...register('confidentiality')}>
                      <option value="public">Јавен</option>
                      <option value="restricted">Ограничен (секторски)</option>
                      <option value="confidential">Доверлив (мгмт+HR+власник)</option>
                    </select>
                  </Field>
                  <Field label="Категорија (општа)">
                    <select className="input" {...register('category')}>
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{t(`category.${c.value}`, c.value)}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Тагови (одделени со запирка)">
                  <input className="input" {...register('tagsText')} />
                </Field>

                <Field label="Опис">
                  <textarea rows={2} className="input resize-none" {...register('description')} />
                </Field>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">{tc('cancel')}</button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || create.isPending || update.isPending || renew.isPending}
            className="btn-primary flex-1"
          >
            {isRenew ? t('modal.submitRenew', 'Обнови') : isEdit ? t('modal.submitEdit', 'Зачувај') : t('modal.submitCreate', 'Додади')}
          </button>
        </div>
      </div>
    </div>
  );
}
