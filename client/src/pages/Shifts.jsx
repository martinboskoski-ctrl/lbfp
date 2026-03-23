import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar, { DEPARTMENTS } from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { canManage, isTopManagement } from '../utils/userTier.js';
import { useShifts, useCreateShift, useDeleteShift } from '../hooks/useShifts.js';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

const SHIFT_COLORS = {
  morning:   'bg-amber-100 text-amber-800 border-amber-200',
  afternoon: 'bg-blue-100 text-blue-800 border-blue-200',
  night:     'bg-indigo-100 text-indigo-800 border-indigo-200',
};

const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (d, n) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

const formatDate = (d) => d.toISOString().split('T')[0];

const Shifts = () => {
  const { t } = useTranslation('shifts');
  const { t: tc } = useTranslation('common');
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [deptFilter, setDeptFilter] = useState(isTopManagement(user) ? '' : user?.department || '');
  const [showForm, setShowForm] = useState(null); // null or { date }

  // Form state
  const [formEmployee, setFormEmployee] = useState('');
  const [formShiftType, setFormShiftType] = useState('morning');
  const [formNotes, setFormNotes] = useState('');

  const params = useMemo(() => ({
    week: formatDate(weekStart),
    ...(deptFilter && { department: deptFilter }),
  }), [weekStart, deptFilter]);

  const { data: shifts, isLoading } = useShifts(params);
  const createMut = useCreateShift();
  const deleteMut = useDeleteShift();

  const days = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  const shiftsForDay = (date) => {
    const ds = formatDate(date);
    return (shifts || []).filter((s) => s.date?.slice(0, 10) === ds);
  };

  const prevWeek = () => setWeekStart(addDays(weekStart, -7));
  const nextWeek = () => setWeekStart(addDays(weekStart, 7));
  const goToday = () => setWeekStart(getMonday(new Date()));

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formEmployee) return;
    createMut.mutate(
      {
        shifts: [{
          employee: formEmployee,
          date: showForm.date,
          shiftType: formShiftType,
          notes: formNotes,
        }],
      },
      {
        onSuccess: () => {
          setShowForm(null);
          setFormEmployee(''); setFormShiftType('morning'); setFormNotes('');
        },
      }
    );
  };

  const isToday = (d) => formatDate(d) === formatDate(new Date());

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={t('title')} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="flex items-center gap-1">
                <button onClick={prevWeek} className="p-1.5 rounded hover:bg-gray-100" title={t('prevWeek')}>
                  <ChevronLeft size={18} />
                </button>
                <button onClick={goToday} className="px-2 py-1 text-xs font-medium rounded hover:bg-gray-100">
                  {t('today')}
                </button>
                <button onClick={nextWeek} className="p-1.5 rounded hover:bg-gray-100" title={t('nextWeek')}>
                  <ChevronRight size={18} />
                </button>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {weekStart.toLocaleDateString()} – {addDays(weekStart, 6).toLocaleDateString()}
              </span>
              {isTopManagement(user) && (
                <select
                  className="input !w-auto text-sm"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                >
                  <option value="">{t('allDepartments')}</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d.value} value={d.value}>{tc(`dept.${d.value}`)}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Week grid */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, i) => (
                <div key={i} className={`rounded-lg border ${isToday(day) ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200 bg-white'} min-h-[180px] flex flex-col`}>
                  <div className={`px-2 py-1.5 border-b text-center ${isToday(day) ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="text-[10px] font-medium text-gray-400 uppercase">{t(`days.${dayKeys[i]}`)}</div>
                    <div className={`text-sm font-semibold ${isToday(day) ? 'text-blue-700' : 'text-gray-700'}`}>
                      {day.getDate()}
                    </div>
                  </div>
                  <div className="flex-1 p-1.5 space-y-1 overflow-y-auto">
                    {isLoading ? (
                      <div className="text-[10px] text-gray-300 text-center pt-4">{tc('loading')}</div>
                    ) : (
                      shiftsForDay(day).map((s) => (
                        <div key={s._id} className={`relative group rounded border px-1.5 py-1 text-[11px] leading-tight ${SHIFT_COLORS[s.shiftType]}`}>
                          <div className="font-medium truncate">{s.employee?.name || '—'}</div>
                          <div className="opacity-70">{t(`typeShort.${s.shiftType}`)}</div>
                          {s.notes && <div className="opacity-60 truncate">{s.notes}</div>}
                          {canManage(user) && (
                            <button
                              onClick={() => { if (confirm(t('confirmDelete'))) deleteMut.mutate(s._id); }}
                              className="absolute -top-1 -right-1 hidden group-hover:flex w-4 h-4 items-center justify-center rounded-full bg-red-500 text-white"
                            >
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  {canManage(user) && (
                    <button
                      onClick={() => setShowForm({ date: formatDate(day) })}
                      className="flex items-center justify-center gap-0.5 text-[10px] text-gray-400 hover:text-blue-600 hover:bg-blue-50 py-1 border-t border-gray-100 transition-colors"
                    >
                      <Plus size={10} /> {t('create')}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add shift modal */}
            {showForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(null)}>
                <form
                  onSubmit={handleCreate}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4"
                >
                  <h3 className="font-semibold text-gray-800">{t('create')} — {showForm.date}</h3>
                  <div>
                    <label className="label">{t('employee')}</label>
                    <input
                      className="input"
                      value={formEmployee}
                      onChange={(e) => setFormEmployee(e.target.value)}
                      placeholder="Employee ID"
                      required
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">Enter employee ID (from admin users list)</p>
                  </div>
                  <div>
                    <label className="label">{t('shiftType')}</label>
                    <select className="input" value={formShiftType} onChange={(e) => setFormShiftType(e.target.value)}>
                      <option value="morning">{t('type.morning')}</option>
                      <option value="afternoon">{t('type.afternoon')}</option>
                      <option value="night">{t('type.night')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">{t('notes')}</label>
                    <input className="input" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder={t('notesPlaceholder')} />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={createMut.isPending} className="btn-primary">{tc('create')}</button>
                    <button type="button" onClick={() => setShowForm(null)} className="btn-secondary">{tc('cancel')}</button>
                  </div>
                </form>
              </div>
            )}

            {!isLoading && !shifts?.length && (
              <div className="text-center py-10 text-gray-400 text-sm mt-4">{t('noShifts')}</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Shifts;
