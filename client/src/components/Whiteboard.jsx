import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone, Trash2, Loader2, Send } from 'lucide-react';
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from '../hooks/useAnnouncements.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isTopManagement } from '../utils/userTier.js';
import { fmtDateTime } from '../utils/formatDate.js';

const Whiteboard = () => {
  const { t } = useTranslation('dashboard');
  const { user } = useAuth();
  const isTopMgmt = isTopManagement(user);

  const { data: announcements = [], isLoading } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const [text, setText] = useState('');

  const handlePost = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await createAnnouncement.mutateAsync(text.trim());
    setText('');
  };

  return (
    <div className="card p-4 h-full flex flex-col min-h-0">

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Megaphone size={16} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{t('bulletin')}</h3>
          <p className="text-xs text-gray-400">{t('whiteboard.subtitle')}</p>
        </div>
      </div>

      {/* Compose — top management only */}
      {isTopMgmt && (
        <form onSubmit={handlePost} className="mb-3 shrink-0">
          <div className="border border-gray-200 rounded-xl p-3">
            <textarea
              className="w-full text-sm text-gray-800 placeholder-gray-400 resize-none outline-none"
              rows={2}
              placeholder={t('whiteboard.placeholder')}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex justify-end pt-2 border-t border-gray-100 mt-2">
              <button
                type="submit"
                disabled={!text.trim() || createAnnouncement.isPending}
                className="btn-primary flex items-center gap-2"
              >
                {createAnnouncement.isPending
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Send size={14} />}
                {t('whiteboard.post')}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Announcements list — scrolls within the panel */}
      <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1 space-y-3">
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {!isLoading && announcements.length === 0 && (
          <div className="text-center py-16 text-gray-300">
            <Megaphone size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">{t('whiteboard.noAnnouncements')}</p>
          </div>
        )}

        {announcements.map((a) => (
          <div key={a._id} className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold flex-shrink-0">
                  {a.createdBy?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{a.createdBy?.name}</p>
                  <p className="text-xs text-gray-400">{fmtDateTime(a.createdAt)}</p>
                </div>
              </div>
              {isTopMgmt && (
                <button
                  onClick={() => deleteAnnouncement.mutate(a._id)}
                  disabled={deleteAnnouncement.isPending}
                  className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                  title={t('whiteboard.deleteTitle')}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <p className="mt-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{a.content}</p>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Whiteboard;
