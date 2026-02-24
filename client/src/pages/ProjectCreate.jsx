import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useCreateProject } from '../hooks/useProjects.js';
import { useDirectory } from '../hooks/useUsers.js';
import Sidebar, { DEPARTMENTS } from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { canManage, isTopManagement } from '../utils/userTier.js';

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Ниска',    color: 'text-gray-500' },
  { value: 'medium', label: 'Средна',   color: 'text-blue-500' },
  { value: 'high',   label: 'Висока',   color: 'text-orange-500' },
  { value: 'urgent', label: 'Итна',     color: 'text-red-600' },
];

const STEPS = [
  'Основни информации',
  'Тим и цели',
  'Задачи',
  'Вклучени одделенија',
];

// ── Small helpers ────────────────────────────────────────────────────────────

const UserChip = ({ user, selected, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(user._id)}
    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
      selected
        ? 'bg-blue-600 text-white border-blue-600'
        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
    }`}
  >
    <span className="w-4 h-4 rounded-full bg-current opacity-20 flex-shrink-0" />
    {user.name}
    {user.isManager && <span className="opacity-70">★</span>}
  </button>
);

const DeptChip = ({ dept, selected, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(dept.value)}
    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
      selected
        ? 'bg-blue-600 text-white border-blue-600'
        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
    }`}
  >
    {dept.label}
  </button>
);

// ── Main component ────────────────────────────────────────────────────────────

const ProjectCreate = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const createProject  = useCreateProject();

  const isTopMgmt  = isTopManagement(user);
  const isManager  = canManage(user);

  // For non-top-management, department is always their own
  const defaultDept = isTopMgmt ? (searchParams.get('dept') || '') : (user?.department || '');

  // Fetch team members from primary dept (and all depts if top_management)
  const { data: deptUsers = [] } = useDirectory(isTopMgmt ? undefined : user?.department);

  const [step, setStep] = useState(0);

  // ── Step 0: Basic info ──
  const [basic, setBasic] = useState({
    title: '', description: '',
    priority: 'medium', status: 'draft',
    startDate: '', endDate: '',
    budget: '',
    department: defaultDept,
  });
  const [basicErrors, setBasicErrors] = useState({});

  // ── Step 1: Team & Goals ──
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState('');
  const [assignedUsers, setAssignedUsers] = useState([]);

  // ── Step 2: Tasks ──
  const [tasks, setTasks] = useState([]);
  const [expandedTask, setExpandedTask] = useState(null);

  // ── Step 3: Involved departments ──
  const [involvedDepts, setInvolvedDepts] = useState([]);

  if (!isManager) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-sm">Немате дозвола за креирање проекти.</p>
        </div>
      </div>
    );
  }

  // ── Validation ───────────────────────────────────────────────────────────

  const validateBasic = () => {
    const errs = {};
    if (!basic.title.trim()) errs.title = 'Насловот е задолжителен';
    if (!basic.department)   errs.department = 'Одделението е задолжително';
    setBasicErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Navigation ───────────────────────────────────────────────────────────

  const goNext = () => {
    if (step === 0 && !validateBasic()) return;
    setStep((s) => s + 1);
  };
  const goBack = () => setStep((s) => s - 1);

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const payload = {
      ...basic,
      budget: basic.budget ? Number(basic.budget) : undefined,
      goals,
      assignedUsers,
      tasks: tasks.map(({ _localId, ...t }) => t),
      involvedDepartments: involvedDepts.filter((d) => d.department !== basic.department),
    };
    const result = await createProject.mutateAsync(payload);
    navigate(`/projects/${result.data.project._id}`);
  };

  // ── Goal helpers ─────────────────────────────────────────────────────────

  const addGoal = () => {
    if (!newGoal.trim()) return;
    setGoals((g) => [...g, newGoal.trim()]);
    setNewGoal('');
  };

  // ── Task helpers ─────────────────────────────────────────────────────────

  const addTask = () => {
    const t = { _localId: Date.now(), title: '', description: '', priority: 'medium', deadline: '', assignedTo: [], subtasks: [] };
    setTasks((prev) => [...prev, t]);
    setExpandedTask(t._localId);
  };

  const updateTask = (localId, field, value) => {
    setTasks((prev) => prev.map((t) => t._localId === localId ? { ...t, [field]: value } : t));
  };

  const removeTask = (localId) => setTasks((prev) => prev.filter((t) => t._localId !== localId));

  const addSubtask = (localId) => {
    setTasks((prev) => prev.map((t) =>
      t._localId === localId
        ? { ...t, subtasks: [...t.subtasks, { title: '' }] }
        : t
    ));
  };

  const updateSubtask = (localId, idx, val) => {
    setTasks((prev) => prev.map((t) =>
      t._localId === localId
        ? { ...t, subtasks: t.subtasks.map((s, i) => i === idx ? { ...s, title: val } : s) }
        : t
    ));
  };

  const removeSubtask = (localId, idx) => {
    setTasks((prev) => prev.map((t) =>
      t._localId === localId
        ? { ...t, subtasks: t.subtasks.filter((_, i) => i !== idx) }
        : t
    ));
  };

  const toggleTaskUser = (localId, userId) => {
    setTasks((prev) => prev.map((t) =>
      t._localId === localId
        ? { ...t, assignedTo: t.assignedTo.includes(userId)
            ? t.assignedTo.filter((id) => id !== userId)
            : [...t.assignedTo, userId] }
        : t
    ));
  };

  // ── Involved dept helpers ────────────────────────────────────────────────

  const addInvolvedDept = (deptVal) => {
    if (involvedDepts.find((d) => d.department === deptVal)) return;
    setInvolvedDepts((prev) => [...prev, { department: deptVal, reason: '', expected: '', deadline: '' }]);
  };

  const removeInvolvedDept = (deptVal) => {
    setInvolvedDepts((prev) => prev.filter((d) => d.department !== deptVal));
  };

  const updateInvolvedDept = (deptVal, field, value) => {
    setInvolvedDepts((prev) => prev.map((d) => d.department === deptVal ? { ...d, [field]: value } : d));
  };

  const availableDepts = DEPARTMENTS.filter((d) => d.value !== basic.department);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title="Нов проект" />

        {/* Step indicator */}
        <div className="border-b border-gray-200 bg-white px-8 py-3">
          <div className="flex items-center gap-2 max-w-2xl">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i === step ? 'bg-blue-600 text-white' : i < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>{i + 1}</div>
                <span className={`text-xs hidden sm:block ${i === step ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{label}</span>
                {i < STEPS.length - 1 && <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">{STEPS[step]}</h2>

              {/* ── STEP 0: Basic info ── */}
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="label">Наслов *</label>
                    <input
                      className="input"
                      placeholder="Наслов на проектот"
                      value={basic.title}
                      onChange={(e) => setBasic({ ...basic, title: e.target.value })}
                    />
                    {basicErrors.title && <p className="text-red-500 text-xs mt-1">{basicErrors.title}</p>}
                  </div>

                  <div>
                    <label className="label">Опис</label>
                    <textarea
                      className="input resize-none"
                      rows={3}
                      placeholder="Опишете го проектот…"
                      value={basic.description}
                      onChange={(e) => setBasic({ ...basic, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Приоритет</label>
                      <select
                        className="input"
                        value={basic.priority}
                        onChange={(e) => setBasic({ ...basic, priority: e.target.value })}
                      >
                        {PRIORITY_OPTIONS.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Статус</label>
                      <select
                        className="input"
                        value={basic.status}
                        onChange={(e) => setBasic({ ...basic, status: e.target.value })}
                      >
                        <option value="draft">Нацрт</option>
                        <option value="active">Активен</option>
                      </select>
                    </div>
                  </div>

                  {isTopMgmt ? (
                    <div>
                      <label className="label">Одделение *</label>
                      <select
                        className="input"
                        value={basic.department}
                        onChange={(e) => setBasic({ ...basic, department: e.target.value })}
                      >
                        <option value="">Изберете одделение…</option>
                        {DEPARTMENTS.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                      {basicErrors.department && <p className="text-red-500 text-xs mt-1">{basicErrors.department}</p>}
                    </div>
                  ) : (
                    <div>
                      <label className="label">Одделение</label>
                      <div className="input bg-gray-50 text-gray-500 cursor-not-allowed">
                        {DEPARTMENTS.find((d) => d.value === basic.department)?.label || basic.department}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Почеток</label>
                      <input
                        type="date"
                        className="input"
                        value={basic.startDate}
                        onChange={(e) => setBasic({ ...basic, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Рок / Крај</label>
                      <input
                        type="date"
                        className="input"
                        value={basic.endDate}
                        onChange={(e) => setBasic({ ...basic, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Буџет (МКД)</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="0"
                      min="0"
                      value={basic.budget}
                      onChange={(e) => setBasic({ ...basic, budget: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* ── STEP 1: Team & Goals ── */}
              {step === 1 && (
                <div className="space-y-6">
                  {/* Goals */}
                  <div>
                    <label className="label">Цели на проектот</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        className="input flex-1"
                        placeholder="Додај цел…"
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                      />
                      <button type="button" onClick={addGoal} className="btn-primary px-3">
                        <Plus size={16} />
                      </button>
                    </div>
                    {goals.length === 0 && (
                      <p className="text-xs text-gray-400">Сè уште нема цели.</p>
                    )}
                    <ul className="space-y-1.5">
                      {goals.map((g, i) => (
                        <li key={i} className="flex items-start gap-2 bg-blue-50 rounded-lg px-3 py-2 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                          <span className="flex-1 text-gray-800">{g}</span>
                          <button type="button" onClick={() => setGoals(goals.filter((_, j) => j !== i))}>
                            <X size={13} className="text-gray-400 hover:text-red-500" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Team */}
                  <div>
                    <label className="label">
                      Членови на тимот
                      {!isTopMgmt && (
                        <span className="ml-1 text-xs font-normal text-gray-400">
                          ({DEPARTMENTS.find((d) => d.value === user?.department)?.label})
                        </span>
                      )}
                    </label>
                    {deptUsers.length === 0 ? (
                      <p className="text-xs text-gray-400">Нема регистрирани корисници во ова одделение.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {deptUsers.map((u) => (
                          <UserChip
                            key={u._id}
                            user={u}
                            selected={assignedUsers.includes(u._id)}
                            onClick={(id) => setAssignedUsers((prev) =>
                              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                            )}
                          />
                        ))}
                      </div>
                    )}
                    {assignedUsers.length > 0 && (
                      <p className="text-xs text-blue-600 mt-1.5">{assignedUsers.length} избрани</p>
                    )}
                  </div>
                </div>
              )}

              {/* ── STEP 2: Tasks ── */}
              {step === 2 && (
                <div className="space-y-3">
                  {tasks.length === 0 && (
                    <p className="text-xs text-gray-400 pb-1">Сè уште нема задачи. Можете и да го прескокнете овој чекор.</p>
                  )}

                  {tasks.map((task) => (
                    <div key={task._localId} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Task header */}
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50">
                        <button
                          type="button"
                          className="flex-1 flex items-center gap-2 text-left"
                          onClick={() => setExpandedTask(expandedTask === task._localId ? null : task._localId)}
                        >
                          {expandedTask === task._localId ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                          <span className={`text-sm font-medium ${task.title ? 'text-gray-800' : 'text-gray-400'}`}>
                            {task.title || 'Нова задача'}
                          </span>
                          {task.subtasks.length > 0 && (
                            <span className="text-xs text-gray-400">· {task.subtasks.length} подзадачи</span>
                          )}
                        </button>
                        <button type="button" onClick={() => removeTask(task._localId)}>
                          <X size={14} className="text-gray-400 hover:text-red-500" />
                        </button>
                      </div>

                      {/* Task body */}
                      {expandedTask === task._localId && (
                        <div className="p-3 space-y-3 border-t border-gray-100">
                          <div>
                            <label className="label text-xs">Наслов *</label>
                            <input
                              className="input text-sm"
                              placeholder="Опишете ја задачата…"
                              value={task.title}
                              onChange={(e) => updateTask(task._localId, 'title', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="label text-xs">Опис</label>
                            <textarea
                              className="input resize-none text-sm"
                              rows={2}
                              value={task.description}
                              onChange={(e) => updateTask(task._localId, 'description', e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="label text-xs">Приоритет</label>
                              <select
                                className="input text-sm"
                                value={task.priority}
                                onChange={(e) => updateTask(task._localId, 'priority', e.target.value)}
                              >
                                <option value="low">Ниска</option>
                                <option value="medium">Средна</option>
                                <option value="high">Висока</option>
                              </select>
                            </div>
                            <div>
                              <label className="label text-xs">Рок</label>
                              <input
                                type="date"
                                className="input text-sm"
                                value={task.deadline}
                                onChange={(e) => updateTask(task._localId, 'deadline', e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Task assignees */}
                          {deptUsers.length > 0 && (
                            <div>
                              <label className="label text-xs">Задолжени лица</label>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {deptUsers.map((u) => (
                                  <UserChip
                                    key={u._id}
                                    user={u}
                                    selected={task.assignedTo.includes(u._id)}
                                    onClick={(id) => toggleTaskUser(task._localId, id)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Subtasks */}
                          <div>
                            <label className="label text-xs">Подзадачи</label>
                            {task.subtasks.map((sub, idx) => (
                              <div key={idx} className="flex items-center gap-2 mb-1.5">
                                <span className="w-3 h-3 rounded border border-gray-300 flex-shrink-0" />
                                <input
                                  className="input text-sm flex-1 py-1"
                                  placeholder="Подзадача…"
                                  value={sub.title}
                                  onChange={(e) => updateSubtask(task._localId, idx, e.target.value)}
                                />
                                <button type="button" onClick={() => removeSubtask(task._localId, idx)}>
                                  <X size={12} className="text-gray-400 hover:text-red-500" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addSubtask(task._localId)}
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                            >
                              <Plus size={12} /> Додај подзадача
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addTask}
                    className="w-full border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl py-3 text-sm text-gray-500 hover:text-blue-600 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus size={16} /> Додај задача
                  </button>
                </div>
              )}

              {/* ── STEP 3: Involved departments ── */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="label">Одделенија (изберете за да тагирате)</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {availableDepts.map((d) => (
                        <DeptChip
                          key={d.value}
                          dept={d}
                          selected={!!involvedDepts.find((x) => x.department === d.value)}
                          onClick={(val) => {
                            const exists = involvedDepts.find((x) => x.department === val);
                            exists ? removeInvolvedDept(val) : addInvolvedDept(val);
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {involvedDepts.map((inv) => {
                    const deptLabel = DEPARTMENTS.find((d) => d.value === inv.department)?.label;
                    return (
                      <div key={inv.department} className="border border-blue-200 bg-blue-50/40 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-blue-800">{deptLabel}</span>
                          <button type="button" onClick={() => removeInvolvedDept(inv.department)}>
                            <X size={14} className="text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                        <div>
                          <label className="label text-xs">Зошто е вклучено ова одделение?</label>
                          <textarea
                            className="input resize-none text-sm"
                            rows={2}
                            placeholder="Причина за вклучување…"
                            value={inv.reason}
                            onChange={(e) => updateInvolvedDept(inv.department, 'reason', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="label text-xs">Што се очекува од нив?</label>
                          <textarea
                            className="input resize-none text-sm"
                            rows={2}
                            placeholder="Очекувања…"
                            value={inv.expected}
                            onChange={(e) => updateInvolvedDept(inv.department, 'expected', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="label text-xs">Рок за нивниот придонес</label>
                          <input
                            type="date"
                            className="input text-sm"
                            value={inv.deadline}
                            onChange={(e) => updateInvolvedDept(inv.department, 'deadline', e.target.value)}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {involvedDepts.length === 0 && (
                    <p className="text-xs text-gray-400">Нема тагирани одделенија. Можете да го прескокнете овој чекор.</p>
                  )}
                </div>
              )}

              {/* ── Navigation buttons ── */}
              <div className="flex justify-between pt-6 border-t border-gray-100 mt-6">
                {step > 0 ? (
                  <button type="button" onClick={goBack} className="btn-secondary flex items-center gap-1">
                    <ChevronLeft size={15} /> Назад
                  </button>
                ) : (
                  <div />
                )}
                {step < STEPS.length - 1 ? (
                  <button type="button" onClick={goNext} className="btn-primary flex items-center gap-1">
                    Следно <ChevronRight size={15} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={createProject.isPending}
                    className="btn-primary"
                  >
                    {createProject.isPending ? 'Креирање…' : 'Креирај проект'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectCreate;
