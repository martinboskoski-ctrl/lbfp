import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, Send, Lock, Unlock, Trash2 } from 'lucide-react';
import { usePO, useToggleStatus, useAddQuestion, useAnswerQuestion, useResolveQuestion, useDeletePO } from '../hooks/usePO.js';
import { useAuth } from '../context/AuthContext.jsx';

const ASCII_RE  = /^[\x20-\x7E]*$/;
const isEnglish = (s) => !s || ASCII_RE.test(s);

const shortId = (id) => String(id).slice(-6).toUpperCase();

const DEPT_TABS = [
  { value: 'quality_assurance', label: 'Quality Assurance' },
  { value: 'r_and_d',           label: 'R&D' },
  { value: 'nabavki',           label: 'Набавки' },
];

// ── Question card ─────────────────────────────────────────────────────────────
const QuestionCard = ({ question, poId, isSales, canAnswer, isClosed }) => {
  const [answerText, setAnswerText]   = useState('');
  const [answerError, setAnswerError] = useState('');
  const answerQuestion  = useAnswerQuestion(poId);
  const resolveQuestion = useResolveQuestion(poId);

  const handleAnswer = async () => {
    if (!answerText.trim()) { setAnswerError('Answer cannot be empty'); return; }
    if (!isEnglish(answerText)) { setAnswerError('English only (ASCII characters)'); return; }
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
            Asked by {question.createdBy?.name} · {new Date(question.createdAt).toLocaleDateString('en-GB')}
          </p>
        </div>
        {question.resolved && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex-shrink-0">
            <CheckCircle2 size={11} /> Resolved
          </span>
        )}
      </div>

      {/* Answer */}
      {question.answer ? (
        <div className="mt-3 pl-3 border-l-2 border-blue-200">
          <p className="text-sm text-gray-700">{question.answer}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            — {question.answeredBy?.name} · {new Date(question.answeredAt).toLocaleDateString('en-GB')}
          </p>
        </div>
      ) : canAnswer && !isClosed ? (
        <div className="mt-3">
          <textarea
            className="input resize-none text-sm"
            rows={2}
            placeholder="Type your answer in English..."
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
            Submit Answer
          </button>
        </div>
      ) : !question.answer && (
        <p className="mt-2 text-xs text-gray-400 italic">No answer yet</p>
      )}

      {/* Resolve (sales only, when answered and not yet resolved) */}
      {isSales && question.answer && !question.resolved && !isClosed && (
        <button
          onClick={() => resolveQuestion.mutate(question._id)}
          disabled={resolveQuestion.isPending}
          className="mt-3 flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-medium"
        >
          <CheckCircle2 size={13} /> Mark as Resolved
        </button>
      )}
    </div>
  );
};

// ── Dept Q&A panel ────────────────────────────────────────────────────────────
const DeptPanel = ({ dept, po, isSales, userDept }) => {
  const [qText, setQText]   = useState('');
  const [qError, setQError] = useState('');
  const addQuestion = useAddQuestion(po._id);

  const questions = po.questions.filter((q) => q.targetDepartment === dept);
  const canAnswer = userDept === dept;
  const isClosed  = po.status === 'closed';

  const handleAddQuestion = async () => {
    if (!qText.trim()) { setQError('Question cannot be empty'); return; }
    if (!isEnglish(qText)) { setQError('English only (ASCII characters)'); return; }
    setQError('');
    await addQuestion.mutateAsync({ text: qText.trim(), targetDepartment: dept });
    setQText('');
  };

  return (
    <div className="space-y-3">
      {questions.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-6">No questions yet for this department</p>
      )}

      {questions.map((q) => (
        <QuestionCard
          key={q._id}
          question={q}
          poId={po._id}
          isSales={isSales}
          canAnswer={canAnswer}
          isClosed={isClosed}
        />
      ))}

      {/* Add question (sales only) */}
      {isSales && !isClosed && (
        <div className="border border-dashed border-gray-300 rounded-xl p-4 mt-2">
          <p className="text-xs font-medium text-gray-500 mb-2">Add question for this department</p>
          <textarea
            className="input resize-none text-sm"
            rows={2}
            placeholder="Type question in English..."
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
            Add Question
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const PODetail = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const { data: po, isLoading, error } = usePO(id);
  const toggleStatus = useToggleStatus(id);
  const deletePO     = useDeletePO();

  const isSales   = user?.department === 'sales';
  const userDept  = user?.department;

  // Which dept tabs to show
  const visibleTabs = isSales
    ? DEPT_TABS
    : DEPT_TABS.filter((t) => t.value === userDept);

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
        Purchase Order not found.
      </div>
    );
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this Purchase Order?')) return;
    await deletePO.mutateAsync(po._id);
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
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
            {po.status}
          </span>
        </div>

        {isSales && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleStatus.mutate()}
              disabled={toggleStatus.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {po.status === 'open' ? <><Lock size={12} /> Close PO</> : <><Unlock size={12} /> Reopen PO</>}
            </button>
            <button
              onClick={handleDelete}
              disabled={deletePO.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto p-6 flex gap-6">

        {/* Left — Overview */}
        <div className="w-72 flex-shrink-0 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Overview</h3>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Date Expected</p>
                <p className="font-medium text-gray-800">
                  {new Date(po.dateExpected).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">MOQ</p>
                <p className="font-medium text-gray-800">{po.moq.toLocaleString()}</p>
              </div>
              {po.description && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Description</p>
                  <p className="text-gray-700 leading-relaxed">{po.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Products */}
          {po.products?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3">
                Products ({po.products.length})
              </h3>
              <div className="space-y-3">
                {po.products.map((p, i) => (
                  <div key={i} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                    <p className="text-xs font-semibold text-gray-800">{p.productType}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Weight: {p.weight}</p>
                    {p.description && <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Created by */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-400">Created by</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">{po.createdBy?.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(po.createdAt).toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>

        {/* Right — Department Q&A */}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {/* Tab bar */}
            {visibleTabs.length > 1 && (
              <div className="flex border-b border-gray-100">
                {visibleTabs.map((t) => {
                  const openCount = po.questions.filter(
                    (q) => q.targetDepartment === t.value && !q.resolved
                  ).length;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setActiveTab(t.value)}
                      className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        activeTab === t.value
                          ? 'border-blue-600 text-blue-700'
                          : 'border-transparent text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {t.label}
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
                <h3 className="text-sm font-semibold text-gray-700">{visibleTabs[0].label}</h3>
              </div>
            )}

            <div className="p-5">
              <DeptPanel
                key={activeTab}
                dept={activeTab}
                po={po}
                isSales={isSales}
                userDept={userDept}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PODetail;
