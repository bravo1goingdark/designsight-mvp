import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  feedbackId: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId; // For nested replies
  author: string;
  content: string;
  role: 'designer' | 'reviewer' | 'product_manager' | 'developer';
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>({
  feedbackId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Feedback', 
    required: true 
  },
  parentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Comment' 
  },
  author: { 
    type: String, 
    required: [true, 'Author is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  content: { 
    type: String, 
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  role: { 
    type: String, 
    required: true,
    enum: ['designer', 'reviewer', 'product_manager', 'developer']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
CommentSchema.index({ feedbackId: 1 });
CommentSchema.index({ parentId: 1 });
CommentSchema.index({ role: 1 });

export default mongoose.model<IComment>('Comment', CommentSchema);
