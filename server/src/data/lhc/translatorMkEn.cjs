// Rough Macedonian → English translator for LHC content.
// Dictionary + rule-based, no external API. Output is approximate ("машински превод").
// Output is intentionally tagged as approximate; UI shows a warning badge.

// Order matters — longer phrases first so dictionary substitution is greedy.
const PHRASES = [
  // ── Greetings / connectors ─────────────────────────────────────────
  ['не е применливо', 'not applicable'],
  ['не е применлив',  'not applicable'],

  // ── Question intros ────────────────────────────────────────────────
  ['Дали ', 'Does '],
  ['дали ', 'whether '],
  ['Колку често', 'How often'],
  ['Колку ', 'How '],
  ['Како ', 'How '],
  ['Кога ', 'When '],
  ['Каде ', 'Where '],
  ['Што ', 'What '],
  ['Кои ', 'Which '],
  ['Кој ', 'Which '],
  ['Зошто ', 'Why '],

  // ── Common verbs / aux ────────────────────────────────────────────
  ['Препорачливо е', 'It is recommended that'],
  ['Потребно е',     'It is required that'],
  ['Се препорачува', 'It is recommended'],
  ['се препорачува', 'it is recommended'],
  ['Обезбедете',     'Ensure'],
  ['обезбедете',     'ensure'],
  ['треба да биде',  'must be'],
  ['треба да се',    'must be'],
  ['треба да',       'should'],
  ['може да биде',   'may be'],
  ['може да се',     'can be'],
  ['може да',        'can'],
  ['не може да',     'cannot'],
  ['не треба да',    'must not'],
  ['да биде',        'be'],
  ['да се',          'to be'],
  ['постои',         'exists'],
  ['постојат',       'exist'],
  ['има',            'has'],
  ['имаат',          'have'],
  ['нема',           'does not have'],
  ['немаат',         'do not have'],
  ['се изврши',      'is performed'],
  ['се извршени',    'are performed'],
  ['се извршуваат',  'are performed'],
  ['е извршено',     'is performed'],
  ['се користи',     'is used'],
  ['се користат',    'are used'],
  ['се користат',    'are used'],
  ['се чува',        'is kept'],
  ['се чуваат',      'are kept'],
  ['се применува',   'is applied'],
  ['се применуваат', 'are applied'],
  ['се води',        'is maintained'],
  ['се водат',       'are maintained'],
  ['се води',        'is kept'],
  ['се потпишува',   'is signed'],
  ['се потпишани',   'are signed'],
  ['се поднесат',    'be submitted'],
  ['се поднесува',   'is submitted'],
  ['се прима',       'is received'],
  ['се прават',      'are made'],
  ['се прави',       'is made'],
  ['се ажурира',     'is updated'],
  ['се ажурираат',   'are updated'],
  ['се проверуваат', 'are verified'],
  ['се проверува',   'is verified'],
  ['се пропише',     'is regulated'],
  ['се пропишува',   'is regulated'],
  ['се пропишано',   'is prescribed'],
  ['се обучуваат',   'are trained'],
  ['се обучува',     'is trained'],
  ['се вршат',       'are carried out'],
  ['се врши',        'is carried out'],
  ['се пријави',     'be reported'],
  ['се пријавува',   'is reported'],
  ['се обработи',    'be processed'],
  ['се обработуваат','are processed'],

  // ── Legal / company terms ─────────────────────────────────────────
  ['Друштвото',                    'the Company'],
  ['друштвото',                    'the Company'],
  ['Друштво',                      'Company'],
  ['компанијата',                  'the company'],
  ['Компанијата',                  'the Company'],
  ['работодавачот',                'the employer'],
  ['Работодавачот',                'The employer'],
  ['работодавач',                  'employer'],
  ['работодавачи',                 'employers'],
  ['работниците',                  'the workers'],
  ['работникот',                   'the worker'],
  ['работник',                     'worker'],
  ['работници',                    'workers'],
  ['вработениот',                  'the employee'],
  ['вработените',                  'the employees'],
  ['вработени',                    'employees'],
  ['кандидатот',                   'the candidate'],
  ['кандидатите',                  'the candidates'],
  ['кандидати',                    'candidates'],
  ['клиентот',                     'the client'],
  ['клиентите',                    'the clients'],
  ['клиенти',                      'clients'],
  ['потрошувачите',                'consumers'],
  ['трети лица',                   'third parties'],
  ['трето лице',                   'third party'],
  ['овластени лица',               'authorized persons'],
  ['овластено лице',               'authorized person'],
  ['офицер за заштита на лични податоци', 'Data Protection Officer'],
  ['Офицер за заштита на лични податоци', 'Data Protection Officer'],
  ['офицерот за заштита на личните податоци', 'the Data Protection Officer'],
  ['офицерот',                     'the officer'],
  ['офицер',                       'officer'],
  ['Агенцијата',                   'the Agency'],
  ['Агенција',                     'Agency'],
  ['Управата',                     'the Administration'],
  ['УЈП',                          'PRO (Public Revenue Office)'],
  ['Инспекцискиот надзор',         'inspection oversight'],
  ['инспекциски надзор',           'inspection'],
  ['прекршочна мерка',             'misdemeanor sanction'],
  ['прекршок',                     'violation'],
  ['прекршоци',                    'violations'],
  ['санкција',                     'sanction'],
  ['санкции',                      'sanctions'],
  ['одредба',                      'provision'],
  ['одредби',                      'provisions'],
  ['пропис',                       'regulation'],
  ['прописи',                      'regulations'],

  // ── Topics ────────────────────────────────────────────────────────
  ['договор за вработување',       'employment contract'],
  ['Договор за вработување',       'Employment contract'],
  ['договори за вработување',      'employment contracts'],
  ['договор',                      'contract'],
  ['договори',                     'contracts'],
  ['колективен договор',           'collective agreement'],
  ['Колективниот договор',         'the collective agreement'],
  ['Колективен договор',           'Collective agreement'],
  ['работен однос',                'employment relationship'],
  ['работниот однос',              'the employment relationship'],
  ['работните односи',             'labor relations'],
  ['Закон за работните односи',    'Labor Relations Act'],
  ['Законот за работните односи',  'the Labor Relations Act'],
  ['Закон за заштита на личните податоци', 'Personal Data Protection Act'],
  ['Законот за заштита на личните податоци', 'the Personal Data Protection Act'],
  ['Закон за безбедност и здравје при работа', 'Occupational Safety and Health Act'],
  ['Законот за безбедност и здравје при работа', 'the Occupational Safety and Health Act'],
  ['Правилник за видео надзор',    'Video Surveillance Regulation'],
  ['Правилник за безбедност на обработката на личните податоци', 'Personal Data Processing Security Regulation'],
  ['Правилник',                    'Regulation'],
  ['правилник',                    'regulation'],
  ['статут',                       'bylaws'],

  // ── HR / process ──────────────────────────────────────────────────
  ['процес на вработување',        'hiring process'],
  ['процес на работа',             'work process'],
  ['процеси',                      'processes'],
  ['процес',                       'process'],
  ['оглас',                        'job advertisement'],
  ['огласи',                       'job advertisements'],
  ['пол',                          'gender'],
  ['возраст',                      'age'],
  ['потекло',                      'origin'],
  ['лични околности',              'personal circumstances'],
  ['годишен одмор',                'annual leave'],
  ['Годишен одмор',                'Annual leave'],
  ['боледување',                   'sick leave'],
  ['прекувремена работа',          'overtime'],
  ['работно време',                'working hours'],
  ['работното време',              'working hours'],
  ['плата',                        'salary'],
  ['платата',                      'the salary'],
  ['платите',                      'salaries'],
  ['минимална плата',              'minimum wage'],
  ['Минимална плата',              'Minimum wage'],
  ['Социјално осигурување',        'Social insurance'],
  ['социјално осигурување',        'social insurance'],
  ['здравствено осигурување',      'health insurance'],
  ['пензиско осигурување',         'pension insurance'],
  ['обука',                        'training'],
  ['обуки',                        'trainings'],
  ['обукa',                        'training'],
  ['седиште',                      'headquarters'],
  ['седиштето',                    'the headquarters'],

  // ── Health & Safety ───────────────────────────────────────────────
  ['безбедност и здравје при работа', 'occupational safety and health'],
  ['безбедност на работа',         'workplace safety'],
  ['заштита на работа',            'protection at work'],
  ['ризик',                        'risk'],
  ['ризици',                       'risks'],
  ['проценка на ризик',            'risk assessment'],
  ['Лична заштитна опрема',        'Personal protective equipment'],
  ['лична заштитна опрема',        'personal protective equipment'],
  ['ЛЗО',                          'PPE'],
  ['заштитни средства',            'protective gear'],
  ['заштитна опрема',              'protective equipment'],
  ['повреда на работа',            'workplace injury'],
  ['повреди на работа',            'workplace injuries'],
  ['пожар',                        'fire'],
  ['пожарна заштита',              'fire safety'],
  ['прва помош',                   'first aid'],

  // ── GDPR ──────────────────────────────────────────────────────────
  ['лични податоци',               'personal data'],
  ['Лични податоци',               'Personal data'],
  ['обработка на лични податоци',  'personal data processing'],
  ['заштита на лични податоци',    'personal data protection'],
  ['биометриски податоци',         'biometric data'],
  ['биометриски',                  'biometric'],
  ['согласност',                   'consent'],
  ['видео надзор',                 'video surveillance'],
  ['снимки',                       'recordings'],
  ['пристап',                      'access'],
  ['ажурирање',                    'updating'],
  ['резервна копија',              'backup'],
  ['бекап',                        'backup'],

  // ── Cyber ─────────────────────────────────────────────────────────
  ['уред',                         'device'],
  ['уреди',                        'devices'],
  ['компјутер',                    'computer'],
  ['компјутери',                   'computers'],
  ['телефон',                      'phone'],
  ['телефони',                     'phones'],
  ['таблет',                       'tablet'],
  ['таблети',                      'tablets'],
  ['лозинка',                      'password'],
  ['лозинки',                      'passwords'],
  ['антивирус',                    'antivirus'],
  ['ажурирања',                    'updates'],
  ['оперативен систем',            'operating system'],
  ['оперативни системи',           'operating systems'],
  ['софтвер',                      'software'],
  ['серверот',                     'the server'],
  ['сервер',                       'server'],
  ['мрежа',                        'network'],
  ['мрежен',                       'network'],
  ['мрежна безбедност',            'network security'],
  ['фишинг',                       'phishing'],
  ['е-пошта',                      'email'],
  ['електронска пошта',            'email'],
  ['автентикација',                'authentication'],
  ['двофакторска',                 'two-factor'],
  ['MFA',                          'MFA'],
  ['инцидент',                     'incident'],
  ['инциденти',                    'incidents'],
  ['свесност',                     'awareness'],
  ['сајбер безбедност',            'cyber security'],

  // ── Frequency / quantities ────────────────────────────────────────
  ['секогаш',                      'always'],
  ['често',                        'often'],
  ['понекогаш',                    'sometimes'],
  ['ретко',                        'rarely'],
  ['никогаш',                      'never'],
  ['автоматски',                   'automatically'],
  ['рачно',                        'manually'],
  ['редовно',                      'regularly'],
  ['месечно',                      'monthly'],
  ['неделно',                      'weekly'],
  ['дневно',                       'daily'],
  ['квартално',                    'quarterly'],
  ['годишно',                      'annually'],
  ['секој месец',                  'every month'],
  ['секоја недела',                'every week'],
  ['секоја година',                'every year'],
  ['еднаш месечно',                'once a month'],

  // ── Adjectives ────────────────────────────────────────────────────
  ['целосно',                      'fully'],
  ['делумно',                      'partially'],
  ['изготвен',                     'drafted'],
  ['потпишан',                     'signed'],
  ['заверен',                      'certified'],
  ['важечки',                      'valid'],
  ['писмена форма',                'written form'],
  ['во писмена форма',             'in written form'],

  // ── Articles ──────────────────────────────────────────────────────
  ['Член ',  'Article '],
  ['член ',  'article '],
  ['Членови ', 'Articles '],
  ['членови ', 'articles '],
  ['став ', 'paragraph '],
  ['ставови ', 'paragraphs '],
  ['точка ', 'item '],
  ['алинеја ', 'subparagraph '],
  ['од ',    'of '],

  // ── Connectors / common little words ──────────────────────────────
  ['кои ',   'which '],
  ['која ',  'which '],
  ['кој ',   'who '],
  ['чии ',   'whose '],
  ['во кој',     'in which'],
  ['во која',    'in which'],
  ['но ',    'but '],
  ['исто така ', 'also '],
  ['или ',   'or '],
  ['и ',     'and '],
  ['со ',    'with '],
  ['без ',   'without '],
  ['на ',    'of '],
  ['за ',    'for '],
  ['по ',    'after '],
  ['пред ',  'before '],
  ['над ',   'above '],
  ['под ',   'below '],
  ['до ',    'to '],
  ['од ',    'from '],
  ['кон ',   'towards '],
  ['ако ',   'if '],
  ['освен ', 'except '],
  ['секој ', 'every '],
  ['секои ', 'all '],
  ['сите ',  'all '],
  ['некои ', 'some '],
  ['еден ',  'one '],
  ['една ',  'one '],
  ['едно ',  'one '],
  ['нивниот ', 'their '],
  ['вашиот ', 'your '],
  ['нашиот ', 'our '],
  ['нивен ', 'their '],
  ['нивна ', 'their '],
  ['нивно ', 'their '],

  // ── Misc one-liners ───────────────────────────────────────────────
  ['Да',     'Yes'],
  ['Не',     'No'],
  ['Точно',  'True'],
  ['Неточно', 'False'],
];

const escapeReg = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// A "small" phrase (3 chars or fewer Cyrillic) gets word-boundary anchoring
// so we don't munch suffixes (e.g. "и " inside "ангажирани лица").
const isShort = (mk) => mk.replace(/\s+$/, '').length <= 3;

// Sort by descending source-phrase length so longer matches win.
const ORDERED = [...PHRASES].sort((a, b) => b[0].length - a[0].length);
const SUBSTS = ORDERED.map(([mk, en]) => {
  const trimmed = mk.replace(/\s+$/, '');
  if (isShort(mk)) {
    // Anchor to start-of-line or whitespace before; match either end-of-line or whitespace after.
    const re = new RegExp(`(^|\\s)${escapeReg(trimmed)}(?=\\s|$|[.,;:?!])`, 'g');
    return [re, `$1${en.replace(/\s+$/, '')}`];
  }
  return [new RegExp(escapeReg(mk), 'g'), en];
});

// Convert "Член N став M од Закон..." → "Article N paragraph M of the ... Act"
const articleNumberFix = (s) =>
  s.replace(/Article\s+(\d+)\s+paragraph\s+(\d+)/g, 'Article $1, paragraph $2');

// Crude word-by-word fallback for any leftover Cyrillic words.
// We don't try to translate — we just transliterate so the reader can pronounce.
const transliterate = (s) => {
  const map = {
    а:'a', б:'b', в:'v', г:'g', д:'d', ѓ:'gj', е:'e', ж:'zh', з:'z', ѕ:'dz',
    и:'i', ј:'j', к:'k', л:'l', љ:'lj', м:'m', н:'n', њ:'nj', о:'o', п:'p',
    р:'r', с:'s', т:'t', ќ:'kj', у:'u', ф:'f', х:'h', ц:'c', ч:'ch', џ:'dj', ш:'sh',
    А:'A', Б:'B', В:'V', Г:'G', Д:'D', Ѓ:'Gj', Е:'E', Ж:'Zh', З:'Z', Ѕ:'Dz',
    И:'I', Ј:'J', К:'K', Л:'L', Љ:'Lj', М:'M', Н:'N', Њ:'Nj', О:'O', П:'P',
    Р:'R', С:'S', Т:'T', Ќ:'Kj', У:'U', Ф:'F', Х:'H', Ц:'C', Ч:'Ch', Џ:'Dj', Ш:'Sh',
  };
  return s.replace(/[А-Яа-яЃѓЅѕЈјЉљЊњЌќЏџ]/g, (ch) => map[ch] || ch);
};

const cleanup = (s) =>
  s.replace(/\s+/g, ' ')
    .replace(/\s+([.,;:?!])/g, '$1')
    .replace(/^\s+|\s+$/g, '');

const translate = (text) => {
  if (!text) return '';
  let s = text;
  for (const [re, en] of SUBSTS) s = s.replace(re, en);
  s = articleNumberFix(s);
  // Anything still in Cyrillic → transliterate so it's at least readable.
  s = transliterate(s);
  return cleanup(s);
};

module.exports = { translate };
