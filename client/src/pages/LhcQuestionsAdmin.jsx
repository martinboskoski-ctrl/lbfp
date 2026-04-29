import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { Pagination } from '../components/Pagination.jsx';
import {
  useLhcCategories,
  useLhcQuestions,
  useCreateLhcQuestion,
  useUpdateLhcQuestion,
  useDeleteLhcQuestion,
} from '../hooks/useLhc.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isTopManagement } from '../utils/userTier.js';

const TYPE_OPTIONS = [
  { v: 'yes_no',         l: 'Да / Не' },
  { v: 'yes_no_na',      l: 'Да / Не / Н/А' },
  { v: 'yes_partial_no', l: 'Да / Делумно / Не' },
  { v: 'true_false',     l: 'Точно / Неточно' },
  { v: 'choice',         l: 'Избор (со опции)' },
  { v: 'multi_check',    l: 'Повеќе избор (чекбокс)' },
];
const SANCTIONS = ['none', 'low', 'medium', 'high'];

const empty = (cat) => ({
  category: cat || '',
  subCategory: '',
  text: '',
  article: '',
  type: 'yes_no',
  options: [],
  correctAnswer: 'yes',
  weight: 1,
  sanctionLevel: 'medium',
  recommendation: '',
  active: true,
});

const QuestionForm = ({ initial, categories, onCancel, onSave, busy }) => {
  const [f, setF] = useState({ ...empty(), ...initial, options: initial?.options || [] });
  const isEdit = !!initial?.qid;
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const needsOptions = ['choice', 'multi_check'].includes(f.type);

  const updateOpt = (i, key, val) => {
    setF((s) => {
      const next = [...(s.options || [])];
      next[i] = { ...next[i], [key]: val };
      return { ...s, options: next };
    });
  };
  const addOpt = () => setF((s) => ({ ...s, options: [...(s.options || []), { value: '', label: '' }] }));
  const removeOpt = (i) => setF((s) => ({ ...s, options: s.options.filter((_, idx) => idx !== i) }));

  const submit = (e) => {
    e.preventDefault();
    const payload = { ...f, weight: Number(f.weight) || 1 };
    if (!needsOptions) payload.options = [];
    onSave(payload);
  };

  return (
    <form onSubmit={submit} className="card p-4 sm:p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="label">Област</label>
          <select className="input" value={f.category} onChange={(e) => set('category', e.target.value)} disabled={isEdit} required>
            <option value="">—</option>
            {categories.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Под-област</label>
          <input className="input" value={f.subCategory || ''} onChange={(e) => set('subCategory', e.target.value)} placeholder="напр. recruitment" />
        </div>
        <div>
          <label className="label">Тип</label>
          <select className="input" value={f.type} onChange={(e) => set('type', e.target.value)}>
            {TYPE_OPTIONS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Текст на прашањето</label>
        <textarea className="input" rows={3} value={f.text} onChange={(e) => set('text', e.target.value)} required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Член / правен извор</label>
          <input className="input" value={f.article || ''} onChange={(e) => set('article', e.target.value)} placeholder="Член X од Закон..." />
        </div>
        <div>
          <label className="label">Тежина</label>
          <input className="input" type="number" step="0.5" min="0" value={f.weight} onChange={(e) => set('weight', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Точен одговор</label>
          {needsOptions ? (
            <input className="input" value={f.correctAnswer || ''} onChange={(e) => set('correctAnswer', e.target.value)} placeholder="value од опциите" />
          ) : (
            <select className="input" value={f.correctAnswer || ''} onChange={(e) => set('correctAnswer', e.target.value)}>
              {f.type === 'true_false' ? (<>
                <option value="true">Точно</option>
                <option value="false">Неточно</option>
              </>) : (<>
                <option value="yes">Да</option>
                <option value="no">Не</option>
              </>)}
            </select>
          )}
        </div>
        <div>
          <label className="label">Ниво на санкција</label>
          <select className="input" value={f.sanctionLevel} onChange={(e) => set('sanctionLevel', e.target.value)}>
            {SANCTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {needsOptions && (
        <div>
          <label className="label">Опции</label>
          <div className="space-y-2">
            {(f.options || []).map((o, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input className="input flex-1" placeholder="value (внатрешно)" value={o.value || ''} onChange={(e) => updateOpt(i, 'value', e.target.value)} />
                <input className="input flex-[2]" placeholder="label (што го гледа корисникот)" value={o.label || ''} onChange={(e) => updateOpt(i, 'label', e.target.value)} />
                <button type="button" onClick={() => removeOpt(i)} className="text-slate-400 hover:text-red-700 p-1.5">
                  <X size={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={addOpt} className="btn-secondary text-sm inline-flex items-center gap-1">
              <Plus size={13} /> Додади опција
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="label">Препорака (ако одговорот не е точен)</label>
        <textarea className="input" rows={2} value={f.recommendation || ''} onChange={(e) => set('recommendation', e.target.value)} />
      </div>

      <div className="flex items-center gap-2">
        <input id="qactive" type="checkbox" className="accent-slate-700" checked={!!f.active} onChange={(e) => set('active', e.target.checked)} />
        <label htmlFor="qactive" className="text-sm text-slate-700 cursor-pointer">Активно (видливо за нови кампањи)</label>
      </div>

      <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="btn-secondary">Откажи</button>
        <button type="submit" className="btn-primary inline-flex items-center gap-1.5" disabled={busy}>
          <Save size={14} /> {busy ? 'Зачувување...' : (isEdit ? 'Зачувај' : 'Додади')}
        </button>
      </div>
    </form>
  );
};

const LhcQuestionsAdmin = () => {
  const { user } = useAuth();
  const { data: categories = [] } = useLhcCategories();
  const [activeCat, setActiveCat] = useState('');
  const cat0 = activeCat || categories[0]?.key;
  const { data: qData } = useLhcQuestions(cat0 ? { category: cat0, limit: 500 } : {});
  const create = useCreateLhcQuestion();
  const update = useUpdateLhcQuestion();
  const remove = useDeleteLhcQuestion();
  const [editing, setEditing] = useState(null); // null | 'new' | question

  const questions = qData?.questions || [];

  const PAGE = 20;
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [activeCat]);
  const pageCount = Math.max(1, Math.ceil(questions.length / PAGE));
  const visibleSlice = useMemo(
    () => questions.slice((page - 1) * PAGE, page * PAGE),
    [questions, page]
  );
  const visibleGrouped = useMemo(() => {
    const g = {};
    for (const q of visibleSlice) (g[q.subCategory || '—'] ||= []).push(q);
    return g;
  }, [visibleSlice]);

  if (!isTopManagement(user)) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-slate-500">Forbidden</div>
      </div>
    );
  }

  const onSave = (payload) => {
    if (editing === 'new') {
      create.mutate(payload, { onSuccess: () => setEditing(null) });
    } else if (editing && editing.qid) {
      update.mutate({ qid: editing.qid, data: payload }, { onSuccess: () => setEditing(null) });
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title="Управување со прашања" />
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-5xl mx-auto">
            <Link to="/lhc" className="text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 mb-3">
              <ArrowLeft size={14} /> Назад
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Прашања по област</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Овде можете да додавате, менувате и деактивирате прашања. Деактивираните не се користат во нови кампањи.
                </p>
              </div>
              <button
                onClick={() => setEditing('new')}
                className="btn-primary text-sm inline-flex items-center gap-1.5"
              >
                <Plus size={14} /> Ново прашање
              </button>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 mb-4 border-b border-slate-200">
              {categories.map((c) => {
                const active = (cat0 === c.key);
                return (
                  <button
                    key={c.key}
                    onClick={() => setActiveCat(c.key)}
                    className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${active ? 'border-slate-800 text-slate-900 font-medium' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                  >
                    {c.name} <span className="text-xs text-slate-400">({c.questionCount})</span>
                  </button>
                );
              })}
            </div>

            {editing && (
              <div className="mb-5">
                <QuestionForm
                  initial={editing === 'new' ? empty(cat0) : editing}
                  categories={categories}
                  onCancel={() => setEditing(null)}
                  onSave={onSave}
                  busy={create.isPending || update.isPending}
                />
              </div>
            )}

            {questions.length === 0 ? (
              <div className="card p-8 text-center text-slate-500 text-sm">
                Нема прашања за оваа област. Кликнете „Ново прашање" за да додадете.
              </div>
            ) : (
              <div className="space-y-5">
                {Object.entries(visibleGrouped).map(([sub, list]) => (
                  <div key={sub}>
                    <h3 className="section-title mb-2">{sub}</h3>
                    <div className="card divide-y divide-slate-100">
                      {list.map((q) => (
                        <div key={q._id} className={`px-4 py-3 ${!q.active ? 'opacity-60' : ''}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs text-slate-400">{q.qid}</span>
                                <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">{q.type}</span>
                                <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">w {q.weight}</span>
                                <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{q.sanctionLevel}</span>
                                {!q.active && <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-50 text-red-700">деактивирано</span>}
                              </div>
                              <p className="text-sm text-slate-900 mt-1">{q.text}</p>
                              {q.article && <p className="text-xs text-slate-500 mt-0.5 italic">{q.article}</p>}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button onClick={() => setEditing(q)} className="text-slate-500 hover:text-slate-900 p-2" title="Уреди">
                                <Edit2 size={14} />
                              </button>
                              {q.active && (
                                <button
                                  onClick={() => {
                                    if (confirm('Да се деактивира ова прашање?')) remove.mutate(q.qid);
                                  }}
                                  className="text-slate-500 hover:text-red-700 p-2"
                                  title="Деактивирај"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <Pagination page={page} pageCount={pageCount} onChange={setPage} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LhcQuestionsAdmin;
