import express, { Router } from 'express';
import Project from '../models/Project';
import { minioClient } from '../config/minio';
import { AppError } from '../middleware/errorHandler';

const router: Router = express.Router();

// GET /api/maintenance/images/verify?fix=remove
// Scans all projects, verifies each image object exists in MinIO.
// If fix=remove, removes missing images from projects.
router.get('/images/verify', async (req, res, next) => {
  try {
    const bucketName = process.env.MINIO_BUCKET || 'designsight';
    const fix = (req.query.fix as string) || '';

    const projects = await Project.find({});
    const report: any[] = [];
    let missingTotal = 0;
    let removedTotal = 0;

    for (const project of projects) {
      const missing: any[] = [];
      for (const img of project.images) {
        try {
          // statObject throws if object missing
          // @ts-ignore types
          await minioClient.statObject(bucketName, img.filename);
        } catch (err: any) {
          const code = err?.code || err?.message || 'UNKNOWN';
          if (code.includes('NotFound') || code.includes('NoSuchKey') || /not exist/i.test(code)) {
            missing.push({ id: img.id, filename: img.filename, reason: code });
          }
        }
      }

      if (missing.length > 0) {
        missingTotal += missing.length;
        if (fix === 'remove') {
          const keep = project.images.filter(img => !missing.find(m => m.id === img.id));
          const removed = project.images.length - keep.length;
          project.images = keep as any;
          await project.save();
          removedTotal += removed;
        }
        report.push({ projectId: project._id, projectName: project.name, missing });
      }
    }

    res.json({
      success: true,
      data: {
        bucket: bucketName,
        missingTotal,
        removedTotal,
        projectsWithMissing: report.length,
        details: report
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
