import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Download, Globe } from 'lucide-react';
import { ndaSchema } from '../../schemas/terkovi/ndaSchema.js';
import CompanyFieldsSection from '../common/CompanyFieldsSection.jsx';
import api from '../../api/axios.js';

const LANGUAGE_OPTIONS = [
  { value: 'MKD',      label: 'Само македонски' },
  { value: 'ENG',      label: 'Само англиски' },
  { value: 'BILINGUAL', label: 'Македонски – Англиски' },
];

export default function NDAForm() {
  const [generateError, setGenerateError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(ndaSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      secondParty: {
        crn: '',
        mkd: { name: '', address: '', manager: '' },
        eng: { name: '', address: '', manager: '' },
      },
      language: 'MKD',
    },
  });

  const language = watch('language');

  const onSubmit = async (data) => {
    setGenerateError('');
    try {
      const response = await api.post('/terkovi/nda/generate', data, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const dateStr = data.date.replace(/-/g, '');
      const partyName = data.language === 'ENG' ? data.secondParty.eng.name : data.secondParty.mkd.name;
      const partySlug = partyName
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '')
        .substring(0, 30);
      const langSuffix = { MKD: 'MKD', ENG: 'ENG', BILINGUAL: 'MKD_ENG' }[data.language] ?? 'MKD';
      link.setAttribute('download', `NDA_LBFP_${partySlug}_${dateStr}_${langSuffix}.docx`);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('NDA generation failed:', err);
      setGenerateError('Грешка при генерирање. Обидете се повторно.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <FileText size={22} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Договор за доверливост (NDA)</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Генерирај договор помеѓу ЛБФП ДОО Битола и втората страна
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Language selector */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={16} className="text-gray-500" />
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
              Верзија на документот
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {LANGUAGE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-colors ${
                  language === opt.value
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  value={opt.value}
                  {...register('language')}
                  className="sr-only"
                />
                <span className="font-medium text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
          {errors.language && (
            <p className="mt-1.5 text-xs text-red-600">{errors.language.message}</p>
          )}
        </div>

        {/* Agreement date */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-4">
            Датум на договор
          </h3>
          <div>
            <label className="label" htmlFor="nda-date">Датум</label>
            <input
              id="nda-date"
              type="date"
              className={`input ${errors.date ? 'border-red-400' : ''}`}
              {...register('date')}
            />
            {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date.message}</p>}
          </div>
        </div>

        {/* Second party company fields */}
        <CompanyFieldsSection
          prefix="secondParty"
          legend="Втора договорна страна"
          language={language}
          register={register}
          errors={errors.secondParty}
        />

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
          {isSubmitting ? 'Генерирање…' : 'Генерирај договор (.docx)'}
        </button>
      </form>
    </div>
  );
}
