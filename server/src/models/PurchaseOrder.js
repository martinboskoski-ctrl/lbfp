import mongoose from 'mongoose';

export const PO_DEPARTMENTS  = ['sales', 'quality_assurance', 'r_and_d', 'nabavki'];
export const Q_TARGET_DEPTS  = ['quality_assurance', 'r_and_d', 'nabavki'];

const productSchema = new mongoose.Schema({
  productType: { type: String, required: true },
  weight:      { type: String, required: true },
  description: { type: String, default: '' },
});

const questionSchema = new mongoose.Schema({
  text:             { type: String, required: true },
  targetDepartment: { type: String, enum: Q_TARGET_DEPTS, required: true },
  createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  answer:           { type: String, default: '' },
  answeredBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  answeredAt:       { type: Date },
  resolved:         { type: Boolean, default: false },
  resolvedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt:       { type: Date },
}, { timestamps: true });

const purchaseOrderSchema = new mongoose.Schema({
  clientName:   { type: String, required: true },
  dateExpected: { type: Date,   required: true },
  moq:          { type: Number, required: true },
  description:  { type: String, default: '' },
  products:     [productSchema],
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:       { type: String, enum: ['open', 'closed'], default: 'open' },
  questions:    [questionSchema],
}, { timestamps: true });

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);
