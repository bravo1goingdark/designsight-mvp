import express, { Router } from 'express';
import Comment from '../models/Comment';
import { AppError } from '../middleware/errorHandler';

const router: Router = express.Router();

// GET /api/comments/feedback/:feedbackId - Get all comments for a feedback item
router.get('/feedback/:feedbackId', async (req, res, next) => {
  try {
    const { feedbackId } = req.params;
    const { role } = req.query;

    const filter: any = { feedbackId };
    if (role) filter.role = role;

    const comments = await Comment.find(filter)
      .sort({ createdAt: 1 })
      .populate('parentId');

    // Organize comments into a tree structure
    const commentMap = new Map<string, any>();
    const rootComments: any[] = [];

    comments.forEach(comment => {
      const commentObj = comment.toObject() as any;
      commentObj.replies = [];
      commentMap.set((comment._id as any).toString(), commentObj);

      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId.toString());
        if (parent) {
          parent.replies.push(commentObj);
        }
      } else {
        rootComments.push(commentObj);
      }
    });

    res.json({
      success: true,
      count: comments.length,
      data: rootComments
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/comments - Create new comment
router.post('/', async (req, res, next) => {
  try {
    const {
      feedbackId,
      parentId,
      author,
      content,
      role
    } = req.body;

    // Validate required fields
    if (!feedbackId || !author || !content || !role) {
      return next(new AppError('Missing required fields', 400));
    }

    const comment = await Comment.create({
      feedbackId,
      parentId,
      author,
      content,
      role
    });

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/comments/:id - Update comment
router.put('/:id', async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      return next(new AppError('Comment content is required', 400));
    }

    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { content },
      { new: true, runValidators: true }
    );

    if (!comment) {
      return next(new AppError('Comment not found', 404));
    }

    res.json({
      success: true,
      data: comment
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/comments/:id - Delete comment
router.delete('/:id', async (req, res, next) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);

    if (!comment) {
      return next(new AppError('Comment not found', 404));
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
