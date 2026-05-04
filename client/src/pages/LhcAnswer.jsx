import { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle2, Send, Cloud, CloudOff, Loader2 } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { Pagination } from '../components/Pagination.jsx';
import {
  useLhcMyAssignment,
  useSaveLhcAnswer,
  useSubmitLhcAssignment,
  useLhcCategories,
} from '../hooks/useLhc.js';
import { qText, qArticle, oLabel, isApprox } from '../utils/lhcLang.js';

const fallbackOptions = (type, t) => {
  const yn = [
    { value: 'yes', label: t('options.yes') },
    { value: 'no',  label: t('options.no') },
  ];
  switch (type) {
    case 'yes_no':         return yn;
    case 'yes_no_na':      return [...yn, { value: 'na', label: t('options.na') }];
    case 'yes_partial_no': return [
      { value: 'yes',     label: t('options.yes') },
      { value: 'partial', label: t('options.partial') },
      { value: 'no',      label: t('options.no') },
    ];
    case 'true_false':     return [
      { value: 'true',  label: t('options.true') },
      { value: 'false', label: t('options.false') },
    ];
    default:               return [];
  }
};

const renderOptions = (q, t) => {
  if (q.options && q.options.length) {
    return q.options.map((o) => ({ value: o.value, label: oLabel(o) }));
  }
  return fallbackOptions(q.type, t);
};

const QuestionCard = ({ q, value, onChange, disabled, t }) => {
  const options = renderOptions(q, t);
  const isMulti = q.type === 'multi_check';
  const approx = isApprox(q);

  const handleSingle = (val) => onChange(val);
  const handleMulti = (optVal) => {
    const cur = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    onChange({ ...cur, [optVal]: !cur[optVal] });
  };

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 mb-1">
        {q.subCategory && (
          <span className="text-[11px] uppercase tracking-wide text-slate-400">{q.subCategory}</span>
        )}
        {approx && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500" title={t('approxNote')}>
            {t('answer.approxBadge')}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-900 leading-relaxed">{qText(q)}</p>
      {qArticle(q) && <p className="text-xs text-slate-500 mt-1 italic">{qArticle(q)}</p>}

      <div className="mt-3 flex flex-col gap-2">
        {!isMulti && options.map((o) => {
          const selected = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              disabled={disabled}
              onClick={() => handleSingle(o.value)}
              className={`text-left px-3 py-2 rounded-md border text-sm transition-colors ${
                selected
                  ? 'bg-slate-100 border-slate-400 text-slate-900'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {selected && <CheckCircle2 size={13} className="inline -mt-0.5 mr-1.5 text-slate-700" />}
              {o.label}
            </button>
          );
        })}
        {isMulti && options.map((o) => {
          const cur = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
          const checked = !!cur[o.value];
          return (
            <label key={o.value} className={`flex items-start gap-2 px-3 py-2 rounded-md border text-sm cursor-pointer ${checked ? 'bg-slate-100 border-slate-400' : 'border-slate-200 hover:bg-slate-50'} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => handleMulti(o.value)}
                className="mt-0.5 accent-slate-700"
              />
              <span>{o.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

const LhcAnswer = () => {
  const { t } = useTranslation('lhc');
  const { t: tc } = useTranslation('common');
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useLhcMyAssignment(id);
  const { data: categories = [] } = useLhcCategories();
  const save = useSaveLhcAnswer();
  const submit = useSubmitLhcAssignment();

  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [activeCat, setActiveCat] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE = 10;

  const [local, setLocal] = useState({});
  const merged = useMemo(() => ({ ...(data?.answers || {}), ...local }), [data, local]);

  const [saveState, setSaveState] = useState('idle');
  const savedTimer = useRef(null);
  const pendingCount = useRef(0);

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (pendingCount.current > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  const grouped = useMemo(() => {
    if (!data?.questions) return {};
    const g = {};
    for (const q of data.questions) (g[q.category] ||= []).push(q);
    return g;
  }, [data]);

  const catKeys = Object.keys(grouped);
  const cur = activeCat || catKeys[0];

  const answeredCount = useMemo(() => {
    if (!data?.questions) return 0;
    return data.questions.filter((q) => merged[q.qid] !== undefined && merged[q.qid] !== '').length;
  }, [data, merged]);

  const total = data?.questions?.length || 0;

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-slate-700" />
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar title={tc('error')} />
          <main className="flex-1 p-6">
            <div className="card p-6 max-w-xl mx-auto text-center">
              <p className="text-red-700 mb-3">{tc('noResults')}</p>
              <Link to="/lhc" className="btn-secondary inline-flex items-center gap-1">
                <ArrowLeft size={14} /> {tc('back')}
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { campaign, assignment, isClosed } = data;
  const disabled = isClosed || assignment.status === 'completed';

  const onAnswer = (qid, value) => {
    setLocal((s) => ({ ...s, [qid]: value }));
    setSaveState('saving');
    pendingCount.current += 1;
    if (savedTimer.current) clearTimeout(savedTimer.current);
    save.mutate(
      { id, qid, answer: value },
      {
        onSuccess: () => {
          pendingCount.current = Math.max(0, pendingCount.current - 1);
          if (pendingCount.current === 0) {
            setSaveState('saved');
            savedTimer.current = setTimeout(() => setSaveState('idle'), 2000);
          }
        },
        onError: () => {
          pendingCount.current = Math.max(0, pendingCount.current - 1);
          setSaveState('error');
        },
      }
    );
  };

  const submitFinal = () => {
    submit.mutate(id, {
      onSuccess: () => navigate(`/lhc/campaigns/${id}`),
    });
  };

  const catName = (key) => t(`categoryNames.${key}`, {
    defaultValue: categories.find((c) => c.key === key)?.name || key,
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={t('answer.title')} />
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-3xl mx-auto">
            <Link to={`/lhc/campaigns/${id}`} className="text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 mb-3">
              <ArrowLeft size={14} /> {tc('back')}
            </Link>

            <div className="card p-4 sm:p-5 mb-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">{campaign.title}</h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {t('answer.answeredOf', { answered: answeredCount, total })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {!disabled && (
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded ${
                      saveState === 'error'  ? 'bg-red-50 text-red-700 border border-red-200' :
                      saveState === 'saving' ? 'bg-slate-100 text-slate-700' :
                      saveState === 'saved'  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                               'text-slate-400'
                    }`}>
                      {saveState === 'saving' && <><Loader2 size={11} className="animate-spin" /> {t('answer.savePill.saving')}</>}
                      {saveState === 'saved'  && <><Cloud size={11} /> {t('answer.savePill.saved')}</>}
                      {saveState === 'error'  && <><CloudOff size={11} /> {t('answer.savePill.error')}</>}
                      {saveState === 'idle'   && <><Cloud size={11} /> {t('answer.savePill.idle')}</>}
                    </span>
                  )}
                  {!disabled && (
                    <button
                      onClick={() => setConfirmSubmit(true)}
                      disabled={answeredCount < total || submit.isPending}
                      className="btn-primary inline-flex items-center gap-1.5 text-sm"
                    >
                      <Send size={13} /> {t('answer.submit')}
                    </button>
                  )}
                  {disabled && (
                    <Link to={`/lhc/campaigns/${id}/my-result`} className="btn-secondary text-sm">
                      {t('answer.viewResult')}
                    </Link>
                  )}
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-700 transition-all" style={{ width: `${total ? Math.round(answeredCount/total*100) : 0}%` }} />
              </div>
            </div>

            {/* Category tabs */}
            {catKeys.length > 1 && (
              <div className="flex gap-1 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 mb-4 border-b border-slate-200">
                {catKeys.map((k) => {
                  const active = (cur === k);
                  const done = (grouped[k] || []).filter((q) => merged[q.qid] !== undefined && merged[q.qid] !== '').length;
                  return (
                    <button
                      key={k}
                      onClick={() => { setActiveCat(k); setPage(1); }}
                      className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${active ? 'border-slate-800 text-slate-900 font-medium' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                      {catName(k)} <span className="text-xs text-slate-400">({done}/{grouped[k]?.length || 0})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {(() => {
              const all = grouped[cur] || [];
              const pageCount = Math.max(1, Math.ceil(all.length / PAGE));
              const slice = all.slice((page - 1) * PAGE, page * PAGE);
              return (
                <>
                  <div className="space-y-3">
                    {slice.map((q) => (
                      <QuestionCard
                        key={q.qid}
                        q={q}
                        value={merged[q.qid]}
                        onChange={(v) => onAnswer(q.qid, v)}
                        disabled={disabled}
                        t={t}
                      />
                    ))}
                  </div>
                  <Pagination page={page} pageCount={pageCount} onChange={setPage} />
                </>
              );
            })()}

            {confirmSubmit && (
              <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-md border border-slate-200 max-w-md w-full p-5">
                  <h3 className="font-semibold text-slate-900 mb-2">{t('answer.submitConfirmTitle')}</h3>
                  <p className="text-sm text-slate-600 mb-4">{t('answer.submitConfirmBody')}</p>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setConfirmSubmit(false)} className="btn-secondary text-sm">{tc('cancel')}</button>
                    <button onClick={submitFinal} className="btn-primary text-sm" disabled={submit.isPending}>
                      {submit.isPending ? t('answer.submitting') : t('answer.submit')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LhcAnswer;
