import mongoose from 'mongoose';

const leaveBalanceSchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    year:      { type: Number, required: true },
    totalDays: { type: Number, default: 20 },
    usedDays:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

leaveBalanceSchema.index({ user: 1, year: 1 }, { unique: true });

leaveBalanceSchema.virtual('remainingDays').get(function () {
  return this.totalDays - this.usedDays;
});

leaveBalanceSchema.set('toJSON', { virtuals: true });
leaveBalanceSchema.set('toObject', { virtuals: true });

export default mongoose.model('LeaveBalance', leaveBalanceSchema);
