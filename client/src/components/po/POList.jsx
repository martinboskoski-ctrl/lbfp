import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, FileText, ChevronRight } from 'lucide-react';
import { usePOs } from '../../hooks/usePO.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { fmtDateShort } from '../../utils/formatDate.js';
import CreatePOModal from './CreatePOModal.jsx';

const shortId = (id) => String(id).slice(-6).toUpperCase();

const POList = () => {
  const { t } = useTranslation('po');
  const { user }          = useAuth();
  const { data: pos = [], isLoading } = usePOs();
  const [showModal, setShowModal]     = useState(false);
  const navigate = useNavigate();
  const isSales  = user?.department === 'sales' || user?.department === 'top_management';

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{t('title')}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t('totalCount', { count: pos.length })}</p>
        </div>
        {isSales && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} />
            {t('newPO')}
          </button>
        )}
      </div>

      {/* Table */}
      {pos.length === 0 ? (
        <div className="text-center py-20 text-gray-300">
          <FileText size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">{t('noPOs')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pos.map((po) => {
            const openQ = po.questions?.filter((q) => !q.resolved).length ?? 0;
            return (
              <button
                key={po._id}
                onClick={() => navigate(`/po/${po._id}`)}
                className="w-full text-left bg-white border border-gray-200 rounded-xl px-5 py-4 hover:shadow-md transition-shadow flex items-center gap-4"
              >
                {/* PO ref */}
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg flex-shrink-0">
                  PO-{shortId(po._id)}
                </span>

                {/* Client + date */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{po.clientName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t('expected', { date: fmtDateShort(po.dateExpected) })}
                    {' · '}{t('moqShort', { value: po.moq })}
                    {po.products?.length > 0 && ` · ${t('productCount', { count: po.products.length })}`}
                  </p>
                </div>

                {/* Open questions badge */}
                {openQ > 0 && (
                  <span className="text-xs font-medium bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full flex-shrink-0">
                    {t('openQuestions', { count: openQ })}
                  </span>
                )}

                {/* Status */}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                  po.status === 'open'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {t(`status.${po.status}`)}
                </span>

                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {showModal && <CreatePOModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default POList;
