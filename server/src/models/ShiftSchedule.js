import mongoose from 'mongoose';
import { DEPARTMENTS } from './User.js';

const shiftScheduleSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  department: { type: String, enum: DEPARTMENTS, required: true },
  date: { type: Date, required: true },
  shiftType: { type: String, enum: ['morning', 'afternoon', 'night'], required: true },
  startTime: { type: String },
  endTime: { type: String },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

shiftScheduleSchema.index({ employee: 1, date: 1 }, { unique: true });

const ShiftSchedule = mongoose.model('ShiftSchedule', shiftScheduleSchema);

export default ShiftSchedule;
