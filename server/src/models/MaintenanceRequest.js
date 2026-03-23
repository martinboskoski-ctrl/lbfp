import mongoose from 'mongoose';
import { DEPARTMENTS } from './User.js';

const maintenanceRequestSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  machineId: { type: String, trim: true },
  department: { type: String, enum: DEPARTMENTS, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['reported', 'in_progress', 'resolved'], default: 'reported' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolvedAt: { type: Date },
  resolutionNotes: { type: String },
}, { timestamps: true });

const MaintenanceRequest = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);

export default MaintenanceRequest;
