import mongoose from 'mongoose';
import { Readable } from 'stream';

// Packaging artwork / ingredient files live in MongoDB GridFS (S3 is not set up).
const BUCKET = 'packagingFiles';

const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET });

/** Stores an in-memory multer file; returns the file reference saved on the round. */
export const saveFile = (file, metadata = {}) =>
  new Promise((resolve, reject) => {
    const upload = bucket().openUploadStream(file.originalname, {
      metadata: { ...metadata, mimeType: file.mimetype },
    });
    Readable.from(file.buffer)
      .pipe(upload)
      .on('error', reject)
      .on('finish', () =>
        resolve({
          fileId: upload.id,
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        })
      );
  });

export const openFileStream = (fileId) => bucket().openDownloadStream(new mongoose.Types.ObjectId(fileId));

export const readFile = async (fileId) => {
  const chunks = [];
  for await (const chunk of openFileStream(fileId)) chunks.push(chunk);
  return Buffer.concat(chunks);
};

export const deleteFile = async (fileId) => {
  try {
    await bucket().delete(new mongoose.Types.ObjectId(fileId));
  } catch {
    // already gone — nothing to clean up
  }
};
