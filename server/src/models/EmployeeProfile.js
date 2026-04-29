import mongoose from 'mongoose';

const employeeProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

    // ---- Identity & personal
    legalName:        { type: String, trim: true },
    embg:             { type: String, trim: true },
    birthDate:        { type: Date, default: null },
    gender:           { type: String, enum: ['male', 'female', 'other', 'undisclosed'], default: 'undisclosed' },
    maritalStatus:    { type: String, enum: ['single', 'married', 'divorced', 'widowed', 'partnership'], default: 'single' },
    dependents:       { type: Number, default: 0 },
    nationality:      { type: String, trim: true },
    idNumber:         { type: String, trim: true },
    address:          {
      street: { type: String, trim: true },
      city:   { type: String, trim: true },
      country:{ type: String, trim: true, default: 'North Macedonia' },
      postal: { type: String, trim: true },
    },
    personalPhone:    { type: String, trim: true },
    personalEmail:    { type: String, trim: true, lowercase: true },
    photoUrl:         { type: String, trim: true },
    emergencyContact: {
      name:     { type: String, trim: true },
      relation: { type: String, trim: true },
      phone:    { type: String, trim: true },
    },

    // ---- Employment / contract
    position:         { type: String, trim: true },
    jobDescription:   { type: String, trim: true },
    subTeam:          { type: String, trim: true },
    employmentType:   { type: String, enum: ['full_time', 'part_time', 'fixed_term', 'internship', 'contractor'], default: 'full_time' },
    contractType:     { type: String, enum: ['open_ended', 'fixed_term'], default: 'open_ended' },
    contractStart:    { type: Date, default: null },
    contractEnd:      { type: Date, default: null }, // null when open-ended
    probationEnd:     { type: Date, default: null },
    noticePeriodDays: { type: Number, default: 30 },
    workLocation:     { type: String, enum: ['factory', 'office', 'hybrid', 'remote'], default: 'factory' },
    ftePercent:       { type: Number, min: 0, max: 100, default: 100 },
    hireDate:         { type: Date, default: null }, // may differ from contractStart on rehire

    // ---- Compensation visibility hint
    salaryVisibleToManager: { type: Boolean, default: false },

    // ---- Health & safety
    sanitaryCheckLast: { type: Date, default: null },
    sanitaryCheckNext: { type: Date, default: null },
    fitnessExamLast:   { type: Date, default: null },
    fitnessExamNext:   { type: Date, default: null },
    allergies:         { type: String, trim: true },
    bloodType:         { type: String, trim: true },

    // ---- Education & skills
    highestEducation: { type: String, enum: ['none', 'primary', 'secondary', 'bachelor', 'master', 'phd'], default: 'secondary' },
    schools: [
      {
        institution: { type: String, trim: true },
        degree:      { type: String, trim: true },
        field:       { type: String, trim: true },
        from:        { type: Date },
        to:          { type: Date },
      },
    ],
    languages: [
      {
        language:   { type: String, trim: true },
        proficiency:{ type: String, enum: ['basic', 'intermediate', 'advanced', 'native'], default: 'intermediate' },
      },
    ],
    skills:           [{ type: String, trim: true }],
    previousJobs: [
      {
        employer: { type: String, trim: true },
        role:     { type: String, trim: true },
        from:     { type: Date },
        to:       { type: Date },
      },
    ],

    // ---- Family / beneficiaries (HR + top mgmt only)
    family: [
      {
        name:     { type: String, trim: true },
        relation: { type: String, trim: true }, // spouse, child, parent...
        birthDate:{ type: Date },
        dependent:{ type: Boolean, default: false },
      },
    ],
    beneficiaries: [
      {
        name:        { type: String, trim: true },
        relation:    { type: String, trim: true },
        sharePercent:{ type: Number, min: 0, max: 100 },
      },
    ],

    // ---- Recognition (light list — heavy ones go in their own collection later)
    recognitions: [
      {
        title:    { type: String, trim: true },
        date:     { type: Date },
        givenBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        notes:    { type: String, trim: true },
      },
    ],

    // ---- HR private notes (HR + top mgmt only)
    hrNotes: { type: String, trim: true },
  },
  { timestamps: true }
);

// ---- Virtuals
employeeProfileSchema.virtual('seniorityYears').get(function () {
  const start = this.hireDate || this.contractStart;
  if (!start) return null;
  return Math.floor((Date.now() - new Date(start).getTime()) / (365.25 * 86_400_000));
});

employeeProfileSchema.virtual('contractDaysLeft').get(function () {
  if (!this.contractEnd) return null;
  return Math.ceil((new Date(this.contractEnd) - new Date()) / 86_400_000);
});

employeeProfileSchema.virtual('contractStatus').get(function () {
  if (this.contractType === 'open_ended' || !this.contractEnd) return 'open_ended';
  const days = Math.ceil((new Date(this.contractEnd) - new Date()) / 86_400_000);
  if (days < 0)  return 'expired';
  if (days <= 60) return 'expiring_soon';
  return 'active';
});

employeeProfileSchema.virtual('sanitaryCheckStatus').get(function () {
  if (!this.sanitaryCheckNext) return 'unknown';
  const days = Math.ceil((new Date(this.sanitaryCheckNext) - new Date()) / 86_400_000);
  if (days < 0)  return 'overdue';
  if (days <= 30) return 'due_soon';
  return 'ok';
});

employeeProfileSchema.set('toJSON',   { virtuals: true });
employeeProfileSchema.set('toObject', { virtuals: true });

export default mongoose.model('EmployeeProfile', employeeProfileSchema);
