import mongoose from 'mongoose';

// One question to the AI assistant — for accountability, usage and cost tracking.
const assistantLogSchema = new mongoose.Schema(
  {
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    question: { type: String, required: true },
    answer:   { type: String, default: '' },
    tools:    [{ name: String, args: mongoose.Schema.Types.Mixed, _id: false }],
    tokens:   { type: Number, default: 0 },
    ms:       { type: Number, default: 0 },
    error:    { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('AssistantLog', assistantLogSchema);
