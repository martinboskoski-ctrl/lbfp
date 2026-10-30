import mongoose from 'mongoose';

// One block of annual leave taken. `days` are working days, entered by HR or the
// manager (a suggestion excludes weekends; public holidays are theirs to subtract).
const leaveEntrySchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    from:      { type: Date, required: true },
    to:        { type: Date, required: true },
    days:      { type: Number, required: true, min: 0.5 },
    note:      { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('LeaveEntry', leaveEntrySchema);
