import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';

const DUMMY_TRAININGS = [
  {
    id: 1,
    titleMk: 'Онбординг за нови вработени',
    titleEn: 'New Employee Onboarding',
    descMk: 'Воведна обука за сите нови вработени — запознавање со компанијата, политики, алатки и тимска структура.',
    descEn: 'Introductory training for all new employees — company overview, policies, tools, and team structure.',
    duration: '2 дена / 2 days',
    status: 'active',
    category: 'onboarding',
    datesMk: '24–25 март 2026',
    datesEn: 'March 24–25, 2026',
    locationMk: 'Сала за состаноци — Приземје',
    locationEn: 'Meeting Room — Ground Floor',
    trainerMk: 'Марија Стојановска — HR одделение',
    trainerEn: 'Marija Stojanovska — HR Department',
    targetMk: 'Сите новопримени вработени',
    targetEn: 'All newly hired employees',
    agenda: [
      {
        timeMk: 'Ден 1 — 09:00–12:00',
        timeEn: 'Day 1 — 09:00–12:00',
        titleMk: 'Добредојде во ЛБФП',
        titleEn: 'Welcome to LBFP',
        itemsMk: [
          'Историјат на компанијата и мисија',
          'Организациска структура и одделенија',
          'Преглед на производствен процес',
          'Обиколка на објектот',
        ],
        itemsEn: [
          'Company history and mission',
          'Organizational structure and departments',
          'Production process overview',
          'Facility tour',
        ],
      },
      {
        timeMk: 'Ден 1 — 13:00–16:00',
        timeEn: 'Day 1 — 13:00–16:00',
        titleMk: 'Политики и правилници',
        titleEn: 'Policies & Regulations',
        itemsMk: [
          'Работно време, отсуства и годишен одмор',
          'Кодекс на однесување',
          'Заштита на лични податоци (ЗЗЛП)',
          'Процедура за пријавување проблеми',
        ],
        itemsEn: [
          'Working hours, absences, and annual leave',
          'Code of conduct',
          'Personal data protection (LPDP)',
          'Issue reporting procedure',
        ],
      },
      {
        timeMk: 'Ден 2 — 09:00–12:00',
        timeEn: 'Day 2 — 09:00–12:00',
        titleMk: 'Безбедност и хигиена',
        titleEn: 'Safety & Hygiene',
        itemsMk: [
          'Безбедност и здравје при работа (БЗР)',
          'Хигиенски стандарди и HACCP основи',
          'Лична заштитна опрема (ЛЗО)',
          'Постапка при несреќа или евакуација',
        ],
        itemsEn: [
          'Occupational health & safety (OHS)',
          'Hygiene standards and HACCP basics',
          'Personal protective equipment (PPE)',
          'Emergency and evacuation procedures',
        ],
      },
      {
        timeMk: 'Ден 2 — 13:00–16:00',
        timeEn: 'Day 2 — 13:00–16:00',
        titleMk: 'Алатки и системи',
        titleEn: 'Tools & Systems',
        itemsMk: [
          'Најава во PackFlow — задачи, барања, документи',
          'Користење на ERP систем (основни модули)',
          'Е-пошта и интерна комуникација',
          'Запознавање со тимот и менторот',
        ],
        itemsEn: [
          'PackFlow login — tasks, requests, documents',
          'ERP system basics (core modules)',
          'Email and internal communication',
          'Meet the team and assigned mentor',
        ],
      },
    ],
  },
  {
    id: 2,
    titleMk: 'Безбедност и здравје при работа',
    titleEn: 'Workplace Health & Safety',
    descMk: 'Задолжителна годишна обука за безбедност на работното место, прва помош и противпожарна заштита. Согласно Закон за БЗР, сите вработени мора да ја поминат оваа обука.',
    descEn: 'Mandatory annual training on workplace safety, first aid, and fire prevention. Per the OHS Law, all employees must complete this training.',
    duration: '4 часа / 4 hours',
    status: 'active',
    category: 'compliance',
    datesMk: '28 март 2026',
    datesEn: 'March 28, 2026',
    locationMk: 'Производствена хала — Сектор А',
    locationEn: 'Production Hall — Sector A',
    trainerMk: 'Горан Петровски — Стручно лице за БЗР',
    trainerEn: 'Goran Petrovski — OHS Specialist',
    targetMk: 'Сите вработени (задолжително)',
    targetEn: 'All employees (mandatory)',
  },
  {
    id: 3,
    titleMk: 'HACCP и хигиенски стандарди',
    titleEn: 'HACCP & Hygiene Standards',
    descMk: 'Обука за HACCP принципите, критичните контролни точки и хигиенските стандарди во производството на храна. Вклучува практични примери од нашата производствена линија.',
    descEn: 'Training on HACCP principles, critical control points, and hygiene standards in food production. Includes practical examples from our production line.',
    duration: '1 ден / 1 day',
    status: 'active',
    category: 'compliance',
    datesMk: '2 април 2026',
    datesEn: 'April 2, 2026',
    locationMk: 'Сала за состаноци — 1 кат',
    locationEn: 'Meeting Room — 1st Floor',
    trainerMk: 'Ана Димитрова — Одделение за квалитет',
    trainerEn: 'Ana Dimitrova — Quality Assurance Dept.',
    targetMk: 'Производство, Набавки, Објект',
    targetEn: 'Production, Procurement, Facility',
  },
  {
    id: 4,
    titleMk: 'Работа со ERP систем',
    titleEn: 'ERP System Training',
    descMk: 'Практична обука за користење на ERP системот — модули за набавки, залихи, фактурирање и финансиско известување.',
    descEn: 'Hands-on training for using the ERP system — procurement, inventory, invoicing, and financial reporting modules.',
    duration: '1 ден / 1 day',
    status: 'active',
    category: 'technical',
    datesMk: '7 април 2026',
    datesEn: 'April 7, 2026',
    locationMk: 'ИТ просторија — 2 кат',
    locationEn: 'IT Room — 2nd Floor',
    trainerMk: 'Стефан Илиевски — ИТ одделение',
    trainerEn: 'Stefan Ilievski — IT Department',
    targetMk: 'Финансии, Набавки, Продажба',
    targetEn: 'Finance, Procurement, Sales',
  },
  {
    id: 5,
    titleMk: 'Лидерство и менаџмент на тимови',
    titleEn: 'Leadership & Team Management',
    descMk: 'Обука за менаџери и тим-лидери — ефективна комуникација, делегирање задачи, мотивација на вработени и решавање конфликти во тимот.',
    descEn: 'Training for managers and team leads — effective communication, task delegation, employee motivation, and conflict resolution.',
    duration: '2 дена / 2 days',
    status: 'upcoming',
    category: 'leadership',
    datesMk: '14–15 април 2026',
    datesEn: 'April 14–15, 2026',
    locationMk: 'Хотел Милениум — Битола (надворешна локација)',
    locationEn: 'Hotel Milenium — Bitola (external venue)',
    trainerMk: 'Надворешен тренер — Д-р Емилија Тасева',
    trainerEn: 'External trainer — Dr. Emilija Taseva',
    targetMk: 'Менаџери и тим-лидери на сите одделенија',
    targetEn: 'Managers and team leads from all departments',
  },
  {
    id: 6,
    titleMk: 'ISO 9001:2015 — Систем за управување со квалитет',
    titleEn: 'ISO 9001:2015 — Quality Management System',
    descMk: 'Запознавање со барањата на ISO 9001, интерни аудити, корективни мерки и улогата на секој вработен во системот за управување со квалитет.',
    descEn: 'Understanding ISO 9001 requirements, internal audits, corrective actions, and every employee\'s role in the quality management system.',
    duration: '1 ден / 1 day',
    status: 'completed',
    category: 'compliance',
    datesMk: '10 март 2026 (завршена)',
    datesEn: 'March 10, 2026 (completed)',
    locationMk: 'Сала за состаноци — Приземје',
    locationEn: 'Meeting Room — Ground Floor',
    trainerMk: 'Ана Димитрова — Одделение за квалитет',
    trainerEn: 'Ana Dimitrova — Quality Assurance Dept.',
    targetMk: 'Сите одделенија',
    targetEn: 'All departments',
  },
];

const CATEGORY_COLORS = {
  onboarding: 'bg-blue-100 text-blue-700',
  compliance: 'bg-red-100 text-red-700',
  technical: 'bg-purple-100 text-purple-700',
  leadership: 'bg-amber-100 text-amber-700',
};

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  upcoming: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-gray-100 text-gray-500',
};

const Trainings = () => {
  const { t, i18n } = useTranslation('common');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const isMk = i18n.language === 'mk';

  const statusLabel = (s) => {
    if (isMk) return { active: 'Активна', upcoming: 'Претстојна', completed: 'Завршена' }[s];
    return { active: 'Active', upcoming: 'Upcoming', completed: 'Completed' }[s];
  };

  const categoryLabel = (c) => {
    if (isMk) return { onboarding: 'Онбординг', compliance: 'Регулатива', technical: 'Техничка', leadership: 'Лидерство' }[c];
    return { onboarding: 'Onboarding', compliance: 'Compliance', technical: 'Technical', leadership: 'Leadership' }[c];
  };

  const toggle = (id) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={t('trainings')} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {DUMMY_TRAININGS.map((tr) => {
              const isOpen = expandedId === tr.id;
              return (
                <div key={tr.id} className="card overflow-hidden">
                  <button
                    onClick={() => toggle(tr.id)}
                    className="w-full p-5 text-left flex flex-col gap-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <svg
                          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                        <h3 className="font-semibold text-gray-800 text-lg leading-snug">
                          {isMk ? tr.titleMk : tr.titleEn}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[tr.category]}`}>
                          {categoryLabel(tr.category)}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[tr.status]}`}>
                          {statusLabel(tr.status)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 ml-6">{isMk ? tr.descMk : tr.descEn}</p>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 bg-gray-50/50 px-5 pb-5">
                      {/* Details grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 ml-6">
                        <div>
                          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                            {isMk ? 'Датум' : 'Date'}
                          </div>
                          <div className="text-sm text-gray-700">{isMk ? tr.datesMk : tr.datesEn}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                            {isMk ? 'Времетраење' : 'Duration'}
                          </div>
                          <div className="text-sm text-gray-700">{tr.duration}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                            {isMk ? 'Локација' : 'Location'}
                          </div>
                          <div className="text-sm text-gray-700">{isMk ? tr.locationMk : tr.locationEn}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                            {isMk ? 'Обучувач' : 'Trainer'}
                          </div>
                          <div className="text-sm text-gray-700">{isMk ? tr.trainerMk : tr.trainerEn}</div>
                        </div>
                        <div className="sm:col-span-2">
                          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                            {isMk ? 'Целна група' : 'Target Group'}
                          </div>
                          <div className="text-sm text-gray-700">{isMk ? tr.targetMk : tr.targetEn}</div>
                        </div>
                      </div>

                      {/* Full agenda for onboarding */}
                      {tr.agenda && (
                        <div className="mt-5 ml-6">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            {isMk ? 'Програма' : 'Agenda'}
                          </h4>
                          <div className="space-y-4">
                            {tr.agenda.map((block, idx) => (
                              <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4">
                                <div className="flex items-baseline gap-2 mb-2">
                                  <span className="text-xs font-mono text-gray-400">
                                    {isMk ? block.timeMk : block.timeEn}
                                  </span>
                                  <span className="text-sm font-medium text-gray-800">
                                    {isMk ? block.titleMk : block.titleEn}
                                  </span>
                                </div>
                                <ul className="space-y-1 ml-1">
                                  {(isMk ? block.itemsMk : block.itemsEn).map((item, i) => (
                                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                      <span className="text-gray-300 mt-1.5 shrink-0 block w-1.5 h-1.5 rounded-full bg-gray-300" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Trainings;
