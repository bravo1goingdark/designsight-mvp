import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'

// Mock global fetch for image download
beforeAll(() => {
  // @ts-ignore
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(8),
  })
})

afterAll(() => {
  // @ts-ignore
  delete global.fetch
})

// Mock @google-cloud/vision before importing AIService
vi.mock('@google-cloud/vision', () => {
  const mockClient = {
    textDetection: vi.fn().mockResolvedValue([
      {
        textAnnotations: [
          {
            description: 'Call to action',
            boundingPoly: {
              vertices: [
                { x: 100, y: 200 },
                { x: 300, y: 200 },
                { x: 300, y: 240 },
                { x: 100, y: 240 },
              ],
            },
          },
        ],
      },
    ]),
    objectLocalization: vi.fn().mockResolvedValue([
      {
        localizedObjectAnnotations: [
          {
            name: 'Button',
            boundingPoly: {
              normalizedVertices: [
                { x: 0.10, y: 0.50 },
                { x: 0.30, y: 0.50 },
                { x: 0.30, y: 0.55 },
                { x: 0.10, y: 0.55 },
              ],
            },
          },
          {
            name: 'Button',
            boundingPoly: {
              normalizedVertices: [
                { x: 0.35, y: 0.56 },
                { x: 0.55, y: 0.56 },
                { x: 0.55, y: 0.60 },
                { x: 0.35, y: 0.60 },
              ],
            },
          },
        ],
      },
    ]),
    imageProperties: vi.fn().mockResolvedValue([
      {
        imagePropertiesAnnotation: {
          dominantColors: {
            colors: [
              { color: { red: 0, green: 0, blue: 0 } },
              { color: { red: 255, green: 255, blue: 255 } },
            ],
          },
        },
      },
    ]),
    safeSearchDetection: vi.fn().mockResolvedValue([{ safeSearchAnnotation: {} }]),
  }

  return {
    ImageAnnotatorClient: vi.fn().mockImplementation(() => mockClient),
  }
})

import { AIService } from '../src/services/aiService'

describe('AIService integration (coordinate mapping)', () => {
  it('converts normalized object boxes to pixel coordinates when image dimensions provided', async () => {
    const width = 1920
    const height = 1080

    const result = await AIService.analyzeDesign('http://unit.test/img.jpg', width, height)

    // Find the spacing issue generated from two buttons
    const spacing = result.feedback.find(f => f.title === 'Button Spacing Issue')
    expect(spacing).toBeTruthy()
    expect(spacing!.coordinates.width).toBeGreaterThan(0)
    expect(spacing!.coordinates.height).toBeGreaterThan(0)

    // Expect roughly scaled coordinates around the first button region
    expect(spacing!.coordinates.x).toBeGreaterThanOrEqual(Math.floor(0.10 * width) - 5)
    expect(spacing!.coordinates.y).toBeGreaterThanOrEqual(Math.floor(0.50 * height) - 5)

    // Summary string present
    expect(result.summary).toMatch(/Design analysis completed/)
  })
})

