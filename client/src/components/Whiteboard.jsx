import { useState } from 'react';
import { Megaphone, Trash2, Loader2, Send } from 'lucide-react';
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from '../hooks/useAnnouncements.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isTopManagement } from '../utils/userTier.js';

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('mk-MK', { day: 'numeric', month: 'long', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('mk-MK', { hour: '2-digit', minute: '2-digit' });
};

const Whiteboard = () => {
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
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Megaphone size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Огласна табла</h2>
          <p className="text-sm text-gray-400">Соопштенија од раководството</p>
        </div>
      </div>

      {/* Compose — top management only */}
      {isTopMgmt && (
        <form onSubmit={handlePost} className="mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
            <textarea
              className="w-full text-sm text-gray-800 placeholder-gray-400 resize-none outline-none"
              rows={3}
              placeholder="Напишете соопштение за сите вработени…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex justify-end pt-3 border-t border-gray-100 mt-2">
              <button
                type="submit"
                disabled={!text.trim() || createAnnouncement.isPending}
                className="btn-primary flex items-center gap-2"
              >
                {createAnnouncement.isPending
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Send size={14} />}
                Објави
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Announcements list */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {!isLoading && announcements.length === 0 && (
        <div className="text-center py-20 text-gray-300">
          <Megaphone size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Сè уште нема соопштенија</p>
        </div>
      )}

      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a._id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold flex-shrink-0">
                  {a.createdBy?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{a.createdBy?.name}</p>
                  <p className="text-xs text-gray-400">{formatDate(a.createdAt)}</p>
                </div>
              </div>
              {isTopMgmt && (
                <button
                  onClick={() => deleteAnnouncement.mutate(a._id)}
                  disabled={deleteAnnouncement.isPending}
                  className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                  title="Избриши"
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
