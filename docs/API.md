# API Reference (MVP)

Base URL: `http://localhost:4000`

## Projects
- `GET /api/projects` — list
- `GET /api/projects/:id` — get
- `POST /api/projects { name, description? }` — create
- `PUT /api/projects/:id` — update
- `DELETE /api/projects/:id` — delete

## Uploads
- `POST /api/upload/:projectId` — multipart form with `image` (PNG/JPG), returns project with new image meta
- `GET /api/upload/image/:imageId` — returns `{ imageUrl }` (presigned URL)
- `GET /api/upload/image/:imageId/file` — streams image via API (browser‑friendly)

## Feedback
- `GET /api/feedback/project/:projectId?imageId=&category=&severity=&role=&status=`
- `GET /api/feedback/:id`
- `POST /api/feedback { projectId, imageId, title, description, category, severity, roles[], coordinates }`
- `PUT /api/feedback/:id`
- `DELETE /api/feedback/:id`

## AI Analysis
- `POST /api/ai/analyze/:projectId/:imageId` — run Google Vision and persist feedback
- `GET /api/ai/analysis/:projectId/:imageId` — fetch AI‑generated feedback

## Export
- `POST /api/export/json { projectId, imageId?, role? }` — JSON export
- `POST /api/export/pdf { projectId, imageId?, role? }` — PDF report with overlays; role is optional
- `GET /api/export/preview/:projectId/:imageId?` — summary preview (role query optional)

## Maintenance
- `GET /api/maintenance/images/verify` — list missing objects (by project)
- `GET /api/maintenance/images/verify?fix=remove` — remove missing images from projects

Notes:
- All endpoints return `{ success, data }` or `{ success: false, error }`.
- Errors use appropriate HTTP status codes via AppError.
