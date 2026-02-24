import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  plan: { type: String, enum: ['basic', 'enterprise'], default: 'basic' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Company', companySchema);
