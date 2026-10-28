import { useEffect, useMemo, useRef, useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_BYTES = 15 * 1024 * 1024;

const fmtSize = (bytes) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;

// Native HTML5 drag & drop + click-to-pick. `accept` filters both paths.
const FileDrop = ({ file, onChange, accept, hint, compact = false, error }) => {
  const { t } = useTranslation('packaging');
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState('');

  const acceptList = accept.split(',').map((a) => a.trim());
  const isAccepted = (f) =>
    acceptList.some((a) => (a.endsWith('/*') ? f.type.startsWith(a.slice(0, -1)) : f.type === a));

  const pick = (f) => {
    if (!f) return;
    if (!isAccepted(f)) { setLocalError(t('toast.error')); return; }
    if (f.size > MAX_BYTES) { setLocalError('> 15 MB'); return; }
    setLocalError('');
    onChange(f);
  };

  const preview = useMemo(
    () => (file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null),
    [file]
  );
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
        {preview ? (
          <img src={preview} alt="" className="w-14 h-14 rounded-lg object-cover bg-slate-100" />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
            <FileText size={22} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
          <p className="text-xs text-slate-400">{fmtSize(file.size)}</p>
        </div>
        <button type="button" onClick={() => inputRef.current?.click()} className="text-xs font-medium text-blue-600 hover:text-blue-700">
          {t('form.replace')}
        </button>
        <button type="button" onClick={() => onChange(null)} className="p-1 rounded text-slate-400 hover:text-red-500" title={t('form.remove')}>
          <X size={16} />
        </button>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]); }}
        className={`w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition-colors ${
          compact ? 'py-4 px-3' : 'py-10 px-4'
        } ${
          dragging ? 'border-blue-400 bg-blue-50' : error || localError ? 'border-red-300 bg-red-50/40' : 'border-slate-300 bg-slate-50 hover:border-slate-400'
        }`}
      >
        <UploadCloud size={compact ? 20 : 28} className={dragging ? 'text-blue-500' : 'text-slate-400'} />
        <span className="text-xs text-slate-500">{hint}</span>
      </button>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      {(error || localError) && <p className="text-red-500 text-xs mt-1">{error || localError}</p>}
    </div>
  );
};

export default FileDrop;
