import mongoose from 'mongoose';
import { EJSON } from 'bson';
import PiZip from 'pizzip';

const isTopMgmt = (u) => u?.department === 'top_management';

// GET /api/backup
// Streams a ZIP containing one JSON file per collection, in MongoDB Canonical
// Extended JSON (types preserved — ObjectId, Date, etc.) so the dump can be
// re-imported with `mongoimport --jsonArray`. Top management only.
export const downloadBackup = async (req, res) => {
  try {
    if (!isTopMgmt(req.user)) {
      return res.status(403).json({ message: 'Само топ менаџментот може да презема резервна копија' });
    }

    const db = mongoose.connection.db;
    if (!db) return res.status(503).json({ message: 'Базата не е поврзана' });

    const collections = await db.listCollections().toArray();
    const zip = new PiZip();
    const summary = [];

    for (const { name, type } of collections) {
      if (type && type !== 'collection') continue;   // skip views
      if (name.startsWith('system.')) continue;       // skip internal collections

      const docs = await db.collection(name).find({}).toArray();
      // Canonical EJSON keeps BSON types intact for a lossless mongoimport.
      zip.file(`${name}.json`, EJSON.stringify(docs, { relaxed: false }));
      summary.push(`  ${name}: ${docs.length}`);
    }

    zip.file('README.txt', [
      `MongoDB backup`,
      `Generated: ${new Date().toISOString()}`,
      `Database:  ${db.databaseName}`,
      '',
      'Collections (document count):',
      ...summary,
      '',
      'Files use MongoDB Canonical Extended JSON (BSON types preserved).',
      '',
      'Restore a collection with mongoimport:',
      '  mongoimport --uri "<MONGO_URI>" --collection <name> \\',
      '    --file <name>.json --jsonArray --mode upsert',
    ].join('\n'));

    const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="backup-${db.databaseName}-${stamp}.zip"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
