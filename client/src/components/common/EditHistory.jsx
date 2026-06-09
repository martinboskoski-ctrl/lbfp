import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { History } from 'lucide-react';
import { fmtDateTime } from '../../utils/formatDate.js';

// Render a stored snapshot (Mixed) as readable text, covering the field shapes used
// across the app's editable posts.
const snapshotText = (s) => {
  if (s == null) return '';
  if (typeof s === 'string') return s;
  if (s.title || s.content) return [s.title, s.content].filter(Boolean).join(' — ');
  if (s.text) return s.text;
  if (s.body) return s.body;
  if (s.description !== undefined) {
    const extra = [
      s.forecastEUR != null ? `${s.forecastEUR} EUR` : null,
      s.itemCount != null ? `${s.itemCount} ×` : null,
      s.status || null,
    ].filter(Boolean).join(' · ');
    return [s.description || '—', extra].filter(Boolean).join(' — ');
  }
  try { return JSON.stringify(s); } catch { return ''; }
};

// "изменето" badge that reveals the full version history (oldest = original).
export default function EditHistory({ history = [], className = '' }) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  if (!history.length) return null;

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="inline-flex items-center gap-1 text-[11px] italic text-gray-400 hover:text-gray-600"
        title={t('editHistory')}
      >
        <History size={11} /> {t('edited')}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div
            className="absolute z-50 top-5 left-0 w-72 max-h-72 overflow-y-auto card p-3 shadow-lg text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-semibold text-gray-700 mb-2">{t('editHistory')}</p>
            <ul className="space-y-2.5">
              {history.map((v, i) => (
                <li key={i} className="text-xs">
                  <div className="text-gray-400">
                    {v.editedBy?.name || '—'} · {fmtDateTime(v.editedAt)}
                    {i === 0 && <span className="ml-1">({t('original')})</span>}
                  </div>
                  <div className="text-gray-700 whitespace-pre-wrap break-words">{snapshotText(v.snapshot)}</div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </span>
  );
}
