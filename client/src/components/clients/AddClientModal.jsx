import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCreateClient, useUpdateClient } from '../../hooks/useClients.js';
import { useDirectory } from '../../hooks/useUsers.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { canManage } from '../../utils/userTier.js';

const CLIENT_STATUS_VALUES = ['active', 'prospect', 'inactive'];

const Field = ({ label, error, children }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

export default function AddClientModal({ onClose, initial = null, mode = 'create' }) {
  const { t } = useTranslation('clients');
  const { t: tc } = useTranslation('common');
  const isEdit = mode === 'edit';
  const { user } = useAuth();
  const userCanManage = canManage(user);

  const create = useCreateClient();
  const update = useUpdateClient();
  const { data: salesUsers = [] } = useDirectory('sales');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      companyName: initial?.companyName ?? '',
      contactName: initial?.contactName ?? '',
      email:       initial?.email ?? '',
      phone:       initial?.phone ?? '',
      status:      initial?.status ?? 'active',
      notes:       initial?.notes ?? '',
      assignedTo:  initial?.assignedTo?._id ?? initial?.assignedTo ?? user._id,
    },
  });

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onSubmit = async (data) => {
    if (isEdit) await update.mutateAsync({ id: initial._id, data });
    else        await create.mutateAsync(data);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{isEdit ? t('modal.editTitle') : t('modal.createTitle')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <Field label={t('modal.companyLabel')} error={errors.companyName?.message}>
            <input
              className={`input ${errors.companyName ? 'border-red-400' : ''}`}
              placeholder={t('modal.companyPlaceholder')}
              {...register('companyName', { required: tc('validation.required') })}
            />
          </Field>

          <Field label={t('modal.contactNameLabel')}>
            <input className="input" placeholder={t('modal.contactNamePlaceholder')} {...register('contactName')} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('modal.emailLabel')}>
              <input type="email" className="input" placeholder="email@example.com" {...register('email')} />
            </Field>
            <Field label={t('modal.phoneLabel')}>
              <input className="input" placeholder="+389 7X XXX XXX" {...register('phone')} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('modal.statusLabel')}>
              <select className="input" {...register('status')}>
                {CLIENT_STATUS_VALUES.map((s) => (
                  <option key={s} value={s}>{t(`status.${s}`)}</option>
                ))}
              </select>
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

          <Field label={t('modal.notesLabel')}>
            <textarea rows={2} className="input resize-none" placeholder={t('modal.notesPlaceholder')} {...register('notes')} />
          </Field>
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
