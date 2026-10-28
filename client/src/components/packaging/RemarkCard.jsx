import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Check, X, RotateCcw, Pencil, Trash2, BookOpen } from 'lucide-react';
import { SEVERITY_CLS, SEVERITY_ACCENT, REMARK_STATUS_CLS } from './styles.js';
import {
  useRespondPackagingRemark, useUpdatePackagingRemark, useDeletePackagingRemark,
} from '../../hooks/usePackaging.js';
import { isPackagingLead, isTopManagement } from '../../utils/userTier.js';
import { fmtDateTime } from '../../utils/formatDate.js';

const RemarkCard = ({ checkId, remark, open, user }) => {
  const { t } = useTranslation('packaging');
  const respond = useRespondPackagingRemark();
  const update = useUpdatePackagingRemark();
  const remove = useDeletePackagingRemark();
  const [disputing, setDisputing] = useState(false);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(remark.text);

  const pending = remark.status === 'pending';
  const canAnswer = open && (isTopManagement(user) || user.department === remark.sector);
  const canManage = open && pending &&
    (isPackagingLead(user) || String(remark.createdBy?._id || remark.createdBy) === String(user._id));

  const send = (status, extra = {}) =>
    respond.mutate({ id: checkId, remarkId: remark._id, status, ...extra }, {
      onSuccess: () => { setDisputing(false); setComment(''); },
    });

  return (
    <div className={`rounded-lg border border-slate-200 border-l-4 ${SEVERITY_ACCENT[remark.severity]} bg-white p-3`}>
      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${SEVERITY_CLS[remark.severity]}`}>
          {t(`severity.${remark.severity}`)}
        </span>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${REMARK_STATUS_CLS[remark.status]}`}>
          {t(`remarkStatus.${remark.status}`)}
        </span>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-slate-400">
          {remark.source === 'ai' ? <><Bot size={12} /> {t('source.ai')}</> : remark.createdBy?.name}
        </span>
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea className="input text-sm min-h-[70px]" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex gap-2">
            <button
              onClick={() => update.mutate({ id: checkId, remarkId: remark._id, text }, { onSuccess: () => setEditing(false) })}
              disabled={update.isPending || !text.trim()}
              className="btn-primary text-xs py-1"
            >
              {t('detail.save')}
            </button>
            <button onClick={() => { setEditing(false); setText(remark.text); }} className="btn-secondary text-xs py-1">{t('detail.cancel')}</button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{remark.text}</p>
      )}

      {remark.ruleText && (
        <p className="flex items-start gap-1 mt-1.5 text-[11px] text-slate-500">
          <BookOpen size={12} className="mt-0.5 shrink-0" /> {remark.ruleText}
        </p>
      )}

      {!pending && (
        <div className="mt-2 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
          <span className="font-medium">{remark.response?.by?.name}</span>
          <span className="text-slate-400"> · {fmtDateTime(remark.response?.at)}</span>
          {remark.response?.comment && <p className="mt-0.5 whitespace-pre-wrap">{remark.response.comment}</p>}
        </div>
      )}

      {disputing && (
        <div className="mt-2 space-y-2">
          <textarea
            className="input text-sm min-h-[60px]"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('detail.commentPlaceholder')}
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={() => send('disputed', { comment })} disabled={respond.isPending || !comment.trim()} className="btn-primary text-xs py-1">
              {t('detail.send')}
            </button>
            <button onClick={() => setDisputing(false)} className="btn-secondary text-xs py-1">{t('detail.cancel')}</button>
          </div>
        </div>
      )}

      {!editing && !disputing && (canAnswer || canManage) && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          {canAnswer && pending && (
            <>
              <button onClick={() => send('confirmed')} disabled={respond.isPending} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-700">
                <Check size={13} /> {t('detail.confirm')}
              </button>
              <button onClick={() => setDisputing(true)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-50">
                <X size={13} /> {t('detail.dispute')}
              </button>
            </>
          )}
          {canAnswer && !pending && (
            <button onClick={() => send('pending')} disabled={respond.isPending} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-slate-500 hover:bg-slate-100">
              <RotateCcw size={12} /> {t('detail.reset')}
            </button>
          )}
          {canManage && (
            <span className="ml-auto flex items-center">
              <button onClick={() => setEditing(true)} className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100" title={t('detail.edit')}>
                <Pencil size={13} />
              </button>
              <button
                onClick={() => { if (window.confirm(t('detail.confirmDeleteRemark'))) remove.mutate({ id: checkId, remarkId: remark._id }); }}
                className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100"
                title={t('detail.delete')}
              >
                <Trash2 size={13} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default RemarkCard;
