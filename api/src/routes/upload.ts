import express, { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import Project from '../models/Project';
import { uploadFile, getFileUrl, minioClient } from '../config/minio';
import { AppError } from '../middleware/errorHandler';

const router: Router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      // According to multer types, when passing an error you should not pass the second argument
      return cb(new AppError('Only image files are allowed', 400));
    }
  }
});

// POST /api/upload/:projectId - Upload image to project
router.post('/:projectId', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No image file provided', 400));
    }

    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Process image with Sharp
    const processedImage = await sharp(req.file.buffer)
      .resize(1920, 1080, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Get image metadata from the processed image
    const metadata = await sharp(processedImage).metadata();
    
    // Generate unique filename
    const fileId = uuidv4();
    const filename = `${fileId}.jpg`;
    const bucketName = process.env.MINIO_BUCKET || 'designsight';

    // Upload to MinIO
    await uploadFile(
      bucketName,
      filename,
      processedImage,
      processedImage.length,
      {
        'Content-Type': 'image/jpeg',
        'original-name': req.file.originalname
      }
    );

    // Generate presigned URL
    const imageUrl = await getFileUrl(bucketName, filename);

    // Create image object
    const imageData = {
      id: fileId,
      filename,
      originalName: req.file.originalname,
      url: imageUrl,
      size: processedImage.length,
      mimeType: 'image/jpeg',
      width: metadata.width || 0,
      height: metadata.height || 0,
      uploadedAt: new Date()
    };

    // Add image to project
    project.images.push(imageData);
    await project.save();

    res.status(201).json({
      success: true,
      data: {
        image: imageData,
        project: project
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/upload/image/:imageId - Get image URL
router.get('/image/:imageId', async (req, res, next) => {
  try {
    const { imageId } = req.params;
    const bucketName = process.env.MINIO_BUCKET || 'designsight';
    
    // Find project with this image
    const project = await Project.findOne({ 'images.id': imageId });
    if (!project) {
      return next(new AppError('Image not found', 404));
    }

    const image = project.images.find(img => img.id === imageId);
    if (!image) {
      return next(new AppError('Image not found', 404));
    }

    // Generate fresh presigned URL (may not be browser-accessible if MinIO isn't public)
    const imageUrl = await getFileUrl(bucketName, image.filename);

    res.json({
      success: true,
      data: {
        imageUrl,
        image
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/upload/image/:imageId/file - Stream image through API (browser-friendly)
router.get('/image/:imageId/file', async (req, res, next) => {
  try {
    const { imageId } = req.params;
    const bucketName = process.env.MINIO_BUCKET || 'designsight';

    // Find project with this image
    const project = await Project.findOne({ 'images.id': imageId });
    if (!project) {
      return next(new AppError('Image not found', 404));
    }

    const image = project.images.find(img => img.id === imageId);
    if (!image) {
      return next(new AppError('Image not found', 404));
    }

    // Stream via presigned URL (avoids exposing internal MinIO host to browsers)
    try {
      const signedUrl = await getFileUrl(bucketName, image.filename);
      const response = await fetch(signedUrl);

      if (!response.ok || !response.body) {
        if (response.status === 404) {
          return next(new AppError('Image not found', 404));
        }
        throw new Error(`Storage fetch failed with status ${response.status}`);
      }

      res.setHeader('Content-Type', image.mimeType || response.headers.get('content-type') || 'application/octet-stream');
      res.setHeader('Cache-Control', 'private, max-age=300');
      res.status(response.status);
      // @ts-expect-error Node 18 fetch body is a Readable stream compatible with pipe
      response.body.pipe(res);
    } catch (e) {
      // Fallback to MinIO SDK stream
      try {
        // Try callback-style API to avoid subtle Promise/stream issues
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        // @ts-ignore - using callback form
        minioClient.getObject(bucketName, image.filename, (err: any, dataStream: any) => {
          if (err) {
            // MinIO error "NoSuchKey" is a not-found
            if (err && (err.code === 'NoSuchKey' || err.message?.includes('The specified key does not exist'))) {
              return next(new AppError('Image not found', 404));
            }
            return next(new AppError('Failed to retrieve image from storage', 502));
          }
          res.setHeader('Content-Type', image.mimeType || 'application/octet-stream');
          res.setHeader('Cache-Control', 'private, max-age=300');
          dataStream.on('error', (e: any) => next(e));
          dataStream.pipe(res);
        });
      } catch (err) {
        return next(new AppError('Failed to retrieve image from storage', 502));
      }
    }
  } catch (error) {
    next(error);
  }
});

export default router;
