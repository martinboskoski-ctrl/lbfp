import mongoose from 'mongoose';

const employeeDocumentSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    docType: {
      type: String,
      enum: [
        'contract', 'annex', 'id_copy', 'diploma', 'work_permit', 'nda',
        'code_of_conduct_ack', 'medical_cert', 'background_check', 'reference', 'other',
      ],
      required: true,
    },
    title:       { type: String, trim: true, required: true },
    fileKey:     { type: String, required: true }, // S3 key
    fileName:    { type: String, trim: true },
    fileSize:    { type: Number, default: 0 },
    mimeType:    { type: String, trim: true },
    issueDate:   { type: Date, default: null },
    expiryDate:  { type: Date, default: null },
    confidential:{ type: Boolean, default: false }, // hidden from manager when true
    uploadedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes:       { type: String, trim: true },
  },
  { timestamps: true }
);

employeeDocumentSchema.virtual('expiryStatus').get(function () {
  if (!this.expiryDate) return 'na';
  const days = Math.ceil((new Date(this.expiryDate) - new Date()) / 86_400_000);
  if (days < 0)  return 'expired';
  if (days <= 30) return 'expiring_soon';
  return 'valid';
});

employeeDocumentSchema.set('toJSON',   { virtuals: true });
employeeDocumentSchema.set('toObject', { virtuals: true });

export default mongoose.model('EmployeeDocument', employeeDocumentSchema);
