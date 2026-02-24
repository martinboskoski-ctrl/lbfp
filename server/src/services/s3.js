import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client from '../config/s3.js';

const BUCKET = process.env.S3_BUCKET_NAME;

/**
 * Generate a presigned PUT URL for direct browser upload.
 */
export const getPresignedUploadUrl = async ({ key, contentType, expiresIn = 300 }) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Generate a presigned GET URL for download.
 */
export const getPresignedDownloadUrl = async ({ key, expiresIn = 3600 }) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Delete an object from S3.
 */
export const deleteS3Object = async (key) => {
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  return s3Client.send(command);
};
