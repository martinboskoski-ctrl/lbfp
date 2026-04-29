import { NavLink, useSearchParams } from 'react-router-dom';
import {
  TrendingUp, DollarSign, Building2,
  Users, ShieldCheck, Wrench, Settings, FlaskConical,
  Factory, Crown, LogOut, Users2, Globe, UserPlus,
  ChevronDown, ClipboardList, GraduationCap, FileText,
  Megaphone, CalendarClock, Wrench as WrenchIcon, BarChart3,
  Scale,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import { canManage, isTopManagement } from '../../utils/userTier.js';
import { useUpdateLanguage } from '../../hooks/useUsers.js';
import { useLhcOverview } from '../../hooks/useLhc.js';
import ChangePasswordModal from './ChangePasswordModal.jsx';
import i18next from 'i18next';

export const DEPARTMENTS = [
  { value: 'top_management',    icon: Crown       },
  { value: 'sales',             icon: TrendingUp  },
  { value: 'finance',           icon: DollarSign  },
  { value: 'administration',    icon: Building2   },
  { value: 'hr',                icon: Users2      },
  { value: 'quality_assurance', icon: ShieldCheck },
  { value: 'facility',          icon: Building2   },
  { value: 'machines',          icon: Settings    },
  { value: 'r_and_d',           icon: FlaskConical },
  { value: 'production',        icon: Factory     },
  { value: 'carina',            icon: Wrench      },
  { value: 'nabavki',           icon: Factory     },
];

const NavItem = ({ to, icon: Icon, label, end, badge }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
        isActive
          ? 'bg-slate-100 text-slate-900 font-medium'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`
    }
  >
    <Icon size={15} className="flex-shrink-0" />
    <span className="truncate flex-1">{label}</span>
    {badge > 0 && (
      <span className="text-[10px] font-semibold min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-slate-700 text-white">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </NavLink>
);

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation('common');
  const updateLang = useUpdateLanguage();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deptsOpen, setDeptsOpen] = useState(false);

  const { data: lhcOverview } = useLhcOverview();
  const lhcBadge = (lhcOverview?.myAssignments || []).filter(
    (a) => a?.campaign?.status === 'open' && a?.status !== 'completed'
  ).length;

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const toggleLanguage = () => {
    const newLang = i18next.language === 'mk' ? 'en' : 'mk';
    i18next.changeLanguage(newLang);
    localStorage.setItem('packflow_lang', newLang);
    updateLang.mutate(newLang);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/40"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:w-56 md:z-auto md:transition-none
      `}>
        <div className="px-4 py-4 border-b border-slate-200">
          <span className="text-sm font-semibold text-slate-800 leading-tight tracking-tight">ЛБФП ДОО<br /><span className="text-slate-500 font-normal">Битола</span></span>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto space-y-0.5">
          {/* Departments section */}
          {isTopManagement(user) ? (
            <>
              <button
                onClick={() => setDeptsOpen((v) => !v)}
                className="flex items-center justify-between w-full pt-2 pb-1 px-3 group"
              >
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider group-hover:text-slate-600 transition-colors">
                  {t('departments')}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-200 ${deptsOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {deptsOpen && (
                <div className="space-y-0.5">
                  {DEPARTMENTS.map((dept) => (
                    <div key={dept.value} onClick={handleNavClick}>
                      <NavItem
                        to={`/dashboard?dept=${dept.value}`}
                        icon={dept.icon}
                        label={t(`dept.${dept.value}`)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-0.5 pt-1">
              {DEPARTMENTS.filter((d) => d.value === user?.department).map((dept) => (
                <div key={dept.value} onClick={handleNavClick}>
                  <NavItem
                    to={`/dashboard?dept=${dept.value}`}
                    icon={dept.icon}
                    label={t(`dept.${dept.value}`)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Static nav items */}
          <div className="pt-3 space-y-0.5">
            <div onClick={handleNavClick}>
              <NavItem to="/procedures" icon={ClipboardList} label={t('procedures')} />
            </div>
            <div onClick={handleNavClick}>
              <NavItem to="/trainings" icon={GraduationCap} label={t('trainings')} />
            </div>
            <div onClick={handleNavClick}>
              <NavItem to="/requests" icon={FileText} label={t('requests')} />
            </div>
            <div onClick={handleNavClick}>
              <NavItem to="/announcements" icon={Megaphone} label={t('announcements')} />
            </div>
            <div onClick={handleNavClick}>
              <NavItem to="/shifts" icon={CalendarClock} label={t('shifts')} />
            </div>
            <div onClick={handleNavClick}>
              <NavItem to="/maintenance" icon={WrenchIcon} label={t('maintenance')} />
            </div>
            <div onClick={handleNavClick}>
              <NavItem to="/agreements" icon={FileText} label="Договори" />
            </div>
            <div onClick={handleNavClick}>
              <NavItem to="/lhc" icon={Scale} label="Усогласеност" badge={lhcBadge} />
            </div>
            {(isTopManagement(user) || user?.department === 'production') && (
              <div onClick={handleNavClick}>
                <NavItem to="/production-report" icon={BarChart3} label={t('productionReport')} />
              </div>
            )}
            {(canManage(user) || user?.department === 'hr') && (
              <div onClick={handleNavClick}>
                <NavItem to="/employees" icon={Users2} label="Вработени" />
              </div>
            )}
          </div>

          {user?.role === 'admin' && (
            <>
              <div className="pt-3 pb-1 px-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {t('administration')}
                </span>
              </div>
              <div onClick={handleNavClick}>
                <NavItem to="/admin/users" icon={Users} label={t('users')} />
              </div>
            </>
          )}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full text-left px-2 py-1.5 text-xs mb-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            title={t('changePassword')}
          >
            <div className="font-medium text-slate-800">{user?.name}</div>
            <div className="text-slate-500">
              {t(`dept.${user?.department}`, { defaultValue: user?.department })}
            </div>
            {user?.isManager && (
              <div className="text-slate-600 mt-0.5">{t('manager')}</div>
            )}
          </button>
          {isTopManagement(user) && (
            <div onClick={handleNavClick}>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors mb-0.5 ${
                    isActive ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                <UserPlus size={14} />
                {t('registerUser')}
              </NavLink>
            </div>
          )}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-50 transition-colors mb-0.5"
          >
            <Globe size={14} />
            {i18next.language === 'mk' ? 'EN' : 'MK'}
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <LogOut size={14} />
            {t('logout')}
          </button>
        </div>
      </aside>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </>
  );
};

export default Sidebar;
