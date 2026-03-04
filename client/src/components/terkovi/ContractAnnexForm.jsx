import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Download, User, CalendarDays, ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { contractAnnexSchema } from '../../schemas/terkovi/contractAnnexSchema.js';
import api from '../../api/axios.js';

export default function ContractAnnexForm() {
  const { t } = useTranslation('terkovi');
  const [generateError, setGenerateError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contractAnnexSchema),
    defaultValues: {
      date:           new Date().toISOString().slice(0, 10),
      employeeName:   '',
      employeePin:    '',
      contractNumber: '',
      contractDate:   '',
      newEndDate:     '',
    },
  });

  const employeeName = watch('employeeName');
  const date         = watch('date');

  const onSubmit = async (data) => {
    setGenerateError('');
    try {
      const response = await api.post('/terkovi/contract-annex/generate', data, {
        responseType: 'blob',
      });

      const url  = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href  = url;

      const dateStr   = data.date.replace(/-/g, '');
      const nameSlug  = (data.employeeName ?? '')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_\u0400-\u04FF]/g, '')
        .substring(0, 30);
      link.setAttribute('download', `Aneks_${nameSlug}_${dateStr}.docx`);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Contract annex generation failed:', err);
      setGenerateError(t('contractAnnex.generateError'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 bg-purple-50 rounded-lg">
          <FileText size={22} className="text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('contractAnnex.heading')}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('contractAnnex.description')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Annex Date */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays size={16} className="text-gray-500" />
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
              {t('contractAnnex.annexDateSection')}
            </h3>
          </div>
          <div>
            <label className="label" htmlFor="ca-date">
              {t('contractAnnex.dateLabel')}
            </label>
            <input
              id="ca-date"
              type="date"
              className={`input ${errors.date ? 'border-red-400' : ''}`}
              {...register('date')}
            />
            {errors.date && (
              <p className="mt-1 text-xs text-red-600">{errors.date.message}</p>
            )}
          </div>
        </div>

        {/* Employee Details */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-500" />
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
              {t('contractAnnex.employeeSection')}
            </h3>
          </div>

          {/* Employee Name */}
          <div>
            <label className="label" htmlFor="ca-employeeName">
              {t('contractAnnex.employeeNameLabel')}
            </label>
            <input
              id="ca-employeeName"
              type="text"
              placeholder={t('contractAnnex.employeeNamePlaceholder')}
              className={`input ${errors.employeeName ? 'border-red-400' : ''}`}
              {...register('employeeName')}
            />
            {errors.employeeName && (
              <p className="mt-1 text-xs text-red-600">{errors.employeeName.message}</p>
            )}
          </div>

          {/* Employee EMBG */}
          <div>
            <label className="label" htmlFor="ca-employeePin">
              {t('contractAnnex.employeePinLabel')}
            </label>
            <input
              id="ca-employeePin"
              type="text"
              inputMode="numeric"
              maxLength={13}
              placeholder={t('contractAnnex.employeePinPlaceholder')}
              className={`input font-mono tracking-widest ${errors.employeePin ? 'border-red-400' : ''}`}
              {...register('employeePin')}
            />
            <p className="mt-1 text-xs text-gray-400">13 цифри</p>
            {errors.employeePin && (
              <p className="mt-1 text-xs text-red-600">{errors.employeePin.message}</p>
            )}
          </div>
        </div>

        {/* Base Contract Details */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="text-gray-500" />
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
              {t('contractAnnex.contractSection')}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Contract Number */}
            <div>
              <label className="label" htmlFor="ca-contractNumber">
                {t('contractAnnex.contractNumberLabel')}
              </label>
              <input
                id="ca-contractNumber"
                type="text"
                placeholder={t('contractAnnex.contractNumberPlaceholder')}
                className={`input ${errors.contractNumber ? 'border-red-400' : ''}`}
                {...register('contractNumber')}
              />
              {errors.contractNumber && (
                <p className="mt-1 text-xs text-red-600">{errors.contractNumber.message}</p>
              )}
            </div>

            {/* Contract Date */}
            <div>
              <label className="label" htmlFor="ca-contractDate">
                {t('contractAnnex.contractDateLabel')}
              </label>
              <input
                id="ca-contractDate"
                type="date"
                className={`input ${errors.contractDate ? 'border-red-400' : ''}`}
                {...register('contractDate')}
              />
              {errors.contractDate && (
                <p className="mt-1 text-xs text-red-600">{errors.contractDate.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* New End Date */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays size={16} className="text-gray-500" />
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
              {t('contractAnnex.newEndDateSection')}
            </h3>
          </div>
          <div>
            <label className="label" htmlFor="ca-newEndDate">
              {t('contractAnnex.newEndDateLabel')}
            </label>
            <input
              id="ca-newEndDate"
              type="date"
              className={`input ${errors.newEndDate ? 'border-red-400' : ''}`}
              {...register('newEndDate')}
            />
            {errors.newEndDate && (
              <p className="mt-1 text-xs text-red-600">{errors.newEndDate.message}</p>
            )}
          </div>
        </div>

        {generateError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {generateError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full gap-2"
        >
          <Download size={16} />
          {isSubmitting ? t('contractAnnex.generating') : t('contractAnnex.generateButton')}
        </button>
      </form>
    </div>
  );
}
