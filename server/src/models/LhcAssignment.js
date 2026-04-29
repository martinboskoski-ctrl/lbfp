import mongoose from 'mongoose';

const lhcAssignmentSchema = new mongoose.Schema(
  {
    campaign:    { type: mongoose.Schema.Types.ObjectId, ref: 'LhcCampaign', required: true, index: true },
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    questionIds: [{ type: String, required: true }], // qids selected for this user

    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
    startedAt:   { type: Date, default: null },
    completedAt: { type: Date, default: null },

    // computed on submit / on campaign close
    score:           { type: Number, default: 0 },
    maxScore:        { type: Number, default: 0 },
    violations:      { type: Number, default: 0 },
    categoryBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

lhcAssignmentSchema.index({ campaign: 1, user: 1 }, { unique: true });

export default mongoose.model('LhcAssignment', lhcAssignmentSchema);
