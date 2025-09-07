import { ExportData } from '../exportService';
import { buildBaseUrl } from './baseUrl';

export const generateHTML = async (data: ExportData): Promise<string> => {
  const baseUrl = buildBaseUrl();

  let overlay: any = null;
  if (data.image && data.image.width && data.image.height) {
    const displayWidth = 720;
    const scale = displayWidth / data.image.width;
    const displayHeight = Math.round(data.image.height * scale);

    overlay = {
      imageUrl: `${baseUrl}/api/upload/image/${data.image.id}/file`,
      width: displayWidth,
      height: displayHeight,
      rects: data.feedback.map((f) => ({
        x: Math.round(f.coordinates.x * scale),
        y: Math.round(f.coordinates.y * scale),
        width: Math.round(f.coordinates.width * scale),
        height: Math.round(f.coordinates.height * scale),
        severity: f.severity
      }))
    };
  }

  const template = `
<!DOCTYPE html>
<html>
<head>
    <meta charset=\"UTF-8\">
    <title>DesignSight Report - {{project.name}}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1f2937;
            margin: 0;
            font-size: 28px;
        }
        .header p {
            color: #6b7280;
            margin: 5px 0 0 0;
        }
        .summary {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        .summary h2 {
            margin-top: 0;
            color: #1f2937;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .summary-item {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        .summary-item h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .summary-item .count {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
        }
        .feedback-section {
            margin-top: 30px;
        }
        .feedback-section h2 {
            color: #1f2937;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 10px;
        }
        .feedback-item {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        .feedback-header {
            display: flex;
            justify-content: between;
            align-items: flex-start;
            margin-bottom: 15px;
        }
        .feedback-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin: 0;
            flex: 1;
        }
        .feedback-badges {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        .badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .badge-severity-high { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .badge-severity-medium { background: #fffbeb; color: #d97706; border: 1px solid #fed7aa; }
        .badge-severity-low { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .badge-category-accessibility { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
        .badge-category-visual_hierarchy { background: #faf5ff; color: #9333ea; border: 1px solid #d8b4fe; }
        .badge-category-content_copy { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .badge-category-ui_ux_patterns { background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; }
        .feedback-description {
            color: #4b5563;
            margin-bottom: 15px;
            line-height: 1.6;
        }
        .feedback-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            font-size: 14px;
            color: #6b7280;
        }
        .meta-item { display: flex; flex-direction: column; }
        .meta-label { font-weight: 500; margin-bottom: 2px; }
        .coordinates { font-family: monospace; background: #f3f4f6; padding: 2px 6px; border-radius: 3px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
        @media print { body { margin: 0; padding: 15px; } .feedback-item { page-break-inside: avoid; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>DesignSight Analysis Report</h1>
        <p>{{project.name}} - {{exportDate}}</p>
        {{#if role}}<p>Role: {{role}}</p>{{/if}}
    </div>

    <div class="summary">
        <h2>Summary</h2>
        <div class="summary-grid">
            <div class="summary-item">
                <h3>Total Feedback</h3>
                <div class="count">{{summary.totalFeedback}}</div>
            </div>
            <div class="summary-item">
                <h3>High Priority</h3>
                <div class="count">{{summary.bySeverity.high}}</div>
            </div>
            <div class="summary-item">
                <h3>Medium Priority</h3>
                <div class="count">{{summary.bySeverity.medium}}</div>
            </div>
            <div class="summary-item">
                <h3>Low Priority</h3>
                <div class="count">{{summary.bySeverity.low}}</div>
            </div>
        </div>
    </div>

    {{#if image}}
    <div class=\"image-section\">
        <h2>Design Image</h2>
        <p><strong>{{image.originalName}}</strong> ({{image.width}} × {{image.height}}px)</p>
        {{#if overlay}}
        <div class=\"overlay-container\" style=\"position: relative; width: {{overlay.width}}px; height: {{overlay.height}}px; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; margin-top: 10px;\">
          <img src=\"{{overlay.imageUrl}}\" alt=\"Design\" style=\"width: {{overlay.width}}px; height: {{overlay.height}}px; display: block;\" />
          {{#each overlay.rects}}
            <div style=\"position:absolute; left: {{x}}px; top: {{y}}px; width: {{width}}px; height: {{height}}px; border: 2px dashed {{severityColor severity}}; background-color: {{severityBg severity}};\"></div>
          {{/each}}
        </div>
        {{/if}}
    </div>
    {{/if}}

    <div class="feedback-section">
        <h2>Feedback Items</h2>
        {{#each feedback}}
        <div class="feedback-item">
            <div class="feedback-header">
                <h3 class="feedback-title">{{title}}</h3>
                <div class="feedback-badges">
                    <span class="badge badge-severity-{{severity}}">{{severity}}</span>
                    <span class="badge badge-category-{{category}}">{{category}}</span>
                </div>
            </div>
            <div class="feedback-description">{{description}}</div>
            <div class="feedback-meta">
                <div class="meta-item">
                    <span class="meta-label">Roles</span>
                    <span>{{#each roles}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Coordinates</span>
                    <span class="coordinates">x:{{coordinates.x}} y:{{coordinates.y}} w:{{coordinates.width}} h:{{coordinates.height}}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Status</span>
                    <span>{{status}}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Created</span>
                    <span>{{createdAt}}</span>
                </div>
            </div>
        </div>
        {{/each}}
    </div>

    <div class="footer">
        <p>Generated by DesignSight on {{exportDate}}</p>
    </div>
</body>
</html>`

  try {
    const hbsModule: any = await import('handlebars');
    const handlebars = hbsModule.default ?? hbsModule;

    handlebars.registerHelper('severityColor', (severity: string) => {
      switch (severity) {
        case 'high': return '#dc2626';
        case 'medium': return '#d97706';
        case 'low': return '#16a34a';
        default: return '#3b82f6';
      }
    });
    handlebars.registerHelper('severityBg', (severity: string) => {
      switch (severity) {
        case 'high': return '#dc262633';
        case 'medium': return '#d9770633';
        case 'low': return '#16a34a33';
        default: return '#3b82f633';
      }
    });

    const compiledTemplate = handlebars.compile(template);

    const toPlain = (doc: any) => (doc && typeof doc.toObject === 'function') ? doc.toObject({ getters: true, virtuals: true }) : doc;
    const plainProject = toPlain((data as any).project);
    const plainFeedback = Array.isArray((data as any).feedback) ? (data as any).feedback.map((f: any) => toPlain(f)) : (data as any).feedback;

    return compiledTemplate({ ...data, project: plainProject, feedback: plainFeedback, overlay });
  } catch (error) {
    const msg = error instanceof Error && /Cannot find module|ERR_MODULE_NOT_FOUND/.test(error.message)
      ? 'HTML generation requires handlebars to be installed. Please install it to enable PDF export.'
      : (error instanceof Error ? error.message : 'Unknown error');
    throw new Error(`Template generation failed: ${msg}`);
  }
}
