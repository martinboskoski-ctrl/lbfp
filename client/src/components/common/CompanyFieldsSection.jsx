/**
 * Reusable company fields block — language-aware.
 *
 * Props:
 *   prefix   — RHF field name prefix, e.g. "secondParty"
 *   legend   — section heading
 *   language — 'MKD' | 'ENG' | 'BILINGUAL'
 *   register — from useForm()
 *   errors   — errors[prefix] from formState.errors
 */

import { useTranslation } from 'react-i18next';

// Single input field used in both single-lang and bilingual layouts
const Field = ({ id, label, placeholder, hasError, errorMsg, registration }) => (
  <div>
    <label className="label" htmlFor={id}>{label}</label>
    <input
      id={id}
      type="text"
      placeholder={placeholder}
      className={`input ${hasError ? 'border-red-400' : ''}`}
      {...registration}
    />
    {hasError && <p className="mt-1 text-xs text-red-600">{errorMsg}</p>}
  </div>
);

// Single-language block (MKD-only or ENG-only)
const LangBlock = ({ prefix, lang, register, errors, labels }) => {
  const f = (name) => `${prefix}.${lang}.${name}`;

  return (
    <div className="space-y-3">
      <Field id={`${prefix}-${lang}-name`}    label={labels.name}    placeholder={labels.namePh}    hasError={!!errors?.[lang]?.name}    errorMsg={errors?.[lang]?.name?.message}    registration={register(f('name'))} />
      <Field id={`${prefix}-${lang}-address`} label={labels.address} placeholder={labels.addressPh} hasError={!!errors?.[lang]?.address} errorMsg={errors?.[lang]?.address?.message} registration={register(f('address'))} />
      <Field id={`${prefix}-${lang}-manager`} label={labels.manager} placeholder={labels.managerPh} hasError={!!errors?.[lang]?.manager} errorMsg={errors?.[lang]?.manager?.message} registration={register(f('manager'))} />
    </div>
  );
};

// Bilingual side-by-side layout — one row per field, MKD left / ENG right
const BilingualBlock = ({ prefix, register, errors, mkdLabels, engLabels, t }) => {
  const f = (lang, name) => `${prefix}.${lang}.${name}`;

  const FIELDS = [
    { key: 'name',    mkdLabel: mkdLabels.name,    engLabel: engLabels.name,    mkdPh: mkdLabels.namePh,    engPh: engLabels.namePh    },
    { key: 'address', mkdLabel: mkdLabels.address,  engLabel: engLabels.address, mkdPh: mkdLabels.addressPh, engPh: engLabels.addressPh },
    { key: 'manager', mkdLabel: mkdLabels.manager,  engLabel: engLabels.manager, mkdPh: mkdLabels.managerPh, engPh: engLabels.managerPh },
  ];

  return (
    <div className="space-y-3">
      {/* Column headers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-200">{t('companyFields.mkdSection')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">{t('companyFields.engSection')}</span>
        </div>
      </div>

      {/* Paired rows */}
      {FIELDS.map(({ key, mkdLabel, engLabel, mkdPh, engPh }) => (
        <div key={key} className="grid grid-cols-2 gap-3 items-start">
          <div>
            <label className="label" htmlFor={`${prefix}-mkd-${key}`}>{mkdLabel}</label>
            <input
              id={`${prefix}-mkd-${key}`}
              type="text"
              placeholder={mkdPh}
              className={`input ${errors?.mkd?.[key] ? 'border-red-400' : ''}`}
              {...register(f('mkd', key))}
            />
            {errors?.mkd?.[key] && <p className="mt-1 text-xs text-red-600">{errors.mkd[key].message}</p>}
          </div>
          <div>
            <label className="label" htmlFor={`${prefix}-eng-${key}`}>{engLabel}</label>
            <input
              id={`${prefix}-eng-${key}`}
              type="text"
              placeholder={engPh}
              className={`input ${errors?.eng?.[key] ? 'border-red-400' : ''}`}
              {...register(f('eng', key))}
            />
            {errors?.eng?.[key] && <p className="mt-1 text-xs text-red-600">{errors.eng[key].message}</p>}
          </div>
        </div>
      ))}
    </div>
  );
};

const CompanyFieldsSection = ({ prefix, legend, language = 'MKD', register, errors = {} }) => {
  const { t } = useTranslation('terkovi');

  // These labels are always MKD/ENG regardless of UI language — they label the document language fields
  const MKD_LABELS = {
    name:      t('companyFields.nameLabel'),
    address:   t('companyFields.addressLabel'),
    manager:   t('companyFields.managerLabel'),
    namePh:    t('companyFields.namePlaceholder'),
    addressPh: t('companyFields.addressPlaceholder'),
    managerPh: t('companyFields.managerPlaceholder'),
  };

  const ENG_LABELS = { ...MKD_LABELS };

  const crnLabel = t('companyFields.crnLabel');
  const crnPh    = t('companyFields.crnPlaceholder');

  return (
    <div className="card p-5 space-y-4">
      {legend && (
        <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">{legend}</h3>
      )}

      {language === 'MKD'      && <LangBlock     prefix={prefix} lang="mkd" register={register} errors={errors} labels={MKD_LABELS} />}
      {language === 'ENG'      && <LangBlock     prefix={prefix} lang="eng" register={register} errors={errors} labels={ENG_LABELS} />}
      {language === 'BILINGUAL' && <BilingualBlock prefix={prefix}           register={register} errors={errors} mkdLabels={MKD_LABELS} engLabels={ENG_LABELS} t={t} />}

      {/* CRN — always single, language-agnostic */}
      <div>
        <label className="label" htmlFor={`${prefix}-crn`}>{crnLabel}</label>
        <input
          id={`${prefix}-crn`}
          type="text"
          placeholder={crnPh}
          className={`input ${errors.crn ? 'border-red-400' : ''}`}
          {...register(`${prefix}.crn`)}
        />
        {errors.crn && <p className="mt-1 text-xs text-red-600">{errors.crn.message}</p>}
      </div>
    </div>
  );
};

export default CompanyFieldsSection;
