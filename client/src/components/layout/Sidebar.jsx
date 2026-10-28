import { NavLink, useLocation } from 'react-router-dom';
import {
  TrendingUp, DollarSign, Building2,
  Users, ShieldCheck, Wrench, Settings, FlaskConical,
  Factory, Crown, Users2,
  ChevronRight, ClipboardList, GraduationCap, FileText,
  Scale, ShieldAlert, FolderKanban, FileSignature,
  Handshake, Target, Library, Wrench as ToolsIcon, ScanSearch,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import { canManage, hasSalesAccess, isTopManagement, canUsePackagingTool } from '../../utils/userTier.js';
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
  { value: 'safety',            icon: ShieldAlert },
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

// Collapsible group: inline submenu on mobile, hover flyout on desktop.
const NavGroup = ({ icon, label, items, onItemClick }) => {
  const IconCmp = icon;
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const totalBadge = items.reduce((sum, it) => sum + (it.badge || 0), 0);
  const anyActive = items.some(
    (it) => pathname === it.to || pathname.startsWith(it.to + '/')
  );

  const triggerCls = `relative flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer w-full ${
        anyActive
          ? 'bg-slate-100 text-slate-900 font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r-full before:bg-slate-700'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`;

  return (
    <div className="group relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className={triggerCls}>
        {IconCmp && <IconCmp size={15} className="flex-shrink-0" />}
        <span className="truncate text-left flex-1">{label}</span>
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
        <div className="md:hidden mt-0.5 space-y-0.5 pl-7">
          {items.map((item) => (
            <div key={item.to} onClick={onItemClick}>
              <NavItem to={item.to} icon={item.icon} label={item.label} badge={item.badge} />
            </div>
          ))}
        </div>
      )}

      {/* Desktop hover flyout */}
      <div className="hidden md:group-hover:block md:absolute md:left-full md:top-0 md:pl-1 md:z-50">
        <div className="w-56 bg-white border border-slate-200 rounded-md shadow-lg p-1.5 space-y-0.5 max-h-[80vh] overflow-y-auto">
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
  const { t: td } = useTranslation('dashboard');
  const { t: tp } = useTranslation('packaging');

  const { data: lhcOverview } = useLhcOverview();
  const lhcBadge = (lhcOverview?.myAssignments || []).filter(
    (a) => a?.campaign?.status === 'open' && a?.status !== 'completed'
  ).length;

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const showEmployeesItem = canManage(user) || user?.department === 'hr';

  // ── Submenus ───────────────────────────────────────────────────
  const resourceItems = [
    { to: '/projects',   icon: FolderKanban,  label: td('tabs.projects') },
    { to: '/terkovi',    icon: FileSignature, label: td('tabs.terkovi') },
    ...(hasSalesAccess(user)
      ? [
          { to: '/clients', icon: Handshake, label: td('tabs.clients') },
          { to: '/leads',   icon: Target,    label: td('tabs.leads') },
        ]
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
        {/* Brand — doubles as the home link */}
        <NavLink
          to="/dashboard"
          onClick={handleNavClick}
          className="block px-4 py-4 border-b border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <div className="text-sm font-semibold text-slate-800 leading-tight tracking-tight">
            {t('appName')}
          </div>
          <div className="mt-1 text-[11px] italic text-slate-400 leading-tight">
            {t('appTagline')}
          </div>
        </NavLink>

        <nav className="flex-1 flex flex-col p-2 overflow-y-auto md:overflow-y-visible space-y-0.5">
          {/* Main nav — the brand link above leads to the task board */}
          <div className="pt-1 space-y-0.5">
            <NavGroup
              icon={Library}
              label={t('navGroup.resources')}
              items={resourceItems}
              onItemClick={handleNavClick}
            />
            <div className="mx-3 my-2 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" aria-hidden="true" />
            <div onClick={handleNavClick}>
              <NavItem to="/agreements" icon={FileText} label={t('agreements')} />
            </div>
            <div onClick={handleNavClick}>
              <NavItem to="/procedures" icon={ClipboardList} label={t('procedures')} />
            </div>
            {canUsePackagingTool(user) && (
              <NavGroup
                icon={ToolsIcon}
                label={tp('toolsGroup')}
                items={[{ to: '/tools/packaging', icon: ScanSearch, label: tp('title') }]}
                onItemClick={handleNavClick}
              />
            )}
            <div onClick={handleNavClick}>
              <NavItem to="/trainings" icon={GraduationCap} label={t('trainings')} />
            </div>

            {showEmployeesItem && (
              <div onClick={handleNavClick}>
                <NavItem to="/employees" icon={Users2} label={t('employeesNav')} />
              </div>
            )}

            {isTopManagement(user) && (
              <div onClick={handleNavClick}>
                <NavItem to="/lhc" icon={Scale} label={t('compliance')} badge={lhcBadge} />
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
