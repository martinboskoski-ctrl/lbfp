import mongoose from 'mongoose';
import { editVersionSchema } from './editVersion.js';

const DEPARTMENTS = [
  'sales','finance','administration','hr','quality_assurance',
  'facility','machines','r_and_d','production','top_management','carina','nabavki',
];

// Assignee-submitted request to change the task (deadline/description/goals…).
// Only the task-giver (creator/manager) actually edits; this records the ask.
const changeRequestSchema = new mongoose.Schema(
  {
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message:     { type: String, required: true, trim: true },
    status:      { type: String, enum: ['open', 'resolved'], default: 'open' },
    resolvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt:  { type: Date },
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String },
    assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department:  { type: String, enum: DEPARTMENTS, required: true },
    project:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    priority:    { type: String, enum: ['low','medium','high','urgent'], default: 'medium' },
    deadline:    { type: Date },
    status:      { type: String, enum: ['todo','in_progress','done','approved'], default: 'todo' },
    approvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt:  { type: Date },
    editHistory: [editVersionSchema],
    changeRequests: [changeRequestSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);
