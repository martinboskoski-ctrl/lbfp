import mongoose from 'mongoose';

export const PO_DEPARTMENTS = ['sales', 'quality_assurance', 'r_and_d', 'nabavki'];
export const Q_TARGET_DEPTS = ['quality_assurance', 'r_and_d', 'nabavki', 'packaging'];

export const PO_STAGES = ['pre_order', 'order'];

export const PO_PHASES = [
  'phase_1_idea',
  'phase_2_evaluation',
  'phase_3_plan',
  'phase_4_client_feedback',
  'phase_5_design_logistics',
  'phase_6_industrial_trial',
  'phase_7_design_approval',
  'phase_8_production_planning',
  'phase_9_production_verification',
];

export const Q_STATUSES = [
  'pending',
  'in_progress',
  'awaiting_sales_review',
  'needs_more',
  'sent_to_client',
  'client_approved',
  'client_rejected',
];

const productSchema = new mongoose.Schema({
  productType: { type: String, required: true },
  weight:      { type: String, default: '' },
  description: { type: String, default: '' },
});

const requiredFieldSchema = new mongoose.Schema({
  key:    { type: String, required: true },
  label:  { type: String, required: true },
  filled: { type: Boolean, default: false },
}, { _id: false });

const threadEntrySchema = new mongoose.Schema({
  author:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body:          { type: String, required: true },
  isFinalAnswer: { type: Boolean, default: false },
}, { timestamps: true });

const salesReviewSchema = new mongoose.Schema({
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  accepted:   { type: Boolean },
  notes:      { type: String, default: '' },
}, { _id: false });

const clientApprovalSchema = new mongoose.Schema({
  loggedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  loggedAt:    { type: Date },
  approved:    { type: Boolean },
  clientNotes: { type: String, default: '' },
}, { _id: false });

const questionSchema = new mongoose.Schema({
  text:             { type: String, required: true },
  targetDepartment: { type: String, enum: Q_TARGET_DEPTS, required: true },
  phase:            { type: String, enum: PO_PHASES, default: 'phase_1_idea' },
  productRef:       { type: String, default: '' },
  deadline:         { type: Date },
  priority:         { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },

  createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  status:           { type: String, enum: Q_STATUSES, default: 'pending' },

  requiredFields:   { type: [requiredFieldSchema], default: [] },
  thread:           { type: [threadEntrySchema], default: [] },

  // Convenience: latest final answer text (mirrored from thread for list views).
  answer:           { type: String, default: '' },
  answeredBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  answeredAt:       { type: Date },

  salesReview:     { type: salesReviewSchema, default: () => ({}) },
  clientApproval:  { type: clientApprovalSchema, default: () => ({}) },

  // Legacy — kept so old data still renders. `resolved=true` ≈ `status='client_approved'`.
  resolved:         { type: Boolean, default: false },
  resolvedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt:       { type: Date },
}, { timestamps: true });

const purchaseOrderSchema = new mongoose.Schema({
  clientName:   { type: String, required: true },
  stage:        { type: String, enum: PO_STAGES, default: 'pre_order' },
  currentPhase: { type: String, enum: PO_PHASES, default: 'phase_1_idea' },
  dateExpected: { type: Date },
  moq:          { type: Number },
  description:  { type: String, default: '' },
  products:     [productSchema],
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:       { type: String, enum: ['open', 'closed'], default: 'open' },
  questions:    [questionSchema],
}, { timestamps: true });

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);
