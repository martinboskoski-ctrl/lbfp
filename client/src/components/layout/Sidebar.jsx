import { NavLink, useLocation } from 'react-router-dom';
import {
  TrendingUp, DollarSign, Building2,
  Users, ShieldCheck, Wrench, Settings, FlaskConical,
  Factory, Crown, Users2,
  ChevronDown, ChevronRight, ClipboardList, GraduationCap, FileText,
  Megaphone, CalendarClock, Wrench as WrenchIcon, BarChart3,
  Scale,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import { canManage, isTopManagement } from '../../utils/userTier.js';
import { useLhcOverview } from '../../hooks/useLhc.js';

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

const NavItem = ({ to, icon, label, end, badge }) => {
  const IconCmp = icon;
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `relative flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
          isActive
            ? 'bg-slate-100 text-slate-900 font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r-full before:bg-slate-700'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`
      }
    >
      <IconCmp size={15} className="flex-shrink-0" />
      <span className="truncate flex-1">{label}</span>
      {badge > 0 && (
        <span className="text-[10px] font-semibold min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-slate-700 text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </NavLink>
  );
};

const NavGroup = ({ icon, label, items, onItemClick }) => {
  const IconCmp = icon;
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const totalBadge = items.reduce((sum, it) => sum + (it.badge || 0), 0);
  const anyActive = items.some(
    (it) => pathname === it.to || pathname.startsWith(it.to + '/')
  );

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer w-full ${
          anyActive
            ? 'bg-slate-100 text-slate-900 font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r-full before:bg-slate-700'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <IconCmp size={15} className="flex-shrink-0" />
        <span className="truncate flex-1 text-left">{label}</span>
        {totalBadge > 0 && (
          <span className="text-[10px] font-semibold min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-slate-700 text-white">
            {totalBadge > 99 ? '99+' : totalBadge}
          </span>
        )}
        <ChevronRight
          size={14}
          className={`text-slate-400 transition-transform md:group-hover:rotate-90 ${open ? 'rotate-90 md:rotate-0' : ''}`}
        />
      </button>

      {/* Mobile inline submenu */}
      {open && (
        <div className="md:hidden pl-7 mt-0.5 space-y-0.5">
          {items.map((item) => (
            <div key={item.to} onClick={onItemClick}>
              <NavItem to={item.to} icon={item.icon} label={item.label} badge={item.badge} />
            </div>
          ))}
        </div>
      )}

      {/* Desktop hover flyout — sits flush against the sidebar so the mouse can travel into it */}
      <div className="hidden md:group-hover:block md:absolute md:left-full md:top-0 md:pl-1 md:z-50">
        <div className="w-56 bg-white border border-slate-200 rounded-md shadow-lg p-1.5 space-y-0.5">
          <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {label}
          </div>
          {items.map((item) => (
            <div key={item.to} onClick={onItemClick}>
              <NavItem to={item.to} icon={item.icon} label={item.label} badge={item.badge} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { t } = useTranslation('common');
  const [deptsOpen, setDeptsOpen] = useState(false);

  const { data: lhcOverview } = useLhcOverview();
  const lhcBadge = (lhcOverview?.myAssignments || []).filter(
    (a) => a?.campaign?.status === 'open' && a?.status !== 'completed'
  ).length;

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const showProductionReports = isTopManagement(user) || user?.department === 'production';
  const showEmployeesItem = canManage(user) || user?.department === 'hr';

  // ── Submenus ───────────────────────────────────────────────────
  const legalItems = [
    { to: '/procedures', icon: ClipboardList,  label: t('procedures') },
    { to: '/trainings',  icon: GraduationCap,  label: t('trainings') },
    { to: '/lhc',        icon: Scale,          label: t('compliance'), badge: lhcBadge },
    { to: '/agreements', icon: FileText,       label: t('agreements') },
  ];

  const productionItems = [
    { to: '/maintenance', icon: WrenchIcon,    label: t('maintenance') },
    { to: '/shifts',      icon: CalendarClock, label: t('shifts') },
    ...(showProductionReports
      ? [{ to: '/production-report', icon: BarChart3, label: t('productionReport') }]
      : []),
  ];

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
        <NavLink
          to="/"
          onClick={handleNavClick}
          className="block px-4 py-4 border-b border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <div className="text-sm font-semibold text-slate-800 leading-tight tracking-tight">
            ЛБФП ДОО
            <span className="block text-slate-500 font-normal">{t('appCity')}</span>
          </div>
          <div className="mt-1 text-[11px] italic text-slate-400 leading-tight">
            {t('appTagline')}
          </div>
        </NavLink>

        <nav className="flex-1 p-2 overflow-y-auto md:overflow-y-visible space-y-0.5">
          {/* Departments */}
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

          {/* Static nav — new structured order */}
          <div className="pt-3 space-y-0.5">
            <div onClick={handleNavClick}>
              <NavItem to="/announcements" icon={Megaphone} label={t('announcements')} />
            </div>
            <div onClick={handleNavClick}>
              <NavItem to="/requests" icon={FileText} label={t('requests')} />
            </div>

            <NavGroup
              icon={Scale}
              label={t('navGroup.legal')}
              items={legalItems}
              onItemClick={handleNavClick}
            />

            <NavGroup
              icon={Factory}
              label={t('navGroup.production')}
              items={productionItems}
              onItemClick={handleNavClick}
            />

            {showEmployeesItem && (
              <div onClick={handleNavClick}>
                <NavItem to="/employees" icon={Users2} label={t('employeesNav')} />
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
      </aside>
    </>
  );
};

export default Sidebar;
