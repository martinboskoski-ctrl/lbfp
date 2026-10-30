import mongoose from 'mongoose';

// Sectors that take part in the packaging-artwork check. Sales leads the process.
export const PACKAGING_SECTORS = ['sales', 'r_and_d', 'nabavki', 'quality_assurance'];

const fileRefSchema = new mongoose.Schema(
  {
    fileId:   { type: mongoose.Schema.Types.ObjectId, required: true }, // GridFS id
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size:     { type: Number, required: true },
  },
  { _id: false }
);

// The client email is written in department paragraphs. Each paragraph has one
// owning sector that edits and approves it; Quality owns two.
export const EMAIL_SECTIONS = [
  { key: 'rnd',      sector: 'r_and_d' },           // nutrition facts, recipe, claims
  { key: 'graphics', sector: 'nabavki' },           // dimensions, sizes, print / technical
  { key: 'quality',  sector: 'quality_assurance' }, // compliance, legal, wording vs nutrition facts
  { key: 'general',  sector: 'quality_assurance' }, // grammar, spelling, wording
];
export const EMAIL_SECTION_KEYS = EMAIL_SECTIONS.map((s) => s.key);

const commentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    by:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    at:   { type: Date, default: Date.now },
  }
);

const sectionSchema = new mongoose.Schema(
  {
    key:      { type: String, enum: EMAIL_SECTION_KEYS, required: true },
    sector:   { type: String, enum: PACKAGING_SECTORS, required: true },
    items:    [{ type: String, trim: true }], // one short sentence per remark
    edited:   { type: Boolean, default: false }, // changed by a person → an AI re-run keeps it
    approval: {
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      at: { type: Date },
    },
    comments: [commentSchema],
  },
  { _id: false }
);

const emailSchema = new mongoose.Schema(
  {
    opening:  { type: String, default: '' }, // empty → generated text (see packagingEmail.js)
    closing:  { type: String, default: '' },
    sections: [sectionSchema],
    sent: {
      text: { type: String, default: '' },
      by:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      at:   { type: Date },
    },
  },
  { _id: false }
);

export const emptyEmail = () => ({
  opening: '', closing: '', sections: EMAIL_SECTIONS.map((s) => ({ ...s, items: [], comments: [] })),
});

// A round = one step of the conversation with the client: a question, new artwork,
// corrected artwork, or any mix. Nothing is mandatory; the latest round is active.
const roundSchema = new mongoose.Schema(
  {
    number:          { type: Number, required: true },
    clientMessage:   { type: String, default: '' }, // what the client asked / wrote
    attachments:     [fileRefSchema],                // artwork images / PDFs (0..n)
    ingredientsText: { type: String, default: '' },
    ingredientsFile: { type: fileRefSchema },
    note:            { type: String, default: '' },
    createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ai: {
      // skipped → nothing to review (no artwork anywhere and no client message)
      status:  { type: String, enum: ['not_configured', 'skipped', 'done', 'failed'], default: 'not_configured' },
      summary: { type: String, default: '' },
      answer:  { type: String, default: '' }, // reply to the client's question, in English
      error:   { type: String, default: '' },
      model:   { type: String, default: '' },
      ranAt:   { type: Date },
    },
    email:   { type: emailSchema, default: emptyEmail },
    outcome: {
      decision: { type: String, enum: ['approved', 'changes_required'] },
      summary:  { type: String, default: '' },
      by:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      at:       { type: Date },
    },
  },
  { timestamps: true }
);

const packagingCheckSchema = new mongoose.Schema(
  {
    code:      { type: String, required: true, unique: true }, // e.g. "ПА-0007"
    client:    { type: String, default: '', trim: true },
    product:   { type: String, default: '', trim: true },
    markets:   { type: String, default: '', trim: true }, // target countries, e.g. "Sweden, Finland"
    // in_review → current round open; approved / changes_required → last round closed
    status:    { type: String, enum: ['in_review', 'approved', 'changes_required'], default: 'in_review' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rounds:    [roundSchema],
  },
  { timestamps: true }
);

packagingCheckSchema.index({ status: 1, updatedAt: -1 });

export default mongoose.model('PackagingCheck', packagingCheckSchema);
