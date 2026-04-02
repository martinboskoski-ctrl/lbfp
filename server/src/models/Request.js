import mongoose from 'mongoose';
import { REQUEST_TYPE_KEYS } from '../config/requestTypes.js';

const stepHistorySchema = new mongoose.Schema(
  {
    stepIndex: { type: Number, required: true },
    label:     { type: String, required: true },
    action:    { type: String, enum: ['approved', 'rejected'], required: true },
    actionBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actionAt:  { type: Date, default: Date.now },
    note:      { type: String, default: '' },
  },
  { _id: false }
);

const requestSchema = new mongoose.Schema(
  {
    type:        { type: String, enum: REQUEST_TYPE_KEYS, required: true },
    requester:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department:  { type: String, required: true }, // snapshot of requester's dept at creation
    status:      { type: String, enum: ['pending', 'in_progress', 'approved', 'rejected'], default: 'pending' },
    currentStep: { type: Number, default: 0 },
    totalSteps:  { type: Number, required: true },
    stepHistory: [stepHistorySchema],
    data:        { type: mongoose.Schema.Types.Mixed, default: {} },
    leaveDays:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

requestSchema.index({ requester: 1, status: 1 });
requestSchema.index({ type: 1, status: 1 });
requestSchema.index({ department: 1, currentStep: 1 });

export default mongoose.model('Request', requestSchema);
