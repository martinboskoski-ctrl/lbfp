import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, CheckCircle2, Loader2, Send, Lock, Unlock, Trash2,
  Flag, Clock, MessageSquare, ThumbsUp, ThumbsDown, FileText, Copy,
} from 'lucide-react';
import {
  usePO, useToggleStatus, useAddQuestion, usePostThread, useMarkFinal,
  useSalesReview, useClientApproval, useDigest, useDeletePO,
} from '../hooks/usePO.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDateShort, fmtDateLong } from '../utils/formatDate.js';
import toast from 'react-hot-toast';

const ASCII_RE  = /^[\x20-\x7E]*$/;
const isEnglish = (s) => !s || ASCII_RE.test(s);

const shortId = (id) => String(id).slice(-6).toUpperCase();

const DEPT_KEYS  = ['quality_assurance', 'r_and_d', 'nabavki', 'packaging'];
const PHASE_KEYS = [
  'phase_1_idea', 'phase_2_evaluation', 'phase_3_plan',
  'phase_4_client_feedback', 'phase_5_design_logistics',
  'phase_6_industrial_trial', 'phase_7_design_approval',
  'phase_8_production_planning', 'phase_9_production_verification',
];

const STATUS_COLORS = {
  pending:               'bg-gray-100 text-gray-600',
  in_progress:           'bg-blue-50 text-blue-700',
  awaiting_sales_review: 'bg-amber-50 text-amber-700',
  needs_more:            'bg-orange-50 text-orange-700',
  sent_to_client:        'bg-indigo-50 text-indigo-700',
  client_approved:       'bg-green-50 text-green-700',
  client_rejected:       'bg-red-50 text-red-700',
};

const PRIORITY_COLORS = {
  low:    'bg-gray-50 text-gray-500',
  normal: 'bg-blue-50 text-blue-600',
  high:   'bg-red-50 text-red-600',
};

const canAnswerFor = (user, target) => {
  if (!user) return false;
  if (user.department === 'top_management') return true;
  if (user.department === target) return true;
  if (target === 'packaging' && user.department === 'r_and_d') return true;
  return false;
};

// ── Required-fields checklist ────────────────────────────────────────────────
const RequiredFieldsChecklist = ({ fields, onToggle, disabled, t }) => {
  if (!fields?.length) return null;
  const allFilled = fields.every((f) => f.filled);
  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-700">{t('question.requiredFields')}</p>
        <span className={`text-xs font-medium ${allFilled ? 'text-green-600' : 'text-orange-600'}`}>
          {fields.filter((f) => f.filled).length} / {fields.length}
        </span>
      </div>
      <ul className="space-y-1">
        {fields.map((f) => (
          <li key={f.key} className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={!!f.filled}
              disabled={disabled}
              onChange={(e) => onToggle?.(f.key, e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className={f.filled ? 'text-gray-700 line-through' : 'text-gray-700'}>{f.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ── One question card ───────────────────────────────────────────────────────
const QuestionCard = ({ question, po, user, t }) => {
  const isSales       = user?.department === 'sales' || user?.department === 'top_management';
  const canAnswer     = canAnswerFor(user, question.targetDepartment);
  const isClosed      = po.status === 'closed';

  const [reply, setReply]       = useState('');
  const [reviewNotes, setRN]    = useState('');
  const [clientNotes, setCN]    = useState('');
  const [fields, setFields]     = useState(question.requiredFields || []);
  const [error, setError]       = useState('');

  const postThread     = usePostThread(po._id);
  const markFinal      = useMarkFinal(po._id);
  const salesReview    = useSalesReview(po._id);
  const clientApproval = useClientApproval(po._id);

  const allFilled = fields.length > 0 && fields.every((f) => f.filled);

  const handleReply = async () => {
    if (!reply.trim())     { setError(t('question.answerEmpty')); return; }
    if (!isEnglish(reply)) { setError(t('question.englishOnly')); return; }
    setError('');
    await postThread.mutateAsync({ qid: question._id, body: reply.trim() });
    setReply('');
  };

  const handleMarkFinal = async () => {
    if (!reply.trim() && !question.thread?.length) {
      setError(t('question.answerEmpty')); return;
    }
    if (reply && !isEnglish(reply)) { setError(t('question.englishOnly')); return; }
    setError('');
    try {
      await markFinal.mutateAsync({
        qid: question._id,
        answer: reply.trim() || undefined,
        requiredFields: fields,
      });
      setReply('');
    } catch (e) {
      const missing = e?.response?.data?.missing;
      if (missing?.length) toast.error(`${t('question.missingFields')}: ${missing.join(', ')}`);
    }
  };

  const toggleField = (key, val) => {
    setFields((fs) => fs.map((f) => f.key === key ? { ...f, filled: val } : f));
  };

  const reviewAndSend = (accepted, sendToClient = false) =>
    salesReview.mutateAsync({ qid: question._id, accepted, sendToClient, notes: reviewNotes.trim() }).then(() => setRN(''));

  const logClient = (approved) =>
    clientApproval.mutateAsync({ qid: question._id, approved, clientNotes: clientNotes.trim() }).then(() => setCN(''));

  const finalEntry = question.thread?.find((t) => t.isFinalAnswer);

  return (
    <div className="border border-gray-200 rounded-xl bg-white p-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{question.text}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-400">
            <span>{t('question.askedBy', { name: question.createdBy?.name, date: fmtDateShort(question.createdAt) })}</span>
            {question.productRef && <span className="text-gray-500">· {question.productRef}</span>}
            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
              {t(`phase.${question.phase}`)}
            </span>
            {question.deadline && (
              <span className="flex items-center gap-1 text-gray-500">
                <Clock size={11} /> {fmtDateShort(question.deadline)}
              </span>
            )}
            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${PRIORITY_COLORS[question.priority || 'normal']}`}>
              <Flag size={10} /> {t(`priority.${question.priority || 'normal'}`)}
            </span>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[question.status] || 'bg-gray-100'}`}>
          {t(`qstatus.${question.status}`)}
        </span>
      </div>

      {/* Thread */}
      {question.thread?.length > 0 && (
        <div className="mt-3 space-y-2">
          {question.thread.map((entry) => (
            <div
              key={entry._id}
              className={`pl-3 border-l-2 ${entry.isFinalAnswer ? 'border-green-400 bg-green-50/50' : 'border-blue-200'} py-1.5 px-2 rounded-r`}
            >
              <p className="text-sm text-gray-700">{entry.body}</p>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                {entry.author?.name} · {fmtDateShort(entry.createdAt)}
                {entry.isFinalAnswer && (
                  <span className="ml-1 inline-flex items-center gap-0.5 text-green-700 font-semibold">
                    <CheckCircle2 size={10} /> {t('question.finalAnswer')}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Required-fields checklist visible to target dept while not yet awaiting review */}
      {canAnswer && !isClosed && question.status !== 'client_approved' && (
        <RequiredFieldsChecklist
          fields={fields}
          onToggle={toggleField}
          disabled={question.status === 'awaiting_sales_review' || question.status === 'sent_to_client'}
          t={t}
        />
      )}

      {/* Reply box — any participant can post on an open question */}
      {!isClosed && (canAnswer || isSales) && question.status !== 'client_approved' && (
        <div className="mt-3">
          <textarea
            className="input resize-none text-sm"
            rows={2}
            placeholder={t('question.replyPlaceholder')}
            value={reply}
            onChange={(e) => { setReply(e.target.value); setError(''); }}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={handleReply}
              disabled={postThread.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200"
            >
              {postThread.isPending ? <Loader2 size={12} className="animate-spin" /> : <MessageSquare size={12} />}
              {t('question.postReply')}
            </button>

            {canAnswer && question.status !== 'awaiting_sales_review' && question.status !== 'sent_to_client' && (
              <button
                onClick={handleMarkFinal}
                disabled={markFinal.isPending || (fields.length > 0 && !allFilled)}
                title={fields.length > 0 && !allFilled ? t('question.fillAllFirst') : ''}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {markFinal.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                {t('question.markFinal')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sales review controls */}
      {isSales && question.status === 'awaiting_sales_review' && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold text-amber-800 mb-2">{t('question.reviewBlock')}</p>
          <input
            type="text"
            className="input text-sm mb-2"
            placeholder={t('question.reviewNotesPlaceholder')}
            value={reviewNotes}
            onChange={(e) => setRN(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => reviewAndSend(true, true)}
              disabled={salesReview.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"
            >
              <ThumbsUp size={12} /> {t('question.acceptAndSend')}
            </button>
            <button
              onClick={() => reviewAndSend(true, false)}
              disabled={salesReview.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-50"
            >
              <CheckCircle2 size={12} /> {t('question.acceptOnly')}
            </button>
            <button
              onClick={() => reviewAndSend(false)}
              disabled={salesReview.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-orange-200 text-orange-700 text-xs font-medium hover:bg-orange-50"
            >
              <ThumbsDown size={12} /> {t('question.needsMore')}
            </button>
          </div>
        </div>
      )}

      {/* Sales: log client decision */}
      {isSales && question.status === 'sent_to_client' && (
        <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
          <p className="text-xs font-semibold text-indigo-800 mb-2">{t('question.clientDecisionBlock')}</p>
          <input
            type="text"
            className="input text-sm mb-2"
            placeholder={t('question.clientNotesPlaceholder')}
            value={clientNotes}
            onChange={(e) => setCN(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={() => logClient(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700"
            >
              <ThumbsUp size={12} /> {t('question.clientApproved')}
            </button>
            <button
              onClick={() => logClient(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700"
            >
              <ThumbsDown size={12} /> {t('question.clientRejected')}
            </button>
          </div>
        </div>
      )}

      {/* Sales review feedback line */}
      {question.salesReview?.reviewedAt && (
        <p className="text-xs text-gray-500 mt-2">
          {t(question.salesReview.accepted ? 'question.reviewAccepted' : 'question.reviewRejected', {
            name: question.salesReview.reviewedBy?.name,
            date: fmtDateShort(question.salesReview.reviewedAt),
          })}
          {question.salesReview.notes && <span className="text-gray-400"> — {question.salesReview.notes}</span>}
        </p>
      )}
      {question.clientApproval?.loggedAt && (
        <p className="text-xs text-gray-500 mt-1">
          {t(question.clientApproval.approved ? 'question.clientLoggedApproved' : 'question.clientLoggedRejected', {
            date: fmtDateShort(question.clientApproval.loggedAt),
          })}
          {question.clientApproval.clientNotes && <span className="text-gray-400"> — {question.clientApproval.clientNotes}</span>}
        </p>
      )}

      {finalEntry && question.status === 'client_approved' && (
        <div className="mt-2 text-xs text-green-700 flex items-center gap-1">
          <CheckCircle2 size={12} /> {t('question.fullyResolved')}
        </div>
      )}
    </div>
  );
};

// ── Add-question form ────────────────────────────────────────────────────────
const AddQuestionForm = ({ po, defaultDept, t }) => {
  const [open, setOpen]         = useState(false);
  const [form, setForm]         = useState({
    text: '',
    targetDepartment: defaultDept,
    phase: po.currentPhase || 'phase_1_idea',
    productRef: '',
    deadline: '',
    priority: 'normal',
  });
  const [error, setError]       = useState('');
  const addQuestion             = useAddQuestion(po._id);

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.text.trim())     { setError(t('question.questionEmpty')); return; }
    if (!isEnglish(form.text)) { setError(t('question.englishOnly')); return; }
    setError('');
    await addQuestion.mutateAsync({
      ...form,
      text: form.text.trim(),
      deadline: form.deadline || undefined,
    });
    setForm((f) => ({ ...f, text: '', productRef: '', deadline: '' }));
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full border border-dashed border-gray-300 rounded-xl p-3 text-sm text-gray-500 hover:bg-gray-50"
      >
        + {t('question.addQuestion')}
      </button>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl bg-white p-4 space-y-3">
      <textarea
        className="input resize-none text-sm"
        rows={2}
        placeholder={t('question.questionPlaceholder')}
        value={form.text}
        onChange={(e) => { setF('text', e.target.value); setError(''); }}
      />
      {error && <p className="text-red-500 text-xs">{error}</p>}

      <div className="grid grid-cols-2 gap-2">
        <select className="input text-sm" value={form.targetDepartment} onChange={(e) => setF('targetDepartment', e.target.value)}>
          {DEPT_KEYS.map((d) => <option key={d} value={d}>{t(`deptTab.${d}`)}</option>)}
        </select>
        <select className="input text-sm" value={form.phase} onChange={(e) => setF('phase', e.target.value)}>
          {PHASE_KEYS.map((p) => <option key={p} value={p}>{t(`phase.${p}`)}</option>)}
        </select>
        <input
          className="input text-sm"
          placeholder={t('question.productRefPlaceholder')}
          value={form.productRef}
          onChange={(e) => setF('productRef', e.target.value)}
        />
        <input
          type="date"
          className="input text-sm"
          value={form.deadline}
          onChange={(e) => setF('deadline', e.target.value)}
        />
        <select className="input text-sm col-span-2" value={form.priority} onChange={(e) => setF('priority', e.target.value)}>
          {['low', 'normal', 'high'].map((p) => <option key={p} value={p}>{t(`priority.${p}`)}</option>)}
        </select>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={() => setOpen(false)} className="btn-secondary text-xs">{t('cancel')}</button>
        <button
          onClick={submit}
          disabled={addQuestion.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
        >
          {addQuestion.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          {t('question.addQuestionBtn')}
        </button>
      </div>
    </div>
  );
};

// ── Dept tab panel ───────────────────────────────────────────────────────────
const DeptPanel = ({ dept, po, user, t }) => {
  const isSales  = user?.department === 'sales' || user?.department === 'top_management';
  const questions = po.questions.filter((q) => q.targetDepartment === dept);
  const isClosed  = po.status === 'closed';

  return (
    <div className="space-y-3">
      {questions.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-6">{t('question.noQuestions')}</p>
      )}

      {questions.map((q) => (
        <QuestionCard key={q._id} question={q} po={po} user={user} t={t} />
      ))}

      {isSales && !isClosed && <AddQuestionForm po={po} defaultDept={dept} t={t} />}
    </div>
  );
};

// ── Digest modal ─────────────────────────────────────────────────────────────
const DigestModal = ({ markdown, onClose, t }) => {
  const copy = async () => {
    try { await navigator.clipboard.writeText(markdown); toast.success(t('digest.copied')); }
    catch { toast.error('Copy failed'); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold">{t('digest.title')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">×</button>
        </div>
        <pre className="flex-1 overflow-auto p-5 text-xs whitespace-pre-wrap font-mono text-gray-700">{markdown}</pre>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary text-xs">{t('close')}</button>
          <button onClick={copy} className="btn-primary text-xs flex items-center gap-1.5">
            <Copy size={12} /> {t('digest.copy')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────────────────────
const PODetail = () => {
  const { t }    = useTranslation('po');
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: po, isLoading, error } = usePO(id);
  const toggleStatus = useToggleStatus(id);
  const deletePO     = useDeletePO();
  const digest       = useDigest(id);

  const [digestMd, setDigestMd] = useState(null);

  const isSales  = user?.department === 'sales' || user?.department === 'top_management';

  // Which dept tabs to show
  const visibleTabs = isSales
    ? DEPT_KEYS
    : DEPT_KEYS.filter((k) => canAnswerFor(user, k));

  const [activeTab, setActiveTab] = useState(isSales ? 'r_and_d' : (visibleTabs[0] || 'r_and_d'));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {t('notFound')}
      </div>
    );
  }

  const handleDelete = async () => {
    if (!window.confirm(t('deleteConfirm'))) return;
    await deletePO.mutateAsync(po._id);
    navigate(-1);
  };

  const handleDigest = async () => {
    const res = await digest.mutateAsync();
    setDigestMd(res.markdown);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700">
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
            {po.stage === 'pre_order' ? 'INQ' : 'PO'}-{shortId(po._id)}
          </span>
          <h1 className="text-base font-bold text-gray-900">{po.clientName}</h1>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            po.stage === 'pre_order' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
          }`}>
            {t(`stage.${po.stage}`)}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            po.status === 'open' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {t(`status.${po.status}`)}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
            {t(`phase.${po.currentPhase || 'phase_1_idea'}`)}
          </span>
        </div>

        {isSales && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDigest}
              disabled={digest.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 text-xs font-medium text-blue-600 hover:bg-blue-50"
            >
              {digest.isPending ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
              {t('clientDigest')}
            </button>
            <button
              onClick={() => toggleStatus.mutate()}
              disabled={toggleStatus.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              {po.status === 'open' ? <><Lock size={12} /> {t('closePO')}</> : <><Unlock size={12} /> {t('reopenPO')}</>}
            </button>
            <button
              onClick={handleDelete}
              disabled={deletePO.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 size={12} /> {t('deletePO')}
            </button>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
        {/* Left — Overview */}
        <div className="w-full lg:w-72 lg:flex-shrink-0 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4">{t('overview')}</h3>
            <div className="space-y-3 text-sm">
              {po.dateExpected && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">{t('dateExpected')}</p>
                  <p className="font-medium text-gray-800">{fmtDateLong(po.dateExpected)}</p>
                </div>
              )}
              {po.moq != null && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">{t('moq')}</p>
                  <p className="font-medium text-gray-800">{po.moq.toLocaleString()}</p>
                </div>
              )}
              {po.description && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">{t('description')}</p>
                  <p className="text-gray-700 leading-relaxed">{po.description}</p>
                </div>
              )}
              {po.stage === 'pre_order' && !po.dateExpected && !po.moq && (
                <p className="text-xs text-gray-400 italic">{t('preOrderNoDetails')}</p>
              )}
            </div>
          </div>

          {po.products?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3">{t('productsCount', { count: po.products.length })}</h3>
              <div className="space-y-3">
                {po.products.map((p, i) => (
                  <div key={i} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                    <p className="text-xs font-semibold text-gray-800">{p.productType}</p>
                    {p.weight && <p className="text-xs text-gray-500 mt-0.5">{t('weight', { value: p.weight })}</p>}
                    {p.description && <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-400">{t('createdBy')}</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">{po.createdBy?.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{fmtDateShort(po.createdAt)}</p>
          </div>
        </div>

        {/* Right — Q&A by department */}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {visibleTabs.map((deptKey) => {
                const openCount = po.questions.filter(
                  (q) => q.targetDepartment === deptKey && q.status !== 'client_approved'
                ).length;
                return (
                  <button
                    key={deptKey}
                    onClick={() => setActiveTab(deptKey)}
                    className={`flex-shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                      activeTab === deptKey
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {t(`deptTab.${deptKey}`)}
                    {openCount > 0 && (
                      <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-1.5 py-0.5 rounded-full">
                        {openCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-5">
              <DeptPanel key={activeTab} dept={activeTab} po={po} user={user} t={t} />
            </div>
          </div>
        </div>
      </div>

      {digestMd != null && <DigestModal markdown={digestMd} onClose={() => setDigestMd(null)} t={t} />}
    </div>
  );
};

export default PODetail;
