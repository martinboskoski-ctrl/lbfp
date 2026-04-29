import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import User from './src/models/User.js';
import EmployeeProfile from './src/models/EmployeeProfile.js';
import SalaryHistory from './src/models/SalaryHistory.js';
import DisciplinaryAction from './src/models/DisciplinaryAction.js';
import EmployeeAsset from './src/models/EmployeeAsset.js';
import EmployeeDocument from './src/models/EmployeeDocument.js';
import IncidentReport from './src/models/IncidentReport.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/packflow';

const POSITIONS = {
  top_management: ['CEO', 'COO', 'CFO'],
  sales: ['Head of Sales', 'Account Manager', 'Sales Representative'],
  finance: ['Head of Finance', 'Senior Accountant', 'Accountant'],
  hr: ['Head of HR', 'HR Specialist', 'HR Coordinator'],
  administration: ['Office Manager', 'Administrative Assistant'],
  quality_assurance: ['QA Manager', 'QA Engineer'],
  facility: ['Facility Manager', 'Maintenance Technician'],
  machines: ['Machines Lead', 'Machine Operator'],
  r_and_d: ['Head of R&D', 'R&D Engineer'],
  production: ['Production Manager', 'Production Operator'],
  carina: ['Customs Officer'],
  nabavki: ['Procurement Manager', 'Procurement Specialist'],
};

const SALARIES = {
  top_management: { gross: 180000, net: 124000 },
  sales:          { gross:  72000, net:  50000 },
  finance:        { gross:  68000, net:  47000 },
  hr:             { gross:  62000, net:  43500 },
  administration: { gross:  45000, net:  32500 },
  quality_assurance: { gross: 65000, net: 45500 },
  facility:       { gross:  48000, net:  34500 },
  machines:       { gross:  55000, net:  39000 },
  r_and_d:        { gross:  78000, net:  54000 },
  production:     { gross:  42000, net:  30500 },
  carina:         { gross:  58000, net:  41000 },
  nabavki:        { gross:  60000, net:  42500 },
};

const yearsAgo = (n) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d;
};

const monthsAhead = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d;
};

const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
};

async function seedHR() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  await Promise.all([
    EmployeeProfile.deleteMany({}),
    SalaryHistory.deleteMany({}),
    DisciplinaryAction.deleteMany({}),
    EmployeeAsset.deleteMany({}),
    EmployeeDocument.deleteMany({}),
    IncidentReport.deleteMany({}),
  ]);
  console.log('Cleared HR collections');

  const users = await User.find({}).lean();
  const byDept = {};
  for (const u of users) {
    (byDept[u.department] ||= []).push(u);
  }

  // Wire User.manager — every non-manager in a dept points to the dept's manager.
  for (const dept of Object.keys(byDept)) {
    const mgr = byDept[dept].find((u) => u.isManager) || byDept[dept][0];
    if (!mgr) continue;
    const others = byDept[dept].filter((u) => String(u._id) !== String(mgr._id));
    for (const u of others) {
      await User.updateOne({ _id: u._id }, { $set: { manager: mgr._id } });
    }
  }
  // Top management managers themselves report to nobody (or to the CEO marko).
  const ceo = users.find((u) => u.email === 'marko@lbfp.mk');
  if (ceo) {
    for (const u of users) {
      if (u.isManager && u.email !== 'marko@lbfp.mk' && u.department !== 'top_management') {
        await User.updateOne({ _id: u._id }, { $set: { manager: ceo._id } });
      }
    }
  }
  console.log('Wired User.manager');

  // Profiles + salary
  let profileCount = 0;
  let salaryCount = 0;
  for (const u of users) {
    const positions = POSITIONS[u.department] || ['Specialist'];
    const position = u.isManager ? positions[0] : positions[Math.min(1, positions.length - 1)] || positions[0];
    const yearsHere = (Math.floor(Math.random() * 8) + 1);
    const hireDate = yearsAgo(yearsHere);
    const isFixed = Math.random() < 0.25;
    const contractStart = hireDate;
    const contractEnd = isFixed ? monthsAhead(Math.floor(Math.random() * 18) - 2) : null; // some expired/expiring
    const sanitaryNext = monthsAhead(Math.floor(Math.random() * 14) - 2); // mix of overdue/due_soon/ok

    await EmployeeProfile.create({
      user: u._id,
      legalName: u.name,
      birthDate: yearsAgo(25 + Math.floor(Math.random() * 25)),
      gender: Math.random() < 0.5 ? 'female' : 'male',
      maritalStatus: Math.random() < 0.6 ? 'married' : 'single',
      dependents: Math.floor(Math.random() * 3),
      nationality: 'Macedonian',
      idNumber: 'A' + Math.floor(Math.random() * 9_000_000 + 1_000_000),
      address: { street: 'ул. Партизанска бр. ' + (Math.floor(Math.random() * 200) + 1), city: 'Скопје', country: 'North Macedonia', postal: '1000' },
      personalPhone: '+389 7' + Math.floor(Math.random() * 90_000_000 + 10_000_000),
      personalEmail: u.email.replace('@lbfp.mk', '@gmail.com'),
      emergencyContact: { name: 'Близок роднина', relation: 'spouse', phone: '+389 70 ' + Math.floor(Math.random() * 900000 + 100000) },
      position,
      jobDescription: `Одговорен за дневните активности на одделот ${u.department}.`,
      employmentType: 'full_time',
      contractType: isFixed ? 'fixed_term' : 'open_ended',
      contractStart,
      contractEnd,
      probationEnd: null,
      noticePeriodDays: 30,
      workLocation: ['production', 'machines', 'facility', 'quality_assurance'].includes(u.department) ? 'factory' : 'hybrid',
      ftePercent: 100,
      hireDate,
      salaryVisibleToManager: false,
      sanitaryCheckLast: monthsAgo(10),
      sanitaryCheckNext: sanitaryNext,
      fitnessExamLast: monthsAgo(8),
      fitnessExamNext: monthsAhead(4),
      allergies: '',
      bloodType: ['A+','O+','B+','AB+'][Math.floor(Math.random()*4)],
      highestEducation: ['secondary', 'bachelor', 'master'][Math.floor(Math.random()*3)],
      schools: [{ institution: 'УКИМ - Универзитет Св. Кирил и Методиј', degree: 'Бечелор', field: 'Менаџмент', from: yearsAgo(yearsHere + 4), to: yearsAgo(yearsHere) }],
      languages: [{ language: 'Македонски', proficiency: 'native' }, { language: 'Англиски', proficiency: 'advanced' }],
      skills: ['MS Office', 'Тимска работа', 'Комуникација'],
      previousJobs: [],
      family: [],
      beneficiaries: [],
      recognitions: [],
      hrNotes: u.email === 'viktor@lbfp.mk' ? 'Многу мотивиран — потенцијал за унапредување следната година.' : '',
    });
    profileCount++;

    const base = SALARIES[u.department] || { gross: 50000, net: 35000 };
    const multiplier = u.isManager ? 1.6 : 1.0;
    await SalaryHistory.create({
      user: u._id,
      effectiveDate: hireDate,
      grossAmount: Math.round(base.gross * multiplier * 0.85),
      netAmount: Math.round(base.net * multiplier * 0.85),
      currency: 'MKD',
      payFrequency: 'monthly',
      allowances: [{ kind: 'food', amount: 5000 }, { kind: 'transport', amount: 2500 }],
      reason: 'initial',
      notes: 'Почетна плата',
      createdBy: u._id,
    });
    salaryCount++;

    if (yearsHere >= 2) {
      await SalaryHistory.create({
        user: u._id,
        effectiveDate: yearsAgo(1),
        grossAmount: Math.round(base.gross * multiplier),
        netAmount: Math.round(base.net * multiplier),
        currency: 'MKD',
        payFrequency: 'monthly',
        allowances: [{ kind: 'food', amount: 6000 }, { kind: 'transport', amount: 3000 }],
        reason: 'annual_review',
        notes: 'Годишно зголемување',
        createdBy: ceo?._id || u._id,
        approvedBy: ceo?._id,
      });
      salaryCount++;
    }
  }
  console.log(`Created ${profileCount} EmployeeProfile, ${salaryCount} SalaryHistory rows`);

  // A couple of disciplinary actions, assets, documents, incidents on Viktor (production operator)
  const viktor = users.find((u) => u.email === 'viktor@lbfp.mk');
  const dejan = users.find((u) => u.email === 'dejan@lbfp.mk');
  const natasa = users.find((u) => u.email === 'natasa@lbfp.mk');

  if (viktor && dejan && natasa) {
    await DisciplinaryAction.create({
      user: viktor._id,
      type: 'verbal_warning',
      issuedDate: monthsAgo(4),
      issuedBy: dejan._id,
      category: 'attendance',
      severity: 2,
      reason: 'Доцнење три пати во една недела',
      description: 'Усна опомена дадена по разговор со менаџерот.',
      status: 'acknowledged',
      acknowledgedAt: monthsAgo(4),
      reviewedByHR: natasa._id,
      reviewedAtHR: monthsAgo(4),
      expiryDate: monthsAhead(2),
    });
    await DisciplinaryAction.create({
      user: viktor._id,
      type: 'written_warning',
      issuedDate: monthsAgo(1),
      issuedBy: dejan._id,
      category: 'safety',
      severity: 4,
      reason: 'Не носење на ЛЗО (заштитни ракавици) во производствена зона',
      description: 'Писмена опомена за повторено непочитување на безбедносните протоколи.',
      status: 'pending_top_mgmt',
      reviewedByHR: natasa._id,
      reviewedAtHR: monthsAgo(1),
      expiryDate: monthsAhead(11),
    });

    await EmployeeAsset.create({
      user: viktor._id,
      assetType: 'ppe',
      label: 'Заштитен шлем + ракавици + чевли',
      size: '43',
      issuedDate: monthsAgo(12),
      issuedBy: dejan._id,
      notes: 'Стандардно ЛЗО за производство',
    });
    await EmployeeAsset.create({
      user: viktor._id,
      assetType: 'badge',
      label: 'Идентификациска картичка #PRD-0142',
      serialNumber: 'PRD-0142',
      issuedDate: monthsAgo(12),
      issuedBy: natasa._id,
    });
    await EmployeeAsset.create({
      user: viktor._id,
      assetType: 'locker',
      label: 'Орман #34 — соблекувална',
      serialNumber: '34',
      issuedDate: monthsAgo(12),
      issuedBy: dejan._id,
    });

    await EmployeeDocument.create({
      user: viktor._id,
      docType: 'contract',
      title: 'Договор за вработување',
      fileKey: 'employee-docs/viktor-contract-2023.pdf',
      fileName: 'viktor-contract-2023.pdf',
      fileSize: 142000,
      mimeType: 'application/pdf',
      issueDate: yearsAgo(2),
      uploadedBy: natasa._id,
    });
    await EmployeeDocument.create({
      user: viktor._id,
      docType: 'medical_cert',
      title: 'Санитарен преглед 2026',
      fileKey: 'employee-docs/viktor-sanitary-2026.pdf',
      fileName: 'viktor-sanitary-2026.pdf',
      fileSize: 88000,
      mimeType: 'application/pdf',
      issueDate: monthsAgo(10),
      expiryDate: monthsAhead(2),
      uploadedBy: natasa._id,
    });

    await IncidentReport.create({
      user: viktor._id,
      occurredAt: monthsAgo(6),
      location: 'Производствена линија 2',
      severity: 'minor',
      injuryType: 'Лесна посекотина на прст',
      description: 'При менување на ролна, операторот се посече на острата лента.',
      witnesses: [dejan._id],
      daysLost: 0,
      correctiveAction: 'Дополнителна обука + промена на процедура за менување ролни.',
      investigatedBy: natasa._id,
      closedAt: monthsAgo(5),
      reportedBy: dejan._id,
    });
  }

  console.log('Done.');
  await mongoose.disconnect();
}

seedHR().catch((err) => { console.error(err); process.exit(1); });
