import File from '../models/File.js';
import writeAudit from '../services/audit.js';
import { getPresignedUploadUrl, getPresignedDownloadUrl } from '../services/s3.js';
import { v4 as uuidv4 } from 'uuid';

export const initiateUpload = async (req, res) => {
  const { projectId, gateNumber, originalName, contentType } = req.body;

  if (!projectId || gateNumber === undefined || !originalName || !contentType) {
    return res.status(400).json({ message: 'projectId, gateNumber, originalName, and contentType are required' });
  }

  // Find the next version number for this project
  const latest = await File.findOne({ project: projectId }).sort({ version: -1 });
  const version = latest ? latest.version + 1 : 1;
  const versionLabel = `V${version}`;

  // Mark previous files as not latest
  await File.updateMany({ project: projectId, isLatest: true }, { isLatest: false });

  const ext = originalName.split('.').pop();
  const s3Key = `projects/${projectId}/gate-${gateNumber}/${uuidv4()}.${ext}`;

  // Create file record
  const file = await File.create({
    project: projectId,
    uploader: req.user._id,
    gateNumber: parseInt(gateNumber, 10),
    version,
    versionLabel,
    originalName,
    s3Key,
    mimeType: contentType,
    isLatest: true,
  });

  // Generate presigned PUT URL
  const uploadUrl = await getPresignedUploadUrl({ key: s3Key, contentType });

  await writeAudit({
    projectId,
    userId: req.user._id,
    action: 'file_upload_initiated',
    details: { versionLabel, originalName },
  });

  res.status(201).json({ file, uploadUrl });
};

export const confirmUpload = async (req, res) => {
  const { id } = req.params;
  const { size } = req.body;

  const file = await File.findById(id);
  if (!file) return res.status(404).json({ message: 'File record not found' });

  if (size !== undefined) file.size = size;
  await file.save();

  res.json({ file });
};

export const getDownloadUrl = async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).json({ message: 'File not found' });

  const url = await getPresignedDownloadUrl({ key: file.s3Key });
  res.json({ url });
};
