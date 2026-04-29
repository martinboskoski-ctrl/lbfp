import mongoose from 'mongoose';

const incidentReportSchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    occurredAt:  { type: Date, required: true, default: Date.now },
    location:    { type: String, trim: true },
    severity:    { type: String, enum: ['near_miss', 'minor', 'moderate', 'serious', 'critical'], default: 'minor' },
    injuryType:  { type: String, trim: true },
    description: { type: String, trim: true, required: true },
    witnesses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    daysLost:    { type: Number, default: 0 },
    correctiveAction: { type: String, trim: true },
    investigatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    closedAt:    { type: Date, default: null },
    fileKeys:    [{ type: String }],
    reportedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

incidentReportSchema.virtual('isClosed').get(function () {
  return !!this.closedAt;
});

incidentReportSchema.set('toJSON',   { virtuals: true });
incidentReportSchema.set('toObject', { virtuals: true });

export default mongoose.model('IncidentReport', incidentReportSchema);
