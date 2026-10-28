import { useTranslation } from 'react-i18next';
import { ExternalLink, FileText } from 'lucide-react';
import { usePackagingFile } from '../../hooks/usePackaging.js';

// Shows an image or PDF stored with the check (fetched with auth as a blob URL).
const ArtworkPreview = ({ checkId, file, tall = true }) => {
  const { t } = useTranslation('packaging');
  const { data: url, isLoading } = usePackagingFile(checkId, file?.fileId);

  if (isLoading || !url) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-slate-100 ${tall ? 'h-[480px]' : 'h-40'}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
      </div>
    );
  }

  const isPdf = file.mimeType === 'application/pdf';
  return (
    <div>
      {isPdf ? (
        <iframe src={url} title={file.filename} className={`w-full rounded-xl border border-slate-200 bg-white ${tall ? 'h-[480px]' : 'h-40'}`} />
      ) : (
        <a href={url} target="_blank" rel="noreferrer" className="block rounded-xl border border-slate-200 bg-[repeating-conic-gradient(#f1f5f9_0_25%,#fff_0_50%)] bg-[length:16px_16px]">
          <img src={url} alt={file.filename} className={`w-full object-contain ${tall ? 'max-h-[480px]' : 'max-h-40'}`} />
        </a>
      )}
      <div className="flex items-center justify-between gap-2 mt-1.5 text-xs text-slate-400">
        <span className="flex items-center gap-1 truncate"><FileText size={12} /> {file.filename}</span>
        <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-slate-700 shrink-0">
          <ExternalLink size={12} /> {t('detail.openFull')}
        </a>
      </div>
    </div>
  );
};

export default ArtworkPreview;
