import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useCreateLead, useUpdateLead } from '../../hooks/useLeads.js';
import { useDirectory } from '../../hooks/useUsers.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { canManage } from '../../utils/userTier.js';

export const STAGES = [
  { value: 'new',         label: 'Нов' },
  { value: 'contacted',   label: 'Контактиран' },
  { value: 'qualified',   label: 'Квалификуван' },
  { value: 'proposal',    label: 'Понуда' },
  { value: 'negotiation', label: 'Преговори' },
  { value: 'won',         label: 'Добиен' },
  { value: 'lost',        label: 'Изгубен' },
];

export const SOURCES = [
  { value: 'referral',         label: 'Препорака' },
  { value: 'website',          label: 'Веб-страна' },
  { value: 'cold_call',        label: 'Ладен повик' },
  { value: 'exhibition',       label: 'Саем' },
  { value: 'linkedin',         label: 'LinkedIn' },
  { value: 'existing_client',  label: 'Постоечки клиент' },
  { value: 'other',            label: 'Друго' },
];

export const PRIORITIES = [
  { value: 'low',    label: 'Низок' },
  { value: 'medium', label: 'Среден' },
  { value: 'high',   label: 'Висок' },
];

const Field = ({ label, error, children }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

export default function AddLeadModal({ onClose, initial = null, mode = 'create' }) {
  const isEdit = mode === 'edit';
  const { user } = useAuth();
  const userCanManage = canManage(user);

  const create = useCreateLead();
  const update = useUpdateLead();
  const { data: salesUsers = [] } = useDirectory('sales');

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
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Уреди лид' : 'Нов лид'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          <div className="grid grid-cols-2 gap-3">
            <Field label="Контакт лице *" error={errors.contactName?.message}>
              <input className={`input ${errors.contactName ? 'border-red-400' : ''}`}
                placeholder="Име и презиме"
                {...register('contactName', { required: 'Задолжително поле' })} />
            </Field>
            <Field label="Компанија *" error={errors.companyName?.message}>
              <input className={`input ${errors.companyName ? 'border-red-400' : ''}`}
                placeholder="Назив на компанијата"
                {...register('companyName', { required: 'Задолжително поле' })} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Е-пошта">
              <input type="email" className="input" placeholder="email@example.com"
                {...register('email')} />
            </Field>
            <Field label="Телефон">
              <input className="input" placeholder="+389 7X XXX XXX"
                {...register('phone')} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Фаза">
              <select className="input" {...register('stage')}>
                {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Извор">
              <select className="input" {...register('source')}>
                {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Приоритет">
              <select className="input" {...register('priority')}>
                {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Проценета вредност">
              <input type="number" min={0} className="input" placeholder="пр. 50000"
                {...register('estimatedValue')} />
            </Field>
            <Field label="Валута">
              <select className="input" {...register('currency')}>
                <option value="EUR">EUR — Евро</option>
                <option value="MKD">MKD — Денар</option>
                <option value="USD">USD — Долар</option>
              </select>
            </Field>
          </div>

          <Field label="Интерес за производи">
            <textarea rows={2} className="input resize-none"
              placeholder="Кои амбалажни производи ги бара…"
              {...register('productInterest')} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Следен контакт">
              <input type="date" className="input" {...register('nextFollowUp')} />
            </Field>
            {userCanManage && (
              <Field label="Задолжен">
                <select className="input" {...register('assignedTo')}>
                  {salesUsers.map((u) => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          {watchStage === 'lost' && (
            <Field label="Причина за губење">
              <textarea rows={2} className="input resize-none"
                placeholder="Зошто е изгубен лидот…"
                {...register('lostReason')} />
            </Field>
          )}

        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Откажи</button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || create.isPending || update.isPending}
            className="btn-primary flex-1"
          >
            {isEdit ? 'Зачувај' : 'Додај лид'}
          </button>
        </div>
      </div>
    </div>
  );
}
