import { useSearchParams } from 'react-router-dom';
import { FileText, ArrowLeft, ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import NDAForm from './NDAForm.jsx';
import PLAgreementForm from './PLAgreementForm.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const TEMPLATES = [
  {
    id: 'nda',
    labelKey: 'template.nda.label',
    sublabelKey: 'template.nda.sublabel',
    icon: FileText,
    color: 'bg-blue-50 text-blue-600',
    depts: ['top_management', 'sales'],
  },
  {
    id: 'pl-agreement',
    labelKey: 'template.pl.label',
    sublabelKey: 'template.pl.sublabel',
    icon: ClipboardList,
    color: 'bg-green-50 text-green-600',
    depts: ['top_management', 'sales'],
  },
];

const TemplateIcon = ({ template, onClick, t }) => {
  const Icon = template.icon;
  return (
    <button
      onClick={onClick}
      className="card p-6 flex flex-col items-center gap-3 hover:shadow-md hover:border-blue-200 transition-all group text-center"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${template.color} group-hover:scale-105 transition-transform`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{t(template.labelKey)}</p>
        <p className="text-xs text-gray-400 mt-0.5">{t(template.sublabelKey)}</p>
      </div>
    </button>
  );
};

const TerkoviGallery = () => {
  const { user } = useAuth();
  const { t } = useTranslation('terkovi');
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTemplate = searchParams.get('template');
  const userDept = user?.department;

  const openTemplate = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set('template', id);
    setSearchParams(next);
  };

  const closeTemplate = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('template');
    setSearchParams(next);
  };

  if (activeTemplate === 'nda') {
    return (
      <div>
        <button
          onClick={closeTemplate}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          {t('backToTemplates')}
        </button>
        <NDAForm />
      </div>
    );
  }

  if (activeTemplate === 'pl-agreement') {
    return (
      <div>
        <button
          onClick={closeTemplate}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          {t('backToTemplates')}
        </button>
        <PLAgreementForm />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">{t('title')}</h2>
        <p className="text-sm text-gray-400 mt-0.5">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {TEMPLATES.filter((tmpl) => !tmpl.depts || tmpl.depts.includes(userDept)).map((tmpl) => (
          <TemplateIcon key={tmpl.id} template={tmpl} onClick={() => openTemplate(tmpl.id)} t={t} />
        ))}
      </div>
    </div>
  );
};

export default TerkoviGallery;
