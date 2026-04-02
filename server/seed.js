import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// ── Models ──────────────────────────────────────────────────────────
import User from './src/models/User.js';
import Task from './src/models/Task.js';
import Project from './src/models/Project.js';
import PurchaseOrder from './src/models/PurchaseOrder.js';
import Announcement from './src/models/Announcement.js';
import Agreement from './src/models/Agreement.js';
import Lead from './src/models/Lead.js';
import Procedure from './src/models/Procedure.js';
import LeaveBalance from './src/models/LeaveBalance.js';
import Request from './src/models/Request.js';
import Notification from './src/models/Notification.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/packflow';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Task.deleteMany({}),
    Project.deleteMany({}),
    PurchaseOrder.deleteMany({}),
    Announcement.deleteMany({}),
    Agreement.deleteMany({}),
    Lead.deleteMany({}),
    Procedure.deleteMany({}),
    LeaveBalance.deleteMany({}),
    Request.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('Cleared all collections');

  const hash = await bcrypt.hash('Demo1234!', 10);

  // ── Users ───────────────────────────────────────────────────────
  const usersData = [
    // Top Management
    { name: 'Марко Стојановски', email: 'marko@lbfp.mk', department: 'top_management', isManager: true, role: 'owner', language: 'mk' },
    { name: 'Elena Dimitrova', email: 'elena@lbfp.mk', department: 'top_management', isManager: false, role: 'admin', language: 'en' },
    // Sales
    { name: 'Ана Петровска', email: 'ana@lbfp.mk', department: 'sales', isManager: true, role: 'reviewer', language: 'mk' },
    { name: 'Stefan Nikolov', email: 'stefan@lbfp.mk', department: 'sales', isManager: false, role: 'reviewer', language: 'en' },
    // Finance
    { name: 'Ивана Георгиевска', email: 'ivana@lbfp.mk', department: 'finance', isManager: true, role: 'reviewer', language: 'mk' },
    { name: 'David Trajkov', email: 'david@lbfp.mk', department: 'finance', isManager: false, role: 'reviewer', language: 'en' },
    // HR
    { name: 'Наташа Илиевска', email: 'natasa@lbfp.mk', department: 'hr', isManager: true, role: 'reviewer', language: 'mk' },
    { name: 'Kristina Jovanovska', email: 'kristina@lbfp.mk', department: 'hr', isManager: false, role: 'reviewer', language: 'en' },
    // Administration
    { name: 'Горан Миленковски', email: 'goran@lbfp.mk', department: 'administration', isManager: true, role: 'reviewer', language: 'mk' },
    // Quality Assurance
    { name: 'Мила Ристовска', email: 'mila@lbfp.mk', department: 'quality_assurance', isManager: true, role: 'reviewer', language: 'mk' },
    { name: 'Aleksandar Popov', email: 'aleksandar@lbfp.mk', department: 'quality_assurance', isManager: false, role: 'reviewer', language: 'en' },
    // R&D
    { name: 'Бојан Трајковски', email: 'bojan@lbfp.mk', department: 'r_and_d', isManager: true, role: 'reviewer', language: 'mk' },
    { name: 'Maja Kostadinova', email: 'maja@lbfp.mk', department: 'r_and_d', isManager: false, role: 'reviewer', language: 'en' },
    // Production
    { name: 'Дејан Ангеловски', email: 'dejan@lbfp.mk', department: 'production', isManager: true, role: 'reviewer', language: 'mk' },
    { name: 'Viktor Stojanovski', email: 'viktor@lbfp.mk', department: 'production', isManager: false, role: 'reviewer', language: 'en' },
    // Facility
    { name: 'Ѓорѓе Велковски', email: 'gjorgje@lbfp.mk', department: 'facility', isManager: true, role: 'reviewer', language: 'mk' },
    // Machines
    { name: 'Никола Спасовски', email: 'nikola@lbfp.mk', department: 'machines', isManager: true, role: 'reviewer', language: 'mk' },
    // Nabavki (Procurement)
    { name: 'Тамара Здравковска', email: 'tamara@lbfp.mk', department: 'nabavki', isManager: true, role: 'reviewer', language: 'mk' },
    // Carina (Customs)
    { name: 'Филип Костовски', email: 'filip@lbfp.mk', department: 'carina', isManager: true, role: 'reviewer', language: 'mk' },
  ];

  const users = await User.insertMany(
    usersData.map(u => ({ ...u, passwordHash: hash }))
  );
  console.log(`Created ${users.length} users`);

  // Helper to find user by email
  const u = email => users.find(x => x.email === email)._id;
  const uObj = email => users.find(x => x.email === email);

  // ── Tasks ───────────────────────────────────────────────────────
  const tasksData = [
    // Sales tasks
    { title: 'Подготви понуда за Алкалоид', description: 'Нов клиент бара понуда за флексибилна амбалажа за фармацевтски производи. Потребно е да се подготви детална ценовна понуда.', assignedTo: u('stefan@lbfp.mk'), createdBy: u('ana@lbfp.mk'), department: 'sales', priority: 'high', status: 'in_progress', deadline: new Date('2026-03-28') },
    { title: 'Follow up with Vitaminka', description: 'Send updated pricing for snack packaging line. They requested volume discount for 500k+ units.', assignedTo: u('ana@lbfp.mk'), createdBy: u('marko@lbfp.mk'), department: 'sales', priority: 'medium', status: 'todo', deadline: new Date('2026-04-01') },
    { title: 'Ажурирај CRM за Q1 резултати', description: 'Внеси ги сите затворени зделки од Q1 2026 во системот.', assignedTo: u('stefan@lbfp.mk'), createdBy: u('ana@lbfp.mk'), department: 'sales', priority: 'low', status: 'todo', deadline: new Date('2026-04-05') },
    // Finance tasks
    { title: 'Месечен финансиски извештај', description: 'Подготви го финансискиот извештај за март 2026. Вклучи ги сите приходи, расходи и профитна маржа.', assignedTo: u('david@lbfp.mk'), createdBy: u('ivana@lbfp.mk'), department: 'finance', priority: 'high', status: 'in_progress', deadline: new Date('2026-03-31') },
    { title: 'Review supplier invoices', description: 'Cross-check all supplier invoices for March against purchase orders. Flag any discrepancies.', assignedTo: u('ivana@lbfp.mk'), createdBy: u('marko@lbfp.mk'), department: 'finance', priority: 'medium', status: 'todo', deadline: new Date('2026-04-03') },
    // HR tasks
    { title: 'Организирај обука за безбедност', description: 'Годишна обука за безбедност и здравје при работа за сите вработени во производство.', assignedTo: u('kristina@lbfp.mk'), createdBy: u('natasa@lbfp.mk'), department: 'hr', priority: 'high', status: 'todo', deadline: new Date('2026-04-10') },
    { title: 'Onboarding for new QA engineer', description: 'Prepare onboarding materials and schedule orientation for the new quality assurance team member starting April 1st.', assignedTo: u('natasa@lbfp.mk'), createdBy: u('marko@lbfp.mk'), department: 'hr', priority: 'medium', status: 'in_progress', deadline: new Date('2026-03-31') },
    // Production tasks
    { title: 'Калибрација на машина за печатење', description: 'Потребна е рекалибрација на флексо машината бр. 3 поради отстапување во бојата.', assignedTo: u('viktor@lbfp.mk'), createdBy: u('dejan@lbfp.mk'), department: 'production', priority: 'urgent', status: 'in_progress', deadline: new Date('2026-03-24') },
    { title: 'Production schedule for April', description: 'Create the detailed production schedule for April including all confirmed orders and maintenance windows.', assignedTo: u('dejan@lbfp.mk'), createdBy: u('marko@lbfp.mk'), department: 'production', priority: 'high', status: 'todo', deadline: new Date('2026-03-30') },
    // QA tasks
    { title: 'Тестирај нов материјал за ламинација', description: 'Направи тестови за јакост, транспарентност и бариерни својства на новиот ламинатен филм од добавувачот.', assignedTo: u('aleksandar@lbfp.mk'), createdBy: u('mila@lbfp.mk'), department: 'quality_assurance', priority: 'high', status: 'in_progress', deadline: new Date('2026-03-27') },
    { title: 'ISO 9001 audit preparation', description: 'Prepare documentation and conduct internal audit before the external ISO 9001 surveillance audit in May.', assignedTo: u('mila@lbfp.mk'), createdBy: u('marko@lbfp.mk'), department: 'quality_assurance', priority: 'urgent', status: 'todo', deadline: new Date('2026-04-15') },
    // R&D tasks
    { title: 'Развој на биоразградлива амбалажа', description: 'Истражи можности за целосно биоразградлива флексибилна амбалажа за прехранбени производи.', assignedTo: u('maja@lbfp.mk'), createdBy: u('bojan@lbfp.mk'), department: 'r_and_d', priority: 'high', status: 'in_progress', deadline: new Date('2026-05-01') },
    { title: 'Test recyclable mono-material pouch', description: 'Run barrier tests on the PE mono-material stand-up pouch prototype for dry food applications.', assignedTo: u('bojan@lbfp.mk'), createdBy: u('marko@lbfp.mk'), department: 'r_and_d', priority: 'medium', status: 'todo', deadline: new Date('2026-04-20') },
    // Administration
    { title: 'Обнови договор за чистење', description: 'Договорот со фирмата за чистење истекува на 01.04. Преговарај за нови услови.', assignedTo: u('goran@lbfp.mk'), createdBy: u('marko@lbfp.mk'), department: 'administration', priority: 'medium', status: 'todo', deadline: new Date('2026-03-30') },
    // Completed tasks
    { title: 'Годишен попис на залихи', description: 'Завршен е годишниот попис на сите суровини и готови производи во магацинот.', assignedTo: u('tamara@lbfp.mk'), createdBy: u('marko@lbfp.mk'), department: 'nabavki', priority: 'high', status: 'done', deadline: new Date('2026-03-20') },
    { title: 'Customs documentation for EU export', description: 'All export documentation for the EU shipment to Germany has been completed and verified.', assignedTo: u('filip@lbfp.mk'), createdBy: u('ana@lbfp.mk'), department: 'carina', priority: 'high', status: 'approved', approvedBy: u('marko@lbfp.mk'), approvedAt: new Date('2026-03-19'), deadline: new Date('2026-03-20') },
  ];

  const tasks = await Task.insertMany(tasksData);
  console.log(`Created ${tasks.length} tasks`);

  // ── Projects ────────────────────────────────────────────────────
  const projectsData = [
    {
      title: 'Нова линија за биоразградлива амбалажа',
      description: 'Развој и лансирање на целосно биоразградлива линија на флексибилна амбалажа за прехранбената индустрија. Овој проект вклучува истражување на материјали, дизајн, тестирање и пилот производство.',
      owner: u('marko@lbfp.mk'),
      department: 'r_and_d',
      priority: 'high',
      status: 'active',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-08-31'),
      budget: 2500000,
      goals: ['Развој на 3 типа биоразградлива амбалажа', 'Добивање на потребни сертификати', 'Пилот производство до јуни 2026'],
      assignedUsers: [u('bojan@lbfp.mk'), u('maja@lbfp.mk'), u('mila@lbfp.mk'), u('dejan@lbfp.mk')],
      involvedDepartments: [
        { department: 'r_and_d', reason: 'Истражување и развој на материјали', expected: 'Прототипови за тестирање', deadline: new Date('2026-04-30') },
        { department: 'quality_assurance', reason: 'Тестирање и сертификација', expected: 'ISO и EN сертификати', deadline: new Date('2026-06-30') },
        { department: 'production', reason: 'Пилот производство', expected: 'Прва серија', deadline: new Date('2026-07-31') },
      ],
      tasks: [
        { title: 'Анализа на материјали', status: 'done', priority: 'high', assignedTo: [u('maja@lbfp.mk')], subtasks: [{ title: 'PLA филм тестирање', done: true }, { title: 'Целулозна база тестирање', done: true }] },
        { title: 'Дизајн на прототип', status: 'in_progress', priority: 'high', assignedTo: [u('bojan@lbfp.mk'), u('maja@lbfp.mk')], deadline: new Date('2026-04-15'), subtasks: [{ title: 'CAD модел', done: true }, { title: 'Спецификација на слоеви', done: false }] },
        { title: 'Барирени тестови', status: 'todo', priority: 'medium', assignedTo: [u('mila@lbfp.mk')], deadline: new Date('2026-05-01') },
      ],
    },
    {
      title: 'ERP System Integration',
      description: 'Full integration of new ERP system across all departments. This will replace the current manual tracking with automated workflows for orders, inventory, and production planning.',
      owner: u('elena@lbfp.mk'),
      department: 'top_management',
      priority: 'urgent',
      status: 'active',
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-06-30'),
      budget: 5000000,
      goals: ['Go-live by June 2026', 'Train all department heads', 'Migrate historical data from last 3 years'],
      assignedUsers: [u('ivana@lbfp.mk'), u('goran@lbfp.mk'), u('ana@lbfp.mk'), u('natasa@lbfp.mk')],
      involvedDepartments: [
        { department: 'finance', reason: 'Financial module setup and chart of accounts migration', expected: 'Fully operational finance module', deadline: new Date('2026-04-30') },
        { department: 'sales', reason: 'CRM and order management integration', expected: 'Order pipeline automation', deadline: new Date('2026-05-15') },
        { department: 'administration', reason: 'IT infrastructure and user management', expected: 'System deployment and access control', deadline: new Date('2026-03-31') },
      ],
      tasks: [
        { title: 'Server infrastructure setup', status: 'done', priority: 'high', assignedTo: [u('goran@lbfp.mk')], subtasks: [{ title: 'Provision servers', done: true }, { title: 'Network configuration', done: true }, { title: 'SSL certificates', done: true }] },
        { title: 'Data migration plan', status: 'in_progress', priority: 'high', assignedTo: [u('ivana@lbfp.mk')], deadline: new Date('2026-04-01'), subtasks: [{ title: 'Map legacy data fields', done: true }, { title: 'Write migration scripts', done: false }, { title: 'Test migration on staging', done: false }] },
        { title: 'User training schedule', status: 'todo', priority: 'medium', assignedTo: [u('natasa@lbfp.mk')], deadline: new Date('2026-05-01') },
      ],
    },
    {
      title: 'Проширување на производствен капацитет',
      description: 'Набавка и инсталација на нова флексо машина за печатење со 8 бои за зголемување на производствениот капацитет за 30%.',
      owner: u('marko@lbfp.mk'),
      department: 'production',
      priority: 'high',
      status: 'active',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-09-30'),
      budget: 15000000,
      goals: ['Набавка на машина до мај 2026', 'Инсталација и тестирање до јули', 'Полн капацитет до септември'],
      assignedUsers: [u('dejan@lbfp.mk'), u('nikola@lbfp.mk'), u('tamara@lbfp.mk')],
      involvedDepartments: [
        { department: 'machines', reason: 'Инсталација и одржување', expected: 'Техничка подготовка на просторот', deadline: new Date('2026-05-15') },
        { department: 'nabavki', reason: 'Набавка на машина и резервни делови', expected: 'Испорака до мај', deadline: new Date('2026-05-01') },
        { department: 'finance', reason: 'Финансирање и буџет', expected: 'Одобрение на инвестиција', deadline: new Date('2026-03-31') },
      ],
      tasks: [
        { title: 'Евалуација на понуди', status: 'done', priority: 'high', assignedTo: [u('tamara@lbfp.mk'), u('dejan@lbfp.mk')], subtasks: [{ title: 'Bobst понуда', done: true }, { title: 'Windmöller & Hölscher понуда', done: true }, { title: 'Финална споредба', done: true }] },
        { title: 'Подготовка на просторот', status: 'in_progress', priority: 'medium', assignedTo: [u('nikola@lbfp.mk')], deadline: new Date('2026-05-01') },
      ],
    },
  ];

  const projects = await Project.insertMany(projectsData);
  console.log(`Created ${projects.length} projects`);

  // ── Purchase Orders ─────────────────────────────────────────────
  const poData = [
    {
      clientName: 'Алкалоид АД Скопје',
      dateExpected: new Date('2026-04-15'),
      moq: 50000,
      description: 'Флексибилна амбалажа за фармацевтски производи - таблети и прашоци. Потребна е бариерна заштита и детска заштита.',
      products: [
        { productType: 'Сашети за прашок', weight: '5g', description: 'Алуминиумско фолио ламинат, 80x120mm' },
        { productType: 'Стик пакување', weight: '10g', description: 'PET/AL/PE структура, 25x150mm' },
      ],
      createdBy: u('ana@lbfp.mk'),
      status: 'open',
      questions: [
        { text: 'Дали материјалот ги исполнува барањата за фармацевтска употреба (EU GMP)?', targetDepartment: 'quality_assurance', createdBy: u('ana@lbfp.mk'), answer: 'Да, нашиот PET/AL/PE ламинат е сертифициран по EU GMP стандардите.', answeredBy: u('mila@lbfp.mk'), answeredAt: new Date('2026-03-21'), resolved: true, resolvedBy: u('ana@lbfp.mk'), resolvedAt: new Date('2026-03-22') },
        { text: 'Можеме ли да постигнеме бариера за влага < 0.5 g/m²/24h?', targetDepartment: 'r_and_d', createdBy: u('ana@lbfp.mk'), answer: '', resolved: false },
      ],
    },
    {
      clientName: 'Vitaminka AD Prilep',
      dateExpected: new Date('2026-05-01'),
      moq: 200000,
      description: 'Stand-up pouches for snack products - chips, nuts, and dried fruit lines. Need high barrier and attractive print quality.',
      products: [
        { productType: 'Stand-up pouch 200g', weight: '200g', description: 'PET/VMPET/PE, 160x250+45mm, zip-lock' },
        { productType: 'Pillow bag 100g', weight: '100g', description: 'OPP/VMPET/PE, 140x200mm' },
        { productType: 'Stand-up pouch 500g', weight: '500g', description: 'PET/VMPET/PE, 200x300+50mm, zip-lock' },
      ],
      createdBy: u('stefan@lbfp.mk'),
      status: 'open',
      questions: [
        { text: 'Can we source VMPET film domestically or do we need to import?', targetDepartment: 'nabavki', createdBy: u('stefan@lbfp.mk'), answer: '', resolved: false },
        { text: 'What is the lead time for gravure cylinders for 8-color design?', targetDepartment: 'r_and_d', createdBy: u('stefan@lbfp.mk'), answer: 'Standard lead time is 3-4 weeks from artwork approval.', answeredBy: u('bojan@lbfp.mk'), answeredAt: new Date('2026-03-22'), resolved: false },
      ],
    },
    {
      clientName: 'Пивара Скопје',
      dateExpected: new Date('2026-04-20'),
      moq: 100000,
      description: 'Етикети за нова линија на крафт пиво. Потребни се водоотпорни етикети со метализиран ефект.',
      products: [
        { productType: 'Етикета за шише 0.33L', weight: '0.5g', description: 'OPP со металик ефект, 70x90mm' },
        { productType: 'Етикета за шише 0.5L', weight: '0.7g', description: 'OPP со металик ефект, 80x110mm' },
      ],
      createdBy: u('ana@lbfp.mk'),
      status: 'open',
      questions: [
        { text: 'Дали можеме да обезбедиме cold foil ефект на флексо печат?', targetDepartment: 'r_and_d', createdBy: u('ana@lbfp.mk'), answer: '', resolved: false },
      ],
    },
  ];

  const pos = await PurchaseOrder.insertMany(poData);
  console.log(`Created ${pos.length} purchase orders`);

  // ── Announcements ───────────────────────────────────────────────
  const announcementsData = [
    { content: 'Почитувани колеги, ве информираме дека на 28 март (петок) ќе се одржи годишниот состанок на компанијата во конференциската сала во 14:00 часот. Присуството е задолжително за сите вработени.', createdBy: u('marko@lbfp.mk') },
    { content: 'Reminder: The ISO 9001 external surveillance audit is scheduled for May 12-13. All department heads must ensure documentation is up to date. Contact Mila for the checklist.', createdBy: u('elena@lbfp.mk') },
    { content: 'Честитки на тимот за продажба за рекордните резултати во Q1 2026! Го надминавме планот за 15%. Продолжете со одличната работа!', createdBy: u('marko@lbfp.mk') },
    { content: 'New parking policy effective April 1st: reserved spots for production shift workers (6AM-2PM). All others please use the secondary lot. Maps available at the administration office.', createdBy: u('goran@lbfp.mk') },
  ];

  const announcements = await Announcement.insertMany(announcementsData);
  console.log(`Created ${announcements.length} announcements`);

  // ── Agreements ──────────────────────────────────────────────────
  const agreementsData = [
    {
      title: 'Договор за набавка на суровини - PolyFilm GmbH',
      description: 'Годишен рамковен договор за набавка на BOPP, PET и PE филмови за производство.',
      otherParty: 'PolyFilm GmbH, Germany',
      category: 'supply',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      autoRenew: true,
      reminderDays: 60,
      value: 8500000,
      currency: 'EUR',
      status: 'active',
      department: 'nabavki',
      createdBy: u('tamara@lbfp.mk'),
      notes: 'Клаузула за ценовно приспособување на квартално ниво врз основа на индексот на цени на нафта.',
    },
    {
      title: 'NDA - Alkaloid AD',
      description: 'Non-disclosure agreement for pharmaceutical packaging development project.',
      otherParty: 'Alkaloid AD Skopje',
      category: 'nda',
      startDate: new Date('2026-02-15'),
      endDate: new Date('2028-02-15'),
      autoRenew: false,
      reminderDays: 90,
      value: null,
      currency: 'MKD',
      status: 'active',
      department: 'sales',
      createdBy: u('ana@lbfp.mk'),
      notes: 'Covers all product specifications, pricing, and technical drawings shared during the project.',
    },
    {
      title: 'Договор за одржување на машини',
      description: 'Сервисен договор за превентивно и корективно одржување на сите производствени машини.',
      otherParty: 'Техно Сервис ДООЕЛ Скопје',
      category: 'service',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2026-05-31'),
      autoRenew: true,
      reminderDays: 45,
      value: 1200000,
      currency: 'MKD',
      status: 'active',
      department: 'machines',
      createdBy: u('nikola@lbfp.mk'),
    },
    {
      title: 'Office lease agreement',
      description: 'Lease for the administrative office building, 450m² on the second floor.',
      otherParty: 'Real Estate Partners DOO',
      category: 'lease',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2027-01-01'),
      autoRenew: false,
      reminderDays: 180,
      value: 3600,
      currency: 'EUR',
      status: 'active',
      department: 'administration',
      createdBy: u('goran@lbfp.mk'),
      notes: 'Monthly rent: 3600 EUR. Annual increase capped at 3%.',
    },
    {
      title: 'Договор за вработување - шаблон',
      description: 'Стандарден договор за вработување на неопределено време.',
      otherParty: 'Нов вработен',
      category: 'employment',
      startDate: new Date('2026-01-01'),
      endDate: null,
      autoRenew: false,
      status: 'draft',
      department: 'hr',
      createdBy: u('natasa@lbfp.mk'),
    },
  ];

  const agreements = await Agreement.insertMany(agreementsData);
  console.log(`Created ${agreements.length} agreements`);

  // ── Leads ───────────────────────────────────────────────────────
  const leadsData = [
    {
      contactName: 'Петар Јованов',
      companyName: 'Макпрогрес ДОО Виница',
      email: 'petar.jovanov@makprogres.mk',
      phone: '+389 72 234 567',
      stage: 'proposal',
      source: 'exhibition',
      priority: 'high',
      estimatedValue: 150000,
      currency: 'EUR',
      productInterest: 'Флексибилна амбалажа за бисквити и вафли',
      nextFollowUp: new Date('2026-03-25'),
      assignedTo: u('ana@lbfp.mk'),
      createdBy: u('ana@lbfp.mk'),
      activities: [
        { type: 'meeting', text: 'Средба на саемот Пакомак 2026. Заинтересирани за целосна линија на амбалажа за бисквити.', createdBy: u('ana@lbfp.mk') },
        { type: 'email', text: 'Испратена понуда за 3 типа flow-pack амбалажа и stand-up кеси.', createdBy: u('ana@lbfp.mk') },
        { type: 'call', text: 'Повратен одговор - бараат 10% попуст на волумен над 1M парчиња.', createdBy: u('stefan@lbfp.mk') },
      ],
    },
    {
      contactName: 'Maria Schmidt',
      companyName: 'BioNature AG, Austria',
      email: 'schmidt@bionature.at',
      phone: '+43 1 234 5678',
      stage: 'qualified',
      source: 'linkedin',
      priority: 'high',
      estimatedValue: 200000,
      currency: 'EUR',
      productInterest: 'Eco-friendly packaging for organic tea and herbs',
      nextFollowUp: new Date('2026-03-26'),
      assignedTo: u('stefan@lbfp.mk'),
      createdBy: u('ana@lbfp.mk'),
      activities: [
        { type: 'note', text: 'Inbound inquiry via LinkedIn. Looking for EU-certified compostable packaging for organic products.', createdBy: u('stefan@lbfp.mk') },
        { type: 'call', text: 'Intro call - very interested in our biodegradable pouch development. Wants samples by May.', createdBy: u('stefan@lbfp.mk') },
      ],
    },
    {
      contactName: 'Димитар Ковачевски',
      companyName: 'Тутунски Комбинат Прилеп',
      email: 'kovacevski@tkprilep.mk',
      phone: '+389 71 987 654',
      stage: 'negotiation',
      source: 'existing_client',
      priority: 'medium',
      estimatedValue: 300000,
      currency: 'EUR',
      productInterest: 'Ламинатна фолија за тутунски производи - нов дизајн',
      nextFollowUp: new Date('2026-03-27'),
      assignedTo: u('ana@lbfp.mk'),
      createdBy: u('ana@lbfp.mk'),
      activities: [
        { type: 'meeting', text: 'Средба во нивните простории. Сакаат ребрендирање на целата линија - нов дизајн и материјал.', createdBy: u('ana@lbfp.mk') },
        { type: 'email', text: 'Испратена ревидирана понуда со нови цени за 2026.', createdBy: u('ana@lbfp.mk') },
        { type: 'call', text: 'Преговори за цена - блиску сме до договор. Финална понуда до петок.', createdBy: u('ana@lbfp.mk') },
      ],
    },
    {
      contactName: 'Thomas Berger',
      companyName: 'Alpine Dairy GmbH',
      email: 'berger@alpinedairy.de',
      phone: '+49 89 123 4567',
      stage: 'contacted',
      source: 'referral',
      priority: 'medium',
      estimatedValue: 120000,
      currency: 'EUR',
      productInterest: 'Flexible packaging for cheese and dairy products',
      nextFollowUp: new Date('2026-04-01'),
      assignedTo: u('stefan@lbfp.mk'),
      createdBy: u('stefan@lbfp.mk'),
      activities: [
        { type: 'note', text: 'Referred by Vitaminka. Looking for high-barrier cheese packaging with modified atmosphere compatibility.', createdBy: u('stefan@lbfp.mk') },
      ],
    },
    {
      contactName: 'Сара Митревска',
      companyName: 'Жито Лукс АД Скопје',
      email: 'sara@zitoluks.mk',
      phone: '+389 70 555 123',
      stage: 'won',
      source: 'cold_call',
      priority: 'high',
      estimatedValue: 80000,
      currency: 'EUR',
      productInterest: 'Амбалажа за брашно и тестенини',
      assignedTo: u('ana@lbfp.mk'),
      createdBy: u('ana@lbfp.mk'),
      wonDate: new Date('2026-03-15'),
      activities: [
        { type: 'call', text: 'Прв контакт - заинтересирани за замена на хартиена со флексибилна амбалажа.', createdBy: u('ana@lbfp.mk') },
        { type: 'meeting', text: 'Презентација на нашите производи. Одлично примени.', createdBy: u('ana@lbfp.mk') },
        { type: 'email', text: 'Потпишан договор! Прва нарачка од 50,000 единици.', createdBy: u('ana@lbfp.mk') },
      ],
    },
  ];

  const leads = await Lead.insertMany(leadsData);
  console.log(`Created ${leads.length} leads`);

  // ── Procedures ──────────────────────────────────────────────────
  const proceduresData = [
    {
      title: 'Процедура за контрола на квалитет на влезни суровини',
      content: `## 1. Цел\nОваа процедура го дефинира начинот на проверка на квалитетот на сите влезни суровини пред нивна употреба во производство.\n\n## 2. Опсег\nСе применува за сите суровини: филмови, лепила, мастила и растворувачи.\n\n## 3. Постапка\n1. При приемот, магационерот го проверува количеството и визуелниот квалитет\n2. Се зема примерок и се доставува до лабораторија\n3. QA тимот врши тестирање во рок од 24 часа\n4. Доколку материјалот не ги исполнува спецификациите, се означува како \"неусогласен\" и се известува набавката\n5. Одобрениот материјал се означува со зелена етикета и се ослободува за производство\n\n## 4. Документација\n- Формулар QA-001: Приемен извештај\n- Формулар QA-002: Лабораториски резултати\n- Формулар QA-003: Неусогласеност`,
      createdBy: u('mila@lbfp.mk'),
      departments: ['quality_assurance', 'nabavki', 'production'],
    },
    {
      title: 'Employee Onboarding Procedure',
      content: `## 1. Purpose\nStandardized onboarding process for all new employees at LBFP.\n\n## 2. Scope\nApplies to all new hires regardless of department or position.\n\n## 3. Steps\n1. **Day 1 - HR Orientation** (2 hours)\n   - Company overview and mission\n   - Sign employment contract and NDA\n   - Receive access badges and IT credentials\n2. **Day 1 - Department Introduction** (4 hours)\n   - Meet department manager and team\n   - Tour of facilities including production floor\n   - Safety briefing (mandatory for production staff)\n3. **Week 1 - Training**\n   - Department-specific training plan\n   - IT systems training (ERP, email, PackFlow)\n   - Quality management system overview\n4. **Day 30 - Check-in**\n   - Meeting with HR and department manager\n   - Feedback collection\n   - Probation period review schedule\n\n## 4. Required Documents\n- Employment contract\n- NDA\n- Safety acknowledgment form\n- IT access request form`,
      createdBy: u('natasa@lbfp.mk'),
      departments: ['hr', 'top_management', 'administration'],
    },
    {
      title: 'Процедура за нарачка на суровини',
      content: `## 1. Цел\nДефинирање на процесот за нарачка на суровини и материјали потребни за производство.\n\n## 2. Постапка\n1. Производство испраќа барање за материјал до набавка\n2. Набавката проверува залиха и доколку е потребно, подготвува нарачка\n3. Нарачката се одобрува од раководителот на набавки\n4. За износи над 500,000 МКД потребно е одобрение од финансии\n5. За износи над 2,000,000 МКД потребно е одобрение од управата\n6. По одобрение, се испраќа нарачка до добавувачот\n7. Се следи статусот на испорака\n\n## 3. Рокови\n- Стандардна нарачка: 5 работни дена за обработка\n- Итна нарачка: 24 часа (потребно одобрение од управата)`,
      createdBy: u('tamara@lbfp.mk'),
      departments: ['nabavki', 'production', 'finance', 'top_management'],
    },
    {
      title: 'Machine Maintenance Schedule',
      content: `## 1. Purpose\nPreventive maintenance schedule for all production machinery to minimize downtime.\n\n## 2. Daily Checks (Operator)\n- Visual inspection before shift start\n- Lubrication points check\n- Clean print stations and ink trays\n- Report any unusual sounds or vibrations\n\n## 3. Weekly Maintenance (Technician)\n- Belt tension check\n- Roller alignment verification\n- Ink viscosity calibration\n- Air pressure system check\n\n## 4. Monthly Maintenance (Maintenance Team)\n- Full bearing inspection\n- Electrical system check\n- Safety guard verification\n- Calibration of temperature controls\n\n## 5. Annual Overhaul\n- Complete machine teardown and inspection\n- Replace wear parts (bearings, seals, belts)\n- Re-certification of safety systems\n- Performance benchmark testing`,
      createdBy: u('nikola@lbfp.mk'),
      departments: ['machines', 'production', 'facility'],
    },
  ];

  const procedures = await Procedure.insertMany(proceduresData);
  console.log(`Created ${procedures.length} procedures`);

  // ── Leave Balances (2026) ───────────────────────────────────────
  const leaveBalances = users.map(user => ({
    user: user._id,
    year: 2026,
    totalDays: 20,
    usedDays: Math.floor(Math.random() * 6), // 0-5 days used so far in 2026
  }));

  await LeaveBalance.insertMany(leaveBalances);
  console.log(`Created ${leaveBalances.length} leave balances`);

  // ── Requests ────────────────────────────────────────────────────
  const requestsData = [
    {
      type: 'day_off',
      requester: u('stefan@lbfp.mk'),
      department: 'sales',
      status: 'approved',
      currentStep: 2,
      totalSteps: 2,
      data: { reason: 'Семејна прослава - крштевка', startDate: '2026-03-20', endDate: '2026-03-21' },
      leaveDays: 2,
      stepHistory: [
        { stepIndex: 0, label: 'Department Manager', action: 'approved', actionBy: u('ana@lbfp.mk'), actionAt: new Date('2026-03-15'), note: 'Одобрено. Пријатно!' },
        { stepIndex: 1, label: 'HR', action: 'approved', actionBy: u('natasa@lbfp.mk'), actionAt: new Date('2026-03-16'), note: '' },
      ],
    },
    {
      type: 'day_off',
      requester: u('maja@lbfp.mk'),
      department: 'r_and_d',
      status: 'pending',
      currentStep: 0,
      totalSteps: 2,
      data: { reason: 'Personal matters - apartment relocation', startDate: '2026-04-07', endDate: '2026-04-08' },
      leaveDays: 2,
      stepHistory: [],
    },
    {
      type: 'overtime',
      requester: u('viktor@lbfp.mk'),
      department: 'production',
      status: 'approved',
      currentStep: 1,
      totalSteps: 1,
      data: { reason: 'Итна нарачка за Алкалоид - потребна прекувремена работа за завршување на серијата', date: '2026-03-22', hours: 4 },
      stepHistory: [
        { stepIndex: 0, label: 'Department Manager', action: 'approved', actionBy: u('dejan@lbfp.mk'), actionAt: new Date('2026-03-21'), note: 'Одобрено поради итност на нарачката.' },
      ],
    },
    {
      type: 'equipment',
      requester: u('aleksandar@lbfp.mk'),
      department: 'quality_assurance',
      status: 'in_progress',
      currentStep: 1,
      totalSteps: 2,
      data: { item: 'Thickness gauge - digital micrometer', reason: 'Current device is out of calibration and beyond repair. Need new one for incoming material inspection.' },
      stepHistory: [
        { stepIndex: 0, label: 'Department Manager', action: 'approved', actionBy: u('mila@lbfp.mk'), actionAt: new Date('2026-03-18'), note: 'Essential for QA work. Please approve.' },
      ],
    },
    {
      type: 'travel',
      requester: u('ana@lbfp.mk'),
      department: 'sales',
      status: 'pending',
      currentStep: 0,
      totalSteps: 2,
      data: { destination: 'Нирнберг, Германија', purpose: 'FachPack 2026 - саем за амбалажа', startDate: '2026-09-22', endDate: '2026-09-25', estimatedCost: 2500, currency: 'EUR' },
      totalSteps: 2,
      stepHistory: [],
    },
    {
      type: 'complaint',
      requester: u('kristina@lbfp.mk'),
      department: 'hr',
      status: 'in_progress',
      currentStep: 1,
      totalSteps: 3,
      data: { subject: 'Температура во канцелариите', description: 'Климатизацијата во канцеларискиот дел не функционира правилно. Температурата е над 28°C во текот на работното време.' },
      stepHistory: [
        { stepIndex: 0, label: 'Department Manager', action: 'approved', actionBy: u('natasa@lbfp.mk'), actionAt: new Date('2026-03-20'), note: 'Потврдувам, проблемот е реален. Потребна е итна интервенција.' },
      ],
    },
  ];

  const requests = await Request.insertMany(requestsData);
  console.log(`Created ${requests.length} requests`);

  // ── Notifications ───────────────────────────────────────────────
  const notificationsData = [
    { recipient: u('bojan@lbfp.mk'), type: 'task_assigned', title: 'Нова задача', message: 'Ви е доделена задачата "Test recyclable mono-material pouch"', link: '/dashboard?dept=r_and_d&tab=tasks', read: false },
    { recipient: u('ana@lbfp.mk'), type: 'po_question', title: 'New question on PO', message: 'Боjan answered your question about gravure cylinder lead time on the Vitaminka order.', link: '/dashboard?dept=sales&tab=po', read: false },
    { recipient: u('mila@lbfp.mk'), type: 'task_assigned', title: 'ISO audit preparation', message: 'You have been assigned the ISO 9001 audit preparation task.', link: '/dashboard?dept=quality_assurance&tab=tasks', read: true },
    { recipient: u('dejan@lbfp.mk'), type: 'request_action', title: 'Ново барање за прекувремена', message: 'Виктор Стојановски побара одобрение за прекувремена работа.', link: '/requests', read: true },
    { recipient: u('stefan@lbfp.mk'), type: 'request_approved', title: 'Барање одобрено', message: 'Вашето барање за слободен ден е одобрено.', link: '/requests', read: true },
    { recipient: u('marko@lbfp.mk'), type: 'announcement', title: 'Нов проект креиран', message: 'Elena created the project "ERP System Integration".', link: '/dashboard?dept=top_management&tab=projects', read: false },
  ];

  await Notification.insertMany(notificationsData);
  console.log(`Created ${notificationsData.length} notifications`);

  console.log('\n✅ Seed complete!');
  console.log('\n📋 Login credentials (all users use the same password):');
  console.log('   Password: Demo1234!');
  console.log('\n👤 Key accounts:');
  console.log('   marko@lbfp.mk  — Top Management (Owner)');
  console.log('   elena@lbfp.mk  — Top Management (Admin)');
  console.log('   ana@lbfp.mk    — Sales Manager');
  console.log('   stefan@lbfp.mk — Sales Employee');
  console.log('   ivana@lbfp.mk  — Finance Manager');
  console.log('   natasa@lbfp.mk — HR Manager');
  console.log('   dejan@lbfp.mk  — Production Manager');
  console.log('   mila@lbfp.mk   — QA Manager');
  console.log('   bojan@lbfp.mk  — R&D Manager');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
