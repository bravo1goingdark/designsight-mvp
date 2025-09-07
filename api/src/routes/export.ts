import express, { Router } from 'express';
import Project from '../models/Project';
import Feedback from '../models/Feedback';
import { ExportService, ExportData } from '../services/exportService';
import { AppError } from '../middleware/errorHandler';

const router: Router = express.Router();

// POST /api/export/pdf - Generate PDF report
router.post('/pdf', async (req, res, next) => {
  try {
    const { projectId, imageId, role } = req.body as { projectId: string; imageId?: string; role?: string };

    if (!projectId) {
      return next(new AppError('Project ID is required', 400));
    }

    // Get project data
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Get image data if specified
    let image = null;
    if (imageId) {
      image = project.images.find(img => img.id === imageId);
      if (!image) {
        return next(new AppError('Image not found', 404));
      }
    }

    // Build feedback filter. If role provided, filter by role; otherwise include all.
    const filter: any = { projectId };
    if (imageId) filter.imageId = imageId;
    if (role) filter.roles = { $in: [role] };

    // Get feedback data
    const feedback = await Feedback.find(filter).sort({ createdAt: -1 });

    // Prepare export data
    const exportData: ExportData = {
      project,
      ...(image && { image }),
      feedback,
      exportDate: new Date().toISOString(),
      ...(role && { role }),
      summary: ExportService.generateSummary(feedback)
    };

    // Generate PDF
    const pdfBuffer = await ExportService.generatePDF(exportData);

    // Set response headers
    const filename = `designsight-report-${project.name}-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

// POST /api/export/json - Generate JSON export
router.post('/json', async (req, res, next) => {
  try {
    const { projectId, imageId, role } = req.body;

    if (!projectId) {
      return next(new AppError('Project ID is required', 400));
    }

    // Get project data
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Get image data if specified
    let image = null;
    if (imageId) {
      image = project.images.find(img => img.id === imageId);
      if (!image) {
        return next(new AppError('Image not found', 404));
      }
    }

    // Build feedback filter
    const filter: any = { projectId };
    if (imageId) filter.imageId = imageId;
    if (role) filter.roles = { $in: [role] };

    // Get feedback data
    const feedback = await Feedback.find(filter).sort({ createdAt: -1 });

    // Prepare export data
    const exportData: ExportData = {
      project,
      ...(image && { image }),
      feedback,
      exportDate: new Date().toISOString(),
      ...(role && { role }),
      summary: ExportService.generateSummary(feedback)
    };

    // Generate JSON
    const jsonData = ExportService.generateJSON(exportData);

    // Set response headers
    const filename = `designsight-data-${project.name}-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(jsonData);
  } catch (error) {
    next(error);
  }
});

// GET /api/export/preview - Get export preview data (supports routes with and without imageId)
const handlePreview = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const { projectId, imageId } = req.params as { projectId: string; imageId?: string };
    const { role } = req.query;

    // Get project data
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Get image data if specified
    let image = null as null | typeof project.images[number];
    if (imageId) {
      image = project.images.find(img => img.id === imageId) || null;
      if (!image) {
        return next(new AppError('Image not found', 404));
      }
    }

    // Build feedback filter
    const filter: any = { projectId };
    if (imageId) filter.imageId = imageId;
    if (role) filter.roles = { $in: [role as string] };

    // Get feedback data
    const feedback = await Feedback.find(filter).sort({ createdAt: -1 });

    // Prepare preview data
    const previewData = {
      project: {
        id: project._id,
        name: project.name,
        description: project.description
      },
      image: image ? {
        id: image.id,
        originalName: image.originalName,
        width: image.width,
        height: image.height
      } : null,
      feedbackCount: feedback.length,
      summary: ExportService.generateSummary(feedback),
      availableRoles: ['designer', 'reviewer', 'product_manager', 'developer']
    };

    res.json({
      success: true,
      data: previewData
    });
  } catch (error) {
    next(error);
  }
};

router.get('/preview/:projectId', handlePreview);
router.get('/preview/:projectId/:imageId', handlePreview);

export default router;
