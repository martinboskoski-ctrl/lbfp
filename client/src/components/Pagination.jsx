import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ page, pageCount, onChange }) => {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-3">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="btn-secondary text-sm px-2 py-1.5 disabled:opacity-40"
        aria-label="Претходна"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="text-xs text-slate-500">
        {page} / {pageCount}
      </span>
      <button
        onClick={() => onChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
        className="btn-secondary text-sm px-2 py-1.5 disabled:opacity-40"
        aria-label="Следна"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
};
