import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';

const TRAININGS = [
  {
    id: 'anticorruption',
    titleMk: 'Антикорупциска политика',
    titleEn: 'Anti-Corruption Policy',
    descMk: 'Спречување на корупција, изнуда, проневера и поткуп',
    descEn: 'Prevention of corruption, extortion, embezzlement and bribery',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
      </svg>
    ),
    color: 'from-slate-700 to-slate-900',
    accent: 'text-amber-400',
    status: 'active',
    route: '/trainings/anticorruption',
  },
  {
    id: 'onboarding',
    titleMk: 'Онбординг за нови вработени',
    titleEn: 'New Employee Onboarding',
    descMk: 'Воведна обука за сите нови вработени',
    descEn: 'Introductory training for all new employees',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    color: 'from-blue-600 to-blue-800',
    accent: 'text-blue-200',
    status: 'upcoming',
    route: null,
  },
  {
    id: 'safety',
    titleMk: 'Безбедност и здравје при работа',
    titleEn: 'Workplace Health & Safety',
    descMk: 'Задолжителна годишна обука за безбедност',
    descEn: 'Mandatory annual safety training',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    color: 'from-green-600 to-green-800',
    accent: 'text-green-200',
    status: 'upcoming',
    route: null,
  },
  {
    id: 'haccp',
    titleMk: 'HACCP и хигиенски стандарди',
    titleEn: 'HACCP & Hygiene Standards',
    descMk: 'Критични контролни точки и хигиена',
    descEn: 'Critical control points and hygiene',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    color: 'from-teal-600 to-teal-800',
    accent: 'text-teal-200',
    status: 'upcoming',
    route: null,
  },
  {
    id: 'erp',
    titleMk: 'Работа со ERP систем',
    titleEn: 'ERP System Training',
    descMk: 'Набавки, залихи, фактурирање',
    descEn: 'Procurement, inventory, invoicing',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
      </svg>
    ),
    color: 'from-purple-600 to-purple-800',
    accent: 'text-purple-200',
    status: 'upcoming',
    route: null,
  },
  {
    id: 'leadership',
    titleMk: 'Лидерство и менаџмент',
    titleEn: 'Leadership & Management',
    descMk: 'Ефективна комуникација и водење тимови',
    descEn: 'Effective communication and team leadership',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v-2.5m3 2.5v-5.5m3 5.5v-3.5" />
      </svg>
    ),
    color: 'from-amber-600 to-amber-800',
    accent: 'text-amber-200',
    status: 'upcoming',
    route: null,
  },
];

const STATUS_BADGE = {
  active: { label: 'Активна', labelEn: 'Active', cls: 'bg-green-500/20 text-green-300 ring-1 ring-green-500/30' },
  upcoming: { label: 'Наскоро', labelEn: 'Coming Soon', cls: 'bg-white/10 text-white/60 ring-1 ring-white/20' },
  completed: { label: 'Завршена', labelEn: 'Completed', cls: 'bg-gray-500/20 text-gray-300 ring-1 ring-gray-500/30' },
};

const Trainings = () => {
  const { t, i18n } = useTranslation('common');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const isMk = i18n.language === 'mk';

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={t('trainings')} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">
                {isMk ? 'Обуки и тренинзи' : 'Trainings'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isMk ? 'Изберете обука за да ја започнете' : 'Select a training to begin'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {TRAININGS.map((tr) => {
                const badge = STATUS_BADGE[tr.status];
                const isClickable = tr.route !== null;
                return (
                  <button
                    key={tr.id}
                    onClick={() => isClickable && navigate(tr.route)}
                    disabled={!isClickable}
                    className={`group relative aspect-square rounded-xl bg-gradient-to-br ${tr.color} p-4 text-left flex flex-col justify-between overflow-hidden transition-all duration-200 ${
                      isClickable
                        ? 'hover:scale-[1.02] hover:shadow-xl cursor-pointer'
                        : 'opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {/* Decorative circle */}
                    <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/5" />
                    <div className="absolute -bottom-5 -left-5 w-16 h-16 rounded-full bg-white/5" />

                    <div className="relative z-10">
                      <div className={`${tr.accent} mb-2`}>
                        {tr.icon}
                      </div>
                      <h3 className="text-sm font-bold text-white leading-snug">
                        {isMk ? tr.titleMk : tr.titleEn}
                      </h3>
                      <p className="text-[11px] text-white/60 mt-1 line-clamp-2">
                        {isMk ? tr.descMk : tr.descEn}
                      </p>
                    </div>

                    <div className="relative z-10 flex items-center justify-between">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
                        {isMk ? badge.label : badge.labelEn}
                      </span>
                      {isClickable && (
                        <span className="text-white/40 group-hover:text-white/80 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Trainings;
