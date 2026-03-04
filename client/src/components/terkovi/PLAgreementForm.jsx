import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Download, Building2, CreditCard, User, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { plAgreementSchema, DEPOSIT_OPTIONS } from '../../schemas/terkovi/plAgreementSchema.js';
import api from '../../api/axios.js';

// Balance percent is the complement of deposit
const depositToBalance = { '70': '30', '60': '40', '50': '50' };

export default function PLAgreementForm() {
  const { t } = useTranslation('terkovi');
  const [generateError, setGenerateError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(plAgreementSchema),
    defaultValues: {
      effectiveDate:         new Date().toISOString().slice(0, 10),
      companyName:           '',
      companyAddress:        '',
      companyCRN:            '',
      companyCEO:            '',
      customerEmail:         '',
      customerSignatoryName: '',
      MOQamount:             '',
      depositPercent:        '70',
    },
  });

  const depositPercent = watch('depositPercent');
  const balancePercent = depositToBalance[depositPercent] ?? '30';

  const onSubmit = async (data) => {
    setGenerateError('');
    try {
      const response = await api.post('/terkovi/pl-agreement/generate', data, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const dateStr = data.effectiveDate.replace(/-/g, '');
      const partySlug = data.companyName
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '')
        .substring(0, 30);
      link.setAttribute('download', `PLAgreement_${partySlug}_${dateStr}.docx`);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PL Agreement generation failed:', err);
      setGenerateError(t('pl.generateError'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 bg-green-50 rounded-lg">
          <FileText size={22} className="text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('pl.heading')}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('pl.description')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Effective Date */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-4">
            {t('pl.agreementDateSection')}
          </h3>
          <div>
            <label className="label" htmlFor="pl-effectiveDate">{t('pl.effectiveDateLabel')}</label>
            <input
              id="pl-effectiveDate"
              type="date"
              className={`input ${errors.effectiveDate ? 'border-red-400' : ''}`}
              {...register('effectiveDate')}
            />
            {errors.effectiveDate && (
              <p className="mt-1 text-xs text-red-600">{errors.effectiveDate.message}</p>
            )}
          </div>
        </div>

        {/* Customer Company Details */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-gray-500" />
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
              {t('pl.customerSection')}
            </h3>
          </div>

          {/* Company Name */}
          <div>
            <label className="label" htmlFor="pl-companyName">{t('pl.companyNameLabel')}</label>
            <input
              id="pl-companyName"
              type="text"
              placeholder={t('pl.companyNamePlaceholder')}
              className={`input ${errors.companyName ? 'border-red-400' : ''}`}
              {...register('companyName')}
            />
            {errors.companyName && (
              <p className="mt-1 text-xs text-red-600">{errors.companyName.message}</p>
            )}
          </div>

          {/* Company Address */}
          <div>
            <label className="label" htmlFor="pl-companyAddress">{t('pl.addressLabel')}</label>
            <input
              id="pl-companyAddress"
              type="text"
              placeholder={t('pl.addressPlaceholder')}
              className={`input ${errors.companyAddress ? 'border-red-400' : ''}`}
              {...register('companyAddress')}
            />
            {errors.companyAddress && (
              <p className="mt-1 text-xs text-red-600">{errors.companyAddress.message}</p>
            )}
          </div>

          {/* Two-column: CRN + CEO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="pl-companyCRN">{t('pl.crnLabel')}</label>
              <input
                id="pl-companyCRN"
                type="text"
                placeholder={t('pl.crnPlaceholder')}
                className={`input ${errors.companyCRN ? 'border-red-400' : ''}`}
                {...register('companyCRN')}
              />
              {errors.companyCRN && (
                <p className="mt-1 text-xs text-red-600">{errors.companyCRN.message}</p>
              )}
            </div>
            <div>
              <label className="label" htmlFor="pl-companyCEO">{t('pl.ceoLabel')}</label>
              <input
                id="pl-companyCEO"
                type="text"
                placeholder={t('pl.ceoPlaceholder')}
                className={`input ${errors.companyCEO ? 'border-red-400' : ''}`}
                {...register('companyCEO')}
              />
              {errors.companyCEO && (
                <p className="mt-1 text-xs text-red-600">{errors.companyCEO.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Communication */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-gray-500" />
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
              {t('pl.communicationSection')}
            </h3>
          </div>
          <div>
            <label className="label" htmlFor="pl-customerEmail">{t('pl.customerEmailLabel')}</label>
            <input
              id="pl-customerEmail"
              type="email"
              placeholder={t('pl.customerEmailPlaceholder')}
              className={`input ${errors.customerEmail ? 'border-red-400' : ''}`}
              {...register('customerEmail')}
            />
            {errors.customerEmail && (
              <p className="mt-1 text-xs text-red-600">{errors.customerEmail.message}</p>
            )}
          </div>
        </div>

        {/* Commercial Terms */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-gray-500" />
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
              {t('pl.commercialSection')}
            </h3>
          </div>

          {/* MOQ */}
          <div>
            <label className="label" htmlFor="pl-MOQamount">
              {t('pl.moqLabel')}
            </label>
            <input
              id="pl-MOQamount"
              type="number"
              min="1"
              step="1"
              placeholder={t('pl.moqPlaceholder')}
              className={`input ${errors.MOQamount ? 'border-red-400' : ''}`}
              {...register('MOQamount')}
            />
            <p className="mt-1 text-xs text-gray-400">
              {t('pl.moqHint')}
            </p>
            {errors.MOQamount && (
              <p className="mt-1 text-xs text-red-600">{errors.MOQamount.message}</p>
            )}
          </div>

          {/* Deposit / Balance split */}
          <div>
            <label className="label">{t('pl.depositLabel')}</label>
            <div className="flex flex-col sm:flex-row gap-3 mt-1">
              {DEPOSIT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-colors ${
                    depositPercent === opt.value
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    value={opt.value}
                    {...register('depositPercent')}
                    className="sr-only"
                  />
                  <span className="font-medium text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.depositPercent && (
              <p className="mt-1.5 text-xs text-red-600">{errors.depositPercent.message}</p>
            )}
            <p
              className="mt-2 text-xs text-gray-400"
              dangerouslySetInnerHTML={{ __html: t('pl.depositHint', { deposit: depositPercent, balance: balancePercent }) }}
            />
          </div>
        </div>

        {/* Signature Block */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-500" />
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
              {t('pl.signatorySection')}
            </h3>
          </div>
          <div>
            <label className="label" htmlFor="pl-customerSignatoryName">
              {t('pl.signatoryNameLabel')}
            </label>
            <input
              id="pl-customerSignatoryName"
              type="text"
              placeholder={t('pl.signatoryNamePlaceholder')}
              className={`input ${errors.customerSignatoryName ? 'border-red-400' : ''}`}
              {...register('customerSignatoryName')}
            />
            {errors.customerSignatoryName && (
              <p className="mt-1 text-xs text-red-600">{errors.customerSignatoryName.message}</p>
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
          {isSubmitting ? t('pl.generating') : t('pl.generateButton')}
        </button>
      </form>
    </div>
  );
}
