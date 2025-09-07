import express, { Router } from 'express';
import Feedback from '../models/Feedback';
import { AppError } from '../middleware/errorHandler';

const router: Router = express.Router();

// GET /api/feedback/project/:projectId - Get all feedback for a project
router.get('/project/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { imageId, category, severity, role, status } = req.query;

    // Build a filter object
    const filter: any = { projectId };
    
    if (imageId) filter.imageId = imageId;
    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (role) filter.roles = { $in: [role] };

    const feedback = await Feedback.find(filter)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: feedback.length,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/feedback/:id - Get single feedback item
router.get('/:id', async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return next(new AppError('Feedback not found', 404));
    }

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/feedback - Create new feedback
router.post('/', async (req, res, next) => {
  try {
    const {
      projectId,
      imageId,
      title,
      description,
      category,
      severity,
      roles,
      coordinates
    } = req.body;

    // Validate required fields
    if (!projectId || !imageId || !title || !description || !category || !severity || !coordinates) {
      return next(new AppError('Missing required fields', 400));
    }

    const feedback = await Feedback.create({
      projectId,
      imageId,
      title,
      description,
      category,
      severity,
      roles: roles || [],
      coordinates,
      aiGenerated: false,
      status: 'open'
    });

    res.status(201).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/feedback/:id - Update feedback
router.put('/:id', async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      severity,
      roles,
      coordinates,
      status
    } = req.body;

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category }),
        ...(severity && { severity }),
        ...(roles && { roles }),
        ...(coordinates && { coordinates }),
        ...(status && { status })
      },
      { new: true, runValidators: true }
    );

    if (!feedback) {
      return next(new AppError('Feedback not found', 404));
    }

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/feedback/:id - Delete feedback
router.delete('/:id', async (req, res, next) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);

    if (!feedback) {
      return next(new AppError('Feedback not found', 404));
    }

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/feedback/roles/:role - Get feedback filtered by role
router.get('/roles/:role', async (req, res, next) => {
  try {
    const { role } = req.params;
    const { projectId, imageId } = req.query;

    const filter: any = { roles: { $in: [role] } };
    
    if (projectId) filter.projectId = projectId;
    if (imageId) filter.imageId = imageId;

    const feedback = await Feedback.find(filter)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: feedback.length,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
});

export default router;
