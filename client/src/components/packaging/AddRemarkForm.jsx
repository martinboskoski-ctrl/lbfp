import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { useAddPackagingRemark } from '../../hooks/usePackaging.js';
import { PACKAGING_SECTORS } from '../../utils/userTier.js';

const SEVERITIES = ['critical', 'warning', 'info'];

const AddRemarkForm = ({ checkId, rules, defaultSector }) => {
  const { t } = useTranslation('packaging');
  const { t: tc } = useTranslation('common');
  const add = useAddPackagingRemark();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ text: '', sector: defaultSector, severity: 'warning', ruleId: '' });

  // Picking a rule routes the remark to that rule's sector.
  const pickRule = (ruleId) => {
    const rule = rules.find((r) => r._id === ruleId);
    setForm((f) => ({ ...f, ruleId, sector: rule ? rule.sector : f.sector }));
  };

  const submit = (e) => {
    e.preventDefault();
    add.mutate(
      { id: checkId, text: form.text.trim(), sector: form.sector, severity: form.severity, ruleId: form.ruleId || undefined },
      { onSuccess: () => { setForm((f) => ({ ...f, text: '', ruleId: '' })); setOpen(false); } }
    );
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700">
        <Plus size={15} /> {t('detail.addRemark')}
      </button>
    );
  }

  const activeRules = rules.filter((r) => r.active);
  return (
    <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
      <textarea
        className="input text-sm min-h-[70px]"
        value={form.text}
        onChange={(e) => setForm({ ...form, text: e.target.value })}
        placeholder={t('detail.remarkPlaceholder')}
        autoFocus
      />
      {activeRules.length > 0 && (
        <div>
          <label className="label text-xs">{t('detail.ruleLabel')}</label>
          <select className="input text-sm py-1.5" value={form.ruleId} onChange={(e) => pickRule(e.target.value)}>
            <option value="">{t('detail.noRule')}</option>
            {activeRules.map((r) => (
              <option key={r._id} value={r._id}>{r.category ? `${r.category} — ` : ''}{r.text}</option>
            ))}
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label text-xs">{t('detail.sector')}</label>
          <select className="input text-sm py-1.5" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })}>
            {PACKAGING_SECTORS.map((s) => <option key={s} value={s}>{tc(`dept.${s}`)}</option>)}
          </select>
        </div>
        <div>
          <label className="label text-xs">{t('detail.severityLabel')}</label>
          <select className="input text-sm py-1.5" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
            {SEVERITIES.map((s) => <option key={s} value={s}>{t(`severity.${s}`)}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={add.isPending || !form.text.trim()} className="btn-primary text-sm py-1.5">{t('detail.add')}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-sm py-1.5">{t('detail.cancel')}</button>
      </div>
    </form>
  );
};

export default AddRemarkForm;
