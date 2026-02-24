import { Download, File } from 'lucide-react';
import { useDownloadUrl } from '../../hooks/useProjects.js';
import toast from 'react-hot-toast';

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const FileVersionList = ({ files = [] }) => {
  const downloadUrl = useDownloadUrl();

  const handleDownload = async (fileId, originalName) => {
    try {
      const url = await downloadUrl.mutateAsync(fileId);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName;
      a.click();
    } catch {
      toast.error('Не успеа да се добие линкот за преземање');
    }
  };

  if (files.length === 0) {
    return (
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Датотеки</h2>
        <p className="text-sm text-gray-400">Сè уште нема прикачени датотеки.</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Датотеки</h2>
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file._id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              file.isLatest ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-white'
            }`}
          >
            <File size={18} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {file.originalName}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    file.isLatest ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {file.versionLabel}
                </span>
                {file.isLatest && (
                  <span className="text-xs text-blue-600 font-medium">Најнова</span>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                Порта {file.gateNumber} · {file.uploader?.name} ·{' '}
                {new Date(file.uploadedAt).toLocaleDateString('mk-MK')}
                {file.size ? ` · ${formatSize(file.size)}` : ''}
              </div>
            </div>
            <button
              onClick={() => handleDownload(file._id, file.originalName)}
              className="btn-secondary p-1.5"
              title="Преземи"
            >
              <Download size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileVersionList;
