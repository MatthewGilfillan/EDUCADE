# Fresh website validation — 9 October 2026

## Scope

A fresh static website repository for ongoing EDUCADE front-end development.
Backend work and moving the live domain are outside the current scope.

## Verification

- Frozen npm install (`npm ci`) completed using the committed dependency lockfile.
- `npm run build` validated the Cloudflare static asset deployment configuration
  in dry-run mode. No production deployment was executed by that check.
- `npm run dev` starts Cloudflare's local Workers runtime and serves `public/`.
- Browser checks exercise widths of 1440, 1024, 768, 640, 390 and 320 pixels.
- Checks cover image loading, horizontal overflow, mobile navigation,
  class/student preview switching, keyboard controls, and the sample challenge.
- Signup interface tests use mocked responses and do not validate contact storage.
- All 12 approved image assets remain byte-for-byte unchanged from the supplied ZIP.

The missing rope sprite is replaced by CSS views of the existing approved
NPC dialogue illustration. The mobile headline has a spacing correction, and
the original logo has a light backing in the dashboard previews for legibility.

Run `tests/browser_smoke.py` to reproduce the browser checks. The final screenshots
for the current development environment are in `/workspace/educade-validation/fresh`.

## Interactive teacher dashboard

The standalone page public/teacher.html adds real UI components; neither dashboard
reference image is used to render it. It uses the unchanged assets/logo.png.

- 51 expandable curriculum groups and 127 EDUCADE skill IDs.
- Representative evidence for 17 skills per learner; 2,040 fictional responses
  shared by class/profile scores, support counts, hints, evidence and trends.
- Reading Foundations and Reading Comprehension are separate views.
- Unassessed skills show No evidence yet and are excluded from score/chart math.
- Radar charts plot only assessed groups (at most four here); fewer than three
  assessed groups use bars rather than fabricating additional axes.
- Four data-consistency tests passed; browser checks passed at 1440, 1024, 768,
  640, 390 and 320 pixels, including search, sorting, six learners, all domains,
  HP/radar switches, evidence dialogs, empty evidence, tab keys and Escape.
- Landing-page browser checks passed at the same six widths. The approved
  landing content, JavaScript, signup and artwork are unchanged; its header now
  includes the explicitly requested teacher demo entry.
- CCSS identifiers and Grade 5 wording were checked against a published reference
  mirror. Prototype task alignments remain candidates; no mastery claim is made.
  Access to the California Department of Education primary publication is blocked.
- No accounts, payments, live AI assessment or contact/student storage were added.
- Changes are restricted to development; main and educade.io are not updated.

## Presentation controls and teacher demo entry

- Class heatmap and RPG HP bars display identical percentages from the same
  records. Every cell opens skill evidence; learner names open their profiles.
- Class and student chart preferences are independent, with browser-local
  persistence. Radar fallback in Foundations preserves the saved preference.
- Switching views preserves selected evidence, expanded groups, learner/domain,
  search and sorting. Blocked/malformed storage is handled without breaking UI.
- The header/mobile Teacher sign in link opens the demo. Its destination visibly
  states “Demo dashboard · Fictional data”; no credentials are collected.
- Browser checks passed at all six widths listed above; desktop and mobile
  screenshots were inspected. All four existing data-consistency tests passed.
- Photos/Viking renderer and independent controls passed browser tests with
  explicit SVG fixtures at 1440/390 pixels. The supplied sheets are visible in
  chat but unavailable as downloadable files; actual artwork integration and
  visual verification remain pending. Both choices stay disabled in the shipped
  preview until the original files arrive. Initials work now.
- Current screenshots: `/workspace/educade-validation/presentation` and
  `/workspace/educade-validation/teacher-entry`.
