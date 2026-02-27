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

const MKD_LABELS = {
  name:    'Назив на компанијата',
  address: 'Адреса',
  manager: 'Одговорно лице (управник / директор)',
  crn:     'Матичен број (CRN)',
  namePh:    'пр. АКМЕ Корпорација ДОО Скопје',
  addressPh: 'пр. ул. Македонија 1, 1000 Скопје',
  managerPh: 'пр. Иван Иванов',
  crnPh:     'пр. 1234567',
};

const ENG_LABELS = {
  name:    'Company Name',
  address: 'Address',
  manager: 'Manager / Director',
  crn:     'CRN (Company Registration Number)',
  namePh:    'e.g. ACME Corporation DOO Skopje',
  addressPh: 'e.g. 1 Macedonia St, 1000 Skopje',
  managerPh: 'e.g. Ivan Ivanov',
  crnPh:     'e.g. 1234567',
};

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
const LangBlock = ({ prefix, lang, register, errors }) => {
  const L = lang === 'mkd' ? MKD_LABELS : ENG_LABELS;
  const f = (name) => `${prefix}.${lang}.${name}`;

  return (
    <div className="space-y-3">
      <Field id={`${prefix}-${lang}-name`}    label={L.name}    placeholder={L.namePh}    hasError={!!errors?.[lang]?.name}    errorMsg={errors?.[lang]?.name?.message}    registration={register(f('name'))} />
      <Field id={`${prefix}-${lang}-address`} label={L.address} placeholder={L.addressPh} hasError={!!errors?.[lang]?.address} errorMsg={errors?.[lang]?.address?.message} registration={register(f('address'))} />
      <Field id={`${prefix}-${lang}-manager`} label={L.manager} placeholder={L.managerPh} hasError={!!errors?.[lang]?.manager} errorMsg={errors?.[lang]?.manager?.message} registration={register(f('manager'))} />
    </div>
  );
};

// Bilingual side-by-side layout — one row per field, MKD left / ENG right
const BilingualBlock = ({ prefix, register, errors }) => {
  const f = (lang, name) => `${prefix}.${lang}.${name}`;

  const FIELDS = [
    { key: 'name',    mkdLabel: MKD_LABELS.name,    engLabel: ENG_LABELS.name,    mkdPh: MKD_LABELS.namePh,    engPh: ENG_LABELS.namePh    },
    { key: 'address', mkdLabel: MKD_LABELS.address,  engLabel: ENG_LABELS.address, mkdPh: MKD_LABELS.addressPh, engPh: ENG_LABELS.addressPh },
    { key: 'manager', mkdLabel: MKD_LABELS.manager,  engLabel: ENG_LABELS.manager, mkdPh: MKD_LABELS.managerPh, engPh: ENG_LABELS.managerPh },
  ];

  return (
    <div className="space-y-3">
      {/* Column headers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-200">МКД</span>
          <span className="text-xs text-gray-400">Кирилица</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">ENG</span>
          <span className="text-xs text-gray-400">Latin</span>
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
  const crnLabel = language === 'ENG' ? ENG_LABELS.crn : MKD_LABELS.crn;
  const crnPh    = language === 'ENG' ? ENG_LABELS.crnPh : MKD_LABELS.crnPh;

  return (
    <div className="card p-5 space-y-4">
      {legend && (
        <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">{legend}</h3>
      )}

      {language === 'MKD'      && <LangBlock     prefix={prefix} lang="mkd" register={register} errors={errors} />}
      {language === 'ENG'      && <LangBlock     prefix={prefix} lang="eng" register={register} errors={errors} />}
      {language === 'BILINGUAL' && <BilingualBlock prefix={prefix}           register={register} errors={errors} />}

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
