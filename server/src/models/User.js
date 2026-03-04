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
