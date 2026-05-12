import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const DEPARTMENTS = [
  'sales',
  'finance',
  'administration',
  'hr',
  'quality_assurance',
  'facility',
  'machines',
  'r_and_d',
  'production',
  'top_management',
  'carina',
  'nabavki',
];

export const USER_STATUSES = ['active', 'suspended', 'deleted'];

const activityEntrySchema = new mongoose.Schema({
  action:     { type: String, required: true },
  at:         { type: Date, default: Date.now },
  target:     { type: String, default: '' },     // e.g. "User:<id>" or "PurchaseOrder:<id>"
  targetType: { type: String, default: '' },
  metadata:   { type: mongoose.Schema.Types.Mixed, default: {} },
  ip:         { type: String, default: '' },
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  department: { type: String, enum: DEPARTMENTS, required: true },
  isManager: { type: Boolean, default: false },
  // role is derived: managers get 'owner', others get 'reviewer'
  // kept for future access restriction
  role: { type: String, enum: ['owner', 'reviewer', 'client', 'admin'], default: 'reviewer' },
  language: { type: String, enum: ['mk', 'en'], default: 'mk' },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  active: { type: Boolean, default: true },

  // Lifecycle
  status: { type: String, enum: USER_STATUSES, default: 'active' },
  suspendedAt:     { type: Date,   default: null },
  suspendedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  suspendedReason: { type: String, default: '' },
  deletedAt:       { type: Date,   default: null },
  deletedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Embedded, capped activity trail of THIS user's actions in the app.
  // Pushed via $push + $slice:-200 to keep growth bounded.
  activityLog: { type: [activityEntrySchema], default: [] },
}, { timestamps: true });

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export { DEPARTMENTS };
export default mongoose.model('User', userSchema);
