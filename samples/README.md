# Sample Test Images and Scenarios

This folder provides guidance for test data used in demos and reviews. To avoid licensing issues, image files are not included. Use your own screenshots or public‑domain images that resemble the described scenarios.

Important
- Do not include sensitive or proprietary designs without permission.
- Keep each image under ~10MB (PNG/JPG/JPEG recommended).
- Typical resolution: 1920×1080 or similar.

Suggested sample files (filenames to use)
1) landing_page.png
   - Scenario: A simple landing page screenshot with a hero section, a large heading, body copy, and at least one primary CTA button.
   - What this exercises:
     - Accessibility: Potential color-contrast review and text readability.
     - Visual Hierarchy: Heading prominence vs. body text, CTA emphasis.
     - UI/UX Patterns: Button placement and spacing between interactive elements.
   - Expected examples (AI may vary):
     - “Color Contrast Review Needed” (accessibility; roles: designer, developer)
     - “Design Structure Analysis” (visual_hierarchy; roles: designer, reviewer)

2) form-with-small-text.jpg
   - Scenario: A form with labels, inputs, help text, and a submit button. Include at least one clearly small text element (e.g., fine print or helper text).
   - What this exercises:
     - Accessibility: Small text detection/readability issues.
     - Visual Hierarchy: Label/input alignment and spacing.
     - UI/UX Patterns: Primary action placement.
   - Expected examples (AI may vary):
     - “Small Text Detected” (accessibility; roles: designer, developer)
     - Additional spacing/alignment feedback where applicable.

How to use these in the app
1. Start locally: docker-compose up --build
2. Open http://localhost:5174
3. Create a project (e.g., “Sample Demo”).
4. Upload one of the above images (use these exact filenames for clarity).
5. Click “AI Analyze” to generate feedback.
6. Toggle overlay on the image to see coordinate-anchored boxes.
7. Switch roles (Designer/Developer/Reviewer/PM) to see filtered feedback.
8. Click a box or list item to open the discussion panel; add a sample comment.
9. Export PDF and JSON to verify handoff artifacts.

Notes
- Coordinates are stored in original image pixels; the UI overlay scales to fit your screen.
- AI output can vary by image content and quality; re-run analysis if needed.
- For cloud demos, use the same steps with your hosted URL.

