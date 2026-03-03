import { useState } from 'react';
import { X, Phone, Mail, MapPin, Calendar, User, MessageSquare, PhoneCall, Video, MoreHorizontal } from 'lucide-react';
import { useAddActivity } from '../../hooks/useLeads.js';
import { STAGES, SOURCES, PRIORITIES } from './AddLeadModal.jsx';

const STAGE_LABEL = Object.fromEntries(STAGES.map((s) => [s.value, s.label]));
const SOURCE_LABEL = Object.fromEntries(SOURCES.map((s) => [s.value, s.label]));
const PRIORITY_LABEL = Object.fromEntries(PRIORITIES.map((p) => [p.value, p.label]));

const ACTIVITY_TYPES = [
  { value: 'note',    label: 'Белешка',  icon: MessageSquare },
  { value: 'call',    label: 'Повик',    icon: PhoneCall },
  { value: 'email',   label: 'Е-пошта',  icon: Mail },
  { value: 'meeting', label: 'Состанок', icon: Video },
  { value: 'other',   label: 'Друго',    icon: MoreHorizontal },
];

const ACTIVITY_TYPE_LABEL = Object.fromEntries(ACTIVITY_TYPES.map((t) => [t.value, t.label]));

const STAGE_COLOR = {
  new:         'bg-blue-100 text-blue-700',
  contacted:   'bg-sky-100 text-sky-700',
  qualified:   'bg-indigo-100 text-indigo-700',
  proposal:    'bg-violet-100 text-violet-700',
  negotiation: 'bg-amber-100 text-amber-700',
  won:         'bg-green-100 text-green-700',
  lost:        'bg-red-100 text-red-700',
};

const PRIORITY_COLOR = {
  low:    'bg-gray-100 text-gray-600',
  medium: 'bg-amber-100 text-amber-700',
  high:   'bg-red-100 text-red-700',
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('mk-MK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleDateString('mk-MK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function LeadDetailModal({ lead, onClose }) {
  const addActivity = useAddActivity();
  const [actType, setActType] = useState('note');
  const [actText, setActText] = useState('');

  const handleAddActivity = async () => {
    if (!actText.trim()) return;
    await addActivity.mutateAsync({ id: lead._id, data: { type: actType, text: actText.trim() } });
    setActText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">{lead.companyName}</h2>
            <p className="text-sm text-gray-500">{lead.contactName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLOR[lead.stage]}`}>
              {STAGE_LABEL[lead.stage]}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLOR[lead.priority]}`}>
              {PRIORITY_LABEL[lead.priority]}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {SOURCE_LABEL[lead.source]}
            </span>
          </div>

          {/* Contact info */}
          <div className="space-y-2 text-sm">
            {lead.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={14} className="text-gray-400" />
                <a href={`mailto:${lead.email}`} className="hover:text-blue-600">{lead.email}</a>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={14} className="text-gray-400" />
                <a href={`tel:${lead.phone}`} className="hover:text-blue-600">{lead.phone}</a>
              </div>
            )}
            {lead.assignedTo && (
              <div className="flex items-center gap-2 text-gray-600">
                <User size={14} className="text-gray-400" />
                <span>Задолжен: {lead.assignedTo.name || '—'}</span>
              </div>
            )}
            {lead.nextFollowUp && (
              <div className={`flex items-center gap-2 ${lead.isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                <Calendar size={14} className={lead.isOverdue ? 'text-red-500' : 'text-gray-400'} />
                <span>Следен контакт: {fmtDate(lead.nextFollowUp)}{lead.isOverdue ? ' (задоцнет!)' : ''}</span>
              </div>
            )}
          </div>

          {/* Value */}
          {lead.estimatedValue && (
            <div className="card p-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Проценета вредност</span>
              <span className="font-semibold text-gray-900">
                {Number(lead.estimatedValue).toLocaleString('mk-MK')} {lead.currency}
              </span>
            </div>
          )}

          {/* Product interest */}
          {lead.productInterest && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Интерес за производи</p>
              <p className="text-sm text-gray-700 leading-relaxed">{lead.productInterest}</p>
            </div>
          )}

          {/* Lost reason */}
          {lead.stage === 'lost' && lead.lostReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <p className="text-xs font-medium text-red-600 mb-0.5">Причина за губење</p>
              <p className="text-sm text-red-700">{lead.lostReason}</p>
            </div>
          )}

          {/* Won/Lost dates */}
          {lead.wonDate && (
            <p className="text-xs text-green-600">Добиен на: {fmtDate(lead.wonDate)}</p>
          )}
          {lead.lostDate && (
            <p className="text-xs text-red-600">Изгубен на: {fmtDate(lead.lostDate)}</p>
          )}

          {/* Activity log */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Активности</h3>

            {/* Add activity form */}
            <div className="space-y-2 mb-4">
              <div className="flex gap-2">
                <select className="input w-32 text-sm" value={actType} onChange={(e) => setActType(e.target.value)}>
                  {ACTIVITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <input
                  className="input flex-1 text-sm"
                  placeholder="Додај активност…"
                  value={actText}
                  onChange={(e) => setActText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddActivity()}
                />
                <button
                  onClick={handleAddActivity}
                  disabled={!actText.trim() || addActivity.isPending}
                  className="btn-primary text-sm px-4"
                >
                  Додај
                </button>
              </div>
            </div>

            {/* Activity list */}
            {lead.activities?.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">Нема евидентирани активности.</p>
            )}
            <div className="space-y-2">
              {[...(lead.activities || [])].reverse().map((a) => (
                <div key={a._id} className="card p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium">
                      {ACTIVITY_TYPE_LABEL[a.type] || a.type}
                    </span>
                    <span className="text-xs text-gray-400">{fmtDateTime(a.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700">{a.text}</p>
                  <p className="text-xs text-gray-400">{a.createdBy?.name || '—'}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Затвори</button>
        </div>
      </div>
    </div>
  );
}
