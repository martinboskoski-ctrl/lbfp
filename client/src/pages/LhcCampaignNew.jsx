import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import Sidebar, { DEPARTMENTS } from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { useLhcCategories, useCreateLhcCampaign } from '../hooks/useLhc.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isTopManagement } from '../utils/userTier.js';

const todayPlus = (d) => {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
};

const LhcCampaignNew = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: categories = [] } = useLhcCategories();
  const create = useCreateLhcCampaign();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [chosen, setChosen] = useState([]);
  const [audienceMode, setAudienceMode] = useState('all');
  const [audienceDepartments, setAudienceDepartments] = useState([]);
  const [questionsPerCategory, setQuestionsPerCategory] = useState(20);
  const [pickStrategy, setPickStrategy] = useState('random');
  const [openAt, setOpenAt] = useState(todayPlus(0));
  const [closeAt, setCloseAt] = useState(todayPlus(15));

  const eligibleCategories = useMemo(
    () => categories.filter((c) => c.questionCount > 0),
    [categories]
  );

  if (!isTopManagement(user)) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-slate-500">Forbidden</div>
      </div>
    );
  }

  const toggle = (key, list, setList) => {
    setList(list.includes(key) ? list.filter((x) => x !== key) : [...list, key]);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (chosen.length === 0) return;
    const payload = {
      title: title.trim(),
      description,
      categories: chosen,
      audienceMode,
      audienceDepartments: audienceMode === 'departments' ? audienceDepartments : [],
      questionsPerCategory: pickStrategy === 'all' ? null : Number(questionsPerCategory),
      pickStrategy,
      openAt: new Date(openAt).toISOString(),
      closeAt: new Date(closeAt).toISOString(),
    };
    create.mutate(payload, {
      onSuccess: (r) => navigate(`/lhc/campaigns/${r.data.campaign._id}`),
    });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title="Нова кампања — Усогласеност" />
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-3xl mx-auto">
            <Link to="/lhc" className="text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 mb-3">
              <ArrowLeft size={14} /> Назад
            </Link>

            <form onSubmit={submit} className="card p-4 sm:p-6 space-y-5">
              <div>
                <label className="label">Наслов</label>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Q2 2026 Преглед на усогласеност" required />
              </div>

              <div>
                <label className="label">Опис (опционално)</label>
                <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div>
                <label className="label">Области</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {eligibleCategories.map((c) => (
                    <label key={c.key} className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer text-sm ${chosen.includes(c.key) ? 'bg-slate-100 border-slate-400' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input
                        type="checkbox"
                        checked={chosen.includes(c.key)}
                        onChange={() => toggle(c.key, chosen, setChosen)}
                        className="accent-slate-700"
                      />
                      <span aria-hidden>{c.icon}</span>
                      <span className="flex-1">{c.name}</span>
                      <span className="text-xs text-slate-500">{c.questionCount} прашања</span>
                    </label>
                  ))}
                </div>
                {categories.some((c) => c.questionCount === 0) && (
                  <p className="text-xs text-slate-400 mt-2">Областите без прашања не се покажани (во подготовка).</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Целна група</label>
                  <select className="input" value={audienceMode} onChange={(e) => setAudienceMode(e.target.value)}>
                    <option value="all">Сите вработени</option>
                    <option value="managers_only">Само менаџери</option>
                    <option value="departments">Одредени сектори</option>
                  </select>
                </div>
                <div>
                  <label className="label">Стратегија</label>
                  <select className="input" value={pickStrategy} onChange={(e) => setPickStrategy(e.target.value)}>
                    <option value="random">Случаен избор</option>
                    <option value="all">Сите прашања</option>
                  </select>
                </div>
              </div>

              {audienceMode === 'departments' && (
                <div>
                  <label className="label">Сектори</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DEPARTMENTS.map((d) => (
                      <label key={d.value} className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm cursor-pointer ${audienceDepartments.includes(d.value) ? 'bg-slate-100 border-slate-400' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <input
                          type="checkbox"
                          checked={audienceDepartments.includes(d.value)}
                          onChange={() => toggle(d.value, audienceDepartments, setAudienceDepartments)}
                          className="accent-slate-700"
                        />
                        <span>{d.value}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {pickStrategy === 'random' && (
                <div>
                  <label className="label">Прашања по област</label>
                  <input type="number" min={1} max={100} className="input sm:w-40" value={questionsPerCategory} onChange={(e) => setQuestionsPerCategory(e.target.value)} />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Отвара се на</label>
                  <input type="date" className="input" value={openAt} onChange={(e) => setOpenAt(e.target.value)} />
                </div>
                <div>
                  <label className="label">Затвора се на</label>
                  <input type="date" className="input" value={closeAt} onChange={(e) => setCloseAt(e.target.value)} />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <Link to="/lhc" className="btn-secondary">Откажи</Link>
                <button type="submit" className="btn-primary inline-flex items-center gap-1.5" disabled={create.isPending || !title.trim() || chosen.length === 0}>
                  <Save size={14} /> {create.isPending ? 'Зачувување...' : 'Зачувај драфт'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LhcCampaignNew;
