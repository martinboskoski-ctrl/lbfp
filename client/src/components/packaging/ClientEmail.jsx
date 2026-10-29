import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Copy, Check, Info, RotateCcw } from 'lucide-react';
import { buildClientEmail } from './clientEmail.js';

// Ready-to-send English email for the client. It is generated from the confirmed
// remarks and the AI's answer, and can be edited before copying.
const ClientEmail = ({ check, round, senderName }) => {
  const { t } = useTranslation('packaging');
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState(null); // null → follow the generated text
  const generated = buildClientEmail({ check, round, senderName });
  const text = draft ?? generated;
  const edited = draft !== null && draft !== generated;
  const pending = round.remarks.filter((r) => r.status === 'pending').length;

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <Mail size={15} className="text-slate-400" /> {t('email.title')}
        </h3>
        <div className="flex items-center gap-1.5">
          {edited && (
            <button onClick={() => setDraft(null)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-slate-500 hover:bg-slate-100" title={t('email.resetHint')}>
              <RotateCcw size={12} /> {t('email.reset')}
            </button>
          )}
          <button
            onClick={copy}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              copied ? 'bg-green-50 text-green-700 border-green-200' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? t('email.copied') : t('email.copy')}
          </button>
        </div>
      </div>
      {pending > 0 && (
        <p className="flex items-start gap-1.5 mb-2 text-xs text-amber-700">
          <Info size={13} className="mt-0.5 shrink-0" /> {t('email.pendingNote', { count: pending })}
        </p>
      )}
      <textarea
        value={text}
        onChange={(e) => setDraft(e.target.value)}
        className="input font-mono text-[12px] leading-relaxed min-h-[280px]"
      />
      <p className="text-[11px] text-slate-400 mt-1.5">{edited ? t('email.editedHint') : t('email.hint')}</p>
    </section>
  );
};

export default ClientEmail;
