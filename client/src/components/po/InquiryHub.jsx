import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search, ChevronRight, MessageSquare, Clock, Flag } from 'lucide-react';
import { usePOs } from '../../hooks/usePO.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { fmtDateShort } from '../../utils/formatDate.js';
import CreatePOModal from './CreatePOModal.jsx';

const shortId = (id) => String(id).slice(-6).toUpperCase();

// Short, pill-friendly department labels.
const SHORT_DEPT = {
  quality_assurance: 'Квалитет',
  r_and_d:           'R&D',
  nabavki:           'Набавки',
  packaging:         'Пакување',
};

const STATUS_PILL = {
  pending:               'bg-slate-100 text-slate-600',
  in_progress:           'bg-blue-50 text-blue-700',
  awaiting_sales_review: 'bg-amber-50 text-amber-700',
  needs_more:            'bg-orange-50 text-orange-700',
  sent_to_client:        'bg-indigo-50 text-indigo-700',
  client_approved:       'bg-green-50 text-green-700',
  client_rejected:       'bg-red-50 text-red-700',
};

const ANSWERER_ACTIVE = ['pending', 'in_progress', 'needs_more'];

const Chip = ({ active, onClick, children, count, accent }) => (
  <button
    onClick={onClick}
    className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
      active
        ? (accent ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white')
        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
    }`}
  >
    {children}
    {count > 0 && <span className={`text-[11px] ${active ? 'opacity-80' : (accent ? 'text-amber-600 font-bold' : 'opacity-60')}`}>{count}</span>}
  </button>
);

export default function InquiryHub() {
  const { t } = useTranslation('po');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: pos = [], isLoading } = usePOs();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const myDept = user?.department;
  const isSalesSide = myDept === 'sales' || myDept === 'top_management';

  const targetsMe = (q) =>
    q.targetDepartment === myDept ||
    (q.targetDepartment === 'packaging' && myDept === 'r_and_d');

  // A question that requires the current user's action right now.
  const needsMe = (q) => {
    if (q.status === 'client_approved') return false;
    if (isSalesSide) return q.status === 'awaiting_sales_review';
    return targetsMe(q) && ANSWERER_ACTIVE.includes(q.status);
  };

  const enriched = useMemo(() => pos.map((po) => {
    const questions = po.questions || [];
    return {
      ...po,
      _myCount:   questions.filter(needsMe).length,
      _openCount: questions.filter((q) => !q.resolved && q.status !== 'client_approved').length,
      _hasReview: questions.some((q) => q.status === 'awaiting_sales_review'),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [pos, myDept, isSalesSide]);

  const counts = useMemo(() => ({
    all:      enriched.length,
    needs_me: enriched.filter((p) => p._myCount > 0).length,
    open:     enriched.filter((p) => p.status === 'open').length,
    review:   enriched.filter((p) => p._hasReview).length,
    closed:   enriched.filter((p) => p.status !== 'open').length,
  }), [enriched]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = q ? enriched.filter((p) => p.clientName?.toLowerCase().includes(q)) : enriched;
    if (filter === 'needs_me') list = list.filter((p) => p._myCount > 0);
    else if (filter === 'open')   list = list.filter((p) => p.status === 'open');
    else if (filter === 'review') list = list.filter((p) => p._hasReview);
    else if (filter === 'closed') list = list.filter((p) => p.status !== 'open');
    return [...list].sort((a, b) => {
      if ((b._myCount > 0) !== (a._myCount > 0)) return a._myCount > 0 ? -1 : 1;
      if ((a.status === 'open') !== (b.status === 'open')) return a.status === 'open' ? -1 : 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [enriched, search, filter]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const chips = [
    { key: 'all',      label: t('hub.filterAll'),      count: counts.all },
    { key: 'needs_me', label: t('hub.filterNeedsMe'),  count: counts.needs_me, accent: true },
    { key: 'open',     label: t('hub.filterOpen'),     count: counts.open },
    ...(isSalesSide ? [{ key: 'review', label: t('hub.filterReview'), count: counts.review }] : []),
    { key: 'closed',   label: t('hub.filterClosed'),   count: counts.closed },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-1.5 gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{t('title')}</h2>
          <p className="text-xs text-gray-400 mt-0.5 max-w-xl">{t('hub.intro')}</p>
        </div>
        {isSalesSide && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> {t('newPO')}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative my-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {chips.map((c) => (
          <Chip key={c.key} active={filter === c.key} accent={c.accent} count={c.count}
            onClick={() => setFilter(c.key)}>
            {c.label}
          </Chip>
        ))}
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="text-center py-20 text-gray-300">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">{pos.length === 0 ? t('noPOs') : t('hub.noMatch')}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visible.map((po) => (
            <InquiryCard key={po._id} po={po} t={t} needsMe={needsMe} navigate={navigate} />
          ))}
        </div>
      )}

      {showModal && <CreatePOModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

const InquiryCard = ({ po, t, needsMe, navigate }) => {
  const isClosed = po.status !== 'open';
  const questions = po.questions || [];
  const earliestDeadline = questions
    .filter((q) => q.deadline && needsMe(q))
    .map((q) => new Date(q.deadline))
    .sort((a, b) => a - b)[0];

  return (
    <button
      onClick={() => navigate(`/po/${po._id}`)}
      className={`w-full text-left rounded-xl px-4 sm:px-5 py-3.5 transition-shadow flex flex-col gap-2 ${
        isClosed
          ? 'bg-gray-50/60 border border-gray-200 hover:bg-gray-50 opacity-90'
          : po._myCount > 0
            ? 'bg-white border border-amber-200 ring-1 ring-amber-100 hover:shadow-md border-l-[3px] border-l-amber-500'
            : 'bg-white border border-gray-200 hover:shadow-md border-l-[3px] border-l-blue-400'
      }`}
    >
      {/* Top row */}
      <div className="flex items-center gap-3">
        <span className={`text-xs font-mono font-bold px-2 py-1 rounded-lg flex-shrink-0 ${
          isClosed ? 'text-gray-500 bg-gray-100' : 'text-blue-600 bg-blue-50'
        }`}>
          {po.stage === 'pre_order' ? 'INQ' : 'PO'}-{shortId(po._id)}
        </span>
        <span className={`text-sm font-semibold truncate flex-1 ${isClosed ? 'text-gray-600' : 'text-gray-900'}`}>
          {po.clientName}
        </span>
        {po._myCount > 0 && (
          <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex-shrink-0">
            {t('hub.needsYouCount', { count: po._myCount })}
          </span>
        )}
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
          isClosed ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-700'
        }`}>
          {t(`status.${po.status}`)}
        </span>
        <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap -mt-0.5">
        <span>{t(`phase.${po.currentPhase}`)}</span>
        {po.products?.length > 0 && <span>· {t('productCount', { count: po.products.length })}</span>}
        <span>· {fmtDateShort(po.createdAt)}</span>
        {earliestDeadline && (
          <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
            <Clock size={11} /> {fmtDateShort(earliestDeadline)}
          </span>
        )}
      </div>

      {/* Question pills */}
      {questions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {questions.map((q) => {
            const mine = needsMe(q);
            const label = mine ? t('hub.needsYou') : t(`qstatus.${q.status}`);
            return (
              <span
                key={q._id}
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md ${
                  mine ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200 font-medium' : (STATUS_PILL[q.status] || 'bg-gray-100 text-gray-600')
                }`}
              >
                <span className="font-medium">{SHORT_DEPT[q.targetDepartment] || q.targetDepartment}</span>
                <span className="opacity-40">·</span>
                <span>{label}</span>
                {q.priority === 'high' && <Flag size={9} className="text-red-500" />}
              </span>
            );
          })}
        </div>
      ) : (
        <span className="text-xs text-gray-300 italic">{t('hub.noQuestions')}</span>
      )}
    </button>
  );
};
