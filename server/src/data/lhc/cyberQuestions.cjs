/**
 * Cyber Security Health Check - Questions and Configuration
 *
 * Categories cover basic but comprehensive cyber security assessment
 * for Macedonian SMEs. Questions are practical and actionable.
 */

// Industry definitions
const INDUSTRIES = {
  services: {
    id: 'services',
    name: 'Услуги',
    description: 'Консултантски услуги, агенции, професионални услуги'
  },
  manufacturing: {
    id: 'manufacturing',
    name: 'Производство / Фабрика',
    description: 'Производствени компании, фабрики, индустрија'
  },
  retail: {
    id: 'retail',
    name: 'Трговија на мало / големо',
    description: 'Продавници, дистрибуција, е-трговија'
  },
  hospitality: {
    id: 'hospitality',
    name: 'Угостителство / Туризам',
    description: 'Ресторани, хотели, туристички агенции'
  },
  construction: {
    id: 'construction',
    name: 'Градежништво / Инженеринг',
    description: 'Градежни компании, архитекти, инженери'
  },
  startup: {
    id: 'startup',
    name: 'Стартап / SaaS / ИТ',
    description: 'Технолошки стартапи, софтверски компании'
  },
  other: {
    id: 'other',
    name: 'Друго',
    description: 'Останати индустрии'
  }
};

// Industry weights per category (higher = more important for that industry)
const INDUSTRY_WEIGHTS = {
  device_security: {
    services: 1.1,
    manufacturing: 1.0,
    retail: 1.1,
    hospitality: 1.0,
    construction: 0.9,
    startup: 1.3,
    other: 1.0
  },
  data_protection: {
    services: 1.3,
    manufacturing: 1.0,
    retail: 1.4,
    hospitality: 1.2,
    construction: 0.9,
    startup: 1.4,
    other: 1.0
  },
  network_security: {
    services: 1.1,
    manufacturing: 1.2,
    retail: 1.3,
    hospitality: 1.3,
    construction: 0.8,
    startup: 1.4,
    other: 1.0
  },
  email_phishing: {
    services: 1.3,
    manufacturing: 1.0,
    retail: 1.2,
    hospitality: 1.1,
    construction: 1.0,
    startup: 1.2,
    other: 1.0
  },
  access_auth: {
    services: 1.2,
    manufacturing: 1.1,
    retail: 1.3,
    hospitality: 1.1,
    construction: 1.0,
    startup: 1.5,
    other: 1.0
  },
  employee_training: {
    services: 1.2,
    manufacturing: 1.1,
    retail: 1.2,
    hospitality: 1.2,
    construction: 1.0,
    startup: 1.1,
    other: 1.0
  },
  incident_management: {
    services: 1.1,
    manufacturing: 1.2,
    retail: 1.2,
    hospitality: 1.0,
    construction: 0.9,
    startup: 1.3,
    other: 1.0
  },
  physical_security: {
    services: 0.9,
    manufacturing: 1.3,
    retail: 1.2,
    hospitality: 1.1,
    construction: 1.2,
    startup: 0.8,
    other: 1.0
  },
  compliance_policies: {
    services: 1.2,
    manufacturing: 1.1,
    retail: 1.3,
    hospitality: 1.1,
    construction: 1.0,
    startup: 1.2,
    other: 1.0
  }
};

// Maturity levels (qualitative - no percentages shown to users)
const maturityLevels = {
  critical: {
    threshold: 0,
    label: 'Критично ниво на сајбер безбедност',
    class: 'critical',
    description: 'Вашата организација има сериозни безбедносни пропусти кои бараат итно внимание. Ризикот од сајбер напад или губење на податоци е многу висок.'
  },
  low: {
    threshold: 31,
    label: 'Низок степен на сајбер безбедност',
    class: 'low',
    description: 'Постојат значителни безбедносни пропусти кои треба да се адресираат. Препорачуваме итно преземање на основни безбедносни мерки.'
  },
  moderate: {
    threshold: 51,
    label: 'Умерено ниво на сајбер безбедност',
    class: 'moderate',
    description: 'Имате основна безбедносна заштита, но постои значителен простор за подобрување. Фокусирајте се на идентификуваните слабости.'
  },
  good: {
    threshold: 66,
    label: 'Добро ниво на сајбер безбедност',
    class: 'good',
    description: 'Вашата организација има солидна безбедносна основа. Продолжете со надградување и редовно ревидирање на безбедносните практики.'
  },
  strong: {
    threshold: 81,
    label: 'Високо ниво на сајбер безбедност',
    class: 'strong',
    description: 'Имате напредни безбедносни практики. Фокусирајте се на континуирано подобрување и следење на новите закани.'
  },
  excellent: {
    threshold: 91,
    label: 'Одлично ниво на сајбер безбедност',
    class: 'excellent',
    description: 'Вашата организација демонстрира примерна сајбер безбедност. Продолжете со одржување на високите стандарди и едукација на тимот.'
  }
};

// Categories with questions
const CATEGORIES = [
  {
    id: 'device_security',
    name: 'Основна безбедност на уреди',
    description: 'Лозинки, ажурирања, антивирус заштита',
    questions: [
      {
        id: 'dev_1',
        text: 'Дали сите компјутери и уреди во компанијата имаат инсталирано и ажурирано антивирус софтвер?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, сите уреди имаат ажуриран антивирус', score: 100 },
          { value: 'b', text: 'Повеќето уреди имаат антивирус', score: 70 },
          { value: 'c', text: 'Само некои уреди имаат антивирус', score: 30 },
          { value: 'd', text: 'Немаме антивирус софтвер', score: 0 }
        ]
      },
      {
        id: 'dev_2',
        text: 'Колку често се ажурираат оперативните системи и софтверите на работните уреди?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Автоматски или веднаш по излегување на ажурирање', score: 100 },
          { value: 'b', text: 'Редовно, барем еднаш месечно', score: 75 },
          { value: 'c', text: 'Повремено, кога ќе се сетиме', score: 30 },
          { value: 'd', text: 'Ретко или никогаш', score: 0 }
        ]
      },
      {
        id: 'dev_3',
        text: 'Дали работните компјутери се заклучуваат автоматски по период на неактивност?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, автоматски се заклучуваат по 5-10 минути', score: 100 },
          { value: 'b', text: 'Да, но по подолг период (над 15 минути)', score: 60 },
          { value: 'c', text: 'Зависи од вработениот', score: 30 },
          { value: 'd', text: 'Не, не се заклучуваат автоматски', score: 0 }
        ]
      },
      {
        id: 'dev_4',
        text: 'Дали вработените користат службени или приватни уреди за работа?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Само службени уреди со безбедносни политики', score: 100 },
          { value: 'b', text: 'Службени уреди, но без строги политики', score: 70 },
          { value: 'c', text: 'Мешавина од службени и приватни уреди', score: 40 },
          { value: 'd', text: 'Претежно приватни уреди без контрола', score: 10 }
        ]
      },
      {
        id: 'dev_5',
        text: 'Дали имате евиденција на сите уреди (компјутери, телефони, таблети) што се користат за работа?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, имаме целосна евиденција со редовно ажурирање', score: 100 },
          { value: 'b', text: 'Имаме делумна евиденција', score: 50 },
          { value: 'c', text: 'Немаме формална евиденција', score: 0 }
        ]
      }
    ]
  },
  {
    id: 'data_protection',
    name: 'Заштита на податоци',
    description: 'Бекап, енкрипција, контрола на пристап',
    questions: [
      {
        id: 'data_1',
        text: 'Колку често правите бекап (резервна копија) на важните податоци?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Дневно, автоматски', score: 100 },
          { value: 'b', text: 'Неделно', score: 70 },
          { value: 'c', text: 'Месечно', score: 40 },
          { value: 'd', text: 'Ретко или немаме бекап', score: 0 }
        ]
      },
      {
        id: 'data_2',
        text: 'Каде се чуваат вашите бекап податоци?',
        type: 'choice',
        options: [
          { value: 'a', text: 'На повеќе локации (локално + cloud)', score: 100 },
          { value: 'b', text: 'Само во cloud сервис', score: 75 },
          { value: 'c', text: 'Само локално (на истата локација)', score: 40 },
          { value: 'd', text: 'Немаме организиран бекап', score: 0 }
        ]
      },
      {
        id: 'data_3',
        text: 'Дали тестирате дали бекапот може успешно да се врати?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, редовно (барем квартално)', score: 100 },
          { value: 'b', text: 'Понекогаш', score: 50 },
          { value: 'c', text: 'Никогаш не сме тестирале', score: 0 }
        ]
      },
      {
        id: 'data_4',
        text: 'Дали чувствителните податоци (лични податоци, финансиски информации) се енкриптирани?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, сите чувствителни податоци се енкриптирани', score: 100 },
          { value: 'b', text: 'Делумно, некои податоци се енкриптирани', score: 50 },
          { value: 'c', text: 'Не, податоците не се енкриптирани', score: 0 }
        ]
      },
      {
        id: 'data_5',
        text: 'Дали имате дефинирано кој има пристап до кои податоци во компанијата?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, имаме јасно дефинирани нивоа на пристап', score: 100 },
          { value: 'b', text: 'Делумно дефинирано', score: 50 },
          { value: 'c', text: 'Сите имаат пристап до се', score: 0 }
        ]
      }
    ]
  },
  {
    id: 'network_security',
    name: 'Мрежна безбедност',
    description: 'WiFi безбедност, firewall, VPN',
    questions: [
      {
        id: 'net_1',
        text: 'Дали вашата WiFi мрежа е заштитена со силна лозинка (WPA2/WPA3)?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, користиме WPA2/WPA3 со силна лозинка', score: 100 },
          { value: 'b', text: 'Да, но лозинката е едноставна', score: 50 },
          { value: 'c', text: 'Не сум сигурен/а', score: 20 },
          { value: 'd', text: 'Мрежата е отворена или слабо заштитена', score: 0 }
        ]
      },
      {
        id: 'net_2',
        text: 'Дали имате одделна WiFi мрежа за гости/посетители?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, гостите користат одделна мрежа', score: 100 },
          { value: 'b', text: 'Не, сите користат иста мрежа', score: 30 },
          { value: 'c', text: 'Немаме WiFi за гости', score: 70 }
        ]
      },
      {
        id: 'net_3',
        text: 'Дали користите firewall за заштита на мрежата?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, имаме хардверски и/или софтверски firewall', score: 100 },
          { value: 'b', text: 'Само вградениот firewall на рутерот', score: 50 },
          { value: 'c', text: 'Не користиме firewall', score: 0 },
          { value: 'd', text: 'Не знам', score: 10 }
        ]
      },
      {
        id: 'net_4',
        text: 'Дали вработените користат VPN кога работат од дома или јавни мрежи?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, задолжително се користи VPN', score: 100 },
          { value: 'b', text: 'Понекогаш, зависи од вработениот', score: 40 },
          { value: 'c', text: 'Не користиме VPN', score: 0 },
          { value: 'd', text: 'Немаме работа од далечина', score: 70 }
        ]
      },
      {
        id: 'net_5',
        text: 'Колку често се менува лозинката за WiFi мрежата?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Редовно (на секои 3-6 месеци) или по заминување на вработен', score: 100 },
          { value: 'b', text: 'Понекогаш', score: 50 },
          { value: 'c', text: 'Никогаш од кога е поставена', score: 10 }
        ]
      }
    ]
  },
  {
    id: 'email_phishing',
    name: 'Е-пошта и фишинг заштита',
    description: 'Безбедност на е-пошта, препознавање на измами',
    questions: [
      {
        id: 'email_1',
        text: 'Дали користите професионална е-пошта (со домен на компанијата) или бесплатни сервиси?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Професионална е-пошта со безбедносни функции (Google Workspace, Microsoft 365)', score: 100 },
          { value: 'b', text: 'Професионална е-пошта без напредни безбедносни функции', score: 70 },
          { value: 'c', text: 'Бесплатни сервиси (Gmail, Yahoo)', score: 30 }
        ]
      },
      {
        id: 'email_2',
        text: 'Дали вашата е-пошта има вклучено филтрирање на спам и малициозни прилози?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, имаме напредно филтрирање', score: 100 },
          { value: 'b', text: 'Само основно спам филтрирање', score: 50 },
          { value: 'c', text: 'Не, немаме филтрирање', score: 0 },
          { value: 'd', text: 'Не знам', score: 20 }
        ]
      },
      {
        id: 'email_3',
        text: 'Дали вработените знаат како да препознаат фишинг (измамнички) е-пошти?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, имавме обука и редовно ги потсетуваме', score: 100 },
          { value: 'b', text: 'Делумно, некои вработени знаат', score: 50 },
          { value: 'c', text: 'Не, немавме обука за ова', score: 0 }
        ]
      },
      {
        id: 'email_4',
        text: 'Дали имате процедура за пријавување на сомнителни е-пошти?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, имаме јасна процедура и одговорно лице', score: 100 },
          { value: 'b', text: 'Неформално, вработените се јавуваат на колега', score: 50 },
          { value: 'c', text: 'Не, немаме процедура', score: 0 }
        ]
      },
      {
        id: 'email_5',
        text: 'Дали некогаш сте биле цел на фишинг напад или измама преку е-пошта?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, но го препознавме и не настрада ништо', score: 80 },
          { value: 'b', text: 'Да, и имавме последици (финансиски или податоци)', score: 20 },
          { value: 'c', text: 'Не, или не сме свесни за тоа', score: 60 }
        ]
      }
    ]
  },
  {
    id: 'access_auth',
    name: 'Пристап и автентикација',
    description: 'Двофакторска автентикација, политики за лозинки',
    questions: [
      {
        id: 'auth_1',
        text: 'Дали користите двофакторска автентикација (2FA) за важните системи?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, за сите важни системи и сервиси', score: 100 },
          { value: 'b', text: 'Само за некои системи', score: 50 },
          { value: 'c', text: 'Не користиме 2FA', score: 0 }
        ]
      },
      {
        id: 'auth_2',
        text: 'Дали имате политика за силни лозинки (минимум должина, комплексност)?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, и системски се применува', score: 100 },
          { value: 'b', text: 'Имаме препорака, но не се применува строго', score: 50 },
          { value: 'c', text: 'Немаме политика за лозинки', score: 0 }
        ]
      },
      {
        id: 'auth_3',
        text: 'Колку често вработените ги менуваат лозинките?',
        type: 'choice',
        options: [
          { value: 'a', text: 'На секои 3-6 месеци задолжително', score: 100 },
          { value: 'b', text: 'Годишно или по потреба', score: 60 },
          { value: 'c', text: 'Никогаш, освен ако не се заборави', score: 10 }
        ]
      },
      {
        id: 'auth_4',
        text: 'Што се случува со корисничките сметки кога вработен ја напушта компанијата?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Веднаш се деактивираат/бришат истиот ден', score: 100 },
          { value: 'b', text: 'Се деактивираат во рок од неколку дена', score: 60 },
          { value: 'c', text: 'Понекогаш остануваат активни подолго време', score: 20 },
          { value: 'd', text: 'Немаме процедура за ова', score: 0 }
        ]
      },
      {
        id: 'auth_5',
        text: 'Дали вработените делат лозинки или кориснички сметки?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Не, секој има свој акаунт и лозинка', score: 100 },
          { value: 'b', text: 'Понекогаш, за одредени системи', score: 40 },
          { value: 'c', text: 'Да, често делиме лозинки', score: 0 }
        ]
      }
    ]
  },
  {
    id: 'employee_training',
    name: 'Обука на вработени',
    description: 'Свесност за сајбер безбедност',
    questions: [
      {
        id: 'train_1',
        text: 'Дали вработените добиваат обука за сајбер безбедност?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, редовно (годишно или почесто)', score: 100 },
          { value: 'b', text: 'Само при вработување', score: 50 },
          { value: 'c', text: 'Немаме формална обука', score: 0 }
        ]
      },
      {
        id: 'train_2',
        text: 'Дали новите вработени добиваат упатства за безбедносните правила?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, како дел од онбордингот', score: 100 },
          { value: 'b', text: 'Неформално, од колегите', score: 40 },
          { value: 'c', text: 'Не, се снаоѓаат сами', score: 0 }
        ]
      },
      {
        id: 'train_3',
        text: 'Дали вработените знаат што да направат ако забележат безбедносен инцидент?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, имаме јасна процедура која сите ја знаат', score: 100 },
          { value: 'b', text: 'Некои знаат, други не', score: 40 },
          { value: 'c', text: 'Немаме дефинирана процедура', score: 0 }
        ]
      },
      {
        id: 'train_4',
        text: 'Како ги информирате вработените за нови безбедносни закани?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Редовно преку е-пошта, состаноци или интерен систем', score: 100 },
          { value: 'b', text: 'Повремено, кога ќе се сетиме', score: 40 },
          { value: 'c', text: 'Не ги информираме', score: 0 }
        ]
      },
      {
        id: 'train_5',
        text: 'Оценете ја општата свесност на вработените за сајбер безбедност:',
        type: 'scale',
        scaleDescription: '1 = Многу ниска свесност, 10 = Одлична свесност'
      }
    ]
  },
  {
    id: 'incident_management',
    name: 'Управување со инциденти',
    description: 'План за одговор, пријавување на инциденти',
    questions: [
      {
        id: 'inc_1',
        text: 'Дали имате план за одговор на сајбер безбедносни инциденти?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, имаме документиран план', score: 100 },
          { value: 'b', text: 'Имаме неформални процедури', score: 50 },
          { value: 'c', text: 'Немаме план', score: 0 }
        ]
      },
      {
        id: 'inc_2',
        text: 'Дали имате определено одговорно лице за сајбер безбедност?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, имаме ИТ/безбедносен одговорник', score: 100 },
          { value: 'b', text: 'Некој се грижи за тоа покрај другите задачи', score: 50 },
          { value: 'c', text: 'Немаме определено лице', score: 0 }
        ]
      },
      {
        id: 'inc_3',
        text: 'Дали имате договор со надворешна ИТ/безбедносна компанија за поддршка?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, имаме редовна соработка', score: 100 },
          { value: 'b', text: 'Имаме контакт, но без формален договор', score: 50 },
          { value: 'c', text: 'Не, немаме надворешна поддршка', score: 20 }
        ]
      },
      {
        id: 'inc_4',
        text: 'Дали некогаш сте имале сајбер безбедносен инцидент (вирус, ransomware, хакирање)?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, и успешно го решивме', score: 70 },
          { value: 'b', text: 'Да, и имавме значителни последици', score: 30 },
          { value: 'c', text: 'Не, или не сме свесни за тоа', score: 60 }
        ]
      },
      {
        id: 'inc_5',
        text: 'Дали водите евиденција на безбедносни инциденти и проблеми?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, документираме се', score: 100 },
          { value: 'b', text: 'Само поголемите инциденти', score: 50 },
          { value: 'c', text: 'Не водиме евиденција', score: 0 }
        ]
      }
    ]
  },
  {
    id: 'physical_security',
    name: 'Физичка безбедност',
    description: 'Безбедност на просториите, заштита од кражба',
    questions: [
      {
        id: 'phys_1',
        text: 'Дали серверите и мрежната опрема се наоѓаат во заклучена просторија?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, со ограничен пристап', score: 100 },
          { value: 'b', text: 'Делумно заштитени', score: 50 },
          { value: 'c', text: 'Не, достапни се на сите', score: 0 },
          { value: 'd', text: 'Немаме сервери на локација (cloud)', score: 80 }
        ]
      },
      {
        id: 'phys_2',
        text: 'Дали имате систем за контрола на пристап до канцелариите (картички, клучеви)?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, со евиденција на влезови', score: 100 },
          { value: 'b', text: 'Да, но без евиденција', score: 60 },
          { value: 'c', text: 'Не, отворен пристап', score: 20 }
        ]
      },
      {
        id: 'phys_3',
        text: 'Дали лаптопите и мобилните уреди се обезбедени од кражба?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, имаме политики и физичко обезбедување', score: 100 },
          { value: 'b', text: 'Вработените се одговорни за своите уреди', score: 50 },
          { value: 'c', text: 'Немаме посебни мерки', score: 20 }
        ]
      },
      {
        id: 'phys_4',
        text: 'Дали се уништуваат правилно старите хард дискови и документи со чувствителни податоци?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, имаме процедура за безбедно уништување', score: 100 },
          { value: 'b', text: 'Понекогаш', score: 40 },
          { value: 'c', text: 'Не, само ги фрламе', score: 0 }
        ]
      },
      {
        id: 'phys_5',
        text: 'Дали посетителите се регистрираат и придружуваат во просториите?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, секогаш', score: 100 },
          { value: 'b', text: 'Понекогаш, зависи од посетителот', score: 50 },
          { value: 'c', text: 'Не, слободно се движат', score: 10 }
        ]
      }
    ]
  },
  {
    id: 'compliance_policies',
    name: 'Усогласеност и политики',
    description: 'Безбедносни политики, заштита на лични податоци',
    questions: [
      {
        id: 'comp_1',
        text: 'Дали имате напишана политика за сајбер безбедност?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, и редовно се ажурира', score: 100 },
          { value: 'b', text: 'Да, но не е ажурирана долго време', score: 50 },
          { value: 'c', text: 'Немаме формална политика', score: 0 }
        ]
      },
      {
        id: 'comp_2',
        text: 'Дали сте усогласени со Законот за заштита на лични податоци (GDPR/ЗЗЛП)?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, целосно усогласени', score: 100 },
          { value: 'b', text: 'Делумно усогласени', score: 50 },
          { value: 'c', text: 'Не сме сигурни / Не сме усогласени', score: 10 }
        ]
      },
      {
        id: 'comp_3',
        text: 'Дали имате определено офицер за заштита на лични податоци (DPO)?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да', score: 100 },
          { value: 'b', text: 'Не, но некој ги има тие задачи', score: 50 },
          { value: 'c', text: 'Не', score: 0 },
          { value: 'd', text: 'Не сме обврзани по закон', score: 70 }
        ]
      },
      {
        id: 'comp_4',
        text: 'Дали имате политика за прифатливо користење на ИТ ресурсите од вработените?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Да, сите вработени ја потпишале', score: 100 },
          { value: 'b', text: 'Имаме неформални правила', score: 40 },
          { value: 'c', text: 'Немаме таква политика', score: 0 }
        ]
      },
      {
        id: 'comp_5',
        text: 'Колку често ги ревидирате безбедносните политики и процедури?',
        type: 'choice',
        options: [
          { value: 'a', text: 'Годишно или почесто', score: 100 },
          { value: 'b', text: 'На секои 2-3 години', score: 50 },
          { value: 'c', text: 'Никогаш од кога се напишани', score: 10 },
          { value: 'd', text: 'Немаме политики за ревизија', score: 0 }
        ]
      }
    ]
  }
];

// Category labels in Macedonian for reports
const CATEGORY_LABELS = {
  device_security: 'Безбедност на уреди',
  data_protection: 'Заштита на податоци',
  network_security: 'Мрежна безбедност',
  email_phishing: 'Е-пошта и фишинг',
  access_auth: 'Пристап и автентикација',
  employee_training: 'Обука на вработени',
  incident_management: 'Управување со инциденти',
  physical_security: 'Физичка безбедност',
  compliance_policies: 'Усогласеност и политики'
};

module.exports = {
  INDUSTRIES,
  INDUSTRY_WEIGHTS,
  CATEGORIES,
  CATEGORY_LABELS,
  maturityLevels
};
