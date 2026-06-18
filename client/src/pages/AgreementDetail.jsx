import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Edit2, RefreshCw, Ban, Trash2, Bell,
  CheckCircle, AlertTriangle, XCircle, Clock, ShieldAlert,
  Send, Mail, Phone, MapPin, User as UserIcon, Tag,
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import {
  useAgreement,
  useAddAgreementNote,
  useTerminateAgreement,
  useDeleteAgreement,
} from '../hooks/useAgreements.js';
import { useAuth } from '../context/AuthContext.jsx';
import { canManage, isTopManagement } from '../utils/userTier.js';
import { fmtDate } from '../utils/formatDate.js';
import AddAgreementModal from '../components/agreements/AddAgreementModal.jsx';

const STATUS_META = {
  active:        { color: 'bg-emerald-50 text-emerald-800 border border-emerald-200', icon: CheckCircle    },
  expiring_soon: { color: 'bg-amber-50 text-amber-800 border border-amber-200',       icon: AlertTriangle  },
  expired:       { color: 'bg-red-50 text-red-800 border border-red-200',             icon: XCircle        },
  negotiating:   { color: 'bg-sky-50 text-sky-800 border border-sky-200',             icon: Clock          },
  for_renewal:   { color: 'bg-violet-50 text-violet-800 border border-violet-200',    icon: RefreshCw      },
  renewing:      { color: 'bg-violet-50 text-violet-800 border border-violet-200',    icon: RefreshCw      },
  terminated:    { color: 'bg-slate-100 text-slate-600',                              icon: Ban            },
  renewed:       { color: 'bg-slate-100 text-slate-700',                              icon: RefreshCw      },
  archived:      { color: 'bg-slate-100 text-slate-500',                              icon: Clock          },
  draft:         { color: 'bg-slate-100 text-slate-500',                              icon: Clock          },
};

// Activity-log action → badge color. The label is resolved via i18n at render time.
const ACTION_COLOR = {
  created:        'bg-slate-100 text-slate-700',
  updated:        'bg-slate-100 text-slate-600',
  note:           'bg-amber-50 text-amber-800 border border-amber-200',
  renewed:        'bg-slate-100 text-slate-700',
  terminated:     'bg-red-50 text-red-800 border border-red-200',
  reminder_sent:  'bg-slate-200 text-slate-800',
  file_added:     'bg-emerald-50 text-emerald-800 border border-emerald-200',
  file_removed:   'bg-red-50 text-red-700',
  status_changed: 'bg-slate-100 text-slate-600',
};

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-0.5 py-1.5">
    <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
    <span className="text-sm text-slate-900">{children ?? '—'}</span>
  </div>
);

const Section = ({ title, icon: Icon, children, action }) => (
  <div className="card p-4 sm:p-5 mb-3 sm:mb-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-slate-800 inline-flex items-center gap-2">
        {Icon && <Icon size={15} className="text-slate-400" />}
        {title}
      </h3>
      {action}
    </div>
    {children}
  </div>
);

const AgreementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation('agreements');
  const { t: tc } = useTranslation('common');
  const tcDept = (d) => tc(`dept.${d}`, d);
  const { data: a, isLoading, error } = useAgreement(id);
  const addNote = useAddAgreementNote();
  const terminate = useTerminateAgreement();
  const remove = useDeleteAgreement();

  const [modal, setModal] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [confirmTerminate, setConfirmTerminate] = useState(false);
  const [termReason, setTermReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
        </div>
      </div>
    );
  }

  if (error || !a) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar title={t('detail.errorTitle')} />
          <main className="flex-1 p-6">
            <div className="card p-6 max-w-xl mx-auto text-center">
              <p className="text-red-600 mb-3">{t('detail.notFound')}</p>
              <Link to="/agreements" className="btn-secondary inline-flex items-center gap-1">
                <ArrowLeft size={14} /> {t('detail.backToAll')}
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const status = a.effectiveStatus || a.status;
  const sMeta = STATUS_META[status] || STATUS_META.draft;
  const StatusIcon = sMeta.icon;
  const userCanManage = canManage(user) && (isTopManagement(user) || a.department === user.department);
  const isTerminatable = !['terminated', 'renewed', 'expired'].includes(status);

  const submitNote = (e) => {
    e.preventDefault();
    const text = noteText.trim();
    if (!text) return;
    addNote.mutate({ id: a._id, text }, { onSuccess: () => setNoteText('') });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={t('detail.topbarTitle')} />
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <Link to="/agreements" className="text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 mb-3">
              <ArrowLeft size={14} /> {t('detail.allAgreements')}
            </Link>

            {/* Header */}
            <div className="card p-4 sm:p-5 mb-4 sm:mb-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2.5 sm:p-3 rounded bg-slate-100 flex-shrink-0">
                  <FileText size={18} className="text-slate-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.contractNumber && (
                      <span className="text-xs text-slate-400 font-mono">#{a.contractNumber}</span>
                    )}
                    <h1 className="text-lg sm:text-xl font-semibold text-slate-900">{a.title}</h1>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    {t('detail.with')} <span className="font-medium">{a.otherParty}</span>
                    {a.owner?.name && <span className="text-slate-500"> · {t('detail.responsible')}: {a.owner.name}</span>}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${sMeta.color}`}>
                      <StatusIcon size={11} /> {t(`registerStatus.${status}`, status)}
                    </span>
                    {a.confidentiality === 'confidential' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-200 text-slate-800">
                        <ShieldAlert size={11} /> {t('detail.confidential')}
                      </span>
                    )}
                    {a.riskLevel && a.riskLevel !== 'low' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-800 border border-red-200">
                        {t('detail.risk')}: {t(`modal.risk.${a.riskLevel}`, a.riskLevel)}
                      </span>
                    )}
                    {a.tags?.map((tag, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                        <Tag size={10} /> {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {userCanManage && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                  <button onClick={() => setModal({ mode: 'edit', initial: a })} className="btn-secondary inline-flex items-center gap-1 text-sm">
                    <Edit2 size={13} /> {t('actions.edit')}
                  </button>
                  {isTerminatable && (
                    <button onClick={() => setModal({ mode: 'renew', initial: a })} className="btn-secondary inline-flex items-center gap-1 text-sm">
                      <RefreshCw size={13} /> {t('actions.renew')}
                    </button>
                  )}
                  {isTerminatable && (
                    <button onClick={() => setConfirmTerminate(true)} className="btn-secondary inline-flex items-center gap-1 text-sm">
                      <Ban size={13} /> {t('actions.terminate')}
                    </button>
                  )}
                  <button onClick={() => setConfirmDelete(true)} className="btn-secondary inline-flex items-center gap-1 text-sm text-red-700 sm:ml-auto">
                    <Trash2 size={13} /> {t('actions.delete')}
                  </button>
                </div>
              )}

              {/* Termination prompt */}
              {confirmTerminate && (
                <div className="mt-4 p-3 rounded bg-amber-50 border border-amber-200 space-y-2">
                  <p className="text-sm text-amber-800">{t('detail.terminatePrompt')}</p>
                  <input className="input text-sm" value={termReason} onChange={(e) => setTermReason(e.target.value)} placeholder={t('detail.reasonPlaceholder')} />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setConfirmTerminate(false)} className="btn-secondary text-sm">{tc('cancel')}</button>
                    <button
                      onClick={() => { terminate.mutate({ id: a._id, reason: termReason }); setConfirmTerminate(false); }}
                      className="btn-danger text-sm"
                    >
                      {t('actions.confirmTerminate')}
                    </button>
                  </div>
                </div>
              )}

              {/* Delete prompt */}
              {confirmDelete && (
                <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 space-y-2">
                  <p className="text-sm text-red-800">{t('detail.deletePrompt')}</p>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setConfirmDelete(false)} className="btn-secondary text-sm">{tc('cancel')}</button>
                    <button
                      onClick={() => remove.mutate(a._id, { onSuccess: () => navigate('/agreements') })}
                      className="btn-danger text-sm"
                    >
                      {t('actions.delete')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Basic info */}
            <Section title={t('detail.sectionBasic')} icon={FileText}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6">
                <Field label={t('detail.fSector')}>{tcDept(a.department)}</Field>
                <Field label={t('detail.fSeq')}>{a.sequenceNumber ?? '—'}</Field>
                <Field label={t('detail.fDocType')}>{a.documentType ? t(`docType.${a.documentType}`, a.documentType) : '—'}</Field>
                <Field label={t('detail.fClass')}>{a.contractClass || '—'}</Field>
                <Field label={t('detail.fContractNo')}>{a.contractNumber}</Field>
                <Field label={t('detail.fArchiveNo')}>{a.archiveNumber || '—'}</Field>
                <Field label={t('detail.fSignedDate')}>{fmtDate(a.signedDate)}</Field>
                <Field label={t('detail.fStartDate')}>{fmtDate(a.startDate)}</Field>
                <Field label={t('detail.fEndDate')}>{a.endDate ? fmtDate(a.endDate) : t('detail.undetermined')}</Field>
                <Field label={t('detail.fDuration')}>{a.durationType ? t(`duration.${a.durationType}`, a.durationType) : (a.endDate ? t('detail.fixedShort') : t('detail.indefiniteShort'))}</Field>
                <Field label={t('detail.fReviewDate')}>{fmtDate(a.reviewDate)}</Field>
                <Field label={t('detail.fTerminationNotice')}>{a.terminationNoticeDays} {t('detail.daysSuffix')}</Field>
                <Field label={t('detail.fAutoRenew')}>{a.autoRenew ? t('detail.autoRenewYes', { months: a.autoRenewMonths || 12 }) : t('detail.no')}</Field>
                <Field label={t('detail.fReminderThreshold')}>{a.reminderDays} {t('detail.daysSuffix')}</Field>
                <Field label={t('detail.fDriveLink')}>
                  {a.driveLink
                    ? <a href={a.driveLink} target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline inline-flex items-center gap-1">{t('detail.openFolder')}</a>
                    : '—'}
                </Field>
              </div>
              {a.reviewComment && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t('detail.reviewComment')}</div>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{a.reviewComment}</p>
                </div>
              )}
              {a.description && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t('detail.description')}</div>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{a.description}</p>
                </div>
              )}
            </Section>

            {/* Counterparty */}
            <Section title={t('detail.sectionCounterparty')} icon={UserIcon}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6">
                <Field label={t('detail.fLegalEntity')}>{a.otherParty}</Field>
                <Field label={t('detail.fContactPerson')}>{a.counterpartyContact?.name}</Field>
                <Field label={t('detail.fTaxNo')}>{a.counterpartyContact?.taxNo}</Field>
                <Field label={<span className="inline-flex items-center gap-1"><Mail size={11} /> {t('detail.fEmail')}</span>}>{a.counterpartyContact?.email}</Field>
                <Field label={<span className="inline-flex items-center gap-1"><Phone size={11} /> {t('detail.fPhone')}</span>}>{a.counterpartyContact?.phone}</Field>
                <Field label={<span className="inline-flex items-center gap-1"><MapPin size={11} /> {t('detail.fAddress')}</span>}>{a.counterpartyContact?.address}</Field>
              </div>
            </Section>

            {/* Value & payment */}
            <Section title={t('detail.sectionValue')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6">
                <Field label={t('detail.fValue')}>
                  {a.value ? `${Number(a.value).toLocaleString('mk-MK')} ${a.currency}` : '—'}
                </Field>
                <Field label={t('detail.fPaymentTerms')}>{a.paymentTerms ? t(`modal.pay.${a.paymentTerms}`, a.paymentTerms) : '—'}</Field>
                <Field label={t('detail.fAmountPerCycle')}>
                  {a.paymentAmount ? `${Number(a.paymentAmount).toLocaleString('mk-MK')} ${a.currency}` : '—'}
                </Field>
                <Field label={t('detail.fCurrency')}>{a.currency}</Field>
              </div>
            </Section>

            {/* Files */}
            <Section title={t('detail.sectionFiles', { count: a.files?.length || 0 })}>
              {a.files?.length ? (
                <ul className="divide-y divide-slate-100 -my-2">
                  {a.files.map((f) => (
                    <li key={f._id} className="py-2 flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{f.label || f.name}</div>
                        <div className="text-xs text-slate-500">{f.name} · {f.size ? `${Math.round(f.size / 1024)} KB` : ''} · {fmtDate(f.uploadedAt)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-slate-500">{t('detail.noFiles')}</div>
              )}
              {userCanManage && (
                <p className="text-xs text-slate-400 mt-3">{t('detail.s3Hint')}</p>
              )}
            </Section>

            {/* Reminder bookkeeping */}
            {(a.lastReminderSentAt || a.lastReminderDayOffset) && (
              <Section title={t('detail.sectionReminders')} icon={Bell}>
                <div className="text-sm text-slate-700">
                  {t('detail.lastReminder')} <strong>{fmtDate(a.lastReminderSentAt)}</strong>
                  {a.lastReminderDayOffset && <span> {t('detail.thresholdDays', { count: a.lastReminderDayOffset })}</span>}
                </div>
              </Section>
            )}

            {/* Notes */}
            {a.notes && (
              <Section title={t('detail.sectionNotes')}>
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{a.notes}</p>
              </Section>
            )}

            {/* Activity log + add note */}
            <Section title={t('detail.sectionActivity', { count: a.activityLog?.length || 0 })}>
              <form onSubmit={submitNote} className="flex gap-2 mb-4">
                <input
                  className="input text-sm flex-1"
                  placeholder={t('detail.notePlaceholder')}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <button type="submit" className="btn-primary text-sm inline-flex items-center gap-1" disabled={addNote.isPending || !noteText.trim()}>
                  <Send size={13} /> {t('detail.addNote')}
                </button>
              </form>
              {a.activityLog?.length ? (
                <ul className="space-y-3">
                  {[...a.activityLog].reverse().map((entry) => {
                    const color = ACTION_COLOR[entry.action] || 'bg-slate-100 text-slate-600';
                    return (
                      <li key={entry._id} className="flex gap-3">
                        <div className="flex-shrink-0 w-1.5 mt-2 self-stretch bg-slate-100 rounded-full" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
                              {t(`action.${entry.action}`, entry.action)}
                            </span>
                            <span className="text-xs text-slate-500">
                              {entry.user?.name || t('detail.system')} · {fmtDate(entry.at)}
                            </span>
                          </div>
                          {entry.text && (
                            <p className="text-sm text-slate-800 mt-1">{entry.text}</p>
                          )}
                          {entry.meta?.fields?.length > 0 && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {t('detail.changedFields')} {entry.meta.fields.join(', ')}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-sm text-slate-500">{t('detail.noActivity')}</div>
              )}
            </Section>
          </div>
        </main>
      </div>
      {modal && (
        <AddAgreementModal
          mode={modal.mode}
          initial={modal.initial}
          dept={a.department}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};

export default AgreementDetail;
