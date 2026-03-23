import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar, { DEPARTMENTS } from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { canManage, isTopManagement } from '../utils/userTier.js';
import {
  useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement,
  useMarkAnnouncementRead, useTogglePin,
} from '../hooks/useAnnouncements.js';
import { Pin, Trash2, Eye, ChevronDown } from 'lucide-react';

const PRIORITY_STYLES = {
  info:      { badge: 'bg-blue-100 text-blue-700',   border: 'border-l-blue-400' },
  important: { badge: 'bg-amber-100 text-amber-700', border: 'border-l-amber-400' },
  urgent:    { badge: 'bg-red-100 text-red-700',     border: 'border-l-red-500' },
};

const Announcements = () => {
  const { t } = useTranslation('announcements');
  const { t: tc } = useTranslation('common');
  const { user } = useAuth();
  const { data: announcements, isLoading } = useAnnouncements();
  const createMut = useCreateAnnouncement();
  const deleteMut = useDeleteAnnouncement();
  const markReadMut = useMarkAnnouncementRead();
  const togglePinMut = useTogglePin();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('info');
  const [pinned, setPinned] = useState(false);
  const [selectedDepts, setSelectedDepts] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    createMut.mutate(
      { title, content, priority, pinned, departments: selectedDepts },
      {
        onSuccess: () => {
          setShowForm(false);
          setTitle(''); setContent(''); setPriority('info'); setPinned(false); setSelectedDepts([]);
        },
      }
    );
  };

  const isRead = (a) => a.readBy?.includes(user?._id);

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={t('title')} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            {canManage(user) && !showForm && (
              <button onClick={() => setShowForm(true)} className="btn-primary mb-6">
                + {t('create')}
              </button>
            )}

            {showForm && (
              <form onSubmit={handleSubmit} className="card p-5 mb-8 space-y-4">
                <div>
                  <label className="label">{t('titleLabel')}</label>
                  <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('titlePlaceholder')} required />
                </div>
                <div>
                  <label className="label">{t('contentLabel')}</label>
                  <textarea className="input min-h-[120px]" value={content} onChange={(e) => setContent(e.target.value)} placeholder={t('contentPlaceholder')} required />
                </div>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="label">{t('priorityLabel')}</label>
                    <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                      <option value="info">{t('priority.info')}</option>
                      <option value="important">{t('priority.important')}</option>
                      <option value="urgent">{t('priority.urgent')}</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer pb-2">
                      <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      {t('pinned')}
                    </label>
                  </div>
                </div>
                <div>
                  <label className="label">{t('departments')}</label>
                  <p className="text-xs text-gray-400 mb-2">{t('departmentsHint')}</p>
                  <div className="flex flex-wrap gap-2">
                    {DEPARTMENTS.filter((d) => d.value !== 'top_management').map((d) => (
                      <label key={d.value} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedDepts.includes(d.value)}
                          onChange={(e) =>
                            setSelectedDepts((prev) => e.target.checked ? [...prev, d.value] : prev.filter((v) => v !== d.value))
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        {tc(`dept.${d.value}`)}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={createMut.isPending} className="btn-primary">{tc('create')}</button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{tc('cancel')}</button>
                </div>
              </form>
            )}

            {isLoading ? (
              <p className="text-gray-400 text-sm">{tc('loading')}</p>
            ) : !announcements?.length ? (
              <div className="text-center py-20 text-gray-400 text-sm">{t('noAnnouncements')}</div>
            ) : (
              <div className="space-y-3">
                {announcements.map((a) => {
                  const ps = PRIORITY_STYLES[a.priority] || PRIORITY_STYLES.info;
                  const read = isRead(a);
                  return (
                    <div key={a._id} className={`card p-4 border-l-4 ${ps.border} ${read ? 'opacity-70' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {a.pinned && <Pin size={14} className="text-amber-500 shrink-0" />}
                            <h3 className="font-semibold text-gray-800">{a.title}</h3>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ps.badge}`}>
                              {t(`priority.${a.priority}`)}
                            </span>
                            {read && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-100 text-green-600">
                                {t('read')}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{a.content}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            <span>{a.createdBy?.name}</span>
                            <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                            {a.departments?.length > 0 && (
                              <span>{a.departments.map((d) => tc(`dept.${d}`)).join(', ')}</span>
                            )}
                            {isTopManagement(user) && (
                              <span>{t('readBy')}: {a.readBy?.length || 0}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!read && (
                            <button
                              onClick={() => markReadMut.mutate(a._id)}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-green-600"
                              title={t('markRead')}
                            >
                              <Eye size={15} />
                            </button>
                          )}
                          {canManage(user) && (
                            <button
                              onClick={() => togglePinMut.mutate(a._id)}
                              className={`p-1.5 rounded hover:bg-gray-100 ${a.pinned ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'}`}
                              title={a.pinned ? t('unpin') : t('pin')}
                            >
                              <Pin size={15} />
                            </button>
                          )}
                          {canManage(user) && (
                            <button
                              onClick={() => { if (confirm(t('confirmDelete'))) deleteMut.mutate(a._id); }}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Announcements;
