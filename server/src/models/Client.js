import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    description: { type: String, trim: true, default: '' },
    forecastEUR: { type: Number, default: 0, min: 0 },
    itemCount:   { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['forecast', 'confirmed', 'delivered', 'cancelled'],
      default: 'forecast',
    },
    orderDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['note', 'status_change', 'call', 'email', 'meeting', 'other'],
      default: 'note',
    },
    text:      { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const clientSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    contactName: { type: String, trim: true, default: '' },
    email:       { type: String, trim: true, default: '' },
    phone:       { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['active', 'prospect', 'inactive'],
      default: 'active',
    },
    assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department:  { type: String, default: 'sales' },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes:       { type: String, trim: true, default: '' },
    orders:      [orderSchema],
    activities:  [activitySchema],
  },
  { timestamps: true }
);

// Overview aggregates — exclude cancelled orders from forecast/item totals.
clientSchema.virtual('forecastTotal').get(function () {
  return (this.orders || [])
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.forecastEUR || 0), 0);
});
clientSchema.virtual('deliveredTotal').get(function () {
  return (this.orders || [])
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.forecastEUR || 0), 0);
});
clientSchema.virtual('itemTotal').get(function () {
  return (this.orders || [])
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.itemCount || 0), 0);
});
clientSchema.virtual('openOrderCount').get(function () {
  return (this.orders || []).filter((o) => o.status !== 'cancelled').length;
});

clientSchema.set('toJSON',   { virtuals: true });
clientSchema.set('toObject', { virtuals: true });

export default mongoose.model('Client', clientSchema);
