import { useState, useEffect } from 'react';
import { X, Loader2, User } from 'lucide-react';
import { useCreateTask } from '../../hooks/useTasks.js';
import { useDirectory } from '../../hooks/useUsers.js';
import { useProjects } from '../../hooks/useProjects.js';
import { DEPARTMENTS } from '../layout/Sidebar.jsx';

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Ниска' },
  { value: 'medium', label: 'Средна' },
  { value: 'high',   label: 'Висока' },
  { value: 'urgent', label: 'Итна' },
];

const AddTaskModal = ({ onClose, defaultDept, isTopMgmt, isManager, currentUser }) => {
  const isEmployee = !isManager; // plain employee — can only add tasks for themselves

  const [dept, setDept]             = useState(defaultDept || '');
  const [assignedTo, setAssignedTo] = useState(isEmployee ? currentUser?._id : '');
  const [form, setForm]             = useState({ title: '', description: '', priority: 'medium', deadline: '', project: '' });
  const [errors, setErrors]         = useState({});

  const { data: deptUsers = [] } = useDirectory(isEmployee ? undefined : (dept || undefined));
  const { data: projects = [] }  = useProjects(dept || undefined);
  const createTask               = useCreateTask();

  useEffect(() => {
    if (!isEmployee) setAssignedTo('');
  }, [dept, isEmployee]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Насловот е задолжителен';
    if (!isEmployee && !assignedTo) e.assignedTo = 'Изберете лице';
    if (!isEmployee && !dept)       e.dept = 'Изберете одделение';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await createTask.mutateAsync({
      title:       form.title.trim(),
      description: form.description.trim() || undefined,
      assignedTo:  isEmployee ? currentUser._id : assignedTo,
      department:  isEmployee ? currentUser.department : dept,
      priority:    form.priority,
      deadline:    form.deadline || undefined,
      project:     form.project  || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Нова задача</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Employee: show self-assignment badge */}
          {isEmployee && (
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-700">
              <User size={14} />
              Задачата ќе биде доделена на вас
            </div>
          )}

          {/* Top management: dept selector */}
          {isTopMgmt && (
            <div>
              <label className="label">Одделение *</label>
              <select
                className={`input ${errors.dept ? 'border-red-400' : ''}`}
                value={dept}
                onChange={(e) => setDept(e.target.value)}
              >
                <option value="">Изберете одделение…</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              {errors.dept && <p className="text-red-500 text-xs mt-1">{errors.dept}</p>}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="label">Наслов *</label>
            <input
              className={`input ${errors.title ? 'border-red-400' : ''}`}
              placeholder="Опишете ја задачата…"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              autoFocus
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="label">Опис</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Дополнителни детали…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Assignee — managers only */}
          {!isEmployee && (
            <div>
              <label className="label">Задолжено лице *</label>
              {deptUsers.length === 0 ? (
                <p className="text-xs text-gray-400 mt-1">
                  {dept ? 'Нема регистрирани корисници во ова одделение.' : 'Прво изберете одделение.'}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 mt-1">
                  {deptUsers.map((u) => (
                    <button
                      key={u._id}
                      type="button"
                      onClick={() => setAssignedTo(u._id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                        assignedTo === u._id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-current opacity-20 flex-shrink-0" />
                      {u.name}
                      {u.isManager && <span className="opacity-60">★</span>}
                    </button>
                  ))}
                </div>
              )}
              {errors.assignedTo && <p className="text-red-500 text-xs mt-1">{errors.assignedTo}</p>}
            </div>
          )}

          {/* Priority + Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Приоритет</label>
              <select
                className="input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Рок</label>
              <input
                type="date"
                className="input"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
          </div>

          {/* Project (optional) */}
          {projects.length > 0 && (
            <div>
              <label className="label">Поврзан проект (опционално)</label>
              <select
                className="input"
                value={form.project}
                onChange={(e) => setForm({ ...form, project: e.target.value })}
              >
                <option value="">—</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary">
              Откажи
            </button>
            <button
              type="submit"
              disabled={createTask.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {createTask.isPending && <Loader2 size={14} className="animate-spin" />}
              Додај задача
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
