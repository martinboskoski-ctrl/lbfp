import mongoose from 'mongoose';

const productLineSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  kgPerPiece:    { type: Number, default: 0 },          // kg weight per piece
  capacityShift: { type: Number, default: 0 },          // pieces per shift capacity
  producedKg:    { type: Number, default: 0 },          // actual kg produced this period
}, { _id: false });

const categorySchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },  // e.g. "Hansela"
  products: [productLineSchema],
}, { _id: false });

const wasteEntrySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },   // e.g. "Waste simular"
  kg:   { type: Number, default: 0 },
}, { _id: false });

const productionReportSchema = new mongoose.Schema({
  year:        { type: Number, required: true },
  month:       { type: Number, required: true, min: 1, max: 12 },  // 1-12
  categories:  [categorySchema],
  waste:       [wasteEntrySchema],
  workersTotal:  { type: Number, default: 0 },
  workingDays:   { type: Number, default: 0 },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

productionReportSchema.index({ year: 1, month: 1 }, { unique: true });

export default mongoose.model('ProductionReport', productionReportSchema);
