// Auto-translate (machine translation) all LHC questions into English.
// Idempotent: re-running overwrites existing En fields.
//
// Run:   node seed-lhc-translate.js
// Or against prod: MONGO_URI='...' node seed-lhc-translate.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

import LhcQuestion from './src/models/LhcQuestion.js';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { translate } = require(path.join(__dirname, 'src', 'data', 'lhc', 'translatorMkEn.cjs'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/packflow';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const questions = await LhcQuestion.find({}).lean();
  console.log(`Translating ${questions.length} questions...`);

  let touched = 0;
  for (const q of questions) {
    const set = {
      textEn:           translate(q.text || ''),
      articleEn:        translate(q.article || ''),
      recommendationEn: translate(q.recommendation || ''),
    };
    if (Array.isArray(q.options) && q.options.length) {
      set.options = q.options.map((o) => ({
        value:   o.value,
        label:   o.label,
        labelEn: translate(o.label || ''),
      }));
    }
    await LhcQuestion.updateOne(
      { _id: q._id },
      {
        $set: { ...set, 'sourceMeta.machineTranslation': true },
      }
    );
    touched++;
  }

  console.log(`Updated ${touched} questions with EN translations.`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
