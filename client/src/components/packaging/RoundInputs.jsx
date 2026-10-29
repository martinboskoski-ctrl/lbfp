import { useTranslation } from 'react-i18next';
import FileDrop from './FileDrop.jsx';
import MultiFileDrop from './MultiFileDrop.jsx';
import { ARTWORK_ACCEPT, INGREDIENTS_ACCEPT } from './roundForm.js';

const Optional = () => {
  const { t } = useTranslation('packaging');
  return <span className="ml-1 font-normal text-slate-400">({t('form.optional')})</span>;
};

// One step of the conversation with the client — every field is optional.
// Shared by "new check" and "new round".
const RoundInputs = ({ value, onChange }) => {
  const { t } = useTranslation('packaging');
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-5">
      <div>
        <label className="label">{t('form.clientMessage')}<Optional /></label>
        <textarea
          className="input min-h-[90px]"
          value={value.clientMessage}
          onChange={(e) => set({ clientMessage: e.target.value })}
          placeholder={t('form.clientMessagePlaceholder')}
        />
      </div>

      <div>
        <label className="label">{t('form.attachments')}<Optional /></label>
        <MultiFileDrop
          files={value.attachments}
          onChange={(attachments) => set({ attachments })}
          accept={ARTWORK_ACCEPT}
          hint={t('form.attachmentsHint')}
        />
      </div>

      <div>
        <label className="label">{t('form.ingredients')}<Optional /></label>
        <textarea
          className="input min-h-[100px]"
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
      </div>

      <div>
        <label className="label">{t('form.note')}<Optional /></label>
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
