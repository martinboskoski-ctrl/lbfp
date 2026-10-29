import { useEffect, useMemo, useRef, useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_BYTES = 15 * 1024 * 1024;

const fmtSize = (bytes) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;

const Thumb = ({ file, onRemove }) => {
  const url = useMemo(() => (file.type.startsWith('image/') ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return (
    <div className="relative group rounded-lg border border-slate-200 bg-white p-1.5">
      {url ? (
        <img src={url} alt="" className="w-full h-20 rounded object-cover bg-slate-100" />
      ) : (
        <div className="w-full h-20 rounded bg-slate-100 flex items-center justify-center text-slate-500"><FileText size={22} /></div>
      )}
      <p className="text-[11px] text-slate-700 truncate mt-1" title={file.name}>{file.name}</p>
      <p className="text-[10px] text-slate-400">{fmtSize(file.size)}</p>
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border border-slate-300 text-slate-500 hover:text-red-600 hover:border-red-300 flex items-center justify-center shadow-sm"
      >
        <X size={12} />
      </button>
    </div>
  );
};

// Drag & drop (or pick) several files; `max` caps the count.
const MultiFileDrop = ({ files, onChange, accept, hint, max = 10 }) => {
  const { t } = useTranslation('packaging');
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const acceptList = accept.split(',').map((a) => a.trim());
  const isAccepted = (f) => acceptList.includes(f.type);

  const add = (list) => {
    const incoming = Array.from(list || []);
    const rejected = incoming.filter((f) => !isAccepted(f) || f.size > MAX_BYTES);
    const ok = incoming.filter((f) => isAccepted(f) && f.size <= MAX_BYTES);
    const next = [...files, ...ok].slice(0, max);
    setError(rejected.length || files.length + ok.length > max ? t('form.filesRejected', { max }) : '');
    onChange(next);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); add(e.dataTransfer.files); }}
        className={`w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition-colors ${
          files.length ? 'py-4' : 'py-8'
        } px-4 ${dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-slate-400'}`}
      >
        <UploadCloud size={files.length ? 20 : 26} className={dragging ? 'text-blue-500' : 'text-slate-400'} />
        <span className="text-xs text-slate-500">{hint}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => { add(e.target.files); e.target.value = ''; }}
      />
      {error && <p className="text-amber-600 text-xs mt-1">{error}</p>}
      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
          {files.map((f, i) => (
            <Thumb key={`${f.name}-${f.size}-${i}`} file={f} onRemove={() => onChange(files.filter((_, j) => j !== i))} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiFileDrop;
