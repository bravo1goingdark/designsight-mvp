import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './errorHandler';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(errorMessage, 400));
    }
    next();
  };
};

// Validation schemas
export const projectSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().max(500).optional()
});

export const commentSchema = Joi.object({
  feedbackId: Joi.string().required(),
  parentId: Joi.string().optional(),
  author: Joi.string().required().min(1).max(100),
  content: Joi.string().required().min(1).max(1000),
  role: Joi.string().valid('designer', 'reviewer', 'product_manager', 'developer').required()
});

export const feedbackSchema = Joi.object({
  projectId: Joi.string().required(),
  imageId: Joi.string().required(),
  title: Joi.string().required().min(1).max(200),
  description: Joi.string().required().min(1).max(1000),
  category: Joi.string().valid('accessibility', 'visual_hierarchy', 'content_copy', 'ui_ux_patterns').required(),
  severity: Joi.string().valid('high', 'medium', 'low').required(),
  roles: Joi.array().items(Joi.string().valid('designer', 'reviewer', 'product_manager', 'developer')).required(),
  coordinates: Joi.object({
    x: Joi.number().required(),
    y: Joi.number().required(),
    width: Joi.number().required(),
    height: Joi.number().required()
  }).required()
});
