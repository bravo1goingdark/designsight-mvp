import express, { Router } from 'express';
import Project from '../models/Project';
import Feedback from '../models/Feedback';
import { AIService } from '../services/aiService';
import { AppError } from '../middleware/errorHandler';

const router: Router = express.Router();

// POST /api/ai/analyze/:projectId/:imageId - Analyze design with AI
router.post('/analyze/:projectId/:imageId', async (req, res, next) => {
  try {
    const { projectId, imageId } = req.params;

    // Find project and image
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const image = project.images.find(img => img.id === imageId);
    if (!image) {
      return next(new AppError('Image not found', 404));
    }

    // Validate image URL
    const isValidUrl = await AIService.validateImageUrl(image.url);
    if (!isValidUrl) {
      return next(new AppError('Invalid image URL', 400));
    }

    // Check if AI analysis already exists for this image
    const existingFeedback = await Feedback.find({ 
      projectId, 
      imageId, 
      aiGenerated: true 
    });

    if (existingFeedback.length > 0) {
      return res.json({
        success: true,
        message: 'AI analysis already exists for this image',
        data: {
          feedback: existingFeedback,
          summary: 'Previous analysis found'
        }
      });
    }

    // Perform AI analysis
    const analysisResult = await AIService.analyzeDesign(image.url);

    // Save feedback to a database
    const feedbackPromises = analysisResult.feedback.map(feedbackData => 
      Feedback.create({
        projectId,
        imageId,
        ...feedbackData
      })
    );

    const savedFeedback = await Promise.all(feedbackPromises);

    res.json({
      success: true,
      data: {
        feedback: savedFeedback,
        summary: analysisResult.summary
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/ai/analysis/:projectId/:imageId - Get AI analysis results
router.get('/analysis/:projectId/:imageId', async (req, res, next) => {
  try {
    const { projectId, imageId } = req.params;

    const feedback = await Feedback.find({ 
      projectId, 
      imageId, 
      aiGenerated: true 
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
});

export default router;
