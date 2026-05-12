import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, FileText, ChevronRight, Search, ArrowDownAZ, CalendarDays } from 'lucide-react';
import { usePOs } from '../../hooks/usePO.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { fmtDateShort } from '../../utils/formatDate.js';
import CreatePOModal from './CreatePOModal.jsx';

const shortId = (id) => String(id).slice(-6).toUpperCase();

const SORTS = [
  { value: 'date_desc',   key: 'sort.dateDesc',   icon: CalendarDays },
  { value: 'date_asc',    key: 'sort.dateAsc',    icon: CalendarDays },
  { value: 'client_asc',  key: 'sort.clientAsc',  icon: ArrowDownAZ },
  { value: 'client_desc', key: 'sort.clientDesc', icon: ArrowDownAZ },
];

const sortPOs = (list, mode) => {
  const arr = [...list];
  switch (mode) {
    case 'date_asc':    return arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    case 'client_asc':  return arr.sort((a, b) => (a.clientName || '').localeCompare(b.clientName || ''));
    case 'client_desc': return arr.sort((a, b) => (b.clientName || '').localeCompare(a.clientName || ''));
    case 'date_desc':
    default:            return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};

// ── Single row ───────────────────────────────────────────────────────────────
const InquiryRow = ({ po, isClosed, t, navigate }) => {
  const openQ = po.questions?.filter((q) => !q.resolved && q.status !== 'client_approved').length ?? 0;

  return (
    <button
      onClick={() => navigate(`/po/${po._id}`)}
      className={
        isClosed
          ? 'w-full text-left bg-gray-50/60 border border-gray-200 rounded-xl px-5 py-3 hover:bg-gray-50 transition-colors flex items-center gap-4 opacity-80'
          : 'w-full text-left bg-white border border-gray-200 rounded-xl px-5 py-4 hover:shadow-md transition-shadow flex items-center gap-4 ring-1 ring-blue-100/60 shadow-sm border-l-[3px] border-l-blue-500'
      }
    >
      <span className={`text-xs font-mono font-bold px-2 py-1 rounded-lg flex-shrink-0 ${
        isClosed ? 'text-gray-500 bg-gray-100' : 'text-blue-600 bg-blue-50'
      }`}>
        {po.stage === 'pre_order' ? 'INQ' : 'PO'}-{shortId(po._id)}
      </span>

      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isClosed ? 'font-medium text-gray-600' : 'font-semibold text-gray-900'}`}>
          {po.clientName}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {fmtDateShort(po.createdAt)}
          {po.dateExpected && ` · ${t('expected', { date: fmtDateShort(po.dateExpected) })}`}
          {po.moq != null && ` · ${t('moqShort', { value: po.moq })}`}
          {po.products?.length > 0 && ` · ${t('productCount', { count: po.products.length })}`}
        </p>
      </div>

      {openQ > 0 && !isClosed && (
        <span className="text-xs font-medium bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full flex-shrink-0">
          {t('openQuestions', { count: openQ })}
        </span>
      )}

      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
        isClosed ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-700'
      }`}>
        {t(`status.${po.status}`)}
      </span>

      <ChevronRight size={16} className={isClosed ? 'text-gray-300' : 'text-gray-400'} />
    </button>
  );
};

const POList = () => {
  const { t } = useTranslation('po');
  const { user } = useAuth();
  const { data: pos = [], isLoading } = usePOs();
  const [showModal, setShowModal] = useState(false);
  const [search,    setSearch]    = useState('');
  const [sort,      setSort]      = useState('date_desc');
  const navigate = useNavigate();

  const isSales = user?.department === 'sales' || user?.department === 'top_management';

  const { active, closed } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? pos.filter((p) => p.clientName?.toLowerCase().includes(q))
      : pos;
    const sorted = sortPOs(filtered, sort);
    return {
      active: sorted.filter((p) => p.status === 'open'),
      closed: sorted.filter((p) => p.status !== 'open'),
    };
  }, [pos, search, sort]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Title row */}
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{t('title')}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t('totalCount', { count: pos.length })}</p>
        </div>
        {isSales && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} />
            {t('newPO')}
          </button>
        )}
      </div>

      {/* Toolbar — search + sort */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input max-w-[200px]"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{t(s.key)}</option>
          ))}
        </select>
      </div>

      {pos.length === 0 ? (
        <div className="text-center py-20 text-gray-300">
          <FileText size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">{t('noPOs')}</p>
        </div>
      ) : (
        <>
          {/* Active */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                {t('section.active')}
              </span>
              <span className="text-[11px] text-gray-400">{active.length}</span>
              <span className="h-px flex-1 bg-blue-100" />
            </div>
            {active.length === 0 ? (
              <p className="text-xs text-gray-400 italic px-1">{t('noActive')}</p>
            ) : (
              <div className="space-y-2">
                {active.map((po) => (
                  <InquiryRow key={po._id} po={po} isClosed={false} t={t} navigate={navigate} />
                ))}
              </div>
            )}
          </div>

          {/* Closed */}
          {closed.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {t('section.finished')}
                </span>
                <span className="text-[11px] text-gray-400">{closed.length}</span>
                <span className="h-px flex-1 bg-gray-100" />
              </div>
              <div className="space-y-2">
                {closed.map((po) => (
                  <InquiryRow key={po._id} po={po} isClosed={true} t={t} navigate={navigate} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showModal && <CreatePOModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default POList;
