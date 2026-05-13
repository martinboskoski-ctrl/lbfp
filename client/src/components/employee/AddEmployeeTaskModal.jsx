import { useState } from 'react';
import { X, Loader2, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCreateTask } from '../../hooks/useTasks.js';
import { useProjects } from '../../hooks/useProjects.js';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// Compact add-task modal scoped to a single employee.
// Assignee + department are locked — the caller passes them in.
const AddEmployeeTaskModal = ({ employee, onClose }) => {
  const { t }      = useTranslation('tasks');
  const { t: tc }  = useTranslation('common');
  const { t: te } = useTranslation('employeeTasks');

  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', deadline: '', project: '',
  });
  const [errors, setErrors] = useState({});

  const { data: projects = [] } = useProjects(employee?.department);
  const createTask = useCreateTask();

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = t('modal.titleRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await createTask.mutateAsync({
      title:       form.title.trim(),
      description: form.description.trim() || undefined,
      assignedTo:  employee._id,
      department:  employee.department,
      priority:    form.priority,
      deadline:    form.deadline || undefined,
      project:     form.project  || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{te('modalTitle')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Locked assignee chip */}
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
            <User size={14} />
            <span className="font-medium">{employee.name}</span>
            <span className="text-blue-500">·</span>
            <span className="text-blue-600">{tc(`dept.${employee.department}`, { defaultValue: employee.department })}</span>
          </div>

          <div>
            <label className="label">{t('modal.titleLabel')}</label>
            <input
              className={`input ${errors.title ? 'border-red-400' : ''}`}
              placeholder={t('modal.titlePlaceholder')}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              autoFocus
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="label">{t('modal.descriptionLabel')}</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder={t('modal.descriptionPlaceholder')}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('modal.priorityLabel')}</label>
              <select
                className="input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{tc(`priority.${p}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('modal.deadlineLabel')}</label>
              <input
                type="date"
                className="input"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
          </div>

          {projects.length > 0 && (
            <div>
              <label className="label">{t('modal.projectLabel')}</label>
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

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary">{tc('cancel')}</button>
            <button type="submit" disabled={createTask.isPending} className="btn-primary flex items-center gap-2">
              {createTask.isPending && <Loader2 size={14} className="animate-spin" />}
              {t('modal.submitButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeTaskModal;
