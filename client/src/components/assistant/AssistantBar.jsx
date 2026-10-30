import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Send, X, RotateCcw, Loader2, AlertTriangle } from 'lucide-react';
import AssistantMarkdown from './AssistantMarkdown.jsx';
import { useAssistantStatus, useAssistantChat } from '../../hooks/useAssistant.js';

const STORAGE_KEY = 'packflow_assistant_chat';

const loadChat = () => {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
};
const saveChat = (messages) => {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch { /* storage unavailable */ }
};

// Company AI assistant on Почетна: one input bar; the conversation opens in a panel
// under it. Answers come only from app data, via server-side tools.
const AssistantBar = () => {
  const { t } = useTranslation('assistant');
  const { data: status } = useAssistantStatus();
  const chat = useAssistantChat();
  const [messages, setMessages] = useState(loadChat);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => { saveChat(messages); }, [messages]);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, chat.isPending]);

  // Close the panel when clicking outside it.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  if (!status?.allowed) return null;

  const ask = (text) => {
    const question = text.trim();
    if (!question || chat.isPending) return;
    const next = [...messages, { role: 'user', content: question }];
    setMessages(next);
    setInput('');
    setError('');
    setOpen(true);
    chat.mutate(next, {
      onSuccess: (data) => setMessages((m) => [...m, { role: 'assistant', content: data.answer }]),
      onError: (e) => setError(e?.response?.data?.message || t('error')),
    });
  };

  const reset = () => { setMessages([]); setError(''); };
  const suggestions = t('suggestions', { returnObjects: true });

  return (
    <div ref={rootRef} className="relative mb-3 shrink-0">
      <form
        onSubmit={(e) => { e.preventDefault(); ask(input); }}
        className={`flex items-center gap-2 rounded-xl border bg-white px-3 py-2 shadow-sm transition-colors ${
          open ? 'border-violet-300 ring-2 ring-violet-100' : 'border-slate-200 hover:border-violet-300'
        }`}
      >
        <Sparkles size={18} className="text-violet-500 shrink-0" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={status.configured ? t('placeholder') : t('notConfigured')}
          disabled={!status.configured}
          className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
        />
        {messages.length > 0 && !open && (
          <button type="button" onClick={() => setOpen(true)} className="text-xs text-violet-600 hover:underline shrink-0">
            {t('showChat', { count: messages.filter((m) => m.role === 'user').length })}
          </button>
        )}
        <button
          type="submit"
          disabled={!input.trim() || chat.isPending || !status.configured}
          className="p-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 shrink-0"
          aria-label={t('send')}
        >
          {chat.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </form>

      {open && status.configured && (
        <div className="absolute left-0 right-0 top-full mt-2 z-30 rounded-xl border border-slate-200 bg-white shadow-xl flex flex-col max-h-[60vh]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 shrink-0">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Sparkles size={13} className="text-violet-500" /> {t('title')}
            </span>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button onClick={reset} className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-500 hover:bg-slate-100">
                  <RotateCcw size={12} /> {t('newChat')}
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded text-slate-400 hover:bg-slate-100" aria-label={t('close')}>
                <X size={15} />
              </button>
            </div>
          </div>

          <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2">{t('intro')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.isArray(suggestions) && suggestions.map((s) => (
                    <button key={s} onClick={() => ask(s)} className="text-xs px-2.5 py-1 rounded-full border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-violet-600 text-white px-3 py-2 text-sm whitespace-pre-wrap">{m.content}</div>
                </div>
              ) : (
                <div key={i} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={12} className="text-violet-600" />
                  </div>
                  <div className="min-w-0 max-w-[90%] rounded-2xl rounded-tl-sm bg-slate-50 border border-slate-100 px-3 py-2 text-slate-800">
                    <AssistantMarkdown text={m.content} />
                  </div>
                </div>
              )
            ))}
            {chat.isPending && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 size={13} className="animate-spin text-violet-500" /> {t('thinking')}
              </div>
            )}
            {error && (
              <p className="flex items-center gap-1.5 text-xs text-red-600"><AlertTriangle size={13} /> {error}</p>
            )}
          </div>
          <p className="px-4 py-1.5 border-t border-slate-100 text-[10px] text-slate-400 shrink-0">{t('disclaimer')}</p>
        </div>
      )}
    </div>
  );
};

export default AssistantBar;
