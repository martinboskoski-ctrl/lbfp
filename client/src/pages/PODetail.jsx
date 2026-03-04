import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle2, Loader2, Send, Lock, Unlock, Trash2 } from 'lucide-react';
import { usePO, useToggleStatus, useAddQuestion, useAnswerQuestion, useResolveQuestion, useDeletePO } from '../hooks/usePO.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDateShort, fmtDateLong } from '../utils/formatDate.js';

const ASCII_RE  = /^[\x20-\x7E]*$/;
const isEnglish = (s) => !s || ASCII_RE.test(s);

const shortId = (id) => String(id).slice(-6).toUpperCase();

const DEPT_KEYS = ['quality_assurance', 'r_and_d', 'nabavki'];

// ── Question card ─────────────────────────────────────────────────────────────
const QuestionCard = ({ question, poId, isSales, canAnswer, isClosed, t }) => {
  const [answerText, setAnswerText]   = useState('');
  const [answerError, setAnswerError] = useState('');
  const answerQuestion  = useAnswerQuestion(poId);
  const resolveQuestion = useResolveQuestion(poId);

  const handleAnswer = async () => {
    if (!answerText.trim()) { setAnswerError(t('question.answerEmpty')); return; }
    if (!isEnglish(answerText)) { setAnswerError(t('question.englishOnly')); return; }
    setAnswerError('');
    await answerQuestion.mutateAsync({ qid: question._id, answer: answerText.trim() });
    setAnswerText('');
  };

  return (
    <div className={`border rounded-xl p-4 ${question.resolved ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
      {/* Question */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-900">{question.text}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {t('question.askedBy', { name: question.createdBy?.name, date: fmtDateShort(question.createdAt) })}
          </p>
        </div>
        {question.resolved && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex-shrink-0">
            <CheckCircle2 size={11} /> {t('question.resolved')}
          </span>
        )}
      </div>

      {/* Answer */}
      {question.answer ? (
        <div className="mt-3 pl-3 border-l-2 border-blue-200">
          <p className="text-sm text-gray-700">{question.answer}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {t('question.answeredBy', { name: question.answeredBy?.name, date: fmtDateShort(question.answeredAt) })}
          </p>
        </div>
      ) : canAnswer && !isClosed ? (
        <div className="mt-3">
          <textarea
            className="input resize-none text-sm"
            rows={2}
            placeholder={t('question.answerPlaceholder')}
            value={answerText}
            onChange={(e) => { setAnswerText(e.target.value); setAnswerError(''); }}
          />
          {answerError && <p className="text-red-500 text-xs mt-1">{answerError}</p>}
          <button
            onClick={handleAnswer}
            disabled={answerQuestion.isPending}
            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            {answerQuestion.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            {t('question.submitAnswer')}
          </button>
        </div>
      ) : !question.answer && (
        <p className="mt-2 text-xs text-gray-400 italic">{t('question.noAnswer')}</p>
      )}

      {/* Resolve (sales only, when answered and not yet resolved) */}
      {isSales && question.answer && !question.resolved && !isClosed && (
        <button
          onClick={() => resolveQuestion.mutate(question._id)}
          disabled={resolveQuestion.isPending}
          className="mt-3 flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-medium"
        >
          <CheckCircle2 size={13} /> {t('question.markResolved')}
        </button>
      )}
    </div>
  );
};

// ── Dept Q&A panel ────────────────────────────────────────────────────────────
const DeptPanel = ({ dept, po, isSales, userDept, t }) => {
  const [qText, setQText]   = useState('');
  const [qError, setQError] = useState('');
  const addQuestion = useAddQuestion(po._id);

  const questions = po.questions.filter((q) => q.targetDepartment === dept);
  const canAnswer = userDept === dept || userDept === 'top_management';
  const isClosed  = po.status === 'closed';

  const handleAddQuestion = async () => {
    if (!qText.trim()) { setQError(t('question.questionEmpty')); return; }
    if (!isEnglish(qText)) { setQError(t('question.englishOnly')); return; }
    setQError('');
    await addQuestion.mutateAsync({ text: qText.trim(), targetDepartment: dept });
    setQText('');
  };

  return (
    <div className="space-y-3">
      {questions.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-6">{t('question.noQuestions')}</p>
      )}

      {questions.map((q) => (
        <QuestionCard
          key={q._id}
          question={q}
          poId={po._id}
          isSales={isSales}
          canAnswer={canAnswer}
          isClosed={isClosed}
          t={t}
        />
      ))}

      {/* Add question (sales only) */}
      {isSales && !isClosed && (
        <div className="border border-dashed border-gray-300 rounded-xl p-4 mt-2">
          <p className="text-xs font-medium text-gray-500 mb-2">{t('question.addQuestion')}</p>
          <textarea
            className="input resize-none text-sm"
            rows={2}
            placeholder={t('question.questionPlaceholder')}
            value={qText}
            onChange={(e) => { setQText(e.target.value); setQError(''); }}
          />
          {qError && <p className="text-red-500 text-xs mt-1">{qError}</p>}
          <button
            onClick={handleAddQuestion}
            disabled={addQuestion.isPending}
            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            {addQuestion.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            {t('question.addQuestionBtn')}
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const PODetail = () => {
  const { t } = useTranslation('po');
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const { data: po, isLoading, error } = usePO(id);
  const toggleStatus = useToggleStatus(id);
  const deletePO     = useDeletePO();

  const isSales   = user?.department === 'sales' || user?.department === 'top_management';
  const userDept  = user?.department;

  // Which dept tabs to show
  const visibleTabs = isSales
    ? DEPT_KEYS
    : DEPT_KEYS.filter((k) => k === userDept);

  const [activeTab, setActiveTab] = useState(
    isSales ? 'quality_assurance' : userDept
  );

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700">
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1 flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
            PO-{shortId(po._id)}
          </span>
          <h1 className="text-base font-bold text-gray-900">{po.clientName}</h1>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            po.status === 'open' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {t(`status.${po.status}`)}
          </span>
        </div>

        {isSales && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleStatus.mutate()}
              disabled={toggleStatus.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {po.status === 'open' ? <><Lock size={12} /> {t('closePO')}</> : <><Unlock size={12} /> {t('reopenPO')}</>}
            </button>
            <button
              onClick={handleDelete}
              disabled={deletePO.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={12} /> {t('deletePO')}
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6">

        {/* Left — Overview */}
        <div className="w-full lg:w-72 lg:flex-shrink-0 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4">{t('overview')}</h3>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{t('dateExpected')}</p>
                <p className="font-medium text-gray-800">
                  {fmtDateLong(po.dateExpected)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{t('moq')}</p>
                <p className="font-medium text-gray-800">{po.moq.toLocaleString()}</p>
              </div>
              {po.description && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">{t('description')}</p>
                  <p className="text-gray-700 leading-relaxed">{po.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Products */}
          {po.products?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3">
                {t('productsCount', { count: po.products.length })}
              </h3>
              <div className="space-y-3">
                {po.products.map((p, i) => (
                  <div key={i} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                    <p className="text-xs font-semibold text-gray-800">{p.productType}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t('weight', { value: p.weight })}</p>
                    {p.description && <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Created by */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-400">{t('createdBy')}</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">{po.createdBy?.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {fmtDateShort(po.createdAt)}
            </p>
          </div>
        </div>

        {/* Right — Department Q&A */}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {/* Tab bar */}
            {visibleTabs.length > 1 && (
              <div className="flex border-b border-gray-100 overflow-x-auto">
                {visibleTabs.map((deptKey) => {
                  const openCount = po.questions.filter(
                    (q) => q.targetDepartment === deptKey && !q.resolved
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
            )}

            {/* Single dept label (non-sales) */}
            {visibleTabs.length === 1 && (
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">{t(`deptTab.${visibleTabs[0]}`)}</h3>
              </div>
            )}

            <div className="p-5">
              <DeptPanel
                key={activeTab}
                dept={activeTab}
                po={po}
                isSales={isSales}
                userDept={userDept}
                t={t}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PODetail;
