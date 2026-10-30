import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Copy, Check, Pencil, RotateCcw, Clock, CheckCircle2, MessageSquare, Trash2, Send, ChevronDown } from 'lucide-react';
import {
  useUpdatePackagingEmail, useUpdatePackagingSection, useApprovePackagingSection,
  useAddPackagingComment, useDeletePackagingComment,
} from '../../hooks/usePackaging.js';
import { isPackagingLead, isTopManagement } from '../../utils/userTier.js';
import { fmtDateTime } from '../../utils/formatDate.js';

const ownsSection = (user, section) => isTopManagement(user) || user.department === section.sector;

// One line of the email: the text on the left, who answers for it on the right.
const Row = ({ children, side }) => (
  <div className="grid lg:grid-cols-3 gap-x-5 gap-y-2">
    <div className="lg:col-span-2 min-w-0">{children}</div>
    <div className="min-w-0">{side}</div>
  </div>
);

export const CopyButton = ({ text }) => {
  const { t } = useTranslation('packaging');
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
        copied ? 'bg-green-50 text-green-700 border-green-200' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
      }`}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? t('email.copied') : t('email.copy')}
    </button>
  );
};

// Opening / closing — written by Sales; empty means the generated text.
const TextBlock = ({ check, field, custom, value, canEdit }) => {
  const { t } = useTranslation('packaging');
  const { t: tc } = useTranslation('common');
  const update = useUpdatePackagingEmail();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const save = (next) => update.mutate({ id: check._id, [field]: next }, { onSuccess: () => setEditing(false) });

  return (
    <Row side={<p className="text-[11px] text-slate-400 lg:pt-2.5">{t('email.ownedBy', { dept: tc('dept.sales') })}</p>}>
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {t(`email.${field}`)}
          {!custom && <span className="ml-1.5 normal-case tracking-normal font-normal text-slate-400">· {t('email.generated')}</span>}
        </span>
        {canEdit && !editing && (
          <span className="flex items-center gap-1">
            {custom && (
              <button onClick={() => save('')} disabled={update.isPending} className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100" title={t('email.reset')}>
                <RotateCcw size={13} />
              </button>
            )}
            <button onClick={() => { setText(value); setEditing(true); }} className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100" title={t('detail.edit')}>
              <Pencil size={13} />
            </button>
          </span>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea className="input text-sm min-h-[110px]" value={text} onChange={(e) => setText(e.target.value)} autoFocus />
          <div className="flex gap-2">
            <button onClick={() => save(text)} disabled={update.isPending} className="btn-primary text-xs py-1">{t('detail.save')}</button>
            <button onClick={() => setEditing(false)} className="btn-secondary text-xs py-1">{t('detail.cancel')}</button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{value}</p>
      )}
    </div>
    </Row>
  );
};

const Comments = ({ check, section, open, user }) => {
  const { t } = useTranslation('packaging');
  const add = useAddPackagingComment();
  const remove = useDeletePackagingComment();
  const [text, setText] = useState('');
  const submit = (e) => {
    e.preventDefault();
    add.mutate({ id: check._id, key: section.key, text: text.trim() }, { onSuccess: () => setText('') });
  };

  if (!section.comments.length && !open) return null;
  return (
    <div className="mt-2.5 pt-2.5 border-t border-slate-200 space-y-1.5">
      {section.comments.map((c) => (
        <div key={c._id} className="group flex items-start gap-1.5 text-xs">
          <MessageSquare size={12} className="mt-0.5 shrink-0 text-slate-400" />
          <div className="min-w-0 flex-1">
            <span className="font-medium text-slate-700">{c.by?.name}</span>
            <span className="text-slate-400"> · {fmtDateTime(c.at)}</span>
            <p className="text-slate-600 whitespace-pre-wrap">{c.text}</p>
          </div>
          {open && (isTopManagement(user) || String(c.by?._id) === String(user._id)) && (
            <button
              onClick={() => remove.mutate({ id: check._id, key: section.key, commentId: c._id })}
              className="p-0.5 rounded text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
              title={t('detail.delete')}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      ))}
      {open && (
        <form onSubmit={submit} className="flex gap-1.5">
          <input className="input text-xs py-1" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('email.commentPlaceholder')} />
          <button type="submit" disabled={add.isPending || !text.trim()} className="px-2 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 disabled:opacity-40" title={t('detail.send')}>
            <Send size={14} />
          </button>
        </form>
      )}
    </div>
  );
};

// One department paragraph: the owner edits and approves it, everyone comments.
const SectionCard = ({ check, section, open, user }) => {
  const { t } = useTranslation('packaging');
  const { t: tc } = useTranslation('common');
  const update = useUpdatePackagingSection();
  const approve = useApprovePackagingSection();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const mine = ownsSection(user, section);
  const canEdit = open && mine;
  const approved = Boolean(section.approval?.at);

  const save = () => update.mutate(
    { id: check._id, key: section.key, items: text.split('\n') },
    { onSuccess: () => setEditing(false) },
  );

  const side = (
    <div className={`rounded-lg px-3 py-2.5 h-full ${approved ? 'bg-green-50/60' : 'bg-amber-50/60'}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold">
        {approved
          ? <><CheckCircle2 size={14} className="text-green-600" /> <span className="text-green-800">{t('email.approved')}</span></>
          : <><Clock size={14} className="text-amber-600" /> <span className="text-amber-800">{t('email.waiting')}</span></>}
      </div>
      <p className="text-[11px] text-slate-500 mt-0.5">
        {approved
          ? `${section.approval.by?.name || ''} · ${fmtDateTime(section.approval.at)}`
          : t('email.ownedBy', { dept: tc(`dept.${section.sector}`) })}
      </p>
      {canEdit && !editing && (
        <div className="mt-2">
          {approved ? (
            <button
              onClick={() => approve.mutate({ id: check._id, key: section.key, approved: false })}
              disabled={approve.isPending}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-slate-600 hover:bg-white"
            >
              <RotateCcw size={12} /> {t('email.unapprove')}
            </button>
          ) : (
            <button
              onClick={() => approve.mutate({ id: check._id, key: section.key })}
              disabled={approve.isPending}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-700"
            >
              <Check size={13} /> {t('email.approve')}
            </button>
          )}
        </div>
      )}
      <Comments check={check} section={section} open={open} user={user} />
    </div>
  );

  return (
    <Row side={side}>
      <div className={`rounded-lg border bg-white p-3 border-l-4 h-full ${approved ? 'border-l-green-500' : 'border-l-amber-400'} ${
        user.department === section.sector ? 'border-amber-200' : 'border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <span className="text-sm font-semibold text-slate-800">{t(`email.section.${section.key}`)}</span>
          <span className="text-[11px] text-slate-400">· {tc(`dept.${section.sector}`)}</span>
          {user.department === section.sector && <span className="text-[11px] font-medium text-amber-600">· {t('detail.yourSector')}</span>}
          {canEdit && !editing && (
            <button
              onClick={() => { setText(section.items.join('\n')); setEditing(true); }}
              className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs text-slate-500 hover:text-blue-600 hover:bg-slate-100"
            >
              <Pencil size={12} /> {section.items.length ? t('detail.edit') : t('email.add')}
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-2">
            <textarea className="input text-sm min-h-[140px]" value={text} onChange={(e) => setText(e.target.value)} autoFocus />
            <p className="text-[11px] text-slate-500">{t('email.editHint')}</p>
            <div className="flex gap-2">
              <button onClick={save} disabled={update.isPending} className="btn-primary text-xs py-1">{t('detail.save')}</button>
              <button onClick={() => setEditing(false)} className="btn-secondary text-xs py-1">{t('detail.cancel')}</button>
            </div>
          </div>
        ) : section.items.length ? (
          <ul className="list-disc pl-5 space-y-1 text-sm text-slate-800 leading-relaxed">
            {section.items.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        ) : (
          <p className="text-sm text-slate-400 italic">{t('email.empty')}</p>
        )}
      </div>
    </Row>
  );
};

// The client email for one round, in department paragraphs. Departments edit and
// approve their own paragraph; Sales writes the opening / closing and sends it.
const EmailDraft = ({ check, round, open, user }) => {
  const { t } = useTranslation('packaging');
  const [showPreview, setShowPreview] = useState(false);
  const { email, emailPreview } = round;
  const sent = email.sent?.at;
  const canEditText = open && isPackagingLead(user);
  const approvedCount = email.sections.filter((s) => s.approval?.at).length;

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <Mail size={15} className="text-slate-400" /> {t('email.title')}
        </h3>
        <CopyButton text={emailPreview.text} />
      </div>
      <p className="text-xs text-slate-500 mb-3">
        {sent
          ? t('email.sentBy', { name: email.sent.by?.name, at: fmtDateTime(email.sent.at) })
          : t('email.progress', { done: approvedCount, total: email.sections.length })}
      </p>

      <div className="hidden lg:grid lg:grid-cols-3 gap-x-5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        <span className="lg:col-span-2">{t('email.textColumn')}</span>
        <span>{t('email.approvalColumn')}</span>
      </div>
      <div className="space-y-3">
        <TextBlock key={`o-${emailPreview.opening}`} check={check} field="opening" custom={Boolean(email.opening)} value={emailPreview.opening} canEdit={canEditText} />
        {email.sections.map((s) => (
          <SectionCard key={s.key} check={check} section={s} open={open} user={user} />
        ))}
        <TextBlock key={`c-${emailPreview.closing}`} check={check} field="closing" custom={Boolean(email.closing)} value={emailPreview.closing} canEdit={canEditText} />
      </div>

      <button onClick={() => setShowPreview((v) => !v)} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800">
        <ChevronDown size={14} className={`transition-transform ${showPreview ? 'rotate-180' : ''}`} />
        {sent ? t('email.sentText') : t('email.preview')}
      </button>
      {showPreview && (
        <pre className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[12px] leading-relaxed text-slate-700 whitespace-pre-wrap font-mono">
          {emailPreview.text}
        </pre>
      )}
    </section>
  );
};

export default EmailDraft;
