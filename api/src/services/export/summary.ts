import { IFeedback } from '../../models/Feedback';

export const generateSummary = (feedback: IFeedback[]) => {
  const summary = {
    totalFeedback: feedback.length,
    byCategory: {} as Record<string, number>,
    bySeverity: {} as Record<string, number>,
    byStatus: {} as Record<string, number>
  };

  feedback.forEach(item => {
    summary.byCategory[item.category] = (summary.byCategory[item.category] || 0) + 1;
    summary.bySeverity[item.severity] = (summary.bySeverity[item.severity] || 0) + 1;
    summary.byStatus[item.status] = (summary.byStatus[item.status] || 0) + 1;
  });

  return summary;
}
