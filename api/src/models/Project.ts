import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description?: string;
  images: IProjectImage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectImage {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  width: number;
  height: number;
  uploadedAt: Date;
}

const ProjectImageSchema = new Schema<IProjectImage>({
  id: { type: String, required: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  url: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const ProjectSchema = new Schema<IProject>({
  name: { 
    type: String, 
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  images: [ProjectImageSchema]
}, {
  timestamps: true
});

export default mongoose.model<IProject>('Project', ProjectSchema);
