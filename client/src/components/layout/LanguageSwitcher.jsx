import i18next from 'i18next';
import { useUpdateLanguage } from '../../hooks/useUsers.js';

const LangBtn = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-2 py-1 rounded text-[11px] font-semibold uppercase tracking-wide transition-colors ${
      active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-700'
    }`}
    aria-pressed={active}
  >
    {label}
  </button>
);

const LanguageSwitcher = () => {
  const updateLang = useUpdateLanguage();
  const cur = i18next.language === 'mk' ? 'mk' : 'en';

  const set = (lang) => {
    if (lang === cur) return;
    i18next.changeLanguage(lang);
    localStorage.setItem('packflow_lang', lang);
    updateLang.mutate(lang);
  };

  return (
    <div className="hidden sm:inline-flex items-center text-slate-300 select-none">
      <LangBtn active={cur === 'mk'} onClick={() => set('mk')} label="MK" />
      <span aria-hidden>|</span>
      <LangBtn active={cur === 'en'} onClick={() => set('en')} label="EN" />
    </div>
  );
};

export default LanguageSwitcher;
