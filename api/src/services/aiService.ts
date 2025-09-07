import { ImageAnnotatorClient } from '@google-cloud/vision';

const visionClient = new ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS!,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID!,
});

export interface DesignAnalysisResult {
  feedback: FeedbackData[];
  summary: string;
}

interface FeedbackData {
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
}

export class AIService {
  static async analyzeDesign(imageUrl: string, imageWidth?: number, imageHeight?: number): Promise<DesignAnalysisResult> {
    try {
      // Download image from URL
      const imageBuffer = await this.downloadImage(imageUrl);
      
      // Perform multiple Google Vision API analyses
      const [textDetection, objectDetection, colorAnalysis, safeSearch] = await Promise.all([
        this.analyzeText(imageBuffer),
        this.analyzeObjects(imageBuffer),
        this.analyzeColors(imageBuffer),
        this.analyzeSafeSearch(imageBuffer)
      ]);

      // Generate feedback based on analysis results
      const feedback = this.generateFeedbackFromAnalysis({
        textDetection,
        objectDetection,
        colorAnalysis,
        safeSearch
      }, { width: imageWidth, height: imageHeight });

      return {
        feedback,
        summary: this.generateSummary(feedback)
      };
    } catch (error) {
      console.error('AI analysis error:', error);
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async downloadImage(imageUrl: string): Promise<Buffer> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      throw new Error(`Image download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async analyzeText(imageBuffer: Buffer) {
    try {
      const [result] = await visionClient.textDetection({
        image: { content: imageBuffer }
      });
      return result.textAnnotations || [];
    } catch (error) {
      console.error('Text detection error:', error);
      return [];
    }
  }

  private static async analyzeObjects(imageBuffer: Buffer) {
    try {
      const [result] = await visionClient.objectLocalization!({
        image: { content: imageBuffer }
      });
      return result.localizedObjectAnnotations || [];
    } catch (error) {
      console.error('Object detection error:', error);
      return [];
    }
  }

  private static async analyzeColors(imageBuffer: Buffer) {
    try {
      const [result] = await visionClient.imageProperties({
        image: { content: imageBuffer }
      });
      return result.imagePropertiesAnnotation?.dominantColors?.colors || [];
    } catch (error) {
      console.error('Color analysis error:', error);
      return [];
    }
  }

  private static async analyzeSafeSearch(imageBuffer: Buffer) {
    try {
      const [result] = await visionClient.safeSearchDetection({
        image: { content: imageBuffer }
      });
      return result.safeSearchAnnotation;
    } catch (error) {
      console.error('Safe search error:', error);
      return null;
    }
  }

  private static generateFeedbackFromAnalysis(analysis: any, dims?: { width?: number; height?: number }): FeedbackData[] {
    const feedback: FeedbackData[] = [];

    // Analyze text readability and accessibility
    if (analysis.textDetection.length > 0) {
      const textIssues = this.analyzeTextAccessibility(analysis.textDetection);
      feedback.push(...textIssues);
    }

    // Analyze visual hierarchy
    if (analysis.objectDetection.length > 0) {
      const hierarchyIssues = this.analyzeVisualHierarchy(analysis.objectDetection, dims);
      feedback.push(...hierarchyIssues);
    }

    // Analyze color contrast and accessibility
    if (analysis.colorAnalysis.length > 0) {
      const colorIssues = this.analyzeColorAccessibility(analysis.colorAnalysis);
      feedback.push(...colorIssues);
    }

    // Add general UI/UX feedback
    const generalIssues = this.generateGeneralUXFeedback(analysis);
    feedback.push(...generalIssues);

    return feedback;
  }

  private static analyzeTextAccessibility(textAnnotations: any[]): FeedbackData[] {
    const feedback: FeedbackData[] = [];
    
    // Check for small text that might be hard to read
    const smallTexts = textAnnotations.filter(annotation => {
      const vertices = annotation.boundingPoly?.vertices;
      if (!vertices || vertices.length < 2) return false;
      
      const width = Math.abs(vertices[1].x - vertices[0].x);
      const height = Math.abs(vertices[3].y - vertices[0].y);
      return width < 50 || height < 12; // Small text threshold
    });

    if (smallTexts.length > 0) {
      const firstSmallText = smallTexts[0];
      const vertices = firstSmallText.boundingPoly?.vertices || [];
      
      feedback.push({
        title: "Small Text Detected",
        description: "Some text elements appear to be very small and may be difficult to read on mobile devices or for users with visual impairments. Consider increasing font sizes to at least 16px for body text.",
        category: "accessibility",
        severity: "medium",
        roles: ["designer", "developer"],
        coordinates: {
          x: vertices[0]?.x || 0,
          y: vertices[0]?.y || 0,
          width: Math.abs((vertices[1]?.x || 0) - (vertices[0]?.x || 0)),
          height: Math.abs((vertices[3]?.y || 0) - (vertices[0]?.y || 0))
        },
        aiGenerated: true,
        status: "open"
      });
    }

    return feedback;
  }

  private static analyzeVisualHierarchy(objectAnnotations: any[], dims?: { width?: number; height?: number }): FeedbackData[] {
    const feedback: FeedbackData[] = [];
    
    // Check for button-like objects
    const buttons = objectAnnotations.filter((obj: any) => 
      obj.name?.toLowerCase().includes('button') || 
      obj.name?.toLowerCase().includes('click')
    );

    if (buttons.length > 1) {
      // Check if buttons are properly spaced
      const spacingIssues = this.checkButtonSpacing(buttons, dims);
      feedback.push(...spacingIssues);
    }

    return feedback;
  }

  private static checkButtonSpacing(buttons: any[], dims?: { width?: number; height?: number }): FeedbackData[] {
    const feedback: FeedbackData[] = [];

    const widthPx = dims?.width && dims.width > 0 ? dims.width : 1000;
    const heightPx = dims?.height && dims.height > 0 ? dims.height : 1000;
    
    for (let i = 0; i < buttons.length - 1; i++) {
      const button1 = buttons[i];
      const button2 = buttons[i + 1];
      
      const vertices1 = button1.boundingPoly?.normalizedVertices || [];
      const vertices2 = button2.boundingPoly?.normalizedVertices || [];
      
      if (vertices1.length >= 2 && vertices2.length >= 2) {
        const distance = Math.abs(vertices2[0].y - vertices1[2].y);
        
        if (distance < 0.02) { // Too close together (normalized)
          // Convert the combined area covering both buttons into pixel coordinates
          const minX = Math.min(vertices1[0].x ?? 0, vertices2[0].x ?? 0);
          const minY = Math.min(vertices1[0].y ?? 0, vertices2[0].y ?? 0);
          const maxX = Math.max(vertices1[1].x ?? 0, vertices2[1].x ?? 0);
          const maxY = Math.max(vertices1[2].y ?? 0, vertices2[2].y ?? 0);

          feedback.push({
            title: "Button Spacing Issue",
            description: "Buttons appear to be too close together, which may cause accidental clicks on mobile devices. Consider increasing spacing between interactive elements.",
            category: "ui_ux_patterns",
            severity: "medium",
            roles: ["designer", "developer"],
            coordinates: {
              x: Math.round(minX * widthPx),
              y: Math.round(minY * heightPx),
              width: Math.max(1, Math.round((maxX - minX) * widthPx)),
              height: Math.max(1, Math.round((maxY - minY) * heightPx))
            },
            aiGenerated: true,
            status: "open"
          });
        }
      }
    }
    
    return feedback;
  }

  private static analyzeColorAccessibility(colors: any[]): FeedbackData[] {
    const feedback: FeedbackData[] = [];
    
    // Check for potential contrast issues
    const darkColors = colors.filter(color => {
      const rgb = color.color;
      const brightness = (rgb.red + rgb.green + rgb.blue) / 3;
      return brightness < 0.3;
    });

    const lightColors = colors.filter(color => {
      const rgb = color.color;
      const brightness = (rgb.red + rgb.green + rgb.blue) / 3;
      return brightness > 0.7;
    });

    if (darkColors.length > 0 && lightColors.length > 0) {
      feedback.push({
        title: "Color Contrast Review Needed",
        description: "The design contains both very dark and very light colors. Please verify that text has sufficient contrast ratios (4.5:1 for normal text, 3:1 for large text) to meet WCAG accessibility guidelines.",
        category: "accessibility",
        severity: "high",
        roles: ["designer", "developer"],
        coordinates: { x: 0, y: 0, width: 100, height: 100 },
        aiGenerated: true,
        status: "open"
      });
    }

    return feedback;
  }

  private static generateGeneralUXFeedback(analysis: any): FeedbackData[] {
    const feedback: FeedbackData[] = [];
    
    // General feedback based on detected elements
    const hasText = analysis.textDetection.length > 0;
    const hasObjects = analysis.objectDetection.length > 0;
    
    if (hasText && hasObjects) {
      feedback.push({
        title: "Design Structure Analysis",
        description: "The design contains both text and interactive elements. Consider reviewing the visual hierarchy to ensure important information stands out and the user flow is intuitive.",
        category: "visual_hierarchy",
        severity: "low",
        roles: ["designer", "reviewer"],
        coordinates: { x: 0, y: 0, width: 100, height: 100 },
        aiGenerated: true,
        status: "open"
      });
    }

    return feedback;
  }

  private static generateSummary(feedback: FeedbackData[]): string {
    const highIssues = feedback.filter(f => f.severity === 'high').length;
    const mediumIssues = feedback.filter(f => f.severity === 'medium').length;
    const lowIssues = feedback.filter(f => f.severity === 'low').length;
    
    return `Design analysis completed. Found ${highIssues} high priority, ${mediumIssues} medium priority, and ${lowIssues} low priority issues. Focus on accessibility and visual hierarchy improvements.`;
  }

  static async validateImageUrl(imageUrl: string): Promise<boolean> {
    try {
      // Basic URL validation
      new URL(imageUrl);
      return true;
    } catch {
      return false;
    }
  }
}
