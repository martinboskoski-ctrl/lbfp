import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';

/* ───── TABS ───── */
const TABS = [
  { id: 'content', label: 'Содржина', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
  { id: 'presentation', label: 'Презентација', icon: 'M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5' },
  { id: 'video', label: 'Видео', icon: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z' },
  { id: 'test', label: 'Тест', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'downloads', label: 'Материјали', icon: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12M12 16.5V3' },
];

/* ───── PRESENTATION SLIDES DATA ───── */
const SLIDES = [
  {
    title: 'Обука за спречување на корупција',
    subtitle: 'Сектор за набавки | Времетраење: 60 минути',
    type: 'cover',
  },
  {
    title: 'Агенда на обуката',
    items: [
      { time: '10 мин', topic: 'Вовед: Што е корупција?', desc: 'Дефиниции, форми и зошто е важно' },
      { time: '15 мин', topic: 'Видови корупција', desc: 'Поткуп, изнуда, проневера, конфликт на интереси' },
      { time: '10 мин', topic: 'Ризици во набавките', desc: 'Реални примери и ситуации' },
      { time: '10 мин', topic: 'Законска рамка', desc: 'Македонски закони и меѓународни стандарди' },
      { time: '10 мин', topic: 'Интерни политики', desc: 'Нашите процедури и правила' },
      { time: '5 мин', topic: 'Пријавување', desc: 'Како и каде да пријавите' },
    ],
    type: 'agenda',
  },
  {
    title: 'Што е корупција?',
    definition: 'Корупцијата е злоупотреба на доверената моќ или позиција за стекнување лична корист — финансиска или друга.',
    source: 'Transparency International',
    forms: ['Поткуп (мито)', 'Изнуда', 'Проневера', 'Конфликт на интереси', 'Фаворизирање', 'Перење пари'],
    type: 'definition',
  },
  {
    title: 'Зошто мора да се спречи?',
    cards: [
      { icon: '⚖️', label: 'Законски последици', desc: 'Казни до 10 години затвор и парични глоби' },
      { icon: '🏢', label: 'Штета за компанијата', desc: 'Губење лиценци, партнери и репутација' },
      { icon: '👤', label: 'Штета за вработените', desc: 'Губење работно место, кривична одговорност' },
      { icon: '📋', label: 'Ревизорски ризик', desc: 'Негативен извештај, губење сертификати' },
    ],
    type: 'why',
  },
  {
    title: 'Поткуп (мито)',
    desc: 'Нудење, давање, барање или примање на нешто од вредност со цел да се влијае на деловна одлука.',
    example: 'Добавувач на амбалажа ви нуди 500 EUR во готовина за да го изберете. Или, добавувач на суровини ви плаќа „провизија" од 3% за секоја нарачка.',
    bullets: ['Готовина или парични трансфери', 'Скапи подароци (електроника, накит, патувања)', 'Услуги (бесплатни ремонти, вработување на роднини)', 'Угостителски понуди (скапи вечери, патувања)'],
    type: 'corruption_type',
    color: 'amber',
  },
  {
    title: 'Изнуда',
    desc: 'Користење закани, притисок или моќ за да се принуди некое лице да даде пари, услуга или друга корист.',
    example: 'Вработен во набавки му кажува на добавувач: „Ако не ми дадеш попуст од 10% за мене лично, ќе го раскинам договорот."',
    bullets: ['Закани за прекин на деловен однос', 'Условување потпишување договор со лична корист', 'Притисок да се прифати понуда без тендер', 'Барање „подароци" за нормално работење'],
    type: 'corruption_type',
    color: 'red',
  },
  {
    title: 'Проневера',
    desc: 'Присвојување на средства кои се доверени на вработениот за лична корист.',
    example: 'Вработен нарачува суровини за 100.000 МКД, но на фактурата пишува 120.000 МКД — разликата ја задржува за себе.',
    bullets: ['Фалсификување на фактури и сметки', 'Фиктивни добавувачи или набавки', 'Присвојување на готовински средства', 'Злоупотреба на корпоративна картица'],
    type: 'corruption_type',
    color: 'purple',
  },
  {
    title: 'Конфликт на интереси',
    desc: 'Личниот интерес на вработениот е во судир со интересите на компанијата.',
    examples: [
      { label: 'Пример 1', text: 'Вработен ја избира фирмата на неговиот брат како добавувач, без конкурентски понуди.' },
      { label: 'Пример 2', text: 'Менаџер за набавки има удел во фирма-добавувач и ги насочува нарачките кон таа фирма.' },
    ],
    solution: 'Секогаш пријавете го конфликтот на интереси кај вашиот претпоставен. Транспарентноста е клуч!',
    type: 'conflict',
  },
  {
    title: 'Црвени знамиња во набавките',
    flags: [
      { text: 'Добавувачот инсистира на плаќање во готовина', risk: 'Висок' },
      { text: 'Цените се значително повисоки од пазарните', risk: 'Висок' },
      { text: 'Само еден добавувач е секогаш избран', risk: 'Среден' },
      { text: 'Добавувачот нуди скапи подароци или патувања', risk: 'Висок' },
      { text: 'Набавките се делат за да се избегне тендер', risk: 'Среден' },
      { text: 'Фактурите не се совпаѓаат со нарачките', risk: 'Висок' },
      { text: 'Вработен одбива ротација или одмор', risk: 'Среден' },
    ],
    type: 'red_flags',
  },
  {
    title: 'Ситуација за дискусија #1',
    scenario: 'Вие сте одговорен/а за набавка на пластична амбалажа. Еден добавувач ви праќа „новогодишен подарок" — часовник вреден 800 EUR. Истовремено, неговата понуда е за 5% поскапа од конкуренцијата.',
    question: 'Што правите?',
    hint: 'Дали е ова само подарок? Или обид за влијание?',
    answer: 'Го одбивате подарокот, го пријавувате случајот и продолжувате со објективна евалуација на понудите.',
    type: 'discussion',
  },
  {
    title: 'Ситуација за дискусија #2',
    scenario: 'Вашиот колега ви кажува дека „договорил" со добавувач на шеќер цена која е 15% пониска од пазарната. Но, набавката е направена без барање 3 понуди, и колегата одскоро купи нов автомобил.',
    question: 'Што правите?',
    hint: 'Кои знаци укажуваат на можна корупција?',
    answer: 'Пријавете ги сомнежите кај одговорното лице. Не ја игнорирајте ситуацијата — тоа ве прави сочесник.',
    type: 'discussion',
  },
  {
    title: 'Законска рамка',
    sections: [
      {
        heading: 'Кривичен законик на РСМ',
        items: ['Чл. 357-359: Примање и давање поткуп', 'Чл. 353-355: Злоупотреба на службена положба', 'Казна: до 10 години затвор'],
      },
      {
        heading: 'Закон за спречување корупција',
        items: ['Задолжително пријавување', 'Заштита на укажувачи', 'Декларирање на имот'],
      },
      {
        heading: 'Меѓународни стандарди',
        items: ['ISO 37001 (Анти-корупциски системи)', 'UN Global Compact принцип 10', 'OECD конвенција за корупција'],
      },
    ],
    type: 'legal',
  },
  {
    title: 'Последици од корупција',
    columns: [
      { heading: 'За вработениот', items: ['Кривична одговорност', 'Затвор до 10 години', 'Парична казна', 'Губење работно место', 'Уништена кариера'], color: 'red' },
      { heading: 'За компанијата', items: ['Финансиски казни', 'Губење лиценци', 'Забрана на дејност', 'Штета на репутација', 'Губење на клиенти'], color: 'amber' },
      { heading: 'За општеството', items: ['Нелојална конкуренција', 'Повисоки цени', 'Пониски стандарди', 'Губење на доверба', 'Штета за економијата'], color: 'slate' },
    ],
    type: 'consequences',
  },
  {
    title: 'Политика за подароци',
    allowed: ['Промотивни материјали (пенкала, календари)', 'Симболични подароци до 1.500 МКД', 'Деловен ручек во разумни граници', 'Учество на јавни настани/конференции'],
    forbidden: ['Готовина или еквиваленти (ваучери)', 'Подароци над 1.500 МКД', 'Скапи вечери, патувања, забави', 'Услуги за членови на семејството', 'Било што во замена за деловна одлука'],
    type: 'gifts',
  },
  {
    title: 'Интерни процедури',
    procedures: [
      { num: '01', label: 'Минимум 3 понуди', desc: 'За секоја набавка над 30.000 МКД се бараат минимум 3 конкурентски понуди.' },
      { num: '02', label: 'Двојно одобрување', desc: 'Секоја набавка мора да биде одобрена од раководител и финансии.' },
      { num: '03', label: 'Ротација на добавувачи', desc: 'Редовна ревизија и ротација за да се спречи зависност.' },
      { num: '04', label: 'Документација', desc: 'Секоја одлука мора да биде документирана со образложение.' },
      { num: '05', label: 'Декларација за конфликт', desc: 'Годишна декларација за потенцијален конфликт на интереси.' },
    ],
    type: 'procedures',
  },
  {
    title: 'Како да пријавите?',
    channels: [
      { num: '1', label: 'Директен претпоставен', desc: 'Прво обратете се кај вашиот раководител' },
      { num: '2', label: 'Човечки ресурси', desc: 'Доколку претпоставениот е вклучен' },
      { num: '3', label: 'Генерален директор', desc: 'За сериозни случаи' },
      { num: '4', label: 'Анонимна линија', desc: 'Доверлива e-mail адреса или кутија за пријави' },
      { num: '5', label: 'Надворешни органи', desc: 'ДКСК, Јавно обвинителство' },
    ],
    type: 'reporting',
  },
  {
    title: 'Заштита на укажувачи',
    guarantees: [
      'Анонимност на пријавата — идентитетот е заштитен',
      'Забрана за одмазда — отказ, деградирање, мобинг',
      'Правна заштита — бесплатна правна помош за укажувачи',
      'Казни за одмазда — оние кои вршат одмазда се казнуваат',
      'Надворешно пријавување — ДКСК, Народен правобранител',
    ],
    motto: 'Пријавувањето НЕ е предавство — тоа е одговорност и храброст!',
    type: 'whistleblower',
  },
  {
    title: 'Направи / Не прави',
    doList: ['Следи ги интерните процедури', 'Бирај добавувач по квалитет и цена', 'Пријави сомнителни ситуации', 'Документирај ги одлуките', 'Пријави конфликт на интереси', 'Побарај помош кога не си сигурен'],
    dontList: ['Не прифаќај подароци од добавувачи', 'Не криј конфликт на интереси', 'Не прескокнувај процедури', 'Не фалсификувај документи', 'Не игнорирај сомнителни ситуации', 'Не се плаши да пријавиш'],
    type: 'dos_donts',
  },
  {
    title: 'Клучни пораки',
    messages: [
      'Корупцијата не е „нормална" — секоја форма е кривично дело и се казнува.',
      'Вие сте првата линија на одбрана — секторот за набавки е најизложен.',
      'Секогаш следете ги процедурите — 3 понуди, документација, одобрување.',
      'Пријавете секоја сомнителна ситуација — заштитата е загарантирана.',
      'Етичкото однесување е наша конкурентска предност на пазарот.',
    ],
    type: 'key_messages',
  },
  {
    title: 'Ви благодариме!',
    subtitle: 'Заедно градиме компанија без корупција.',
    cta: 'Доколку имате прашања или сомнежи — не чекајте, пријавете!',
    type: 'end',
  },
];

/* ───── TEST QUESTIONS ───── */
const QUESTIONS = [
  { q: 'Што е корупција?', options: ['Злоупотреба на доверената моќ за лична корист', 'Несогласување меѓу колеги', 'Каснење на работа', 'Ниту едно од наведените'], correct: 0 },
  { q: 'Кој од следниве е пример за поткуп?', options: ['Добавувач ви нуди процент од набавката, за да го изберете', 'Добавувач ви праќа каталог на производи', 'Добавувач бара плаќање на време', 'Добавувач ви поканува на саем'], correct: 0 },
  { q: 'Што е изнуда?', options: ['Доброволно давање подарок', 'Користење закани или притисок за да се добие корист', 'Барање на попуст од добавувач', 'Преговарање за подобра цена'], correct: 1 },
  { q: 'Што претставува проневера во набавките?', options: ['Купување на поевтини суровини', 'Фалсификување на фактури и присвојување на разликата', 'Касно плаќање на фактури', 'Набавка без одобрување'], correct: 1 },
  { q: 'Кога постои конфликт на интереси?', options: ['Кога добавувачот е поскап', 'Кога личниот интерес е во судир со интересот на компанијата', 'Кога два добавувачи се караат', 'Кога има несогласување за цена'], correct: 1 },
  { q: 'Колку понуди се потребни за набавка над 30.000 МКД?', options: ['Една', 'Две', 'Минимум три', 'Не е одредено'], correct: 2 },
  { q: 'Што треба да направите ако добавувач ви понуди скап подарок?', options: ['Го прифаќате ако е новогодишен', 'Го одбивате и пријавувате', 'Го прифаќате но никому не кажувате', 'Го делите со колегите'], correct: 1 },
  { q: 'Кои членови од Кривичниот законик се однесуваат на поткуп?', options: ['Чл. 100-105', 'Чл. 200-210', 'Чл. 357-359', 'Чл. 500-510'], correct: 2 },
  { q: 'Колкава е максималната затворска казна за примање поткуп?', options: ['1 година', '5 години', '10 години', '15 години'], correct: 2 },
  { q: 'До колку денари се дозволени симболични подароци?', options: ['500 МКД', '1.500 МКД', '3.000 МКД', '5.000 МКД'], correct: 1 },
  { q: 'Што е „црвено знаме" во набавките?', options: ['Добавувач со ниска цена', 'Фактури кои не се совпаѓаат со нарачките', 'Нов добавувач на пазарот', 'Промоција од добавувач'], correct: 1 },
  { q: 'Каде прво треба да пријавите сомнително однесување?', options: ['На полиција', 'Кај директниот претпоставен', 'На социјални мрежи', 'На медиуми'], correct: 1 },
  { q: 'Законот за заштита на укажувачи гарантира:', options: ['Повисока плата', 'Анонимност, забрана за одмазда и правна заштита', 'Бонус за пријавување', 'Преместување во друг сектор'], correct: 1 },
  { q: 'Вработен во набавки ја избира фирмата на неговиот брат без конкурентски понуди. Ова е пример за:', options: ['Добро деловно работење', 'Конфликт на интереси', 'Проневера', 'Нормална процедура'], correct: 1 },
  { q: 'Дали пријавувањето на корупција е предавство?', options: ['Да, никогаш не треба да се пријавува', 'Не, тоа е одговорност и законска обврска', 'Зависи од ситуацијата', 'Само ако има докази'], correct: 1 },
];

const PASS_THRESHOLD = 0.8; // 80%

/* ───── DOWNLOAD FILES ───── */
const DOWNLOAD_FILES = [
  { name: 'Прирачник за обука', file: 'Prirachnik_Antikorupcija_Obuka.docx', type: 'DOCX', size: '~45 KB', icon: '📄', color: 'bg-blue-50 text-blue-700 ring-blue-200' },
  { name: 'Презентација', file: 'Obuka_Antikorupcija_Prezentacija.pptx', type: 'PPTX', size: '~1.2 MB', icon: '📊', color: 'bg-orange-50 text-orange-700 ring-orange-200' },
  { name: 'Брошура за вработени', file: 'Broshura_Antikorupcija.pdf', type: 'PDF', size: '~31 KB', icon: '📕', color: 'bg-red-50 text-red-700 ring-red-200' },
  { name: 'Антикорупциска политика', file: '%D0%90%D0%BD%D1%82%D0%B8%D0%BA%D0%BE%D1%80%D1%83%D0%BF%D1%86%D0%B8%D1%81%D0%BA%D0%B0%20%D0%BF%D0%BE%D0%BB%D0%B8%D1%82%D0%B8%D0%BA%D0%B0.pdf', type: 'PDF', size: '~628 KB', icon: '📜', color: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  { name: 'Тест — 15 прашања', file: 'Test_Antikorupcija_15_Prashanja.docx', type: 'DOCX', size: '~38 KB', icon: '✏️', color: 'bg-purple-50 text-purple-700 ring-purple-200' },
];

/* ───── SLIDE RENDERER ───── */
const SlideCard = ({ slide, index, total }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const num = `${index + 1} / ${total}`;

  const base = 'bg-white rounded-2xl border border-gray-200 shadow-sm p-8 min-h-[420px] flex flex-col';

  if (slide.type === 'cover') {
    return (
      <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-10 min-h-[420px] flex flex-col items-center justify-center text-center">
        <svg className="w-16 h-16 text-amber-400 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
        </svg>
        <h2 className="text-3xl font-bold text-white mb-3">{slide.title}</h2>
        <p className="text-white/60 text-lg">{slide.subtitle}</p>
        <span className="mt-auto text-white/30 text-xs">{num}</span>
      </div>
    );
  }

  if (slide.type === 'end') {
    return (
      <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-10 min-h-[420px] flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-6">🤝</div>
        <h2 className="text-3xl font-bold text-white mb-3">{slide.title}</h2>
        <p className="text-white/80 text-lg mb-2">{slide.subtitle}</p>
        <p className="text-green-200 text-sm">{slide.cta}</p>
        <span className="mt-auto text-white/30 text-xs">{num}</span>
      </div>
    );
  }

  if (slide.type === 'agenda') {
    return (
      <div className={base}>
        <h3 className="text-xl font-bold text-gray-800 mb-5">{slide.title}</h3>
        <div className="space-y-3 flex-1">
          {slide.items.map((it, i) => (
            <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-gray-50">
              <span className="shrink-0 w-16 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded text-center">{it.time}</span>
              <div>
                <div className="font-semibold text-gray-800 text-sm">{it.topic}</div>
                <div className="text-xs text-gray-500">{it.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <span className="text-gray-300 text-xs mt-4 text-right">{num}</span>
      </div>
    );
  }

  if (slide.type === 'definition') {
    return (
      <div className={base}>
        <h3 className="text-xl font-bold text-gray-800 mb-4">{slide.title}</h3>
        <blockquote className="border-l-4 border-indigo-500 bg-indigo-50 p-4 rounded-r-lg mb-4 italic text-gray-700">
          {slide.definition}
          <div className="text-xs text-gray-400 mt-2 not-italic">— {slide.source}</div>
        </blockquote>
        <div className="font-semibold text-sm text-gray-600 mb-2">Основни форми:</div>
        <div className="flex flex-wrap gap-2 flex-1">
          {slide.forms.map((f, i) => (
            <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">{f}</span>
          ))}
        </div>
        <span className="text-gray-300 text-xs mt-4 text-right">{num}</span>
      </div>
    );
  }

  if (slide.type === 'why') {
    return (
      <div className={base}>
        <h3 className="text-xl font-bold text-gray-800 mb-5">{slide.title}</h3>
        <div className="grid grid-cols-2 gap-4 flex-1">
          {slide.cards.map((c, i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-2xl mb-2">{c.icon}</div>
              <div className="font-semibold text-gray-800 text-sm mb-1">{c.label}</div>
              <div className="text-xs text-gray-500">{c.desc}</div>
            </div>
          ))}
        </div>
        <span className="text-gray-300 text-xs mt-4 text-right">{num}</span>
      </div>
    );
  }

  if (slide.type === 'corruption_type') {
    const colors = { amber: 'border-amber-400 bg-amber-50', red: 'border-red-400 bg-red-50', purple: 'border-purple-400 bg-purple-50' };
    return (
      <div className={base}>
        <h3 className="text-xl font-bold text-gray-800 mb-3">{slide.title}</h3>
        <p className="text-sm text-gray-600 mb-3">{slide.desc}</p>
        <div className={`border-l-4 ${colors[slide.color]} p-4 rounded-r-lg mb-4`}>
          <div className="text-xs font-bold text-gray-500 uppercase mb-1">Пример</div>
          <p className="text-sm text-gray-700">{slide.example}</p>
        </div>
        <ul className="space-y-2 flex-1">
          {slide.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
              {b}
            </li>
          ))}
        </ul>
        <span className="text-gray-300 text-xs mt-4 text-right">{num}</span>
      </div>
    );
  }

  if (slide.type === 'conflict') {
    return (
      <div className={base}>
        <h3 className="text-xl font-bold text-gray-800 mb-3">{slide.title}</h3>
        <p className="text-sm text-gray-600 mb-4">{slide.desc}</p>
        <div className="space-y-3 flex-1">
          {slide.examples.map((ex, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="text-xs font-bold text-indigo-600 mb-1">{ex.label}</div>
              <p className="text-sm text-gray-700">{ex.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 font-medium">
          {slide.solution}
        </div>
        <span className="text-gray-300 text-xs mt-4 text-right">{num}</span>
      </div>
    );
  }

  if (slide.type === 'red_flags') {
    return (
      <div className={base}>
        <h3 className="text-xl font-bold text-gray-800 mb-4">{slide.title}</h3>
        <div className="space-y-2 flex-1">
          {slide.flags.map((f, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-sm text-gray-700">{f.text}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ml-3 ${
                f.risk === 'Висок' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>{f.risk}</span>
            </div>
          ))}
        </div>
        <span className="text-gray-300 text-xs mt-4 text-right">{num}</span>
      </div>
    );
  }

  if (slide.type === 'discussion') {
    return (
      <div className={base}>
        <h3 className="text-xl font-bold text-gray-800 mb-4">{slide.title}</h3>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-4">
          <div className="text-xs font-bold text-amber-600 uppercase mb-2">Сценарио</div>
          <p className="text-sm text-gray-700">{slide.scenario}</p>
        </div>
        <p className="font-semibold text-gray-800 mb-1">{slide.question}</p>
        <p className="text-sm text-gray-500 italic mb-4">{slide.hint}</p>
        <div className="mt-auto">
          {!showAnswer ? (
            <button onClick={() => setShowAnswer(true)} className="btn-primary text-sm">
              Прикажи одговор
            </button>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
              <span className="font-bold">Одговор:</span> {slide.answer}
            </div>
          )}
        </div>
        <span className="text-gray-300 text-xs mt-4 text-right">{num}</span>
      </div>
    );
  }

  if (slide.type === 'legal') {
    return (
      <div className={base}>
        <h3 className="text-xl font-bold text-gray-800 mb-4">{slide.title}</h3>
        <div className="space-y-4 flex-1">
          {slide.sections.map((s, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="font-semibold text-gray-800 text-sm mb-2">{s.heading}</div>
              <ul className="space-y-1">
                {s.items.map((it, j) => (
                  <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />{it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <span className="text-gray-300 text-xs mt-4 text-right">{num}</span>
      </div>
    );
  }

  if (slide.type === 'consequences') {
    const colColors = { red: 'border-red-300 bg-red-50', amber: 'border-amber-300 bg-amber-50', slate: 'border-slate-300 bg-slate-50' };
    return (
      <div className={base}>
        <h3 className="text-xl font-bold text-gray-800 mb-4">{slide.title}</h3>
        <div className="grid grid-cols-3 gap-3 flex-1">
          {slide.columns.map((col, i) => (
            <div key={i} className={`border rounded-lg p-4 ${colColors[col.color]}`}>
              <div className="font-semibold text-gray-800 text-sm mb-3">{col.heading}</div>
              <ul className="space-y-1.5">
                {col.items.map((it, j) => (
                  <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-gray-400 mt-0.5">•</span>{it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <span className="text-gray-300 text-xs mt-4 text-right">{num}</span>
      </div>
    );
  }

  if (slide.type === 'gifts') {
    return (
      <div className={base}>
        <h3 className="text-xl font-bold text-gray-800 mb-4">{slide.title}</h3>
        <div className="grid grid-cols-2 gap-4 flex-1">
          <div className="rounded-lg border-2 border-green-300 bg-green-50 p-4">
            <div className="font-bold text-green-700 text-sm mb-3 flex items-center gap-1">
              <span className="text-green-500">✓</span> ДОЗВОЛЕНО
            </div>
            <ul className="space-y-2">
              {slide.allowed.map((a, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-500 shrink-0">•</span>{a}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
            <div className="font-bold text-red-700 text-sm mb-3 flex items-center gap-1">
              <span className="text-red-500">✗</span> ЗАБРАНЕТО
            </div>
            <ul className="space-y-2">
              {slide.forbidden.map((f, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-red-500 shrink-0">•</span>{f}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <span className="text-gray-300 text-xs mt-4 text-right">{num}</span>
      </div>
    );
  }

  if (slide.type === 'procedures') {
    return (
      <div className={base}>
        <h3 className="text-xl font-bold text-gray-800 mb-4">{slide.title}</h3>
        <div className="space-y-3 flex-1">
          {slide.procedures.map((p, i) => (
            <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 border-l-4 border-indigo-400">
              <span className="text-lg font-bold text-indigo-600 shrink-0">{p.num}</span>
              <div>
                <div className="font-semibold text-gray-800 text-sm">{p.label}</div>
                <div className="text-xs text-gray-500">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <span className="text-gray-300 text-xs mt-4 text-right">{num}</span>
      </div>
    );
  }

  if (slide.type === 'reporting') {
    return (
      <div className={base}>
        <h3 className="text-xl font-bold text-gray-800 mb-4">{slide.title}</h3>
        <div className="flex flex-col gap-3 flex-1">
          {slide.channels.map((ch, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
              <span className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-lg">{ch.num}</span>
              <div>
                <div className="font-semibold text-gray-800 text-sm">{ch.label}</div>
                <div className="text-xs text-gray-500">{ch.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <span className="text-gray-300 text-xs mt-4 text-right">{num}</span>
      </div>
    );
  }

  if (slide.type === 'whistleblower') {
    return (
      <div className={base}>
        <h3 className="text-xl font-bold text-gray-800 mb-4">{slide.title}</h3>
        <div className="space-y-2.5 flex-1">
          {slide.guarantees.map((g, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
              <span className="text-green-500 mt-0.5 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <span className="text-sm text-gray-700">{g}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-center font-bold text-amber-800">
          {slide.motto}
        </div>
        <span className="text-gray-300 text-xs mt-4 text-right">{num}</span>
      </div>
    );
  }

  if (slide.type === 'dos_donts') {
    return (
      <div className={base}>
        <h3 className="text-xl font-bold text-gray-800 mb-4">{slide.title}</h3>
        <div className="grid grid-cols-2 gap-4 flex-1">
          <div>
            <div className="font-bold text-green-700 text-sm mb-3">НАПРАВИ ✓</div>
            <ul className="space-y-2">
              {slide.doList.map((d, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-500 shrink-0 font-bold">+</span>{d}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-bold text-red-700 text-sm mb-3">НЕ ПРАВИ ✗</div>
            <ul className="space-y-2">
              {slide.dontList.map((d, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-red-500 shrink-0 font-bold">−</span>{d}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <span className="text-gray-300 text-xs mt-4 text-right">{num}</span>
      </div>
    );
  }

  if (slide.type === 'key_messages') {
    return (
      <div className={base}>
        <h3 className="text-xl font-bold text-gray-800 mb-5">{slide.title}</h3>
        <div className="space-y-3 flex-1">
          {slide.messages.map((m, i) => (
            <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
              <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">{i + 1}</span>
              <p className="text-sm text-gray-700 pt-1">{m}</p>
            </div>
          ))}
        </div>
        <span className="text-gray-300 text-xs mt-4 text-right">{num}</span>
      </div>
    );
  }

  return null;
};

/* ───── MAIN COMPONENT ───── */
const AnticorruptionTraining = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [slideIndex, setSlideIndex] = useState(0);

  // Test state
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleAnswer = (qIdx, optIdx) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < QUESTIONS.length) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const correctCount = submitted
    ? QUESTIONS.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0)
    : 0;
  const percentage = submitted ? Math.round((correctCount / QUESTIONS.length) * 100) : 0;
  const passed = percentage >= PASS_THRESHOLD * 100;

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Антикорупциска обука" onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 bg-gray-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-6 py-8">
            <div className="max-w-5xl mx-auto">
              <button
                onClick={() => navigate('/trainings')}
                className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Назад кон обуки
              </button>
              <h1 className="text-2xl font-bold mb-1">Спречување на корупција, изнуда, проневера и поткуп</h1>
              <p className="text-white/60 text-sm">Сектор за набавки | Времетраење: 60 минути | Задолжителна обука</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
            <div className="max-w-5xl mx-auto flex overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="max-w-5xl mx-auto p-6">

            {/* ═══ CONTENT TAB ═══ */}
            {activeTab === 'content' && (
              <div className="space-y-8">
                {/* Section: Вовед */}
                <section className="card p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-3">1. Вовед</h2>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Овој прирачник е наменет за сите вработени во секторот за набавки како дел од задолжителната годишна обука за спречување на корупција. Како компанија за производство на храна, ние сме посветени на највисоки стандарди на етичко однесување и транспарентност во сите деловни процеси.
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Секторот за набавки е еден од најизложените сектори на коруптивни ризици бидејќи вклучува директен контакт со добавувачи, управување со финансиски средства и донесување одлуки за избор на добавувачи.
                  </p>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                    <h4 className="font-semibold text-indigo-800 text-sm mb-2">Цели на обуката:</h4>
                    <ul className="space-y-1.5">
                      {['Да се разбере што е корупција и кои се нејзините форми', 'Да се препознаат ситуациите кои претставуваат ризик од корупција', 'Да се знаат законските последици и интерните процедури', 'Да се научи како да се пријави сомнително однесување'].map((g, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-indigo-500 shrink-0 mt-0.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          </span>
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                {/* Section: Дефиниции */}
                <section className="card p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">2. Дефиниции</h2>
                  <div className="space-y-4">
                    {[
                      { term: 'Корупција', def: 'Злоупотреба на доверената моќ или позиција за стекнување лична корист (финансиска или друга).' },
                      { term: 'Поткуп (мито)', def: 'Нудење, давање, барање или примање на нешто од вредност со цел да се влијае на деловна одлука. Пример: добавувач нуди 500 EUR во готовина.' },
                      { term: 'Изнуда', def: 'Користење на закани, притисок или моќ за да се принуди некое лице да даде пари, услуга или корист.' },
                      { term: 'Проневера', def: 'Присвојување на доверени средства за лична корист. Пример: фактурира 120.000 МКД наместо 100.000 МКД.' },
                      { term: 'Конфликт на интереси', def: 'Ситуација каде личниот интерес на вработениот е во судир со интересите на компанијата.' },
                    ].map((d, i) => (
                      <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="font-semibold text-gray-800 text-sm w-40 shrink-0">{d.term}</div>
                        <div className="text-sm text-gray-600">{d.def}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Section: Видови корупција */}
                <section className="card p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">3. Видови корупција со примери од набавки</h2>

                  <div className="space-y-5">
                    <div className="border-l-4 border-amber-400 bg-amber-50 p-5 rounded-r-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">3.1 Поткуп во набавки</h3>
                      <p className="text-sm text-gray-600 mb-3">Најчестата форма на корупција во набавките:</p>
                      <ul className="space-y-1.5 text-sm text-gray-600">
                        {['Директно нудење готовина — добавувач нуди 500 EUR', 'Провизија — добавувач плаќа 3% од секоја нарачка', 'Скапи подароци — часовници, накит, електроника', 'Патувања и угостителство — скапи вечери, одмори', 'Услуги — вработување на роднини, бесплатни ремонти'].map((b, i) => (
                          <li key={i} className="flex items-start gap-2"><span className="text-amber-500 mt-1">•</span>{b}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-l-4 border-red-400 bg-red-50 p-5 rounded-r-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">3.2 Изнуда во набавки</h3>
                      <p className="text-sm text-gray-600 mb-3">Се случува кога некое лице користи закани или моќ:</p>
                      <ul className="space-y-1.5 text-sm text-gray-600">
                        {['Вработен заканува со раскинување договор ако не добие попуст', 'Инспектор бара надомест за да не пријави проблем', 'Добавувач притиска за плаќање во готовина'].map((b, i) => (
                          <li key={i} className="flex items-start gap-2"><span className="text-red-500 mt-1">•</span>{b}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-l-4 border-purple-400 bg-purple-50 p-5 rounded-r-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">3.3 Проневера во набавки</h3>
                      <p className="text-sm text-gray-600 mb-3">Присвојување на средства доверени на вработениот:</p>
                      <ul className="space-y-1.5 text-sm text-gray-600">
                        {['Фалсификување фактури — нарачува за 100.000, фактурира 120.000 МКД', 'Фиктивни добавувачи — креирање на непостоечки фирми', 'Злоупотреба на корпоративна картица за лични набавки'].map((b, i) => (
                          <li key={i} className="flex items-start gap-2"><span className="text-purple-500 mt-1">•</span>{b}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Section: Црвени знамиња */}
                <section className="card p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">4. Црвени знамиња во набавките</h2>
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-red-800">Внимавајте на следниве знаци:</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { flag: 'Добавувачот инсистира на плаќање во готовина', risk: 'Висок' },
                      { flag: 'Цените се значително повисоки од пазарните', risk: 'Висок' },
                      { flag: 'Само еден добавувач е секогаш избран', risk: 'Среден' },
                      { flag: 'Добавувачот нуди скапи подароци', risk: 'Висок' },
                      { flag: 'Фактурите не се совпаѓаат со нарачките', risk: 'Висок' },
                      { flag: 'Набавките се делат за да се избегне тендер', risk: 'Среден' },
                      { flag: 'Вработен одбива ротација или одмор', risk: 'Среден' },
                    ].map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                        <span className="text-sm text-gray-700">{f.flag}</span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${f.risk === 'Висок' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {f.risk}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Section: Законска рамка */}
                <section className="card p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">5. Законска рамка</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <h4 className="font-semibold text-gray-800 text-sm mb-3">Кривичен законик на РСМ</h4>
                      <ul className="space-y-1.5 text-sm text-gray-600">
                        <li>Чл. 357-359: Примање и давање поткуп — <span className="font-semibold text-red-600">до 10 години затвор</span></li>
                        <li>Чл. 353-355: Злоупотреба на службена положба</li>
                        <li>Чл. 273-274: Проневера — до 5 години затвор</li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <h4 className="font-semibold text-gray-800 text-sm mb-3">Закон за спречување корупција</h4>
                      <ul className="space-y-1.5 text-sm text-gray-600">
                        <li>Задолжително пријавување на корупција</li>
                        <li>Заштита на укажувачите</li>
                        <li>Декларирање на имот и интереси</li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <h4 className="font-semibold text-gray-800 text-sm mb-3">Меѓународни стандарди</h4>
                      <ul className="space-y-1.5 text-sm text-gray-600">
                        <li>ISO 37001 — Анти-корупциски системи</li>
                        <li>UN Global Compact — Принцип 10</li>
                        <li>OECD конвенција за корупција</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Section: Интерни политики */}
                <section className="card p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">6. Интерни политики и процедури</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { num: '01', label: 'Минимум 3 понуди', desc: 'За секоја набавка над 30.000 МКД се бараат минимум 3 конкурентски понуди.' },
                      { num: '02', label: 'Двојно одобрување', desc: 'Секоја набавка мора да биде одобрена од раководител и менаџер на сектор.' },
                      { num: '03', label: 'Ротација на добавувачи', desc: 'Редовна ревизија и ротација за да се спречи зависност.' },
                      { num: '04', label: 'Документација', desc: 'Секоја одлука мора да биде документирана со образложение.' },
                    ].map((p, i) => (
                      <div key={i} className="border-l-4 border-indigo-400 bg-gray-50 p-4 rounded-r-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-indigo-600">{p.num}</span>
                          <span className="font-semibold text-gray-800 text-sm">{p.label}</span>
                        </div>
                        <p className="text-xs text-gray-500">{p.desc}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Section: Политика за подароци */}
                <section className="card p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">7. Политика за подароци</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border-2 border-green-300 bg-green-50 p-5">
                      <h4 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                        <span className="text-green-500">✓</span> ДОЗВОЛЕНО
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {['Промотивни материјали (пенкала, календари)', 'Симболични подароци до 1.000 МКД', 'Деловен ручек во разумни граници', 'Учество на јавни настани'].map((a, i) => (
                          <li key={i} className="flex items-start gap-2"><span className="text-green-500">•</span>{a}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border-2 border-red-300 bg-red-50 p-5">
                      <h4 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                        <span className="text-red-500">✗</span> ЗАБРАНЕТО
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {['Готовина или ваучери', 'Подароци над 1.000 МКД', 'Скапи вечери, патувања', 'Услуги за членови на семејството'].map((f, i) => (
                          <li key={i} className="flex items-start gap-2"><span className="text-red-500">•</span>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Section: Канали за пријавување */}
                <section className="card p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">8. Канали за пријавување</h2>
                  <div className="flex flex-col gap-3">
                    {[
                      { num: '1', label: 'Директен претпоставен', desc: 'Прво обратете се кај вашиот раководител.' },
                      { num: '2', label: 'Сектор за човечки ресурси', desc: 'Доколку претпоставениот е вклучен.' },
                      { num: '3', label: 'Генерален директор', desc: 'За сериозни случаи.' },
                      { num: '4', label: 'Анонимна линија', desc: 'Доверлива e-mail адреса или кутија за пријави.' },
                      { num: '5', label: 'Надворешни органи', desc: 'ДКСК, Јавно обвинителство.' },
                    ].map((ch, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                        <span className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">{ch.num}</span>
                        <div>
                          <div className="font-semibold text-gray-800 text-sm">{ch.label}</div>
                          <div className="text-xs text-gray-500">{ch.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Section: Заштита на укажувачи */}
                <section className="card p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">9. Заштита на укажувачи</h2>
                  <div className="space-y-2.5 mb-4">
                    {[
                      'Анонимност на пријавата — идентитетот е заштитен',
                      'Забрана за одмазда — отказ, деградирање, мобинг се забранети',
                      'Правна заштита — бесплатна правна помош за укажувачи',
                      'Надворешно пријавување — ДКСК, Народен правобранител',
                    ].map((g, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                        <span className="text-green-600 mt-0.5 shrink-0">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </span>
                        <span className="text-sm text-gray-700">{g}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                    <p className="font-bold text-amber-800">
                      ВАЖНО: Пријавувањето НЕ е предавство — тоа е одговорност и храброст!
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      Секој вработен кој знае за корупција и не пријави може да сноси одговорност како сочесник.
                    </p>
                  </div>
                </section>
              </div>
            )}

            {/* ═══ PRESENTATION TAB ═══ */}
            {activeTab === 'presentation' && (
              <div>
                <SlideCard slide={SLIDES[slideIndex]} index={slideIndex} total={SLIDES.length} />

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => setSlideIndex((p) => Math.max(0, p - 1))}
                    disabled={slideIndex === 0}
                    className="btn-secondary text-sm disabled:opacity-30"
                  >
                    <svg className="w-4 h-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Претходна
                  </button>

                  {/* Slide dots */}
                  <div className="flex gap-1.5 flex-wrap justify-center max-w-md">
                    {SLIDES.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSlideIndex(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                          i === slideIndex ? 'bg-indigo-600' : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setSlideIndex((p) => Math.min(SLIDES.length - 1, p + 1))}
                    disabled={slideIndex === SLIDES.length - 1}
                    className="btn-secondary text-sm disabled:opacity-30"
                  >
                    Следна
                    <svg className="w-4 h-4 ml-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* ═══ VIDEO TAB ═══ */}
            {activeTab === 'video' && (
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Видео обука</h2>
                <p className="text-sm text-gray-500 mb-6">ЛБФП ДОО Битола — Антикорупциска обука</p>

                {/* Embedded Google Drive Video */}
                <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src="https://drive.google.com/file/d/1Aq78iCymeZZAgVGixXElxgTDeLBmqTvB/preview"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    title="Антикорупциска обука — видео"
                  />
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <a
                    href="https://drive.google.com/file/d/1Aq78iCymeZZAgVGixXElxgTDeLBmqTvB/view?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-sm inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    Отвори во Google Drive
                  </a>
                  <span className="text-xs text-gray-400">Видеото е достапно за сите со линкот</span>
                </div>
              </div>
            )}

            {/* ═══ TEST TAB ═══ */}
            {activeTab === 'test' && (
              <div>
                {/* Test header */}
                <div className="card p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Тест за проверка на знаење</h2>
                      <p className="text-sm text-gray-500 mt-1">15 прашања | Потребен минимум: 80% точност (12/15)</p>
                    </div>
                    {submitted && (
                      <div className={`text-center p-4 rounded-xl ${passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <div className={`text-3xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                          {percentage}%
                        </div>
                        <div className={`text-sm font-medium ${passed ? 'text-green-700' : 'text-red-700'}`}>
                          {correctCount}/{QUESTIONS.length} точни
                        </div>
                        <div className={`text-xs mt-1 font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                          {passed ? 'ПОЛОЖЕН' : 'НЕПОЛОЖЕН'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {!submitted && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>Прогрес</span>
                        <span>{Object.keys(answers).length}/{QUESTIONS.length}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(Object.keys(answers).length / QUESTIONS.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  {QUESTIONS.map((q, qi) => {
                    const selected = answers[qi];
                    const isCorrect = submitted && selected === q.correct;
                    const isWrong = submitted && selected !== undefined && selected !== q.correct;

                    return (
                      <div
                        key={qi}
                        className={`card p-5 transition-all ${
                          submitted
                            ? isCorrect ? 'ring-2 ring-green-400 bg-green-50/50' : isWrong ? 'ring-2 ring-red-400 bg-red-50/50' : ''
                            : ''
                        }`}
                      >
                        <div className="flex items-start gap-3 mb-4">
                          <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center justify-center shrink-0 text-sm">
                            {qi + 1}
                          </span>
                          <h3 className="font-semibold text-gray-800 text-sm pt-1">{q.q}</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-11">
                          {q.options.map((opt, oi) => {
                            const isSelected = selected === oi;
                            const isCorrectOpt = submitted && oi === q.correct;
                            const isWrongOpt = submitted && isSelected && oi !== q.correct;

                            let cls = 'border border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50';
                            if (!submitted && isSelected) {
                              cls = 'border-2 border-indigo-500 bg-indigo-50 text-indigo-700';
                            } else if (isCorrectOpt) {
                              cls = 'border-2 border-green-500 bg-green-50 text-green-800';
                            } else if (isWrongOpt) {
                              cls = 'border-2 border-red-500 bg-red-50 text-red-800 line-through';
                            } else if (submitted) {
                              cls = 'border border-gray-100 bg-gray-50 text-gray-400';
                            }

                            return (
                              <button
                                key={oi}
                                onClick={() => handleAnswer(qi, oi)}
                                disabled={submitted}
                                className={`p-3 rounded-lg text-sm text-left transition-all ${cls} ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                              >
                                <span className="font-medium mr-2">
                                  {String.fromCharCode(97 + oi)})
                                </span>
                                {opt}
                                {isCorrectOpt && (
                                  <span className="float-right text-green-600">
                                    <svg className="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                  </span>
                                )}
                                {isWrongOpt && (
                                  <span className="float-right text-red-600">
                                    <svg className="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Submit / Reset */}
                <div className="mt-6 flex items-center gap-4">
                  {!submitted ? (
                    <button
                      onClick={handleSubmit}
                      disabled={Object.keys(answers).length < QUESTIONS.length}
                      className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Поднеси тест ({Object.keys(answers).length}/{QUESTIONS.length})
                    </button>
                  ) : (
                    <button onClick={handleReset} className="btn-secondary">
                      Повторно решавај
                    </button>
                  )}
                  {!submitted && Object.keys(answers).length < QUESTIONS.length && (
                    <span className="text-xs text-gray-400">
                      Одговорете на сите прашања за да го поднесете тестот
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* ═══ DOWNLOADS TAB ═══ */}
            {activeTab === 'downloads' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Материјали за преземање</h2>
                <p className="text-sm text-gray-500 mb-6">Сите документи од антикорупциската обука</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {DOWNLOAD_FILES.map((f, i) => (
                    <a
                      key={i}
                      href={`/training/anticorruption/${f.file}`}
                      download
                      className="card p-5 flex items-start gap-4 hover:shadow-md transition-shadow group"
                    >
                      <span className="text-3xl">{f.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 text-sm group-hover:text-indigo-600 transition-colors">
                          {f.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ring-1 ${f.color}`}>
                            {f.type}
                          </span>
                          <span className="text-xs text-gray-400">{f.size}</span>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12M12 16.5V3" />
                      </svg>
                    </a>
                  ))}
                </div>

                {/* Video link card */}
                <div className="mt-6">
                  <a
                    href="https://drive.google.com/file/d/1Aq78iCymeZZAgVGixXElxgTDeLBmqTvB/view?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card p-5 flex items-start gap-4 hover:shadow-md transition-shadow group"
                  >
                    <span className="text-3xl">🎬</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 text-sm group-hover:text-indigo-600 transition-colors">
                        Видео обука — ЛБФП ДОО Битола
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full ring-1 bg-pink-50 text-pink-700 ring-pink-200">
                          MP4 / Google Drive
                        </span>
                        <span className="text-xs text-gray-400">Отвора во нов прозорец</span>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AnticorruptionTraining;
