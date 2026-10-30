import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Plus, Trash2, Pencil } from 'lucide-react';
import { useAddLeaveEntry, useDeleteLeaveEntry, useSetLeaveEntitlement } from '../../hooks/useEmployees.js';
import { fmtDate } from '../../utils/formatDate.js';

// Mon–Fri between two YYYY-MM-DD dates, inclusive — a suggestion; public holidays
// are left for HR to subtract.
const weekdaysBetween = (from, to) => {
  if (!from || !to || to < from) return '';
  let n = 0;
  for (let d = new Date(`${from}T00:00:00Z`); d <= new Date(`${to}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() % 6 !== 0) n++;
  }
  return n;
};

const Stat = ({ label, value, tone = 'text-slate-900' }) => (
  <div>
    <div className="text-[11px] text-slate-500">{label}</div>
    <div className={`text-lg font-semibold ${tone}`}>{value}</div>
  </div>
);

// One year's entitlement: granted for the calendar year, usable until 30.06 of the next.
const YearBox = ({ employeeId, y, current, canEditEntitlement }) => {
  const { t } = useTranslation('employees');
  const setEntitlement = useSetLeaveEntitlement();
  const [editing, setEditing] = useState(false);
  const [total, setTotal] = useState(y.total);
  const save = () => setEntitlement.mutate(
    { id: employeeId, year: y.year, totalDays: Number(total) },
    { onSuccess: () => setEditing(false) },
  );

  return (
    <div className={`rounded-lg border p-3 ${current ? 'border-slate-200' : 'border-amber-200 bg-amber-50/40'}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-semibold text-slate-800">
          {current ? t('leave.yearCurrent', { year: y.year }) : t('leave.yearCarryOver', { year: y.year })}
        </span>
        <span className={`text-[11px] ${current ? 'text-slate-500' : 'text-amber-700 font-medium'}`}>
          {t('leave.validUntil', { date: fmtDate(y.validUntil) })}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <div className="text-[11px] text-slate-500">{t('leave.total')}</div>
          {editing ? (
            <div className="flex items-center gap-1 mt-0.5">
              <input type="number" min="0" max="100" className="input py-1 text-sm w-16" value={total} onChange={(e) => setTotal(e.target.value)} autoFocus />
              <button onClick={save} disabled={setEntitlement.isPending || total === ''} className="btn-primary text-xs py-1 px-2">{t('leave.save')}</button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-lg font-semibold text-slate-900">{y.total}</span>
              {y.isDefault && <span className="text-[10px] text-slate-400">{t('leave.default')}</span>}
              {canEditEntitlement && (
                <button onClick={() => { setTotal(y.total); setEditing(true); }} className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100" title={t('leave.editTotal')}>
                  <Pencil size={12} />
                </button>
              )}
            </div>
          )}
        </div>
        <Stat label={t('leave.usedInYear', { year: y.year })} value={y.usedInYear} />
        <Stat label={t('leave.usedNextYear', { year: y.year + 1 })} value={y.usedNextYear} />
        <Stat label={t('leave.remaining')} value={y.remaining} tone={y.remaining < 0 ? 'text-red-600' : 'text-emerald-700'} />
      </div>
      {y.recordedEarlier > 0 && (
        <p className="text-[11px] text-slate-500 mt-2">{t('leave.recordedEarlier', { count: y.recordedEarlier })}</p>
      )}
    </div>
  );
};

const AddLeaveForm = ({ employeeId, onDone }) => {
  const { t } = useTranslation('employees');
  const add = useAddLeaveEntry();
  const [form, setForm] = useState({ from: '', to: '', days: '', note: '' });
  const [daysTouched, setDaysTouched] = useState(false);

  // Days follow the dates until the user types their own number.
  const setDate = (key, value) => setForm((f) => {
    const next = { ...f, [key]: value };
    if (key === 'from' && (!f.to || f.to < value)) next.to = value;
    if (!daysTouched) next.days = weekdaysBetween(next.from, next.to);
    return next;
  });

  const submit = (e) => {
    e.preventDefault();
    add.mutate({ id: employeeId, ...form, days: Number(form.days) }, { onSuccess: onDone });
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-slate-50 p-3 grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
      <label className="text-xs text-slate-600">{t('leave.from')}
        <input type="date" className="input py-1.5 text-sm mt-0.5" value={form.from} onChange={(e) => setDate('from', e.target.value)} required />
      </label>
      <label className="text-xs text-slate-600">{t('leave.to')}
        <input type="date" className="input py-1.5 text-sm mt-0.5" value={form.to} min={form.from} onChange={(e) => setDate('to', e.target.value)} required />
      </label>
      <label className="text-xs text-slate-600">{t('leave.workingDays')}
        <input type="number" min="0.5" step="0.5" className="input py-1.5 text-sm mt-0.5" value={form.days}
          onChange={(e) => { setDaysTouched(true); setForm({ ...form, days: e.target.value }); }} required />
      </label>
      <label className="text-xs text-slate-600 col-span-2 sm:col-span-1">{t('leave.note')}
        <input className="input py-1.5 text-sm mt-0.5" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </label>
      <div className="flex gap-2 col-span-2 sm:col-span-1">
        <button type="submit" disabled={add.isPending || !(Number(form.days) > 0)} className="btn-primary text-sm py-1.5">{t('leave.add')}</button>
        <button type="button" onClick={onDone} className="btn-secondary text-sm py-1.5">{t('leave.cancel')}</button>
      </div>
      <p className="col-span-2 sm:col-span-5 text-[11px] text-slate-500">{t('leave.daysHint')}</p>
    </form>
  );
};

const LeaveCard = ({ employeeId, leave, canManage, canEditEntitlement }) => {
  const { t } = useTranslation('employees');
  const remove = useDeleteLeaveEntry();
  const [adding, setAdding] = useState(false);
  const shownYears = new Set(leave.years.map((y) => y.year));
  const entries = leave.entries.filter((e) => e.allocation.some((a) => shownYears.has(a.year)));

  return (
    <div className="card p-4 sm:p-5 mb-3 sm:mb-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Calendar size={15} className="text-slate-400" /> {t('leave.title')}
        </h3>
        <span className="text-sm text-slate-600">
          {t('leave.availableToday')} <span className="font-semibold text-slate-900">{leave.remaining}</span>
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-3">{t('leave.rule')}</p>

      <div className={`grid gap-3 ${leave.years.length > 1 ? 'lg:grid-cols-2' : ''}`}>
        {leave.years.map((y, i) => (
          <YearBox key={y.year} employeeId={employeeId} y={y} current={i === 0} canEditEntitlement={canEditEntitlement} />
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t('leave.entries')}</span>
        {canManage && !adding && (
          <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900">
            <Plus size={14} /> {t('leave.addEntry')}
          </button>
        )}
      </div>
      {adding && <div className="mb-3"><AddLeaveForm employeeId={employeeId} onDone={() => setAdding(false)} /></div>}

      {entries.length ? (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-slate-500 uppercase tracking-wide">
                <th className="text-left px-2 py-1.5">{t('leave.period')}</th>
                <th className="text-right px-2 py-1.5">{t('leave.days')}</th>
                <th className="text-left px-2 py-1.5">{t('leave.countedAgainst')}</th>
                <th className="text-left px-2 py-1.5">{t('leave.note')}</th>
                {canManage && <th />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((e) => (
                <tr key={e._id} className="group">
                  <td className="px-2 py-1.5 whitespace-nowrap">{fmtDate(e.from)} – {fmtDate(e.to)}</td>
                  <td className="px-2 py-1.5 text-right font-medium">{e.days}</td>
                  <td className="px-2 py-1.5 text-slate-600 whitespace-nowrap">
                    {e.allocation.map((a) => t('leave.allocation', { year: a.year, days: a.days })).join(' · ')}
                  </td>
                  <td className="px-2 py-1.5 text-slate-500">
                    {e.note}{e.createdBy?.name && <span className="text-slate-400"> · {e.createdBy.name}</span>}
                  </td>
                  {canManage && (
                    <td className="px-2 py-1.5 text-right">
                      <button
                        onClick={() => { if (window.confirm(t('leave.confirmDelete'))) remove.mutate({ id: employeeId, entryId: e._id }); }}
                        className="p-1 rounded text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                        title={t('leave.delete')}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-400">{t('leave.noEntries')}</p>
      )}
    </div>
  );
};

export default LeaveCard;
