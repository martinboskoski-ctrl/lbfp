import mongoose from 'mongoose';

const employeeAssetSchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assetType: {
      type: String,
      enum: ['laptop', 'phone', 'badge', 'locker', 'vehicle', 'uniform', 'ppe', 'tool', 'other'],
      required: true,
    },
    label:        { type: String, trim: true, required: true }, // human-readable, e.g. "Dell Latitude 7440"
    serialNumber: { type: String, trim: true },
    size:         { type: String, trim: true }, // for uniform / PPE
    issuedDate:   { type: Date, required: true, default: Date.now },
    issuedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expectedReturn:{ type: Date, default: null },
    returnedDate: { type: Date, default: null },
    returnedTo:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    conditionOnReturn: { type: String, enum: ['good', 'damaged', 'lost', null], default: null },
    replacementCost:   { type: Number, default: null },
    notes:        { type: String, trim: true },
  },
  { timestamps: true }
);

employeeAssetSchema.virtual('isReturned').get(function () {
  return !!this.returnedDate;
});

employeeAssetSchema.set('toJSON',   { virtuals: true });
employeeAssetSchema.set('toObject', { virtuals: true });

export default mongoose.model('EmployeeAsset', employeeAssetSchema);
