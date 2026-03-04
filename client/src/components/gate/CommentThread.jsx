import { useState } from 'react';
import { Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAddComment } from '../../hooks/useProjects.js';
import { fmtDateTime } from '../../utils/formatDate.js';

const CommentThread = ({ projectId, gateNumber, comments = [] }) => {
  const { t } = useTranslation('common');
  const [text, setText] = useState('');
  const addComment = useAddComment(projectId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addComment.mutateAsync({ gateNumber, text: text.trim() });
    setText('');
  };

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('comments.title')}</h4>

      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-xs text-gray-400">{t('comments.noComments')}</p>
        )}
        {comments.map((c, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-700">
              {c.author?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-medium text-gray-800">{c.author?.name || t('comments.unknown')}</span>
                <span className="text-xs text-gray-400">{fmtDateTime(c.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 mt-0.5">{c.text}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="input flex-1 text-sm"
          placeholder={t('comments.placeholder')}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          disabled={!text.trim() || addComment.isPending}
          className="btn-primary px-3"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};

export default CommentThread;
