import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['note', 'call', 'email', 'meeting', 'other'],
      default: 'note',
    },
    text:      { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const leadSchema = new mongoose.Schema(
  {
    contactName:    { type: String, required: true, trim: true },
    companyName:    { type: String, required: true, trim: true },
    email:          { type: String, trim: true, default: '' },
    phone:          { type: String, trim: true, default: '' },
    stage: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
      default: 'new',
    },
    source: {
      type: String,
      enum: ['referral', 'website', 'cold_call', 'exhibition', 'linkedin', 'existing_client', 'other'],
      default: 'other',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    estimatedValue: { type: Number, default: null },
    currency:       { type: String, enum: ['EUR', 'MKD', 'USD'], default: 'EUR' },
    productInterest: { type: String, trim: true, default: '' },
    nextFollowUp:   { type: Date, default: null },
    assignedTo:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department:     { type: String, default: 'sales' },
    createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    activities:     [activitySchema],
    lostReason:     { type: String, trim: true, default: '' },
    wonDate:        { type: Date, default: null },
    lostDate:       { type: Date, default: null },
  },
  { timestamps: true }
);

leadSchema.virtual('isOverdue').get(function () {
  if (!this.nextFollowUp) return false;
  if (this.stage === 'won' || this.stage === 'lost') return false;
  return new Date(this.nextFollowUp) < new Date();
});

leadSchema.set('toJSON',   { virtuals: true });
leadSchema.set('toObject', { virtuals: true });

export default mongoose.model('Lead', leadSchema);
