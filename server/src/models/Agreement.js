import mongoose from 'mongoose';

const DEPARTMENTS = [
  'sales','finance','administration','hr','quality_assurance',
  'facility','machines','r_and_d','production','top_management','carina','nabavki',
];

const agreementSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    otherParty:  { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['nda', 'service', 'supply', 'lease', 'employment', 'partnership', 'other'],
      default: 'other',
    },
    startDate:     { type: Date, required: true },
    endDate:       { type: Date, default: null },   // null = open-ended / indefinite
    autoRenew:     { type: Boolean, default: false },
    reminderDays:  { type: Number, default: 30 },   // days before end to flag as expiring_soon
    value:         { type: Number, default: null },
    currency:      { type: String, enum: ['MKD', 'EUR', 'USD'], default: 'MKD' },
    // Manual lifecycle status — date-driven states (expiring_soon, expired) are computed
    status: {
      type: String,
      enum: ['draft', 'active', 'terminated', 'renewed'],
      default: 'active',
    },
    department:         { type: String, enum: DEPARTMENTS, required: true },
    createdBy:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes:              { type: String, trim: true },
    renewedFromId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Agreement', default: null },
    terminatedAt:       { type: Date, default: null },
    terminationReason:  { type: String, trim: true },
  },
  { timestamps: true }
);

// Computed effective status — overlays date logic on manual status
agreementSchema.virtual('effectiveStatus').get(function () {
  if (['terminated', 'renewed', 'draft'].includes(this.status)) return this.status;
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
