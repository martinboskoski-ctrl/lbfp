import mongoose from 'mongoose';
import { DEPARTMENTS } from './User.js';

const announcementSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  content:     { type: String, required: true, trim: true },
  priority:    { type: String, enum: ['info', 'important', 'urgent'], default: 'info' },
  pinned:      { type: Boolean, default: false },
  departments: [{ type: String, enum: DEPARTMENTS }],           // empty = all employees
  readBy:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model('Announcement', announcementSchema);
