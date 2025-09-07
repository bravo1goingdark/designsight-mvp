# Design Notes

## Architecture
- MERN stack with MinIO for object storage.
- API (Express 5) with routes for projects, upload, feedback, AI, export.
- Client (React + Vite) with role context and coordinate overlay canvas.

## AI integration
- Google Cloud Vision used for text, objects, colors, SafeSearch.
- Heuristics generate structured feedback (category, severity, roles, coordinates).
- Failures in any sub‑analysis return partial results; route still succeeds.

## Coordinates
- Coordinates stored in original image pixels.
- UI overlay scales rectangles by displayedWidth / naturalWidth.
- PDF overlay scales to a fixed width (e.g., 720px) for consistency.

## Exports
- JSON is role‑filterable via `role` param.
- PDF embeds image and draws overlays; optional `role` filters items.

## Trade‑offs & Limitations
- No auth or multi‑user accounts (MVP speed).
- Comments are persisted but not real‑time.
- No retry/backoff for AI API; acceptable for demo scale.
- Healthchecks and tests are minimal; CI not integrated.
