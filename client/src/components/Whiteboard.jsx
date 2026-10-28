import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone, Trash2, Pin, Eye, X, Plus, Pencil, Save } from 'lucide-react';
import {
  useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement,
  useMarkAnnouncementRead, useTogglePin, useEditAnnouncement,
} from '../hooks/useAnnouncements.js';
import { useAuth } from '../context/AuthContext.jsx';
import { canManage, isTopManagement } from '../utils/userTier.js';
import { DEPARTMENTS } from './layout/Sidebar.jsx';
import { fmtDate } from '../utils/formatDate.js';
import EditHistory from './common/EditHistory.jsx';

const PRIORITY_STYLES = {
  info:      { badge: 'bg-blue-100 text-blue-700',   border: 'border-l-blue-400' },
  important: { badge: 'bg-amber-100 text-amber-700', border: 'border-l-amber-400' },
  urgent:    { badge: 'bg-red-100 text-red-700',     border: 'border-l-red-500' },
};

const EMPTY_FORM = { title: '', content: '', priority: 'info', pinned: false, departments: [] };

const Whiteboard = () => {
  const { t } = useTranslation('dashboard');
  const { t: ta } = useTranslation('announcements');
  const { t: tc } = useTranslation('common');
  const { user } = useAuth();
  const canPost = canManage(user);
  const isTopMgmt = isTopManagement(user);

  const { data: announcements = [], isLoading } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();
  const markRead = useMarkAnnouncementRead();
  const togglePin = useTogglePin();
  const editAnnouncement = useEditAnnouncement();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [expandedId, setExpandedId] = useState(null);

  const startEdit = (a) => { setEditingId(a._id); setEditForm({ title: a.title, content: a.content }); };
  const cancelEdit = () => { setEditingId(null); setEditForm({ title: '', content: '' }); };
  const saveEdit = (id) => {
    if (!editForm.title.trim() || !editForm.content.trim()) return;
    editAnnouncement.mutate(
      { id, data: { title: editForm.title.trim(), content: editForm.content.trim() } },
      { onSuccess: cancelEdit }
    );
  };

  const closeForm = () => { setShowForm(false); setForm(EMPTY_FORM); };

  const handleSubmit = (e) => {
    e.preventDefault();
    createAnnouncement.mutate(
      { ...form, title: form.title.trim(), content: form.content.trim() },
      { onSuccess: closeForm }
    );
  };

  const toggleDept = (value, checked) =>
    setForm((f) => ({
      ...f,
      departments: checked ? [...f.departments, value] : f.departments.filter((v) => v !== value),
    }));

  const isRead = (a) => a.readBy?.includes(user?._id);

  return (
    <div className="card p-3 h-full flex flex-col min-h-0">

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Megaphone size={15} className="text-blue-600 flex-shrink-0" />
          <h3 className="text-sm font-semibold text-gray-800 truncate">{t('bulletin')}</h3>
        </div>
        {canPost && (
          <button
            onClick={() => setShowForm(true)}
            className="p-1 rounded-md text-gray-400 hover:bg-blue-50 hover:text-blue-600 shrink-0"
            title={ta('create')}
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Announcements — compact previews; click to expand. Scrolls within the panel. */}
      <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1 space-y-2">
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        )}

        {!isLoading && announcements.length === 0 && (
          <div className="text-center py-8 text-gray-300">
            <Megaphone size={24} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs">{t('whiteboard.noAnnouncements')}</p>
          </div>
        )}

        {announcements.map((a) => {
          const ps = PRIORITY_STYLES[a.priority] || PRIORITY_STYLES.info;
          const read = isRead(a);
          const isAuthor = String(a.createdBy?._id || a.createdBy) === String(user?._id);
          const editing = editingId === a._id;
          const expanded = expandedId === a._id;
          return (
            <div key={a._id} className={`border border-gray-200 border-l-4 ${ps.border} rounded-lg p-2.5 ${read ? 'opacity-70' : ''}`}>
              {editing ? (
                <div className="space-y-2">
                  <input
                    className="input text-sm"
                    value={editForm.title}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder={ta('titlePlaceholder')}
                  />
                  <textarea
                    className="input text-sm min-h-[80px]"
                    value={editForm.content}
                    onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                    placeholder={ta('contentPlaceholder')}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(a._id)} disabled={editAnnouncement.isPending} className="btn-primary flex items-center gap-1.5 text-xs py-1">
                      <Save size={13} /> {tc('save')}
                    </button>
                    <button onClick={cancelEdit} className="btn-secondary text-xs py-1">{tc('cancel')}</button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : a._id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-1.5">
                      {a.pinned && <Pin size={12} className="text-amber-500 shrink-0 mt-0.5" />}
                      <h4 className="text-sm font-semibold text-gray-800 leading-snug flex-1 min-w-0">{a.title}</h4>
                      {a.priority !== 'info' && (
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${ps.badge}`}>
                          {ta(`priority.${a.priority}`)}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs text-gray-600 leading-relaxed whitespace-pre-wrap mt-1 ${expanded ? '' : 'line-clamp-3'}`}>
                      {a.content}
                    </p>
                  </button>

                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400">
                    <span className="truncate">{a.createdBy?.name} · {fmtDate(a.createdAt)}</span>
                    <div className="ml-auto flex items-center shrink-0">
                      {isAuthor && (
                        <button onClick={() => startEdit(a)} className="p-1 rounded hover:bg-gray-100 hover:text-blue-600" title={tc('edit')}>
                          <Pencil size={12} />
                        </button>
                      )}
                      {!read && (
                        <button onClick={() => markRead.mutate(a._id)} className="p-1 rounded hover:bg-gray-100 hover:text-green-600" title={ta('markRead')}>
                          <Eye size={12} />
                        </button>
                      )}
                      {canPost && (
                        <button
                          onClick={() => togglePin.mutate(a._id)}
                          className={`p-1 rounded hover:bg-gray-100 ${a.pinned ? 'text-amber-500' : 'hover:text-amber-500'}`}
                          title={a.pinned ? ta('unpin') : ta('pin')}
                        >
                          <Pin size={12} />
                        </button>
                      )}
                      {canPost && (
                        <button
                          onClick={() => { if (confirm(ta('confirmDelete'))) deleteAnnouncement.mutate(a._id); }}
                          disabled={deleteAnnouncement.isPending}
                          className="p-1 rounded hover:bg-gray-100 hover:text-red-500"
                          title={t('whiteboard.deleteTitle')}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {expanded && (
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400 flex-wrap">
                      {a.departments?.length > 0 && (
                        <span>{a.departments.map((d) => tc(`dept.${d}`)).join(', ')}</span>
                      )}
                      {isTopMgmt && <span>{ta('readBy')}: {a.readBy?.length || 0}</span>}
                      <EditHistory history={a.editHistory} />
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeForm}>
          <div
            className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">{ta('create')}</h3>
              <button onClick={closeForm} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">{ta('titleLabel')}</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder={ta('titlePlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="label">{ta('contentLabel')}</label>
                <textarea
                  className="input min-h-[140px]"
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder={ta('contentPlaceholder')}
                  required
                />
              </div>

              <div className="flex flex-wrap items-end gap-6">
                <div>
                  <label className="label">{ta('priorityLabel')}</label>
                  <select
                    className="input"
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  >
                    <option value="info">{ta('priority.info')}</option>
                    <option value="important">{ta('priority.important')}</option>
                    <option value="urgent">{ta('priority.urgent')}</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={form.pinned}
                    onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {ta('pinned')}
                </label>
              </div>

              <div>
                <label className="label">{ta('departments')}</label>
                <p className="text-xs text-gray-400 mb-2">{ta('departmentsHint')}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {DEPARTMENTS.filter((d) => d.value !== 'top_management').map((d) => (
                    <label key={d.value} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.departments.includes(d.value)}
                        onChange={(e) => toggleDept(d.value, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {tc(`dept.${d.value}`)}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={createAnnouncement.isPending} className="btn-primary">
                  {tc('create')}
                </button>
                <button type="button" onClick={closeForm} className="btn-secondary">
                  {tc('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Whiteboard;
