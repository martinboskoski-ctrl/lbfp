import { useState } from 'react';
import { FileText } from 'lucide-react';
import ArtworkPreview from './ArtworkPreview.jsx';
import { usePackagingFile } from '../../hooks/usePackaging.js';

const Thumb = ({ checkId, file, active, onClick }) => {
  const { data: url } = usePackagingFile(checkId, file.fileId);
  const isImage = file.mimeType.startsWith('image/');
  return (
    <button
      type="button"
      onClick={onClick}
      title={file.filename}
      className={`w-16 h-16 shrink-0 rounded-lg border-2 overflow-hidden bg-slate-100 flex items-center justify-center ${
        active ? 'border-blue-500' : 'border-transparent hover:border-slate-300'
      }`}
    >
      {isImage && url ? <img src={url} alt="" className="w-full h-full object-cover" /> : <FileText size={20} className="text-slate-500" />}
    </button>
  );
};

// All files of a round: the selected one large, the rest as thumbnails.
const AttachmentsGallery = ({ checkId, files }) => {
  const [index, setIndex] = useState(0);
  const selected = files[Math.min(index, files.length - 1)];
  return (
    <div>
      <ArtworkPreview key={selected.fileId} checkId={checkId} file={selected} />
      {files.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {files.map((f, i) => (
            <Thumb key={f.fileId} checkId={checkId} file={f} active={f.fileId === selected.fileId} onClick={() => setIndex(i)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AttachmentsGallery;
