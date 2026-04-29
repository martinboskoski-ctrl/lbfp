import mongoose from 'mongoose';

const disciplinaryActionSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['verbal_warning', 'written_warning', 'reprimand', 'suspension', 'investigation', 'termination_notice'],
      required: true,
    },
    issuedDate: { type: Date, required: true, default: Date.now },
    issuedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: ['attendance', 'performance', 'conduct', 'safety', 'policy', 'other'],
      default: 'other',
    },
    severity:   { type: Number, min: 1, max: 5, default: 2 },
    reason:     { type: String, trim: true, required: true },
    description:{ type: String, trim: true },

    // suspension fields
    suspensionStart: { type: Date, default: null },
    suspensionEnd:   { type: Date, default: null },

    // evidence files (S3 keys via existing File flow)
    evidenceFileKeys: [{ type: String }],

    // workflow state
    status: {
      type: String,
      enum: ['draft', 'pending_hr', 'pending_top_mgmt', 'issued', 'acknowledged', 'declined', 'appealed', 'overturned', 'expired'],
      default: 'draft',
    },
    reviewedByHR:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAtHR:    { type: Date, default: null },
    approvedByTopMgmt: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAtTopMgmt: { type: Date, default: null },

    // employee acknowledgement
    acknowledgedAt:    { type: Date, default: null },
    acknowledgmentNote:{ type: String, trim: true },
    declinedToSign:    { type: Boolean, default: false },

    // appeal
    appealReason:    { type: String, trim: true },
    appealOutcome:   { type: String, enum: ['upheld', 'overturned', null], default: null },

    // expiry — under MK Labour Law warnings often spend after a window
    expiryDate: { type: Date, default: null },
  },
  { timestamps: true }
);

disciplinaryActionSchema.virtual('isActive').get(function () {
  if (['draft', 'declined', 'overturned', 'expired'].includes(this.status)) return false;
  if (this.expiryDate && new Date(this.expiryDate) < new Date()) return false;
  return true;
});

disciplinaryActionSchema.set('toJSON',   { virtuals: true });
disciplinaryActionSchema.set('toObject', { virtuals: true });

export default mongoose.model('DisciplinaryAction', disciplinaryActionSchema);
