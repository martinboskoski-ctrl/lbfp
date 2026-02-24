import mongoose from 'mongoose';

const DEPARTMENTS = [
  'sales','finance','administration','hr','quality_assurance',
  'facility','machines','r_and_d','production','top_management','carina','nabavki',
];

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
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);
