import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Pencil, Trash2, Lock } from 'lucide-react';
import PageShell from '../components/layout/PageShell.jsx';
import {
  usePackagingRules, useCreatePackagingRule, useUpdatePackagingRule, useDeletePackagingRule,
} from '../hooks/usePackaging.js';
import { useAuth } from '../context/AuthContext.jsx';
import { canUsePackagingTool, canEditPackagingRules, PACKAGING_SECTORS } from '../utils/userTier.js';

const EMPTY = { text: '', category: '', sector: 'quality_assurance' };

const RuleForm = ({ initial = EMPTY, onSubmit, onCancel, busy, submitLabel }) => {
  const { t } = useTranslation('packaging');
  const { t: tc } = useTranslation('common');
  const [form, setForm] = useState(initial);
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
      className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3"
    >
      <div>
        <label className="label text-xs">{t('rulesPage.text')}</label>
        <textarea className="input text-sm min-h-[60px]" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder={t('rulesPage.textPlaceholder')} autoFocus />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="label text-xs">{t('rulesPage.category')}</label>
          <input className="input text-sm py-1.5" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder={t('rulesPage.categoryPlaceholder')} />
        </div>
        <div>
          <label className="label text-xs">{t('rulesPage.sector')}</label>
          <select className="input text-sm py-1.5" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })}>
            {PACKAGING_SECTORS.map((s) => <option key={s} value={s}>{tc(`dept.${s}`)}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={busy || !form.text.trim()} className="btn-primary text-sm py-1.5">{submitLabel}</button>
        <button type="button" onClick={onCancel} className="btn-secondary text-sm py-1.5">{t('detail.cancel')}</button>
      </div>
    </form>
  );
};

const PackagingRules = () => {
  const { t } = useTranslation('packaging');
  const { t: tc } = useTranslation('common');
  const { user } = useAuth();
  const { data: rules = [], isLoading } = usePackagingRules();
  const createRule = useCreatePackagingRule();
  const updateRule = useUpdatePackagingRule();
  const deleteRule = useDeletePackagingRule();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  if (!canUsePackagingTool(user)) return <Navigate to="/dashboard" replace />;
  const canEdit = canEditPackagingRules(user);

  const groups = PACKAGING_SECTORS
    .map((s) => ({ sector: s, rules: rules.filter((r) => r.sector === s) }))
    .filter((g) => g.rules.length);

  return (
    <PageShell title={t('rules')}>
      <div className="max-w-3xl mx-auto">
        <Link to="/tools/packaging" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3">
          <ArrowLeft size={15} /> {t('detail.back')}
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{t('rules')}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{t('rulesPage.subtitle')}</p>
            <p className="text-xs text-slate-400 mt-1">{t('rulesPage.count', { count: rules.length })}</p>
          </div>
          {canEdit && !adding && (
            <button onClick={() => setAdding(true)} className="btn-primary flex items-center gap-1.5">
              <Plus size={15} /> {t('rulesPage.add')}
            </button>
          )}
        </div>

        {!canEdit && (
          <p className="flex items-center gap-1.5 text-xs text-slate-500 mb-4"><Lock size={12} /> {t('rulesPage.readOnlyHint')}</p>
        )}

        {adding && (
          <div className="mb-6">
            <RuleForm
              busy={createRule.isPending}
              submitLabel={t('rulesPage.add')}
              onCancel={() => setAdding(false)}
              onSubmit={(form) => createRule.mutate(form, { onSuccess: () => setAdding(false) })}
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : !groups.length ? (
          <p className="text-center py-16 text-sm text-slate-400">{t('rulesPage.empty')}</p>
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <section key={g.sector}>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">{tc(`dept.${g.sector}`)}</h3>
                <div className="card divide-y divide-slate-100">
                  {g.rules.map((r) => (
                    <div key={r._id} className="p-3">
                      {editingId === r._id ? (
                        <RuleForm
                          initial={{ text: r.text, category: r.category, sector: r.sector }}
                          busy={updateRule.isPending}
                          submitLabel={t('detail.save')}
                          onCancel={() => setEditingId(null)}
                          onSubmit={(form) => updateRule.mutate({ ruleId: r._id, ...form }, { onSuccess: () => setEditingId(null) })}
                        />
                      ) : (
                        <div className={`flex items-start gap-3 ${r.active ? '' : 'opacity-50'}`}>
                          <div className="min-w-0 flex-1">
                            {r.category && <p className="text-[11px] font-medium text-slate-400 mb-0.5">{r.category}</p>}
                            <p className="text-sm text-slate-800">{r.text}</p>
                          </div>
                          {canEdit ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => updateRule.mutate({ ruleId: r._id, active: !r.active })}
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${r.active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                              >
                                {r.active ? t('rulesPage.active') : t('rulesPage.inactive')}
                              </button>
                              <button onClick={() => setEditingId(r._id)} className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100" title={t('detail.edit')}>
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => { if (window.confirm(t('rulesPage.confirmDelete'))) deleteRule.mutate(r._id); }}
                                className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100"
                                title={t('detail.delete')}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ) : !r.active && (
                            <span className="text-[11px] text-slate-400">{t('rulesPage.inactive')}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default PackagingRules;
