import mongoose from 'mongoose';

const DEPARTMENTS = [
  'sales','finance','administration','hr','quality_assurance',
  'facility','machines','r_and_d','production','top_management','carina','nabavki','safety',
];

const activitySchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action:  {
      type: String,
      enum: ['created', 'updated', 'note', 'renewed', 'terminated', 'reminder_sent', 'file_added', 'file_removed', 'status_changed'],
      required: true,
    },
    text:    { type: String, default: '' },
    meta:    { type: mongoose.Schema.Types.Mixed, default: {} },
    at:      { type: Date, default: Date.now },
  },
  { _id: true }
);

const fileSchema = new mongoose.Schema(
  {
    key:        { type: String, required: true }, // S3 key
    name:       { type: String, required: true },
    size:       { type: Number, default: 0 },
    mimeType:   { type: String, default: '' },
    label:      { type: String, default: '' }, // e.g. "Original signed", "Annex 1"
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const agreementSchema = new mongoose.Schema(
  {
    // ── Basic info ───────────────────────────────────────────────
    contractNumber: { type: String, trim: true, index: true }, // external/internal reference
    title:       { type: String, trim: true },                  // optional short name/description
    description: { type: String, trim: true },
    category: {
      type: String,
      enum: ['nda', 'service', 'supply', 'lease', 'employment', 'partnership', 'distribution', 'license', 'other'],
      default: 'other',
    },
    tags: [{ type: String, trim: true }],

    // ── Register fields (procedure / Регистар) ───────────────────
    sequenceNumber: { type: Number, default: null },            // Реден број (per department)
    documentType: {                                             // Тип на документ
      type: String,
      enum: ['contract', 'annex', 'other'],
      default: 'contract',
    },
    contractClass:  { type: String, trim: true, default: '' },  // Класа / Предмет (sector-specific)
    durationType: {                                             // Времетраење
      type: String,
      enum: ['fixed', 'indefinite'],
      default: 'fixed',
    },
    archiveNumber:  { type: String, trim: true, default: '' },  // Архивски број / печат
    driveLink:      { type: String, trim: true, default: '' },  // Линк до папка (Google Drive)
    reviewDate:     { type: Date, default: null },              // Датум за преглед (пред истек)
    reviewComment:  { type: String, trim: true, default: '' },  // Преглед — коментар

    // ── Counterparty ─────────────────────────────────────────────
    otherParty:  { type: String, required: true, trim: true }, // legal name
    counterpartyContact: {
      name:    { type: String, trim: true },
      email:   { type: String, trim: true, lowercase: true },
      phone:   { type: String, trim: true },
      taxNo:   { type: String, trim: true },
      address: { type: String, trim: true },
    },

    // ── Duration ─────────────────────────────────────────────────
    startDate:     { type: Date, default: null },   // Датум на стапување во сила (optional)
    endDate:       { type: Date, default: null },   // null = open-ended / indefinite
    signedDate:    { type: Date, default: null },
    autoRenew:     { type: Boolean, default: false },
    autoRenewMonths:        { type: Number, default: 12 },
    reminderDays:           { type: Number, default: 30 },   // days before end to flag/notify
    terminationNoticeDays:  { type: Number, default: 30 },

    // ── Value & payment ──────────────────────────────────────────
    value:         { type: Number, default: null }, // total contract value
    currency:      { type: String, enum: ['MKD', 'EUR', 'USD'], default: 'MKD' },
    paymentTerms: {
      type: String,
      enum: ['one_time', 'monthly', 'quarterly', 'biannual', 'annual', 'on_milestone', 'other'],
      default: 'one_time',
    },
    paymentAmount: { type: Number, default: null }, // amount per payment cycle, when periodic

    // ── Governance / risk ───────────────────────────────────────
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    confidentiality: {
      type: String,
      enum: ['public', 'restricted', 'confidential'],
      default: 'restricted',
    },
    owner:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // responsible person

    // ── Workflow state ──────────────────────────────────────────
    status: {
      type: String,
      // procedure statuses: Активен / Во преговори / За продолжување / Во продолжување /
      // Истечен / Раскинат / Архивиран (plus legacy draft/renewed)
      enum: ['draft', 'active', 'negotiating', 'for_renewal', 'renewing', 'expired', 'terminated', 'renewed', 'archived'],
      default: 'active',
    },
    department:        { type: String, enum: DEPARTMENTS, required: true },
    createdBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes:             { type: String, trim: true },
    renewedFromId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Agreement', default: null },
    terminatedAt:      { type: Date, default: null },
    terminationReason: { type: String, trim: true },

    // ── Files & activity ────────────────────────────────────────
    files:        [fileSchema],
    activityLog:  [activitySchema],

    // ── Reminder bookkeeping ────────────────────────────────────
    lastReminderSentAt:    { type: Date, default: null },
    lastReminderDayOffset: { type: Number, default: null }, // which threshold (e.g. 30, 7) was last fired
  },
  { timestamps: true }
);

// Computed effective status — date logic only overlays the plain `active` status.
// Explicit manual statuses (negotiating, for_renewal, renewing, archived, terminated,
// renewed, draft, expired) are authoritative and pass through unchanged.
agreementSchema.virtual('effectiveStatus').get(function () {
  if (this.status !== 'active') return this.status;
  if (!this.endDate) return 'active';
  const daysLeft = Math.ceil((new Date(this.endDate) - new Date()) / 86_400_000);
  if (daysLeft < 0)                     return 'expired';
  if (daysLeft <= this.reminderDays)    return 'expiring_soon';
  return 'active';
});

agreementSchema.virtual('daysUntilExpiry').get(function () {
  if (!this.endDate) return null;
  return Math.ceil((new Date(this.endDate) - new Date()) / 86_400_000);
});

agreementSchema.set('toJSON',   { virtuals: true });
agreementSchema.set('toObject', { virtuals: true });

export default mongoose.model('Agreement', agreementSchema);
