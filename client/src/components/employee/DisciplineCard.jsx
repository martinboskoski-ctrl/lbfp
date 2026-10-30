import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Plus, Trash2 } from 'lucide-react';
import { useAddDiscipline, useDeleteDiscipline } from '../../hooks/useEmployees.js';
import { fmtDate } from '../../utils/formatDate.js';

const TYPES = ['verbal_warning', 'written_warning', 'reprimand', 'suspension', 'investigation', 'termination_notice'];
const today = () => new Date().toISOString().slice(0, 10);

const AddDisciplineForm = ({ employeeId, onDone }) => {
  const { t } = useTranslation('employees');
  const add = useAddDiscipline();
  const [form, setForm] = useState({ issuedDate: today(), type: 'verbal_warning', reason: '', expiryDate: '' });
  const submit = (e) => {
    e.preventDefault();
    add.mutate({ id: employeeId, ...form, reason: form.reason.trim() }, { onSuccess: onDone });
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-slate-50 p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 items-end mb-3">
      <label className="text-xs text-slate-600">{t('discipline.date')}
        <input type="date" className="input py-1.5 text-sm mt-0.5" value={form.issuedDate} onChange={(e) => setForm({ ...form, issuedDate: e.target.value })} required />
      </label>
      <label className="text-xs text-slate-600">{t('discipline.type')}
        <select className="input py-1.5 text-sm mt-0.5" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {TYPES.map((k) => <option key={k} value={k}>{t(`discipline.types.${k}`)}</option>)}
        </select>
      </label>
      <label className="text-xs text-slate-600 col-span-2">{t('discipline.reason')}
        <input className="input py-1.5 text-sm mt-0.5" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder={t('discipline.reasonPlaceholder')} required />
      </label>
      <label className="text-xs text-slate-600">{t('discipline.validUntil')}
        <input type="date" className="input py-1.5 text-sm mt-0.5" value={form.expiryDate} min={form.issuedDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
      </label>
      <div className="flex gap-2 sm:col-span-3">
        <button type="submit" disabled={add.isPending || !form.reason.trim()} className="btn-primary text-sm py-1.5">{t('discipline.add')}</button>
        <button type="button" onClick={onDone} className="btn-secondary text-sm py-1.5">{t('leave.cancel')}</button>
      </div>
    </form>
  );
};

// Short list: date, type, reason, active or not.
const DisciplineCard = ({ employeeId, records, canManage, canDelete }) => {
  const { t } = useTranslation('employees');
  const remove = useDeleteDiscipline();
  const [adding, setAdding] = useState(false);

  return (
    <div className="card p-4 sm:p-5 mb-3 sm:mb-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
          <ShieldAlert size={15} className="text-slate-400" /> {t('discipline.title')}
        </h3>
        {canManage && !adding && (
          <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900">
            <Plus size={14} /> {t('discipline.addRecord')}
          </button>
        )}
      </div>
      {adding && <AddDisciplineForm employeeId={employeeId} onDone={() => setAdding(false)} />}

      {records.length ? (
        <ul className="divide-y divide-slate-100">
          {records.map((d) => (
            <li key={d._id} className="group flex items-start gap-3 py-2 text-sm">
              <span className="w-24 shrink-0 text-slate-500">{fmtDate(d.issuedDate)}</span>
              <div className="min-w-0 flex-1">
                <span className="font-medium text-slate-900">{t(`discipline.types.${d.type}`)}</span>
                <span className="text-slate-700"> — {d.reason}</span>
                {(d.issuedBy?.name || d.expiryDate) && (
                  <div className="text-[11px] text-slate-400">
                    {d.issuedBy?.name}{d.issuedBy?.name && d.expiryDate && ' · '}
                    {d.expiryDate && t('discipline.validUntilShort', { date: fmtDate(d.expiryDate) })}
                  </div>
                )}
              </div>
              <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded ${
                d.isActive ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-slate-100 text-slate-600'
              }`}>
                {d.isActive ? t('discipline.active') : t('discipline.inactive')}
              </span>
              {canDelete && (
                <button
                  onClick={() => { if (window.confirm(t('discipline.confirmDelete'))) remove.mutate({ id: employeeId, actionId: d._id }); }}
                  className="p-1 rounded text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                  title={t('leave.delete')}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400">{t('discipline.none')}</p>
      )}
    </div>
  );
};

export default DisciplineCard;
