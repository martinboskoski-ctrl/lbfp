// Seeds LHC categories + questions from packaged reference data files.
// Idempotent: re-running upserts by `qid` and `key`.

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

import LhcCategory from './src/models/LhcCategory.js';
import LhcQuestion from './src/models/LhcQuestion.js';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'src', 'data', 'lhc');

const employmentExport = require(path.join(dataDir, 'employmentQuestionsComplete.cjs'));
const gdprQuestionsRaw = require(path.join(dataDir, 'gdprQuestionsComplete.cjs'));
const hsQuestionsRaw   = require(path.join(dataDir, 'healthAndSafetyQuestionsComplete.cjs'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/packflow';

// 7 starter categories — 3 with content, 4 placeholders
const CATEGORIES = [
  { key: 'labour',        name: 'Работни односи',          icon: '👔', color: '#475569', order: 1, description: 'Закон за работните односи — права и обврски на вработени и работодавачи.' },
  { key: 'gdpr',          name: 'Лични податоци',          icon: '🔒', color: '#475569', order: 2, description: 'Закон за заштита на личните податоци (GDPR).' },
  { key: 'health_safety', name: 'Безбедност и здравје',    icon: '🦺', color: '#475569', order: 3, description: 'Закон за безбедност и здравје при работа.' },
  { key: 'tax',           name: 'Даноци',                  icon: '🧾', color: '#475569', order: 4, description: 'Даночна усогласеност и обврски (во подготовка).' },
  { key: 'contracts',     name: 'Договорно право',         icon: '📜', color: '#475569', order: 5, description: 'Договори со трети лица, доставувачи, клиенти (во подготовка).' },
  { key: 'organization',  name: 'Организација и операции', icon: '🏛️', color: '#475569', order: 6, description: 'Процеси, луѓе, комуникација и мерење — оперативна зрелост.' },
  { key: 'systems',       name: 'Системи и ИТ',            icon: '💻', color: '#475569', order: 7, description: 'ИКТ безбедност, управување со системи (во подготовка).' },
  { key: 'cyber',         name: 'Сајбер безбедност',       icon: '🛡️', color: '#475569', order: 8, description: 'Уреди, податоци, мрежа, фишинг, пристап, обука, инциденти.' },
];

// Normalize varying sanction-level enums into high/medium/low/none.
const normalizeSanction = (level, source) => {
  if (!level || level === 'none') return 'none';
  if (source === 'labour') {
    if (level === 'sanction1') return 'high';
    if (level === 'sanction2') return 'medium';
    return 'low';
  }
  if (source === 'gdpr') {
    if (['high', 'medium', 'low', 'none'].includes(level)) return level;
    return 'medium';
  }
  if (source === 'health_safety') {
    if (level === 'sanction3') return 'high';
    if (level === 'sanction2') return 'medium';
    if (level === 'sanction1') return 'low';
    return 'none';
  }
  return 'medium';
};

const buildDoc = (q, categoryKey, prefix) => ({
  qid:          `${prefix}_${q.id}`,
  category:     categoryKey,
  subCategory:  q.category || null,
  text:         q.text,
  article:      q.article || '',
  type:         q.type,
  options:      Array.isArray(q.options) ? q.options : [],
  correctAnswer: q.correctAnswer ?? null,
  weight:       typeof q.weight === 'number' ? q.weight : 1,
  sanctionLevel: normalizeSanction(q.sanctionLevel, categoryKey),
  recommendation: q.recommendation || '',
  sourceMeta:   { originalId: q.id, originalSanctionLevel: q.sanctionLevel || null },
  active:       true,
});

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // ── Categories (upsert) ───────────────────────────────────────
  for (const cat of CATEGORIES) {
    await LhcCategory.updateOne({ key: cat.key }, { $set: cat }, { upsert: true });
  }
  console.log(`Upserted ${CATEGORIES.length} categories`);

  // ── Questions ─────────────────────────────────────────────────
  const labourQs   = (employmentExport.questions || []).map((q) => buildDoc(q, 'labour', 'labour'));
  const gdprQs     = (Array.isArray(gdprQuestionsRaw) ? gdprQuestionsRaw : []).map((q) => buildDoc(q, 'gdpr', 'gdpr'));
  const hsQs       = (Array.isArray(hsQuestionsRaw) ? hsQuestionsRaw : []).map((q) => buildDoc(q, 'health_safety', 'hs'));

  const all = [...labourQs, ...gdprQs, ...hsQs];

  let upserted = 0;
  for (const doc of all) {
    await LhcQuestion.updateOne({ qid: doc.qid }, { $set: doc }, { upsert: true });
    upserted++;
  }
  console.log(`Upserted ${upserted} questions: labour=${labourQs.length}, gdpr=${gdprQs.length}, health_safety=${hsQs.length}`);

  // ── Counts by category & sanction level ───────────────────────
  const counts = await LhcQuestion.aggregate([
    { $group: { _id: { category: '$category', sanction: '$sanctionLevel' }, n: { $sum: 1 } } },
    { $sort: { '_id.category': 1, '_id.sanction': 1 } },
  ]);
  for (const c of counts) console.log(`  ${c._id.category} / ${c._id.sanction}: ${c.n}`);

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => { console.error(err); process.exit(1); });
