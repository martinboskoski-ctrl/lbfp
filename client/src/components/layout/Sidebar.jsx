import { NavLink, useSearchParams } from 'react-router-dom';
import {
  TrendingUp, DollarSign, Building2,
  Users, ShieldCheck, Wrench, Settings, FlaskConical,
  Factory, Crown, LogOut, Users2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { canManage, isTopManagement } from '../../utils/userTier.js';

export const DEPARTMENTS = [
  { value: 'top_management',    label: 'Топ менаџмент',           icon: Crown       },
  { value: 'sales',             label: 'Продажба',                icon: TrendingUp  },
  { value: 'finance',           label: 'Финансии',                icon: DollarSign  },
  { value: 'administration',    label: 'Администрација',          icon: Building2   },
  { value: 'hr',                label: 'Човечки ресурси',         icon: Users2      },
  { value: 'quality_assurance', label: 'Обезбедување квалитет',   icon: ShieldCheck },
  { value: 'facility',          label: 'Објект',                  icon: Building2   },
  { value: 'machines',          label: 'Машини',                  icon: Settings    },
  { value: 'r_and_d',           label: 'Истражување и развој',    icon: FlaskConical },
  { value: 'production',        label: 'Производство',            icon: Factory     },
  { value: 'carina',            label: 'Царина',                  icon: Wrench      },
  { value: 'nabavki',           label: 'Набавки (суровини и амбалажа)', icon: Factory },
];

const NavItem = ({ to, icon: Icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`
    }
  >
    <Icon size={15} className="flex-shrink-0" />
    <span className="truncate">{label}</span>
  </NavLink>
);

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const handleNavClick = () => {
    if (onClose) onClose();
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
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:w-52 md:z-auto md:transition-none
      `}>
        <div className="px-4 py-4 border-b border-gray-200">
          <span className="text-base font-bold text-blue-700 leading-tight">ЛБФП ДОО<br />Битола</span>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto space-y-0.5">
          <div className="pt-2 pb-1 px-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Одделенија
            </span>
          </div>

          {(isTopManagement(user)
            ? DEPARTMENTS
            : DEPARTMENTS.filter((d) => d.value === user?.department)
          ).map((dept) => (
            <div key={dept.value} onClick={handleNavClick}>
              <NavItem
                to={`/dashboard?dept=${dept.value}`}
                icon={dept.icon}
                label={dept.label}
              />
            </div>
          ))}

          {user?.role === 'admin' && (
            <>
              <div className="pt-3 pb-1 px-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Администрација
                </span>
              </div>
              <div onClick={handleNavClick}>
                <NavItem to="/admin/users" icon={Users} label="Корисници" />
              </div>
            </>
          )}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <div className="px-2 py-1.5 text-xs mb-1">
            <div className="font-medium text-gray-700">{user?.name}</div>
            <div className="text-gray-400">
              {DEPARTMENTS.find((d) => d.value === user?.department)?.label || user?.department}
            </div>
            {user?.isManager && (
              <div className="text-blue-500 font-medium mt-0.5">Менаџер</div>
            )}
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={14} />
            Одјави се
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
