import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, User as UserIcon, Briefcase, DollarSign, Calendar, GraduationCap,
  ShieldAlert, Heart, Package, FileText, Lock, CheckCircle2, AlertTriangle,
  Activity, Users as UsersIcon,
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import { useEmployeeFile } from '../hooks/useEmployees.js';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('mk-MK') : '—');
const fmtMoney = (n, c = 'MKD') =>
  n == null ? '—' : new Intl.NumberFormat('mk-MK').format(n) + ' ' + c;

const Pill = ({ tone = 'gray', children }) => {
  const tones = {
    gray:   'bg-slate-100 text-slate-700',
    green:  'bg-emerald-50 text-emerald-800 border border-emerald-200',
    amber:  'bg-amber-50 text-amber-800 border border-amber-200',
    red:    'bg-red-50 text-red-800 border border-red-200',
    blue:   'bg-slate-100 text-slate-700',
    purple: 'bg-slate-200 text-slate-800',
  };
  return <span className={`text-[11px] px-2 py-0.5 rounded ${tones[tone]}`}>{children}</span>;
};

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-0.5 py-1.5">
    <span className="text-[11px] text-slate-500 uppercase tracking-wide">{label}</span>
    <span className="text-sm text-slate-900">{children ?? '—'}</span>
  </div>
);

const Section = ({ title, icon: Icon, children, action }) => (
  <div className="card p-4 sm:p-5 mb-3 sm:mb-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="section-title inline-flex items-center gap-2 normal-case tracking-normal text-sm">
        {Icon && <Icon size={15} className="text-slate-400" />}
        {title}
      </h3>
      {action}
    </div>
    {children}
  </div>
);

const TABS = [
  { key: 'overview',     label: 'Преглед',           icon: UserIcon },
  { key: 'employment',   label: 'Вработување',       icon: Briefcase },
  { key: 'compensation', label: 'Плата',             icon: DollarSign,    needs: 'salary' },
  { key: 'leave',        label: 'Одмор',             icon: Calendar },
  { key: 'training',     label: 'Обуки и сертификати', icon: GraduationCap },
  { key: 'discipline',   label: 'Дисциплина',        icon: ShieldAlert },
  { key: 'health',       label: 'Здравје и БЗР',     icon: Heart },
  { key: 'assets',       label: 'Опрема',            icon: Package },
  { key: 'documents',    label: 'Документи',         icon: FileText },
  { key: 'notes',        label: 'HR белешки',        icon: Lock,          needs: 'confidential' },
];

const EmployeeDetail = () => {
  const { id } = useParams();
  const { data, isLoading, error } = useEmployeeFile(id);
  const [tab, setTab] = useState('overview');

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

  if (error) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar title="Грешка" />
          <main className="flex-1 p-6">
            <div className="card p-6 max-w-xl mx-auto text-center">
              <p className="text-red-600 mb-3">Немате пристап до ова досие или досието не постои.</p>
              <Link to="/employees" className="btn-secondary inline-flex items-center gap-1">
                <ArrowLeft size={14} /> Назад до сите вработени
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const f = data.file;
  const perms = data.permissions;
  const u = f.user;
  const p = f.profile || {};

  const visibleTabs = TABS.filter((t) => {
    if (t.needs === 'salary' && !perms.canViewSalary) return false;
    if (t.needs === 'confidential' && !perms.canViewConfidential) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title="HR — Досие на вработен" />
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-5xl mx-auto">
            <Link to="/employees" className="text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 mb-3">
              <ArrowLeft size={14} /> Сите вработени
            </Link>

            {/* Header card */}
            <div className="card p-4 sm:p-5 mb-4 sm:mb-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-md bg-slate-100 flex items-center justify-center text-slate-700 font-semibold text-base sm:text-lg flex-shrink-0">
                    {u.name?.split(' ').map((s) => s[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">{u.name}</h1>
                    <div className="text-sm text-slate-600 mt-0.5 truncate">
                      {p.position || <span className="italic text-slate-400">без позиција</span>} · {u.email}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <Pill tone="gray">{u.department}</Pill>
                      {u.isManager && <Pill tone="purple">Менаџер</Pill>}
                      {p.contractStatus === 'expiring_soon' && <Pill tone="amber">Договор истекува</Pill>}
                      {p.contractStatus === 'expired' && <Pill tone="red">Договор истечен</Pill>}
                      {p.sanitaryCheckStatus === 'overdue' && <Pill tone="red">Сан. истечен</Pill>}
                      {p.sanitaryCheckStatus === 'due_soon' && <Pill tone="amber">Сан. наскоро</Pill>}
                      {perms.isSelf && <Pill tone="gray">Ова сте Вие</Pill>}
                    </div>
                  </div>
                </div>
                <div className="text-sm sm:text-right w-full sm:w-auto">
                  {f.manager && (
                    <div className="text-slate-500">
                      Менаџер: <span className="text-slate-800 font-medium">{f.manager.name}</span>
                    </div>
                  )}
                  {p.seniorityYears != null && (
                    <div className="text-slate-500">
                      Стаж: <span className="text-slate-800 font-medium">{p.seniorityYears} год.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 mb-4 flex gap-1 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              {visibleTabs.map((t) => {
                const I = t.icon;
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`px-3 py-2 text-sm flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                      active
                        ? 'border-slate-800 text-slate-900 font-medium'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <I size={14} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            {tab === 'overview' && (
              <>
                <Section title="Идентитет" icon={UserIcon}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6">
                    <Field label="Име">{p.legalName || u.name}</Field>
                    <Field label="ЕМБГ">{p.embg}</Field>
                    <Field label="ID број">{p.idNumber}</Field>
                    <Field label="Дата на раѓање">{fmtDate(p.birthDate)}</Field>
                    <Field label="Пол">{p.gender}</Field>
                    <Field label="Брачен статус">{p.maritalStatus}</Field>
                    <Field label="Деца / зависни">{p.dependents}</Field>
                    <Field label="Националност">{p.nationality}</Field>
                    <Field label="Крвна група">{p.bloodType}</Field>
                  </div>
                </Section>
                <Section title="Контакт и адреса">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6">
                    <Field label="Личен телефон">{p.personalPhone}</Field>
                    <Field label="Личен мејл">{p.personalEmail}</Field>
                    <Field label="Град">{p.address?.city}</Field>
                    <Field label="Адреса">{p.address?.street}</Field>
                    <Field label="Поштенски">{p.address?.postal}</Field>
                    <Field label="Држава">{p.address?.country}</Field>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Контакт во итен случај</div>
                    <div className="text-sm">
                      {p.emergencyContact?.name || '—'}{p.emergencyContact?.relation ? ` (${p.emergencyContact.relation})` : ''} · {p.emergencyContact?.phone || ''}
                    </div>
                  </div>
                </Section>
                {f.directReports?.length > 0 && (
                  <Section title="Директни подредени" icon={UsersIcon}>
                    <ul className="space-y-1">
                      {f.directReports.map((r) => (
                        <li key={r._id} className="text-sm">
                          <Link to={`/employees/${r._id}`} className="text-slate-800 hover:underline">{r.name}</Link>
                          <span className="text-slate-500"> — {r.position || r.department}</span>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}
              </>
            )}

            {tab === 'employment' && (
              <Section title="Вработување и договор" icon={Briefcase}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6">
                  <Field label="Позиција">{p.position}</Field>
                  <Field label="Под-тим">{p.subTeam}</Field>
                  <Field label="Тип на вработување">{p.employmentType}</Field>
                  <Field label="Тип на договор">{p.contractType}</Field>
                  <Field label="Почеток на договор">{fmtDate(p.contractStart)}</Field>
                  <Field label="Крај на договор">{fmtDate(p.contractEnd)}</Field>
                  <Field label="Крај на пробен период">{fmtDate(p.probationEnd)}</Field>
                  <Field label="Отказен рок (денови)">{p.noticePeriodDays}</Field>
                  <Field label="Локација">{p.workLocation}</Field>
                  <Field label="FTE %">{p.ftePercent}</Field>
                  <Field label="Дата на вработување">{fmtDate(p.hireDate)}</Field>
                  <Field label="Стаж (години)">{p.seniorityYears}</Field>
                </div>
                {p.jobDescription && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Опис на работно место</div>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">{p.jobDescription}</p>
                  </div>
                )}
              </Section>
            )}

            {tab === 'compensation' && perms.canViewSalary && (
              <>
                <Section title="Тековна плата" icon={DollarSign}>
                  {f.compensation ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6">
                      <Field label="Бруто">{fmtMoney(f.compensation.grossAmount, f.compensation.currency)}</Field>
                      <Field label="Нето">{fmtMoney(f.compensation.netAmount, f.compensation.currency)}</Field>
                      <Field label="Фреквенција">{f.compensation.payFrequency}</Field>
                      <Field label="Од">{fmtDate(f.compensation.effectiveDate)}</Field>
                    </div>
                  ) : <div className="text-sm text-slate-500">Нема податоци.</div>}
                  {f.compensation?.allowances?.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Додатоци</div>
                      <ul className="text-sm space-y-1">
                        {f.compensation.allowances.map((a, i) => (
                          <li key={i} className="flex justify-between max-w-xs">
                            <span className="text-slate-700">{a.kind}</span>
                            <span className="text-slate-900 font-medium">{fmtMoney(a.amount, f.compensation.currency)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Section>
                <Section title="Историја на плата">
                  {f.salaryHistory?.length > 0 ? (
                    <div className="overflow-x-auto -mx-2">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-slate-500 uppercase tracking-wide">
                            <th className="text-left px-2 py-2">Дата</th>
                            <th className="text-left px-2 py-2">Бруто</th>
                            <th className="text-left px-2 py-2">Нето</th>
                            <th className="text-left px-2 py-2">Причина</th>
                            <th className="text-left px-2 py-2">Забелешка</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {f.salaryHistory.map((s) => (
                            <tr key={s._id}>
                              <td className="px-2 py-2">{fmtDate(s.effectiveDate)}</td>
                              <td className="px-2 py-2 font-medium">{fmtMoney(s.grossAmount, s.currency)}</td>
                              <td className="px-2 py-2">{fmtMoney(s.netAmount, s.currency)}</td>
                              <td className="px-2 py-2">{s.reason}</td>
                              <td className="px-2 py-2 text-slate-500">{s.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <div className="text-sm text-slate-500">Нема историја.</div>}
                </Section>
              </>
            )}

            {tab === 'compensation' && !perms.canViewSalary && (
              <Section title="Плата" icon={Lock}>
                <p className="text-sm text-slate-500">Платата е скриена. Само HR и Топ менаџмент имаат пристап.</p>
              </Section>
            )}

            {tab === 'leave' && (
              <>
                <Section title="Биланс на одмор" icon={Calendar}>
                  {f.leaveBalances?.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-slate-500 uppercase tracking-wide">
                          <th className="text-left px-2 py-2">Година</th>
                          <th className="text-left px-2 py-2">Вкупно</th>
                          <th className="text-left px-2 py-2">Искористени</th>
                          <th className="text-left px-2 py-2">Преостанато</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {f.leaveBalances.map((b) => (
                          <tr key={b._id}>
                            <td className="px-2 py-2 font-medium">{b.year}</td>
                            <td className="px-2 py-2">{b.totalDays}</td>
                            <td className="px-2 py-2">{b.usedDays}</td>
                            <td className="px-2 py-2 font-medium">{b.remainingDays}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <div className="text-sm text-slate-500">Нема податоци.</div>}
                </Section>
                <Section title="Барања за одмор и слично">
                  {f.leaveRequests?.length > 0 ? (
                    <ul className="divide-y divide-slate-100 -my-2">
                      {f.leaveRequests.slice(0, 20).map((r) => (
                        <li key={r._id} className="py-2 flex justify-between items-center">
                          <div>
                            <div className="text-sm font-medium text-slate-900">{r.type}</div>
                            <div className="text-xs text-slate-500">{fmtDate(r.createdAt)} · {r.leaveDays || 0} денови</div>
                          </div>
                          <Pill
                            tone={
                              r.status === 'approved' ? 'green' :
                              r.status === 'rejected' ? 'red' :
                              r.status === 'in_progress' ? 'amber' : 'gray'
                            }
                          >
                            {r.status}
                          </Pill>
                        </li>
                      ))}
                    </ul>
                  ) : <div className="text-sm text-slate-500">Нема барања.</div>}
                </Section>
              </>
            )}

            {tab === 'training' && (
              <Section title="Образование, јазици и вештини" icon={GraduationCap}>
                <Field label="Највисоко образование">{p.highestEducation}</Field>
                {p.schools?.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Школи</div>
                    <ul className="text-sm space-y-1">
                      {p.schools.map((s, i) => (
                        <li key={i}>{s.degree} · {s.field} — <span className="text-slate-500">{s.institution} ({fmtDate(s.from)} — {fmtDate(s.to)})</span></li>
                      ))}
                    </ul>
                  </div>
                )}
                {p.languages?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Јазици</div>
                    <div className="flex flex-wrap gap-2">
                      {p.languages.map((l, i) => (
                        <Pill key={i} tone="gray">{l.language} · {l.proficiency}</Pill>
                      ))}
                    </div>
                  </div>
                )}
                {p.skills?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Вештини</div>
                    <div className="flex flex-wrap gap-2">
                      {p.skills.map((s, i) => <Pill key={i} tone="blue">{s}</Pill>)}
                    </div>
                  </div>
                )}
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  Сертификатите со рок ќе се прикажат тука кога ќе се поврзат со модулот за обуки.
                </div>
              </Section>
            )}

            {tab === 'discipline' && (
              <Section title="Дисциплински мерки" icon={ShieldAlert}>
                {f.discipline?.length > 0 ? (
                  <ul className="divide-y divide-slate-100 -my-2">
                    {f.discipline.map((d) => (
                      <li key={d._id} className="py-3">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {d.type.replace('_', ' ')} — {d.category}
                            </div>
                            <div className="text-xs text-slate-500">
                              Издадено: {fmtDate(d.issuedDate)} · Сериозност: {d.severity}/5
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Pill tone={
                              d.status === 'acknowledged' ? 'green' :
                              d.status === 'declined' || d.status === 'overturned' ? 'gray' :
                              d.status === 'expired' ? 'gray' :
                              d.status === 'pending_top_mgmt' || d.status === 'pending_hr' ? 'amber' :
                              'red'
                            }>
                              {d.status}
                            </Pill>
                            {d.isActive && <Pill tone="red">Активна</Pill>}
                          </div>
                        </div>
                        <p className="text-sm text-slate-800 mt-1">{d.reason}</p>
                        {d.description && <p className="text-xs text-slate-500 mt-1">{d.description}</p>}
                        {d.expiryDate && (
                          <div className="text-xs text-slate-500 mt-1">
                            Важи до: {fmtDate(d.expiryDate)}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : <div className="text-sm text-slate-500">Нема дисциплински мерки.</div>}
              </Section>
            )}

            {tab === 'health' && (
              <>
                <Section title="Здравје и БЗР" icon={Heart}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6">
                    <Field label="Последен сан. преглед">{fmtDate(p.sanitaryCheckLast)}</Field>
                    <Field label="Следен сан. преглед">
                      <span className="inline-flex items-center gap-1">
                        {fmtDate(p.sanitaryCheckNext)}
                        {p.sanitaryCheckStatus === 'overdue' && <AlertTriangle size={12} className="text-red-600" />}
                        {p.sanitaryCheckStatus === 'due_soon' && <AlertTriangle size={12} className="text-amber-600" />}
                        {p.sanitaryCheckStatus === 'ok' && <CheckCircle2 size={12} className="text-green-600" />}
                      </span>
                    </Field>
                    <Field label="Последен фитнес">{fmtDate(p.fitnessExamLast)}</Field>
                    <Field label="Следен фитнес">{fmtDate(p.fitnessExamNext)}</Field>
                    <Field label="Алергии">{p.allergies}</Field>
                    <Field label="Крвна група">{p.bloodType}</Field>
                  </div>
                </Section>
                <Section title="Инциденти" icon={Activity}>
                  {f.incidents?.length > 0 ? (
                    <ul className="divide-y divide-slate-100 -my-2">
                      {f.incidents.map((i) => (
                        <li key={i._id} className="py-3">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <div className="text-sm font-medium text-slate-900">{i.injuryType || 'Инцидент'}</div>
                              <div className="text-xs text-slate-500">{fmtDate(i.occurredAt)} · {i.location}</div>
                            </div>
                            <Pill tone={
                              i.severity === 'critical' || i.severity === 'serious' ? 'red' :
                              i.severity === 'moderate' ? 'amber' : 'gray'
                            }>{i.severity}</Pill>
                          </div>
                          <p className="text-sm text-slate-800 mt-1">{i.description}</p>
                          {i.correctiveAction && (
                            <p className="text-xs text-slate-600 mt-1"><strong>Мерка:</strong> {i.correctiveAction}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : <div className="text-sm text-slate-500">Нема пријавени инциденти.</div>}
                </Section>
              </>
            )}

            {tab === 'assets' && (
              <Section title="Доделена опрема" icon={Package}>
                {f.assets?.length > 0 ? (
                  <ul className="divide-y divide-slate-100 -my-2">
                    {f.assets.map((a) => (
                      <li key={a._id} className="py-3 flex justify-between items-start">
                        <div>
                          <div className="text-sm font-medium text-slate-900">{a.label}</div>
                          <div className="text-xs text-slate-500">
                            {a.assetType}{a.serialNumber ? ` · ${a.serialNumber}` : ''}{a.size ? ` · големина ${a.size}` : ''}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">Издадено: {fmtDate(a.issuedDate)}</div>
                        </div>
                        <Pill tone={a.isReturned ? 'gray' : 'green'}>
                          {a.isReturned ? `Вратено ${fmtDate(a.returnedDate)}` : 'Активно'}
                        </Pill>
                      </li>
                    ))}
                  </ul>
                ) : <div className="text-sm text-slate-500">Нема доделена опрема.</div>}
              </Section>
            )}

            {tab === 'documents' && (
              <Section title="Документи" icon={FileText}>
                {f.documents?.length > 0 ? (
                  <ul className="divide-y divide-slate-100 -my-2">
                    {f.documents.map((d) => (
                      <li key={d._id} className="py-3 flex justify-between items-start">
                        <div>
                          <div className="text-sm font-medium text-slate-900">{d.title}</div>
                          <div className="text-xs text-slate-500">{d.docType} · {fmtDate(d.issueDate)}</div>
                          {d.expiryDate && (
                            <div className="text-xs text-slate-500 mt-0.5">Важи до: {fmtDate(d.expiryDate)}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {d.confidential && <Pill tone="red">Доверливо</Pill>}
                          {d.expiryStatus === 'expired' && <Pill tone="red">Истечено</Pill>}
                          {d.expiryStatus === 'expiring_soon' && <Pill tone="amber">Истекува</Pill>}
                          {d.expiryStatus === 'valid' && <Pill tone="green">Важечко</Pill>}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : <div className="text-sm text-slate-500">Нема прикачени документи.</div>}
              </Section>
            )}

            {tab === 'notes' && perms.canViewConfidential && (
              <Section title="HR белешки (само за HR и Топ менаџмент)" icon={Lock}>
                {f.hrNotes ? (
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{f.hrNotes}</p>
                ) : (
                  <div className="text-sm text-slate-500">Нема белешки.</div>
                )}
              </Section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployeeDetail;
