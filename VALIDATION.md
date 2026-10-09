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
- An additional direct-file opening check was blocked by this cloud browser's
  managed URL policy (`file:` is not allowed). The HTTP-based browser checks
  above passed; direct-file behavior was not verified in this environment.
- The hosted preview's `/teacher.html` still returned HTTP 404 after the
  development push. Publishing this branch through the Cloudflare preview
  project's build configuration remains outside the available credentials.

## Approved production release preparation

The user requested this version go live on 9 October 2026. Production release
helpers target the existing `nameless-unit-6af8` Worker identified in the user's
Cloudflare screenshot, with no domain migration or additional application.

- Separate production config; default development/preview config is unchanged.
- Version upload followed by deployment of the exact Git-revision tag to 100%.
  Domain triggers are not deployed. An upload error stops the release.
- Seven tests passed: four demo-data checks and three release-sequence checks.
- Production and preview packaging dry runs passed. Both browser suites passed
  at 1440, 1024, 768, 640, 390 and 320 pixels.
- No actual Cloudflare upload/deployment has been executed from this workspace:
  Wrangler confirms no authentication, and no Cloudflare token/account ID is
  present. The live site still serves the previous header at this point.
- The release can be deployed by connecting the existing live Worker's GitHub
  Builds to `main`, using the production commands documented in README.md.
- Actual live-site validation remains pending the Cloudflare deployment.

## Supplied portrait integration

Both original PNG sheets from the user's Archive.zip are now included in
`public/assets/portraits/`. SHA-256 comparisons against the extracted originals
confirm that both files are byte-for-byte unchanged.

- Photos, Viking avatars and Initials are enabled for all six fictional learners.
- SVG viewports frame each portrait; original sheets are not edited or regenerated.
- Photos is the default for a new browser profile. Existing saved choices remain.
- Tests use the actual portrait files, verify image decoding/dimensions, and
  exercise all six learners in both styles at 1440, 768, 390 and 320 pixels.
- Portrait changes preserve the learner/domain, selected evidence, expanded
  groups and chart choice. Reload retains the selected portrait style.
- All seven tests and both deployment packaging dry runs passed. Dashboard and
  landing browser suites passed at all six widths. Desktop and mobile screenshots
  with both real portrait sets were visually inspected.
- Screenshots: `/workspace/educade-validation/portraits`.
- This completes the previously requested artwork for the approved release.
  educade.io/teacher.html still returned 404 before this update was pushed;
  actual publication and live validation depend on the Cloudflare build.

## Illustrated landing-page rewards

- Replaced the three abstract reward symbols with gold coins, a Viking avatar
  and a hint scroll. Coin and scroll PNGs are newly generated illustrations;
  the avatar is framed from the unchanged, approved Viking portrait sheet.
- Retained the three requested headings, original logo, hero and dashboard
  previews. The rewards are visibly labelled as planned features.
- Landing browser checks passed at 1440, 1024, 768, 640, 390 and 320 pixels,
  including image decoding, navigation, demo entry and existing interactions.
  Desktop, tablet and mobile rewards screenshots were visually inspected.
- Screenshots: `/workspace/educade-validation/rewards`.
- This design update stays on development for review; no production merge,
  deployment or domain configuration change is included.

## Potential-world carousel

- Replaced the text-only world list with five manually explored slides: Viking
  Quest, Scribe of the Nile, The Oracle’s Quest, Roads of Rome and Jade Scrolls.
  Viking Quest is marked First world planned; the other four are Future concept.
- Previous/next wrap around; dots select a world directly. Left/Right, Home and
  End work while the carousel has focus. Slide changes are announced without
  moving focus, and no automatic rotation is used.
- Chromium touch-input checks cover swipes in both directions and normal
  vertical page scrolling. Reduced-motion styling is checked separately.
- Layout and interaction checks passed at 1440, 1024, 768, 640, 390 and 320 pixels.
  Desktop, tablet and phone screenshots were inspected. Preview asset packaging
  passed in dry-run mode.
- Existing Viking artwork is framed from the approved hero asset without editing
  it. Styled title panels represent the other concepts until the original PNGs
  are uploaded as files. All five newly shared artworks are pending integration.
- Screenshots: `/workspace/educade-validation/worlds`.
- Changes stay on development; no production branch or live domain is updated.

## Approved rewards and carousel production release

The user explicitly approved publishing the rewards and carousel update on
9 October 2026. This approval supersedes the development-only status recorded
for those changes above.

- Landing checks and desktop/mobile inspection passed for the carousel version
  at all six widths, including real touch gestures and reduced-motion handling.
- All seven automated tests passed; the teacher browser suite passed at all six
  widths, plus supplied portrait and saved-presentation checks.
- Production packaging passed in dry-run mode. The existing production helper
  and Worker configuration are unchanged; domain triggers are not modified.
- Before promotion, educade.io still served the earlier landing page without
  the teacher entry, illustrated rewards or carousel.
- Wrangler reports that this workspace is not authenticated to Cloudflare.
  Publication therefore depends on the live Worker's GitHub build connection
  or credentials supplied securely through environment settings.
- The carousel's newly shared artwork remains pending original PNG files;
  this approved release includes the working current title-card version.
