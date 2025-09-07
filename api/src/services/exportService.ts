import { IFeedback } from '../models/Feedback';
import { IProject, IProjectImage } from '../models/Project';
import { generatePDF } from './export/pdf';
import { generateHTML } from './export/template';
import { generateJSON } from './export/json';
import { generateSummary } from './export/summary';

export interface ExportOptions {
  projectId: string;
  imageId?: string;
  role?: string;
  format: 'pdf' | 'json';
  includeComments?: boolean;
}

export interface ExportData {
  project: IProject;
  image?: IProjectImage;
  feedback: IFeedback[];
  exportDate: string;
  role?: string;
  summary: {
    totalFeedback: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
  };
}

export class ExportService {
  static async generatePDF(data: ExportData): Promise<Buffer> { return generatePDF(data) }
  static generateJSON(data: ExportData): string { return generateJSON(data) }
  static async generateHTML(data: ExportData): Promise<string> { return generateHTML(data) }
  static generateSummary(feedback: IFeedback[]): ExportData['summary'] { return generateSummary(feedback) }
}
