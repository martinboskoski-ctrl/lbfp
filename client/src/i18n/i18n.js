import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// MK namespaces
import mkCommon from './locales/mk/common.json';
import mkAuth from './locales/mk/auth.json';
import mkDashboard from './locales/mk/dashboard.json';
import mkTasks from './locales/mk/tasks.json';
import mkAgreements from './locales/mk/agreements.json';
import mkLeads from './locales/mk/leads.json';
import mkPo from './locales/mk/po.json';
import mkProjects from './locales/mk/projects.json';
import mkTerkovi from './locales/mk/terkovi.json';
import mkNotifications from './locales/mk/notifications.json';
import mkRequests from './locales/mk/requests.json';
import mkAnnouncements from './locales/mk/announcements.json';
import mkShifts from './locales/mk/shifts.json';
import mkMaintenance from './locales/mk/maintenance.json';
import mkProduction from './locales/mk/production.json';

// EN namespaces
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enTasks from './locales/en/tasks.json';
import enAgreements from './locales/en/agreements.json';
import enLeads from './locales/en/leads.json';
import enPo from './locales/en/po.json';
import enProjects from './locales/en/projects.json';
import enTerkovi from './locales/en/terkovi.json';
import enNotifications from './locales/en/notifications.json';
import enRequests from './locales/en/requests.json';
import enAnnouncements from './locales/en/announcements.json';
import enShifts from './locales/en/shifts.json';
import enMaintenance from './locales/en/maintenance.json';
import enProduction from './locales/en/production.json';

i18n.use(initReactI18next).init({
  lng: localStorage.getItem('packflow_lang') || 'mk',
  fallbackLng: 'mk',
  interpolation: { escapeValue: false },
  resources: {
    mk: {
      common: mkCommon,
      auth: mkAuth,
      dashboard: mkDashboard,
      tasks: mkTasks,
      agreements: mkAgreements,
      leads: mkLeads,
      po: mkPo,
      projects: mkProjects,
      terkovi: mkTerkovi,
      notifications: mkNotifications,
      requests: mkRequests,
      announcements: mkAnnouncements,
      shifts: mkShifts,
      maintenance: mkMaintenance,
      production: mkProduction,
    },
    en: {
      common: enCommon,
      auth: enAuth,
      dashboard: enDashboard,
      tasks: enTasks,
      agreements: enAgreements,
      leads: enLeads,
      po: enPo,
      projects: enProjects,
      terkovi: enTerkovi,
      notifications: enNotifications,
      requests: enRequests,
      announcements: enAnnouncements,
      shifts: enShifts,
      maintenance: enMaintenance,
      production: enProduction,
    },
  },
  defaultNS: 'common',
});

export default i18n;
