import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useCreateRequest, useEditRequest } from '../../hooks/useRequests.js';
import { REQUEST_FORM_FIELDS, REQUEST_TYPE_OPTIONS } from '../../config/requestFormFields.js';

const NewRequestModal = ({ onClose, editRequest = null }) => {
  const { t } = useTranslation('requests');
  const isEdit = !!editRequest;
  const [type, setType] = useState(editRequest?.type || '');
  const [formData, setFormData] = useState(editRequest?.data || {});
  const createMut = useCreateRequest();
  const editMut = useEditRequest();
  const busy = createMut.isPending || editMut.isPending;

  const fields = REQUEST_FORM_FIELDS[type] || [];

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!type) return;
    if (isEdit) {
      editMut.mutate({ id: editRequest._id, data: formData }, { onSuccess: () => onClose() });
    } else {
      createMut.mutate({ type, data: formData }, { onSuccess: () => onClose() });
    }
  };

  const renderField = (field) => {
    const val = formData[field.name] ?? (field.type === 'checkbox' ? false : '');

    if (field.type === 'checkbox') {
      return (
        <label key={field.name} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={!!val}
            onChange={(e) => handleChange(field.name, e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          {t(`field.${field.label}`)}
        </label>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.name}>
          <label className="label">{t(`field.${field.label}`)}{field.required && ' *'}</label>
          <textarea
            className="input min-h-[80px]"
            value={val}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
          />
        </div>
      );
    }

    return (
      <div key={field.name}>
        <label className="label">{t(`field.${field.label}`)}{field.required && ' *'}</label>
        <input
          type={field.type}
          className="input"
          value={val}
          onChange={(e) => handleChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
          required={field.required}
          min={field.min}
          max={field.max}
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">{isEdit ? t('editRequest', { defaultValue: 'Edit request' }) : t('newRequest')}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">{t('requestType')} *</label>
            <select
              className="input"
              value={type}
              onChange={(e) => { setType(e.target.value); setFormData({}); }}
              required
              disabled={isEdit}
            >
              <option value="">{t('selectType')}</option>
              {REQUEST_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{t(`type.${opt.value}`)}</option>
              ))}
            </select>
          </div>

          {fields.map(renderField)}

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={busy || !type} className="btn-primary flex-1">
              {busy ? t('submitting') : t('submit')}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewRequestModal;
