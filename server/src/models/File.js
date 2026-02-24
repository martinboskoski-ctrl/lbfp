import mongoose from 'mongoose';

const fileCommentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const fileSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gateNumber: { type: Number, required: true },
  version: { type: Number, required: true },
  versionLabel: { type: String, required: true },
  originalName: { type: String, required: true },
  s3Key: { type: String, required: true },
  mimeType: { type: String },
  size: { type: Number },
  isLatest: { type: Boolean, default: true },
  comments: [fileCommentSchema],
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.model('File', fileSchema);
