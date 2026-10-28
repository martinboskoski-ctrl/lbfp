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
];

const STATUS_BADGE = {
  active: { label: 'Активна', labelEn: 'Active', cls: 'bg-green-500/20 text-green-300 ring-1 ring-green-500/30' },
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
