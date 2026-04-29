import mongoose from 'mongoose';

const lhcCampaignSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    // categories included (array of LhcCategory keys)
    categories:  [{ type: String, required: true }],

    // audience
    audienceMode: {
      type: String,
      enum: ['all', 'managers_only', 'departments'],
      default: 'all',
    },
    audienceDepartments: [{ type: String }], // when audienceMode === 'departments'

    // question allocation
    questionsPerCategory: { type: Number, default: 20 }, // null/0 = all
    pickStrategy: {
      type: String,
      enum: ['random', 'all'],
      default: 'random',
    },

    // schedule
    openAt:  { type: Date, default: null },
    closeAt: { type: Date, default: null },

    // lifecycle
    status: {
      type: String,
      enum: ['draft', 'open', 'closed', 'archived'],
      default: 'draft',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    closedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    closedAt:  { type: Date, default: null },

    // computed at close
    resultSummary: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

lhcCampaignSchema.index({ status: 1, closeAt: 1 });

export default mongoose.model('LhcCampaign', lhcCampaignSchema);
