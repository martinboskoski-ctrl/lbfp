import mongoose from 'mongoose';

const DEPARTMENTS = [
  'sales','finance','administration','hr','quality_assurance',
  'facility','machines','r_and_d','production','top_management','carina','nabavki',
];

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  done:  { type: Boolean, default: false },
});

const taskSchema = new mongoose.Schema({
  title:      { type: String, required: true },
  description:{ type: String },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deadline:   { type: Date },
  status:     { type: String, enum: ['todo','in_progress','done'], default: 'todo' },
  priority:   { type: String, enum: ['low','medium','high'], default: 'medium' },
  subtasks:   [subtaskSchema],
});

const involvedDeptSchema = new mongoose.Schema({
  department: { type: String, enum: DEPARTMENTS, required: true },
  reason:     { type: String },
  expected:   { type: String },
  deadline:   { type: Date },
});

const projectSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String },
    owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department:  { type: String, enum: DEPARTMENTS, required: true },
    priority:    { type: String, enum: ['low','medium','high','urgent'], default: 'medium' },
    status:      { type: String, enum: ['draft','active','on_hold','completed','cancelled'], default: 'draft' },
    startDate:   { type: Date },
    endDate:     { type: Date },
    budget:      { type: Number },
    goals:       [{ type: String }],
    assignedUsers:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    involvedDepartments: [involvedDeptSchema],
    tasks:       [taskSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
