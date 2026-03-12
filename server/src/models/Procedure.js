import mongoose from 'mongoose';
import { DEPARTMENTS } from './User.js';

const procedureSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    content:     { type: String, required: true },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    departments: [{ type: String, enum: DEPARTMENTS }],
  },
  { timestamps: true }
);

export default mongoose.model('Procedure', procedureSchema);
