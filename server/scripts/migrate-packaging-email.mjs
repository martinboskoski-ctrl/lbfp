// One-off: packaging rounds from before the email draft (remark cards) get the
// department paragraphs. Disputed remarks are dropped; a paragraph whose remarks
// were all confirmed — or any paragraph of a closed round — starts approved.
// The old `remarks` array is left in the database untouched.
//
//   node scripts/migrate-packaging-email.mjs [--dry-run]
import 'dotenv/config';
import mongoose from 'mongoose';
import { EMAIL_SECTIONS } from '../src/models/PackagingCheck.js';

const SECTION_FOR = { r_and_d: 'rnd', nabavki: 'graphics', quality_assurance: 'quality', sales: 'quality' };
const dryRun = process.argv.includes('--dry-run');

await mongoose.connect(process.env.MONGO_URI);
const col = mongoose.connection.collection('packagingchecks');

let migrated = 0;
for (const check of await col.find({}).toArray()) {
  let changed = false;
  check.rounds.forEach((round, i) => {
    if (round.email?.sections?.length) return;
    const remarks = (round.remarks || []).filter((r) => r.status !== 'disputed');
    const closed = Boolean(round.outcome?.decision) || i < check.rounds.length - 1;
    const sections = EMAIL_SECTIONS.map(({ key, sector }) => {
      const own = remarks.filter((r) => SECTION_FOR[r.sector] === key);
      const answered = own.filter((r) => r.status === 'confirmed');
      const approved = closed || (own.length > 0 && answered.length === own.length);
      const last = answered.map((r) => r.response).filter((r) => r?.at).sort((a, b) => b.at - a.at)[0];
      return {
        key, sector,
        items: own.map((r) => r.text),
        edited: own.some((r) => r.source === 'manual'),
        approval: approved ? { by: last?.by || round.outcome?.by, at: last?.at || round.outcome?.at || new Date() } : {},
        comments: [],
      };
    });
    round.email = { opening: '', closing: round.outcome?.summary || '', sections, sent: {} };
    changed = true;
  });
  if (!changed) continue;
  migrated += 1;
  console.log(`${check.code}: ${check.rounds.length} round(s)`);
  if (!dryRun) await col.updateOne({ _id: check._id }, { $set: { rounds: check.rounds } });
}

console.log(`${dryRun ? '[dry run] ' : ''}${migrated} check(s) migrated`);
await mongoose.disconnect();
