import { describe, it, expect } from 'vitest'
import { ExportService } from '../src/services/exportService'
import type { IFeedback } from '../src/models/Feedback'

// Minimal mock of IFeedback for summary aggregation
const mk = (overrides: Partial<IFeedback> = {}): IFeedback => ({
  _id: 'id' as any,
  projectId: 'pid' as any,
  imageId: 'img',
  title: 't',
  description: 'd',
  category: 'ui_ux_patterns',
  severity: 'medium',
  roles: ['designer'],
  coordinates: { x: 10, y: 10, width: 20, height: 20 },
  aiGenerated: false,
  status: 'open',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
} as any)

describe('ExportService.generateSummary', () => {
  it('aggregates totals by category, severity and status', () => {
    const input: IFeedback[] = [
      mk({ severity: 'high', category: 'accessibility', status: 'open' }),
      mk({ severity: 'medium', category: 'visual_hierarchy', status: 'open' }),
      mk({ severity: 'low', category: 'ui_ux_patterns', status: 'resolved' }),
    ]

    const summary = ExportService.generateSummary(input)

    expect(summary.totalFeedback).toBe(3)
    expect(summary.bySeverity.high).toBe(1)
    expect(summary.bySeverity.medium).toBe(1)
    expect(summary.bySeverity.low).toBe(1)

    expect(summary.byCategory.accessibility).toBe(1)
    expect(summary.byCategory.visual_hierarchy).toBe(1)
    expect(summary.byCategory.ui_ux_patterns).toBe(1)

    expect(summary.byStatus.open).toBe(2)
    expect(summary.byStatus.resolved).toBe(1)
  })
})

