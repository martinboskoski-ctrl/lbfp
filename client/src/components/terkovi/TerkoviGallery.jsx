import { useSearchParams } from 'react-router-dom';
import { FileText, ArrowLeft, ClipboardList } from 'lucide-react';
import NDAForm from './NDAForm.jsx';
import PLAgreementForm from './PLAgreementForm.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const TEMPLATES = [
  {
    id: 'nda',
    label: 'NDA',
    sublabel: 'Non-Disclosure Agreement',
    sublabelMk: 'Договор за доверливост',
    icon: FileText,
    color: 'bg-blue-50 text-blue-600',
    depts: ['top_management', 'sales'],
  },
  {
    id: 'pl-agreement',
    label: 'PL Agreement',
    sublabel: 'Private Label Agreement',
    sublabelMk: 'Договор за приватна етикета',
    icon: ClipboardList,
    color: 'bg-green-50 text-green-600',
    depts: ['top_management', 'sales'],
  },
];

const TemplateIcon = ({ template, onClick }) => {
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
        <p className="text-sm font-semibold text-gray-900">{template.label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{template.sublabel}</p>
      </div>
    </button>
  );
};

const TerkoviGallery = () => {
  const { user } = useAuth();
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
          Назад кон теркови
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
          Назад кон теркови
        </button>
        <PLAgreementForm />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Теркови</h2>
        <p className="text-sm text-gray-400 mt-0.5">Изберете терк за генерирање на документ</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {TEMPLATES.filter((t) => !t.depts || t.depts.includes(userDept)).map((t) => (
          <TemplateIcon key={t.id} template={t} onClick={() => openTemplate(t.id)} />
        ))}
      </div>
    </div>
  );
};

export default TerkoviGallery;
