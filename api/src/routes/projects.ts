import express, { Router } from 'express';
import Project from '../models/Project';
import { AppError } from '../middleware/errorHandler';

const router: Router = express.Router();

// GET /api/projects - Get all projects
router.get('/', async (req, res, next) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id - Get single project
router.get('/:id', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return next(new AppError('Project not found', 404));
    }
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects - Create a new project
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return next(new AppError('Project name is required', 400));
    }
    
    const project = await Project.create({
      name,
      description,
      images: []
    });
    
    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true, runValidators: true }
    );
    
    if (!project) {
      return next(new AppError('Project not found', 404));
    }
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    
    if (!project) {
      return next(new AppError('Project not found', 404));
    }
    
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
