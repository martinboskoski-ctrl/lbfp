// Imports HR (organization category) and Cyber (cyber category) question packs.
// Idempotent — re-running upserts by qid.

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

const hr = require(path.join(dataDir, 'hrQuestions.cjs'));
const cyber = require(path.join(dataDir, 'cyberQuestions.cjs'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/packflow';

async function ensureCategory(key, doc) {
  await LhcCategory.updateOne({ key }, { $set: doc }, { upsert: true });
}

// HR pack: { questions, categoryNames, ... }. Each q: id, category (process key),
// text, options [{ value:'A'|'B'|'C'|'D', text, points: 1..4 }].
function buildHrDocs() {
  const docs = [];
  for (const q of hr.questions) {
    const opts = q.options.map((o) => ({ value: o.value, label: o.text }));
    const optionScores = {};
    let best = -Infinity;
    let bestVal = null;
    for (const o of q.options) {
      const fraction = Math.max(0, Math.min(1, (o.points - 1) / 3)); // 1→0, 4→1
      optionScores[o.value] = Number(fraction.toFixed(3));
      if (o.points > best) { best = o.points; bestVal = o.value; }
    }
    docs.push({
      qid: `org_${q.id}`,
      category: 'organization',
      subCategory: q.category,
      text: q.text,
      article: hr.categoryNames?.[q.category] || '',
      type: 'choice',
      options: opts,
      optionScores,
      correctAnswer: bestVal,
      weight: 1,
      sanctionLevel: 'low', // maturity, not regulatory
      recommendation: '',
      sourceMeta: { source: 'hhc', originalId: q.id },
      active: true,
    });
  }
  return docs;
}

// Cyber pack: { CATEGORIES: [{ id, name, questions: [{ id, text, type, options: [{ value, text, score (0-100) }] }] }] }
function buildCyberDocs() {
  const docs = [];
  for (const cat of cyber.CATEGORIES) {
    for (const q of cat.questions) {
      // Normalize 'scale' (1-10) → choice with 10 options scored 0-100.
      let rawOpts = q.options;
      if (q.type === 'scale' && !rawOpts) {
        rawOpts = Array.from({ length: 10 }, (_, i) => ({
          value: String(i + 1),
          text: String(i + 1),
          score: Math.round(((i + 1) - 1) / 9 * 100),
        }));
      }
      if (!rawOpts) continue;

      const opts = rawOpts.map((o) => ({ value: o.value, label: o.text }));
      const optionScores = {};
      let best = -Infinity;
      let bestVal = null;
      for (const o of rawOpts) {
        const fraction = Math.max(0, Math.min(1, (o.score || 0) / 100));
        optionScores[o.value] = Number(fraction.toFixed(3));
        if ((o.score || 0) > best) { best = o.score; bestVal = o.value; }
      }
      docs.push({
        qid: `cyber_${cat.id}_${q.id}`,
        category: 'cyber',
        subCategory: cat.id,
        text: q.text,
        article: cat.name,
        type: 'choice',
        options: opts,
        optionScores,
        correctAnswer: bestVal,
        weight: 1,
        sanctionLevel: 'medium', // security risk
        recommendation: '',
        sourceMeta: { source: 'chc', categoryId: cat.id, originalId: q.id },
        active: true,
      });
    }
  }
  return docs;
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Make sure both categories exist (in case user only ran extra seeder)
  await ensureCategory('organization', {
    key: 'organization', name: 'Организација и операции', icon: '🏛️',
    color: '#475569', order: 6,
    description: 'Процеси, луѓе, комуникација и мерење — оперативна зрелост.',
    active: true,
  });
  await ensureCategory('cyber', {
    key: 'cyber', name: 'Сајбер безбедност', icon: '🛡️',
    color: '#475569', order: 8,
    description: 'Уреди, податоци, мрежа, фишинг, пристап, обука, инциденти.',
    active: true,
  });

  const hrDocs = buildHrDocs();
  const cyberDocs = buildCyberDocs();
  const all = [...hrDocs, ...cyberDocs];

  let n = 0;
  for (const d of all) {
    await LhcQuestion.updateOne({ qid: d.qid }, { $set: d }, { upsert: true });
    n++;
  }
  console.log(`Upserted ${n} questions: organization=${hrDocs.length}, cyber=${cyberDocs.length}`);

  const counts = await LhcQuestion.aggregate([
    { $match: { category: { $in: ['organization', 'cyber'] }, active: true } },
    { $group: { _id: { category: '$category', sub: '$subCategory' }, n: { $sum: 1 } } },
    { $sort: { '_id.category': 1, '_id.sub': 1 } },
  ]);
  for (const c of counts) console.log(`  ${c._id.category} / ${c._id.sub}: ${c.n}`);

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => { console.error(err); process.exit(1); });
