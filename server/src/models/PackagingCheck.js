import mongoose from 'mongoose';

// Sectors that take part in the packaging-artwork check. Sales leads the process.
export const PACKAGING_SECTORS = ['sales', 'r_and_d', 'nabavki', 'quality_assurance'];

const fileRefSchema = new mongoose.Schema(
  {
    fileId:   { type: mongoose.Schema.Types.ObjectId, required: true }, // GridFS id
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size:     { type: Number, required: true },
  },
  { _id: false }
);

const remarkSchema = new mongoose.Schema(
  {
    text:      { type: String, required: true, trim: true },
    severity:  { type: String, enum: ['critical', 'warning', 'info'], default: 'warning' },
    sector:    { type: String, enum: PACKAGING_SECTORS, required: true },
    rule:      { type: mongoose.Schema.Types.ObjectId, ref: 'PackagingRule' },
    ruleText:  { type: String, default: '' }, // snapshot — rules can change later
    source:    { type: String, enum: ['ai', 'manual'], required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // empty for AI remarks
    // pending → the responsible sector has not answered yet
    // confirmed → valid remark, artwork needs a correction
    // disputed → not an issue (comment required)
    status:    { type: String, enum: ['pending', 'confirmed', 'disputed'], default: 'pending' },
    response: {
      comment: { type: String, default: '' },
      by:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      at:      { type: Date },
    },
  },
  { timestamps: true }
);

const roundSchema = new mongoose.Schema(
  {
    number:          { type: Number, required: true },
    artwork:         { type: fileRefSchema, required: true },
    ingredientsText: { type: String, default: '' },
    ingredientsFile: { type: fileRefSchema },
    note:            { type: String, default: '' },
    createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ai: {
      status:  { type: String, enum: ['not_configured', 'done', 'failed'], default: 'not_configured' },
      summary: { type: String, default: '' },
      error:   { type: String, default: '' },
      model:   { type: String, default: '' },
      ranAt:   { type: Date },
    },
    remarks: [remarkSchema],
    outcome: {
      decision: { type: String, enum: ['approved', 'changes_required'] },
      summary:  { type: String, default: '' },
      by:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      at:       { type: Date },
    },
  },
  { timestamps: true }
);

const packagingCheckSchema = new mongoose.Schema(
  {
    code:      { type: String, required: true, unique: true }, // e.g. "ПА-0007"
    client:    { type: String, required: true, trim: true },
    product:   { type: String, required: true, trim: true },
    // in_review → current round open; approved / changes_required → last round closed
    status:    { type: String, enum: ['in_review', 'approved', 'changes_required'], default: 'in_review' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rounds:    [roundSchema],
  },
  { timestamps: true }
);

packagingCheckSchema.index({ status: 1, updatedAt: -1 });

export default mongoose.model('PackagingCheck', packagingCheckSchema);
