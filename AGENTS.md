# EDUCADE development rules

- Work on the `development` branch or a feature branch based on it.
- Do not merge into, commit to, or push to `main` without explicit user approval.
- Do not deploy to production, change educade.io, or migrate its domain/routes
  without explicit user approval.
- Preview deployments are authorized only for the separate `educade-preview`
  Worker on its workers.dev address. Keep custom domain routes empty.
- The default Wrangler configuration on this branch targets that preview Worker.
  Do not change it to `educade` or `nameless-unit-6af8` while preparing a preview.
- Preserve the approved logo, cleaned hero artwork, gradient headline and
  class/student dashboard previews unless the user requests design changes.
- Website development is the current priority; backend work is out of scope.
- Use the existing checkout; do not create a worktree unless the user asks.
- Run `npm run build` after deployment configuration changes. For layout or
  interaction changes, run `tests/browser_smoke.py` and inspect desktop/mobile
  screenshots. Install dependencies before starting the preview server.
- For teacher-dashboard changes, also run `npm test` and
  `/workspace/educade-tools/bin/python tests/teacher_browser.py`.
- Keep EDUCADE skill IDs separate from standards mappings. CCSS reference text
  is checked against a published mirror; prototype alignments are partial and
  must not be described as validated mastery or primary-source verification.
