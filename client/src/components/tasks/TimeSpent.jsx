import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Check, X } from 'lucide-react';
import { useSetTaskTime } from '../../hooks/useTasks.js';
import { TIME_PRESETS, formatMinutes } from './timeFormat.js';

// Preset chips + a small custom-hours field.
export const TimePicker = ({ onPick }) => {
  const { t } = useTranslation('tasks');
  const [hours, setHours] = useState('');
  const custom = Math.round(parseFloat(String(hours).replace(',', '.')) * 60);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {TIME_PRESETS.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onPick(m)}
          className="text-[11px] px-1.5 py-0.5 rounded-full border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600"
        >
          {formatMinutes(m, t)}
        </button>
      ))}
      <form
        onSubmit={(e) => { e.preventDefault(); if (custom > 0) onPick(custom); }}
        className="flex items-center gap-0.5"
      >
        <input
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          inputMode="decimal"
          placeholder={t('time.custom')}
          className="w-10 text-[11px] px-1.5 py-0.5 rounded-full border border-gray-200 outline-none focus:border-blue-400"
        />
        {custom > 0 && (
          <button type="submit" className="p-0.5 text-blue-600 hover:text-blue-700" aria-label={t('time.save')}>
            <Check size={12} />
          </button>
        )}
      </form>
    </div>
  );
};

// Card chip: shows the logged time, or — for the assignee of a finished task with no
// time yet — a soft amber nudge. Clicking expands the picker inline inside the card.
export const TimeChip = ({ task, canLog, isAssignee }) => {
  const { t } = useTranslation('tasks');
  const setTime = useSetTaskTime();
  const [open, setOpen] = useState(false);

  const finished = task.status === 'done' || task.status === 'approved';
  const logged   = task.timeSpentMinutes > 0;
  if (!logged && !(finished && isAssignee)) return null;

  const pick = (minutes) => { setTime.mutate({ id: task._id, minutes }); setOpen(false); };

  return (
    <div onClick={(e) => e.stopPropagation()} className="mt-2">
      <button
        type="button"
        disabled={!canLog}
        onClick={() => setOpen((v) => !v)}
        title={logged ? t('time.spent') : t('time.tooltip')}
        className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full transition-colors ${
          logged
            ? 'bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:hover:bg-gray-50'
            : 'border border-dashed border-amber-300 text-amber-600 hover:bg-amber-50'
        }`}
      >
        <Clock size={10} />
        {logged ? formatMinutes(task.timeSpentMinutes, t) : t('time.nudge')}
      </button>

      {open && (
        <div className="mt-1.5 flex items-center gap-1">
          <TimePicker onPick={pick} />
          {logged && (
            <button
              type="button"
              onClick={() => pick(null)}
              className="ml-auto p-0.5 text-gray-300 hover:text-red-500"
              title={t('time.clear')}
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Toast shown right after dropping your own task into "Завршено".
export const TimeToast = ({ visible, onPick, onDismiss }) => {
  const { t } = useTranslation('tasks');
  return (
    <div className={`w-[300px] rounded-xl border border-gray-200 bg-white shadow-lg px-3 py-2.5 transition-all ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
          <Clock size={12} className="text-amber-500" /> {t('time.question')}
        </p>
        <button onClick={onDismiss} className="text-[11px] text-gray-400 hover:text-gray-600">
          {t('time.skip')}
        </button>
      </div>
      <TimePicker onPick={onPick} />
    </div>
  );
};
