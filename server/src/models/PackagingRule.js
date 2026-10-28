import mongoose from 'mongoose';
import { PACKAGING_SECTORS } from './PackagingCheck.js';

// A checklist rule the artwork is checked against. `sector` owns remarks raised
// under this rule (AI remarks are routed to it automatically).
const packagingRuleSchema = new mongoose.Schema(
  {
    text:      { type: String, required: true, trim: true },
    category:  { type: String, default: '', trim: true }, // e.g. "Содржина", "Јазик", "Фонт"
    sector:    { type: String, enum: PACKAGING_SECTORS, required: true },
    active:    { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('PackagingRule', packagingRuleSchema);
