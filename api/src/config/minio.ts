import { Client } from 'minio';
import { Readable } from 'stream';

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

export const initializeMinIO = async (): Promise<void> => {
  try {
    const bucketName = process.env.MINIO_BUCKET || 'designsight';
    
    // Check if bucket exists
    const bucketExists = await minioClient.bucketExists(bucketName);
    
    if (!bucketExists) {
      // Create bucket if it doesn't exist
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`Bucket '${bucketName}' created successfully`);
    } else {
      console.log(`Bucket '${bucketName}' already exists`);
    }
  } catch (error) {
    console.error('MinIO initialization error:', error);
    throw error;
  }
};

export const uploadFile = async (
  bucketName: string,
  objectName: string,
  stream: Buffer | Readable,
  size: number,
  metaData?: Record<string, string>
): Promise<string> => {
  try {
    await minioClient.putObject(bucketName, objectName, stream, size, metaData);
    return objectName;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

export const getFileUrl = async (
  bucketName: string,
  objectName: string,
  expiry: number = 7 * 24 * 60 * 60 // 7 days
): Promise<string> => {
  try {
    return await minioClient.presignedGetObject(bucketName, objectName, expiry);
  } catch (error) {
    console.error('Get file URL error:', error);
    throw error;
  }
};

export const deleteFile = async (
  bucketName: string,
  objectName: string
): Promise<void> => {
  try {
    await minioClient.removeObject(bucketName, objectName);
  } catch (error) {
    console.error('File deletion error:', error);
    throw error;
  }
};
