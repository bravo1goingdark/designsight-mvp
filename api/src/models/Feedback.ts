import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
  projectId: mongoose.Types.ObjectId;
  imageId: string;
  title: string;
  description: string;
  category: 'accessibility' | 'visual_hierarchy' | 'content_copy' | 'ui_ux_patterns';
  severity: 'high' | 'medium' | 'low';
  roles: ('designer' | 'reviewer' | 'product_manager' | 'developer')[];
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  aiGenerated: boolean;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>({
  projectId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true 
  },
  imageId: { 
    type: String, 
    required: true 
  },
  title: { 
    type: String, 
    required: [true, 'Feedback title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: { 
    type: String, 
    required: [true, 'Feedback description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: { 
    type: String, 
    required: true,
    enum: ['accessibility', 'visual_hierarchy', 'content_copy', 'ui_ux_patterns']
  },
  severity: { 
    type: String, 
    required: true,
    enum: ['high', 'medium', 'low']
  },
  roles: [{
    type: String,
    enum: ['designer', 'reviewer', 'product_manager', 'developer']
  }],
  coordinates: {
    x: { type: Number, required: true, min: 0 },
    y: { type: Number, required: true, min: 0 },
    width: { type: Number, required: true, min: 1 },
    height: { type: Number, required: true, min: 1 }
  },
  aiGenerated: { 
    type: Boolean, 
    default: false 
  },
  status: { 
    type: String, 
    default: 'open',
    enum: ['open', 'resolved', 'dismissed']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
FeedbackSchema.index({ projectId: 1, imageId: 1 });
FeedbackSchema.index({ category: 1 });
FeedbackSchema.index({ severity: 1 });
FeedbackSchema.index({ roles: 1 });
FeedbackSchema.index({ status: 1 });

export default mongoose.model<IFeedback>('Feedback', FeedbackSchema);
