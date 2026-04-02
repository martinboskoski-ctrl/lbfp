import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type:      { type: String, required: true },
    title:     { type: String, required: true },
    message:   { type: String, default: '' },
    link:      { type: String, default: '' },
    read:      { type: Boolean, default: false },
    metadata:  { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 days TTL

export default mongoose.model('Notification', notificationSchema);
