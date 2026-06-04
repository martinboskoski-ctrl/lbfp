// Contract register reference data — mirrors the "Шифрарник" tab of
// Регистар_на_договори_ЛБФП and §10 of the contract-management procedure.
// Class values are stored verbatim (Macedonian) on each agreement's `contractClass`.

// Тип на документ
export const DOCUMENT_TYPES = [
  { value: 'contract', label: 'Договор' },
  { value: 'annex',    label: 'Анекс' },
  { value: 'other',    label: 'Друг документ' },
];

// Времетраење
export const DURATION_TYPES = [
  { value: 'fixed',      label: 'Определено времетраење' },
  { value: 'indefinite', label: 'Неопределено времетраење' },
];

// Статус (procedure §10). `expiring_soon` is a computed-only status (not selectable).
export const REGISTER_STATUSES = [
  { value: 'active',       label: 'Активен' },
  { value: 'negotiating',  label: 'Во преговори' },
  { value: 'for_renewal',  label: 'За продолжување' },
  { value: 'renewing',     label: 'Во продолжување' },
  { value: 'expired',      label: 'Истечен' },
  { value: 'terminated',   label: 'Раскинат' },
  { value: 'archived',     label: 'Архивиран' },
  { value: 'draft',        label: 'Нацрт' },
  { value: 'renewed',      label: 'Обновен' },
];

export const STATUS_LABEL = Object.fromEntries(REGISTER_STATUSES.map((s) => [s.value, s.label]));
STATUS_LABEL.expiring_soon = 'Истекува наскоро';

// Маппинг на сектор (department) → клучот на листата на класи.
// administration ползува листа од finance; carina ползува листа од nabavki.
export const deptToClassKey = (dept) => {
  if (dept === 'administration') return 'finance';
  if (dept === 'carina')         return 'nabavki';
  return dept;
};

// Класи / Предмет на договор по сектор.
export const CONTRACT_CLASSES = {
  sales: [
    'Private Label договор',
    'Договор за продажба / испорака (купувач)',
    'Дистрибутивен договор',
    'Договор за деловна соработка (клиент)',
    'Договор за учество на саем / изложба',
    'Договор за доверливост (NDA) – клиент',
    'Друг документ',
  ],
  finance: [
    'Банкарски / кредитен договор',
    'Договор за лизинг',
    'Договор за осигурување',
    'Договор за ревизија',
    'Договор за правни / адвокатски услуги (retainer)',
    'Договор за сметководствени / даночни услуги',
    'Договор за IT / софтвер / лиценци',
    'Договор за телекомуникации',
    'Договор за службено возило',
    'Договор за закуп на недвижност',
    'Интеркомпаниски договор (ЛУБ)',
    'Друг / недефиниран договор (општо правило)',
  ],
  hr: [
    'Договор за вработување',
    'Анекс на договор за вработување',
    'Договор на дело',
    'Авторски договор',
    'Договор за деловна соработка (freelance)',
    'Договор за пракса / волонтирање',
    'Договор за обука / едукација',
    'Друг документ',
  ],
  nabavki: [
    'Договор за набавка на суровини',
    'Договор за набавка на амбалажа',
    'Договор со печатница',
    'Рамковен договор со добавувач',
    'Договор за шпедиција / царинско застапување',
    'Друг документ',
  ],
  machines: [
    'Договор за сервис / одржување на машини',
    'Договор за набавка на резервни делови',
    'Гарантен договор',
    'Договор за калибрација',
    'Друг документ',
  ],
  facility: [
    'Градежен договор / изведба',
    'Договор за реконструкција / адаптација',
    'Договор за мебел / опремување',
    'Договор за управување со отпад',
    'Договор за чистење / хигиена на објект',
    'Договор за комунални услуги',
    'Друг документ',
  ],
  production: [
    'Договор за транспорт / логистика',
    'Договор за складирање',
    'Договор за услуги поврзани со производство',
    'Договор за изнајмување опрема (производство)',
    'Друг документ',
  ],
  quality_assurance: [
    'Договор со акредитирана лабораторија',
    'Договор за анализи / тестирање',
    'Договор за дератизација, дезинфекција, дезинсекција (DDD)',
    'Договор за калибрација на мерна опрема',
    'Друг документ',
  ],
  r_and_d: [
    'Договор за истражување и развој',
    'Договор за набавка на опрема (нови решенија)',
    'Договор за тестирање / мостри',
    'Договор за доверливост (NDA) – развој',
    'Друг документ',
  ],
  safety: [
    'Договор за БЗР (надворешен соработник)',
    'Договор за противпожарна заштита',
    'Договор за сертификација (ISO 9001 / 14001 / 45001)',
    'Договор за сертификација (HACCP / безбедност на храна)',
    'Договор за обуки за БЗР',
    'Договор за медицина на труд (БЗР прегледи)',
    'Друг документ',
  ],
};

// Helper: class options for a given department (empty list when unknown / top mgmt).
export const classesForDept = (dept) => CONTRACT_CLASSES[deptToClassKey(dept)] || [];

export const DOC_TYPE_LABEL = Object.fromEntries(DOCUMENT_TYPES.map((d) => [d.value, d.label]));
export const DURATION_LABEL = Object.fromEntries(DURATION_TYPES.map((d) => [d.value, d.label]));
