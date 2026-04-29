import mongoose from 'mongoose';

const salaryHistorySchema = new mongoose.Schema(
  {
    user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    effectiveDate: { type: Date, required: true },
    grossAmount:   { type: Number, required: true },
    netAmount:     { type: Number, default: null },
    currency:      { type: String, enum: ['MKD', 'EUR', 'USD'], default: 'MKD' },
    payFrequency:  { type: String, enum: ['monthly', 'biweekly', 'weekly', 'hourly'], default: 'monthly' },
    allowances: [
      {
        kind:   { type: String, enum: ['food', 'transport', 'phone', 'housing', 'other'], default: 'other' },
        amount: { type: Number, required: true },
        notes:  { type: String, trim: true },
      },
    ],
    reason: {
      type: String,
      enum: ['initial', 'raise', 'promotion', 'demotion', 'correction', 'annual_review', 'other'],
      default: 'initial',
    },
    notes:        { type: String, trim: true },
    annexFileKey: { type: String, default: null }, // S3 key
    approvedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

salaryHistorySchema.index({ user: 1, effectiveDate: -1 });

export default mongoose.model('SalaryHistory', salaryHistorySchema);
