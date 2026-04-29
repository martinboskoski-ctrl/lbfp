// Complete 84 Employment Relations Questions - Macedonian Labor Law
// Закон за работните односи - Целосен правен здравствен преглед

const ANSWER_TYPES = {
  YES_NO: 'yes_no',
  CHOICE: 'choice',
  MULTI_CHECK: 'multi_check'
};

const SANCTION_LEVELS = {
  HIGH: 'sanction1',
  MEDIUM: 'sanction2',
  NONE: 'none'
};

const questions = [
  // ===== ПРОЦЕС НА ВРАБОТУВАЊЕ, ОГЛАСИ И ОПШТИ ОКОЛНОСТИ (q1-q14) =====
  {
    id: 'q1',
    category: 'recruitment',
    text: 'Дали во процесот на вработување и барање на кандидати преку оглас, како услов се поставува определено потекло, пол, возраст или други лични околности на посакуваниот работник?',
    article: 'Членови 6, 7 и 8 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.NONE,
    recommendation: 'Потребно е да се отстрани негативната практика, да се поставуваат како услов за вработување потеклото, полот, возраста или другите лични околности на посакуваниот работник.'
  },
  {
    id: 'q2',
    category: 'recruitment',
    text: 'Дали во процесот на вработување од кандидатите се поставуваат прашања или се бараат документи во врска со личните околности на кандидатите за вработување, кои одговори може да немаат влијание на начинот на вршењето на работата?',
    article: 'Членови 6, 7 и 8 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.NONE,
    recommendation: 'Потребно е да се отстрани негативната практика при процесот на вработување, односно да не се бараат податоци и информации од кандидатите кои не се директно поврзани со работните задачи.'
  },
  {
    id: 'q3',
    category: 'recruitment',
    text: 'Дали во договорите за вработување се вметнуваат договорни клаузули кои предвидуваат помали права од правата предвидени со Законот за работните односи или друг закон?',
    article: 'Член 12 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.NONE,
    recommendation: 'Препорачливо е да се ревидираат договорите за вработување и да се отстранат клаузули кои се спротивни на Законот или Колективниот Договор.'
  },
  {
    id: 'q4',
    category: 'recruitment',
    text: 'Дали со сите ангажирани лица е потпишан договор за вработување?',
    article: 'Член 13 став 1 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Потребно е со сите ангажирани лица да се склучат договори за вработување. Ваквиот пропуст е сериозен и претставува единствен пропуст поради кој при инспекциски надзор би се изрекла директна прекршочна мерка.'
  },
  {
    id: 'q5',
    category: 'recruitment',
    text: 'Дали за лицата со кои е склучен договор за вработување има извршено пријавување во задолжително социјално осигурување на денот кој е определен како датум за почеток со работа?',
    article: 'Член 13 став 2 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Потребно е веднаш по склучување на договорот и пред започнување со работа, работникот да биде пријавен во задолжително социјално осигурување.'
  },
  {
    id: 'q6',
    category: 'recruitment',
    text: 'Дали во просториите на седиштето на работодавачот се чува писмена форма од Договорот за вработување?',
    article: 'Член 15 став 2 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Потребно е да се направи проверка и да се потврди дека сите договори се чуваат во седиштето на работодавачот.'
  },
  {
    id: 'q7',
    category: 'recruitment',
    text: 'Дали на вработените му се врачува договор за вработување на денот на потпишување на договорот за вработување?',
    article: 'Член 15 став 3 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Сите договори кои не се предадени на вработените, потребно е да се потпишат од двете страни и да се врачат на оние вработени кои не примиле договор.'
  },
  {
    id: 'q8',
    category: 'recruitment',
    text: 'Кое лице ги потпишува договорите за вработување во име на работодавачот?',
    article: 'Член 17 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.NONE,
    options: [
      { value: 'legal_rep', text: 'Законски застапник - Управител', isCorrect: true },
      { value: 'authorized', text: 'Ополномоштено лице со валидно овластување', isCorrect: true },
      { value: 'other', text: 'Друго лице без овластување', isCorrect: false }
    ],
    recommendation: 'Обезбедете договорите да ги потпишува законскиот застапник или валидно ополномоштено лице.'
  },
  {
    id: 'q9',
    category: 'recruitment',
    text: 'Дали од страна на работодавачот е ангажирано лице кое нема наполнето 15 години или дете кое не завршило задолжително образование?',
    article: 'Член 18 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Без одлагање да се прекине ангажманот на секое лице кое нема навршено 15 години.'
  },
  {
    id: 'q10',
    category: 'recruitment',
    text: 'Дали од страна на работодавачот во акт (акт за систематизација на работни места или друг акт) е определено кои се посебните услови за вршење на работа за секое поединечно работно место?',
    article: 'Член 19 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Препорачливо е да се изготви акт за систематизација и за секоја работна позиција да се определат услови за вршење на работа.'
  },
  {
    id: 'q11',
    category: 'recruitment',
    text: 'Дали со работодавачот е склучен договор за вработување со странец кој нема добиено дозвола за престој по однос на вработување кај работодавачот?',
    article: 'Член 20 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'За сите странски лица кои работат кај работодавачот, потребно е да се обезбеди дозвола за престој согласно Законот за странци.'
  },
  {
    id: 'q12',
    category: 'recruitment',
    text: 'Дали огласот за вработување содржи: назив на работното место, услови за вршење на работата, работно време, распоред, висина на плата, рок за пријавување, рок за избор и податоци за работодавачот?',
    article: 'Член 23 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.8,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Обезбедете огласот да содржи сите задолжителни податоци пропишани со Законот.'
  },
  {
    id: 'q13',
    category: 'recruitment',
    text: 'Дали од кандидатот за вработување се бараат докази за брачен статус, семеен живот, планирање на семејство или социјален/политички статус?',
    article: 'Членови 6, 7, 8 и Закон за заштита на личните податоци',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Не смеат да се бараат лични податоци кои не се релевантни за вршење на работата.'
  },
  {
    id: 'q14',
    category: 'recruitment',
    text: 'Дали на огласот за вработување се наведени условите за вработување кои се однесуваат на работното место и условите за засновање на работниот однос?',
    article: 'Член 14 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Обезбедете огласот да содржи јасни услови за вработување.'
  },

  // ===== ДОГОВОРИ ЗА ВРАБОТУВАЊЕ (q15-q17) =====
  {
    id: 'q15',
    category: 'contracts',
    text: 'Дали договорот за вработување содржи: вид на работа, место на работа, датум на засновање, траење, работно време и висина на плата?',
    article: 'Член 15 став 1 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Договорот мора да содржи сите задолжителни елементи пропишани со Законот.'
  },
  {
    id: 'q16',
    category: 'contracts',
    text: 'Дали договорот за вработување е склучен во писмена форма?',
    article: 'Член 15 став 1 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Сите договори мора да бидат склучени во писмена форма.'
  },
  {
    id: 'q17',
    category: 'contracts',
    text: 'Дали работникот има право да побара измена на договорот за вработување доколку се променат условите за работа?',
    article: 'Член 42 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Обезбедете работниците да знаат за нивното право на измена на договорот при променети услови.'
  },

  // ===== ПРОЦЕС НА РАБОТА И ОРГАНИЗАЦИЈА (q18-q26) =====
  {
    id: 'q18',
    category: 'work_organization',
    text: 'Дали на работникот му е врачен акт за систематизација односно опис на работното место?',
    article: 'Член 28 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Обезбедете секој работник да добие писмен опис на своето работно место.'
  },
  {
    id: 'q19',
    category: 'work_organization',
    text: 'Дали на работното место на работникот му се доделуваат и задачи кои не се содржани во описот на неговото работно место?',
    article: 'Член 28 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.NONE,
    recommendation: 'Избегнувајте доделување задачи надвор од описот на работното место без соодветен анекс на договорот.'
  },
  {
    id: 'q20',
    category: 'work_organization',
    text: 'Дали работникот може да врши работа надвор од просториите на работодавачот (работа од дома)?',
    article: 'Член 43 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.NONE,
    options: [
      { value: 'no', text: 'Не', isCorrect: true },
      { value: 'with_agreement', text: 'Да, но со писмен договор', isCorrect: true },
      { value: 'without_agreement', text: 'Да, без договор', isCorrect: false }
    ],
    recommendation: 'Работа од дома мора да биде уредена со писмен договор.'
  },
  {
    id: 'q21',
    category: 'work_organization',
    text: 'Дали работодавачот има донесено правилник за работа?',
    article: 'Член 123 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Работодавачот мора да донесе правилник за работа.'
  },
  {
    id: 'q22',
    category: 'work_organization',
    text: 'Дали работникот може да врши работа за друг работодавач за време на траењето на работниот однос?',
    article: 'Член 44 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.NONE,
    options: [
      { value: 'no', text: 'Не', isCorrect: false },
      { value: 'with_consent', text: 'Да, со согласност на работодавачот', isCorrect: true },
      { value: 'without_consent', text: 'Да, без согласност', isCorrect: false }
    ],
    recommendation: 'Работа за друг работодавач бара писмена согласност.'
  },
  {
    id: 'q23',
    category: 'work_organization',
    text: 'Дали работодавачот води евиденција за работниците?',
    article: 'Член 96 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Задолжително е да се води евиденција за сите работници.'
  },
  {
    id: 'q24',
    category: 'work_organization',
    text: 'Дали работодавачот има назначено лице задолжено за безбедност при работа?',
    article: 'Закон за безбедност и здравје при работа',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Потребно е да се назначи лице задолжено за безбедност при работа.'
  },
  {
    id: 'q25',
    category: 'work_organization',
    text: 'Дали работниците се обучени за безбедност и здравје при работа?',
    article: 'Закон за безбедност и здравје при работа',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Задолжително е да се спроведе обука за безбедност при работа.'
  },
  {
    id: 'q26',
    category: 'work_organization',
    text: 'Дали работодавачот има изготвено проценка на ризик за работните места?',
    article: 'Закон за безбедност и здравје при работа',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Потребно е да се изготви проценка на ризик за сите работни места.'
  },

  // ===== ЗАШТИТА НА ЛИЧНОСТА И ПРАВАТА НА РАБОТНИКОТ (q27-q29) =====
  {
    id: 'q27',
    category: 'protection',
    text: 'Дали работодавачот преземал мерки за заштита на достоинството на работникот при вршење на работата?',
    article: 'Член 9-а од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Потребно е да се преземат конкретни мерки за заштита на достоинството на работниците.'
  },
  {
    id: 'q28',
    category: 'protection',
    text: 'Дали работодавачот има донесено посебен акт за заштита од малтретирање при работа (мобинг)?',
    article: 'Член 9-в од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Потребно е да се донесе посебен акт за заштита од малтретирање при работа.'
  },
  {
    id: 'q29',
    category: 'protection',
    text: 'Дали работодавачот има назначено лице задолжено за спречување на малтретирање при работа?',
    article: 'Член 9-в од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Потребно е да се назначи лице задолжено за спречување на малтретирање.'
  },

  // ===== ПОСЕБНИ ВИДОВИ ДОГОВОРИ (q30-q33) =====
  {
    id: 'q30',
    category: 'special_contracts',
    text: 'Дали работодавачот склучува договори за вработување на определено време?',
    article: 'Член 45 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Договорите на определено време мора да бидат оправдани со објективни причини.'
  },
  {
    id: 'q31',
    category: 'special_contracts',
    text: 'Дали договорот на определено време трае подолго од 4 години?',
    article: 'Член 45 став 3 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Договорот на определено време не смее да трае подолго од 4 години.'
  },
  {
    id: 'q32',
    category: 'special_contracts',
    text: 'Дали работодавачот склучува договор за привремени и повремени работи?',
    article: 'Член 49 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Договорите за привремени работи мора да бидат уредени правилно.'
  },
  {
    id: 'q33',
    category: 'special_contracts',
    text: 'Дали работодавачот склучува договор за пробна работа?',
    article: 'Член 50 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Пробната работа мора да биде уредена со писмен договор.'
  },

  // ===== ПРЕСТАНОК НА РАБОТНИОТ ОДНОС (q34-q44) =====
  {
    id: 'q34',
    category: 'termination',
    text: 'Дали работодавачот може едностарно да го раскине договорот за вработување без отказ и без надомест?',
    article: 'Член 81 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Работодавачот не смее едностарно да го раскине договорот без законска основа, отказен рок и образложение.'
  },
  {
    id: 'q35',
    category: 'termination',
    text: 'Дали на работникот му е доставено писмено образложение при отказ на договорот за вработување?',
    article: 'Член 83 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Секој отказ мора да биде писмен, образложен и доставен до работникот.'
  },
  {
    id: 'q36',
    category: 'termination',
    text: 'Дали отказот на договорот за вработување е доставен лично на работникот или препорачано по пошта?',
    article: 'Член 83 став 3 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Отказот мора да биде доставен лично или препорачано по пошта со потврда за прием.'
  },
  {
    id: 'q37',
    category: 'termination',
    text: 'Дали работникот има право на отказен рок?',
    article: 'Член 82 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Работникот мора да има законски отказен рок.'
  },
  {
    id: 'q38',
    category: 'termination',
    text: 'Дали работникот има право на надомест за време на отказниот рок?',
    article: 'Член 82 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Работникот има право на плата за време на отказниот рок.'
  },
  {
    id: 'q39',
    category: 'termination',
    text: 'Дали работодавачот може да го откаже договорот поради неспособност на работникот?',
    article: 'Член 79 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Отказот поради неспособност мора да биде оправдан со објективни причини.'
  },
  {
    id: 'q40',
    category: 'termination',
    text: 'Дали работодавачот може да го откаже договорот поради повреда на работната обврска?',
    article: 'Член 78 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Отказот поради повреда мора да биде оправдан со докази.'
  },
  {
    id: 'q41',
    category: 'termination',
    text: 'Дали работникот има право на севкупна отпремнина?',
    article: 'Член 94 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Работникот има право на отпремнина согласно законот.'
  },
  {
    id: 'q42',
    category: 'termination',
    text: 'Дали работникот може да го откаже договорот без отказен рок поради повреда на работодавачот?',
    article: 'Член 87 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Работникот има право на итен отказ доколку работодавачот ги повредува обврските.'
  },
  {
    id: 'q43',
    category: 'termination',
    text: 'Дали работникот може да бара обештетување за штета доколку отказот е незаконит?',
    article: 'Член 101 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Работникот има право на обештетување за незаконит отказ.'
  },
  {
    id: 'q44',
    category: 'termination',
    text: 'Дали работодавачот може да го откаже договорот за време на бременост или породилно отсуство?',
    article: 'Член 89 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Забранет е отказ за време на бременост и породилно отсуство.'
  },

  // ===== ПЛАЌАЊЕ НА РАБОТА (q45-q48) =====
  {
    id: 'q45',
    category: 'payment',
    text: 'Дали работникот прима плата најмалку еднаш месечно?',
    article: 'Член 105 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Платата мора да се исплатува редовно, најмалку еднаш месечно.'
  },
  {
    id: 'q46',
    category: 'payment',
    text: 'Дали плата се исплатува најдоцна до 15-ти во месецот за претходниот месец?',
    article: 'Член 106 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Обезбедете платата да се исплатува до 15-ти во месецот за претходниот месец.'
  },
  {
    id: 'q47',
    category: 'payment',
    text: 'Дали работникот прима писмена потврда (платен лист) за исплатената плата?',
    article: 'Член 107 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Потребно е да се врачува платен лист на секој работник при исплата на плата.'
  },
  {
    id: 'q48',
    category: 'payment',
    text: 'Дали се исплаќа надомест за прекувремена работа?',
    article: 'Член 119 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Потребно е да се исплаќа соодветен надомест за прекувремена работа.'
  },

  // ===== РАБОТНО ВРЕМЕ (q49-q63) =====
  {
    id: 'q49',
    category: 'working_time',
    text: 'Дали полното работно време на работникот изнесува 40 часа неделно?',
    article: 'Член 116 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Полното работно време мора да изнесува 40 часа неделно.'
  },
  {
    id: 'q50',
    category: 'working_time',
    text: 'Дали работникот може да работи прекувремено повеќе од 8 часа неделно?',
    article: 'Член 119 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Прекувременото работење е ограничено на максимум 8 часа неделно.'
  },
  {
    id: 'q51',
    category: 'working_time',
    text: 'Дали се води евиденција за работното време на вработените?',
    article: 'Член 117 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Задолжително е да се води евиденција за работното време на сите вработени.'
  },
  {
    id: 'q52',
    category: 'working_time',
    text: 'Дали работникот може да работи повеќе од 12 часа дневно?',
    article: 'Член 118 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Дневното работно време не смее да надминува 12 часа.'
  },
  {
    id: 'q53',
    category: 'working_time',
    text: 'Дали работникот работи на недела или на државен празник?',
    article: 'Член 129 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'no', text: 'Не', isCorrect: true },
      { value: 'with_consent', text: 'Да, со писмена согласност', isCorrect: true },
      { value: 'without_consent', text: 'Да, без согласност', isCorrect: false }
    ],
    recommendation: 'Работа на недела бара писмена согласност на работникот.'
  },
  {
    id: 'q54',
    category: 'working_time',
    text: 'Дали работникот добива зголемена плата за работа на недела или празник?',
    article: 'Член 129 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Работата на недела и празник се компензира со зголемена плата.'
  },
  {
    id: 'q55',
    category: 'working_time',
    text: 'Дали работникот може да работи ноќе (од 22:00 до 6:00)?',
    article: 'Член 128 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Ноќна работа мора да биде соодветно надоместена.'
  },
  {
    id: 'q56',
    category: 'working_time',
    text: 'Дали работникот добива зголемена плата за ноќна работа?',
    article: 'Член 128 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Ноќната работа се компензира со зголемена плата.'
  },
  {
    id: 'q57',
    category: 'working_time',
    text: 'Дали работникот може да работи во смени?',
    article: 'Член 126 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Работата во смени мора да биде уредена со распоред.'
  },
  {
    id: 'q58',
    category: 'working_time',
    text: 'Дали работникот има право на одмор од најмалку 12 часа меѓу две смени?',
    article: 'Член 126 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Потребно е да се обезбеди одмор од најмалку 12 часа меѓу две смени.'
  },
  {
    id: 'q59',
    category: 'working_time',
    text: 'Дали работникот може да работи повеќе од 48 часа просечно неделно во период од 4 месеци?',
    article: 'Член 119 став 3 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Просечното работно време не смее да надминува 48 часа неделно.'
  },
  {
    id: 'q60',
    category: 'working_time',
    text: 'Дали работникот има право на скратено работно време поради посебни услови на работа?',
    article: 'Член 122 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Обезбедете скратено работно време за работници со посебни услови.'
  },
  {
    id: 'q61',
    category: 'working_time',
    text: 'Дали работникот може да работи на неколку работни места кај истиот работодавач?',
    article: 'Член 42 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.NONE,
    recommendation: 'Работата на неколку работни места мора да биде уредена со договор.'
  },
  {
    id: 'q62',
    category: 'working_time',
    text: 'Дали работникот има право на исплата на плата за време на боледување?',
    article: 'Член 93 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Работникот има право на надомест за време на боледување.'
  },
  {
    id: 'q63',
    category: 'working_time',
    text: 'Дали работодавачот води евиденција за прекувремената работа?',
    article: 'Член 117 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Задолжително е да се води евиденција за прекувремената работа.'
  },

  // ===== ПАУЗИ И ОДМОРИЕ (q64-q77) =====
  {
    id: 'q64',
    category: 'rest_breaks',
    text: 'Дали работникот има право на дневна пауза од најмалку 30 минути?',
    article: 'Член 132 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Обезбедете дневна пауза од најмалку 30 минути за сите работници.'
  },
  {
    id: 'q65',
    category: 'rest_breaks',
    text: 'Дали работникот има право на неделен одмор од најмалку 24 часа непрекинато?',
    article: 'Член 133 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Потребно е да се обезбеди неделен одмор од најмалку 24 часа.'
  },
  {
    id: 'q66',
    category: 'rest_breaks',
    text: 'Дали работникот остварува годишен одмор од најмалку 20 работни дена?',
    article: 'Член 138 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Годишниот одмор мора да биде најмалку 20 работни дена.'
  },
  {
    id: 'q67',
    category: 'rest_breaks',
    text: 'Дали работникот може да се откаже од правото на годишен одмор?',
    article: 'Член 141 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Работникот не може да се откаже од годишниот одмор, ниту да прими парична компензација.'
  },
  {
    id: 'q68',
    category: 'rest_breaks',
    text: 'Дали работодавачот води евиденција за искористениот годишен одмор?',
    article: 'Член 140 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Задолжително е да се води евиденција за годишниот одмор.'
  },
  {
    id: 'q69',
    category: 'rest_breaks',
    text: 'Дали работникот има право на зголемен годишен одмор (повеќе од 20 дена)?',
    article: 'Член 138 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.NONE,
    recommendation: 'Работникот може да има право на зголемен годишен одмор според колективен договор.'
  },
  {
    id: 'q70',
    category: 'rest_breaks',
    text: 'Дали работникот може да го користи годишниот одмор во два дела?',
    article: 'Член 139 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.NONE,
    recommendation: 'Годишниот одмор може да се користи во два дела.'
  },
  {
    id: 'q71',
    category: 'rest_breaks',
    text: 'Дали работникот има право на платено отсуство за семејни потреби?',
    article: 'Член 147 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Работникот има право на платено отсуство за семејни потреби.'
  },
  {
    id: 'q72',
    category: 'rest_breaks',
    text: 'Дали работникот има право на неплатено отсуство?',
    article: 'Член 148 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.NONE,
    recommendation: 'Работникот може да побара неплатено отсуство.'
  },
  {
    id: 'q73',
    category: 'rest_breaks',
    text: 'Дали работникот има право на платено отсуство за стручно усовршување?',
    article: 'Член 143 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Работникот има право на платено отсуство за стручно усовршување.'
  },
  {
    id: 'q74',
    category: 'rest_breaks',
    text: 'Дали работникот има право на годишен одмор и за периодот на боледување?',
    article: 'Член 138 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Боледувањето не ја намалува должината на годишниот одмор.'
  },
  {
    id: 'q75',
    category: 'rest_breaks',
    text: 'Дали работникот користи годишен одмор во текот на календарската година?',
    article: 'Член 137 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Годишниот одмор мора да се користи во текот на календарската година.'
  },
  {
    id: 'q76',
    category: 'rest_breaks',
    text: 'Дали работодавачот го отповикува работникот од годишен одмор?',
    article: 'Член 142 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Работодавачот може да го отповика работникот само во исклучителни случаи.'
  },
  {
    id: 'q77',
    category: 'rest_breaks',
    text: 'Дали работникот има право на компензација за неискористен годишен одмор по престанок на работниот однос?',
    article: 'Член 141 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Работникот има право на компензација за неискористен годишен одмор.'
  },

  // ===== ПОСЕБНА ЗАШТИТА (q78-q84) =====
  {
    id: 'q78',
    category: 'special_protection',
    text: 'Дали на бремена работничка и се доделува работа која е полесна или соодветна на нејзината состојба?',
    article: 'Член 163 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'На бремена работничка мора да и се обезбеди полесна работа или работа соодветна на нејзината состојба.'
  },
  {
    id: 'q79',
    category: 'special_protection',
    text: 'Дали на работничката која дои дете се дозволува платена пауза од еден и пол час дневно?',
    article: 'Член 164 став 4 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'На работничката која дои дете мора да и се даде платена пауза од еден и пол час дневно.'
  },
  {
    id: 'q80',
    category: 'special_protection',
    text: 'Дали бремена работничка може да работи ноќе?',
    article: 'Член 162 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Бремена работничка не смее да работи ноќе.'
  },
  {
    id: 'q81',
    category: 'special_protection',
    text: 'Дали бремена работничка може да работи прекувремено?',
    article: 'Член 162 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Бремена работничка не смее да работи прекувремено.'
  },
  {
    id: 'q82',
    category: 'special_protection',
    text: 'Дали работничката има право на отсуство поради бременост и раѓање?',
    article: 'Член 165 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Работничката има право на породилно отсуство согласно законот.'
  },
  {
    id: 'q83',
    category: 'special_protection',
    text: 'Дали за евентуалното прекувремено или ноќно работење на работник/работничка која има дете до седум години, задолжително се прибавува писмена согласност?',
    article: 'Член 164 став 4 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Не смее да се задава прекувремена работа или работа ноќе на работник кој има дете помладо од седум години без негова/нејзина писмена согласност.'
  },
  {
    id: 'q84',
    category: 'special_protection',
    text: 'Дали работникот со намалена работна способност има право на соодветно работно место?',
    article: 'Член 175 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Работодавачот мора да обезбеди соодветно работно место за работник со намалена работна способност.'
  }
];

// Company size-based sanctions
const sanctions = {
  micro: {
    sanction1: { employer: '500-1.000 евра', responsible: '250 евра' },
    sanction2: { employer: '200-400 евра', responsible: '100 евра' }
  },
  small: {
    sanction1: { employer: '500-1.000 евра', responsible: '250 евра' },
    sanction2: { employer: '200-400 евра', responsible: '100 евра' }
  },
  medium: {
    sanction1: { employer: '1.000-2.000 евра', responsible: '400 евра' },
    sanction2: { employer: '300-600 евра', responsible: '250 евра' }
  },
  large: {
    sanction1: { employer: '2.000-3.000 евра', responsible: '500 евра' },
    sanction2: { employer: '600-1.000 евра', responsible: '350 евра' }
  }
};

// Grade thresholds
const gradeConfig = {
  perfect: { min: 100, label: 'Перфектна усогласеност', class: 'perfect' },
  excellent: { min: 80, label: 'Одлична усогласеност', class: 'excellent' },
  veryGood: { min: 70, label: 'Задоволителна усогласеност', class: 'verygood' },
  good: { min: 60, label: 'Определена усогласеност', class: 'good' },
  average: { min: 50, label: 'Делумна усогласеност', class: 'average' },
  low: { min: 40, label: 'Ниска усогласеност', class: 'low' },
  veryLow: { min: 0, label: 'Исклучително ниска усогласеност', class: 'verylow' }
};

// Category display names
const categoryNames = {
  recruitment: 'Процес на вработување, огласи и општи околности',
  contracts: 'Договори за вработување',
  work_organization: 'Процес на работа и организација',
  protection: 'Заштита на личноста и правата на работникот',
  special_contracts: 'Посебни видови договори за вработување',
  termination: 'Престанок на работниот однос',
  payment: 'Плаќање на работа',
  working_time: 'Работно време',
  rest_breaks: 'Паузи и одморие',
  special_protection: 'Посебна заштита (бременост и родителство)'
};

module.exports = {
  questions,
  sanctions,
  gradeConfig,
  categoryNames,
  ANSWER_TYPES,
  SANCTION_LEVELS
};
