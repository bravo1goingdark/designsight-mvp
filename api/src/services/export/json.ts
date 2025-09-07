import { ExportData } from '../exportService';

export const generateJSON = (data: ExportData): string => {
  try {
    const exportData = {
      metadata: {
        exportDate: data.exportDate,
        projectName: data.project.name,
        imageName: data.image?.originalName,
        role: data.role,
        totalFeedback: data.summary.totalFeedback
      },
      project: {
        id: data.project._id,
        name: data.project.name,
        description: data.project.description,
        createdAt: data.project.createdAt
      },
      image: data.image ? {
        id: data.image.id,
        originalName: data.image.originalName,
        url: data.image.url,
        width: data.image.width,
        height: data.image.height,
        uploadedAt: data.image.uploadedAt
      } : null,
      feedback: data.feedback.map(item => ({
        id: item._id,
        title: item.title,
        description: item.description,
        category: item.category,
        severity: item.severity,
        roles: item.roles,
        coordinates: item.coordinates,
        aiGenerated: item.aiGenerated,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })),
      summary: data.summary
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('JSON generation error:', error);
    throw new Error(`JSON generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
