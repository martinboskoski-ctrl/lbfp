import mongoose from 'mongoose';

const lhcAnswerSchema = new mongoose.Schema(
  {
    campaign:   { type: mongoose.Schema.Types.ObjectId, ref: 'LhcCampaign', required: true, index: true },
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    questionId: { type: String, required: true }, // qid of the LhcQuestion

    answer: { type: mongoose.Schema.Types.Mixed, default: null },

    // snapshot — captured at evaluation, not at the time of answering
    isCorrect:     { type: Boolean, default: null },
    weight:        { type: Number, default: 0 },
    sanctionLevel: { type: String, default: 'none' },

    answeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

lhcAnswerSchema.index({ campaign: 1, user: 1, questionId: 1 }, { unique: true });

export default mongoose.model('LhcAnswer', lhcAnswerSchema);
