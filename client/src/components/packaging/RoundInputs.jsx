import { useTranslation } from 'react-i18next';
import FileDrop from './FileDrop.jsx';
import { ARTWORK_ACCEPT, INGREDIENTS_ACCEPT } from './roundForm.js';

// Artwork + ingredient list + note — shared by "new check" and "new round".
const RoundInputs = ({ value, onChange, errors = {} }) => {
  const { t } = useTranslation('packaging');
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-5">
      <div>
        <label className="label">{t('form.artwork')}</label>
        <FileDrop
          file={value.artwork}
          onChange={(artwork) => set({ artwork })}
          accept={ARTWORK_ACCEPT}
          hint={t('form.artworkHint')}
          error={errors.artwork}
        />
      </div>

      <div>
        <label className="label">{t('form.ingredients')}</label>
        <textarea
          className={`input min-h-[120px] ${errors.ingredients ? 'border-red-400' : ''}`}
          value={value.ingredientsText}
          onChange={(e) => set({ ingredientsText: e.target.value })}
          placeholder={t('form.ingredientsPlaceholder')}
        />
        <p className="text-xs text-slate-500 mt-2 mb-1">{t('form.ingredientsFile')}</p>
        <FileDrop
          file={value.ingredientsFile}
          onChange={(ingredientsFile) => set({ ingredientsFile })}
          accept={INGREDIENTS_ACCEPT}
          hint={t('form.ingredientsFileHint')}
          compact
        />
        {errors.ingredients && <p className="text-red-500 text-xs mt-1">{errors.ingredients}</p>}
      </div>

      <div>
        <label className="label">{t('form.note')}</label>
        <textarea
          className="input min-h-[60px]"
          value={value.note}
          onChange={(e) => set({ note: e.target.value })}
          placeholder={t('form.notePlaceholder')}
        />
      </div>
    </div>
  );
};

export default RoundInputs;
