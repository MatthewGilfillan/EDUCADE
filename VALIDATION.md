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

## Confirmed live release — 9 October 2026

- The user connected the existing `nameless-unit-6af8` Worker to GitHub `main`,
  set the production build/deploy commands, and confirmed preview-branch builds
  are disabled on that Worker. The separate preview Worker remains available.
- An empty commit, `c57933c`, triggered the first build; its tree is identical
  to the approved `e3f2e6a` release. No website code changed in that trigger.
- educade.io now serves the updated teacher entry, illustrated rewards and
  five-world carousel. HTTPS downloads of index.html, world-carousel.js and
  teacher.html match the repository files byte-for-byte.
- Live Chromium checks passed at 1440 and 390 pixels: header/mobile entry,
  decoded reward/portrait images, carousel arrows/keyboard, six demo learners,
  heatmap, portrait switching and student-profile radar. No script errors,
  failed HTTP responses or page-width overflow were observed in those checks.
- Live desktop/mobile screenshots were inspected and are saved under
  `/workspace/educade-validation/live-release`.
- Chromium's live checks accommodated the cloud proxy certificate with
  `ignore_https_errors`; curl HTTPS checks separately verified the downloads.
- Future-world character artwork is still pending the original PNG files;
  the current live carousel includes four styled title panels.


## Dashboard evidence/header revision — 10 October 2026

- Renamed chart controls to Progress Bars and removed the marked demo banner.
- Added sideways skill evidence, downward student evidence, row numbers, fuller
  subject radar charts with central portraits, class selection and utility menu.
- Preserved all original Class 5A scores, supplied images, and standards mappings.
  Extra fictional practices are explicitly unmapped until reviewed.
- All 11 Node tests pass, including DOM interaction, keyboard activation, chart
  parity, missing evidence, independent class rosters and saved preferences.
- `npm run build` packages the separate `educade-preview` Worker in dry-run mode.
- JavaScript syntax, Python test syntax, and `git diff --check` pass.
- The requested Python executable `/workspace/educade-tools/bin/python` is absent
  in this session. Both browser suites also fail immediately under system Python
  because Playwright is absent; Chromium is not installed. No browser screenshots
  were produced for this revision. Desktop/mobile visual QA remains outstanding.
- Landing assets, production configuration and release helper are unchanged.

## Number column and class teaching suggestions — 11 October 2026

- Confirmed and corrected a table-style override that made the number column
  wider than its intended size. Chromium measures 32 pixels on desktop and
  28 pixels on mobile, before/after expansion and during horizontal scrolling;
  the sticky student column begins immediately beside it.
- The class recommendation uses existing response records: Class 5A's
  figurative-language result is 73/120 (61%), with four of six learners below
  70%. It includes a model, paired practice, independent check, two named
  practice groups and four individual check-ins with support/hint counts.
- Class 5B has its own recommendations. Filtering, sorting and presentation
  changes preserve the class-wide plan. Missing evidence is excluded; empty
  or all-correct records do not create a false teaching priority. Evidence
  buttons open the correct student/skill or expand the relevant class column.
- User-facing sample/fictional wording is removed across the class view,
  profiles and evidence. The search placeholder is Search students. The
  existing prototype/Demo data footer remains.
- All 14 Node tests pass. Both Chromium suites pass at 1440, 1024, 768, 640,
  390 and 320 pixels; portrait assignments, presentation persistence, storage
  fallbacks and keyboard/evidence interactions also pass. No page overflow,
  script errors or failed asset responses were reported. Desktop/mobile
  screenshots were inspected in `/workspace/educade-validation/teaching-plans`.
- Updated two stale browser expectations from the previous revision: the
  landing entry checks the current demo footer, and profile evidence checks
  select an assessed skill rather than assuming every first skill is assessed.
  Separate No evidence yet checks remain in place.
- Frozen dependency installation succeeds with an explicit writable npm cache.
  Preview packaging passes with `XDG_CONFIG_HOME=/workspace/educade-tools/config
  npm_config_cache=/workspace/educade-npm-cache npm run build`; this avoids
  unwritable default tool directories without changing integrity verification.
- Changes are on development only. Landing page files, hosting configuration,
  production branch and live domain are outside this revision.


## Overall profile and dashboard layout — 11 October 2026

- Added Overall before Reading. Opening a full profile starts there with a
  four-axis radar for Reading, Writing, Grammar and Vocabulary. Selecting a
  subject point, bar or subject card opens its detailed skills; existing
  explicit subject routes continue to work.
- Domain scores use the same response records as skill evidence, weighted by
  attempts. Reading includes Foundations and Comprehension. Overall support
  totals and the four-week trend use all four subjects without duplicate counts.
  Unassessed domains show No evidence yet and do not create a zero or polygon.
- Overall and subject chart preferences are saved separately. Existing saved
  subject bars do not replace the initial Overall radar. Portrait changes,
  learner switches and reloads preserve the selected presentation.
- Progress over four weeks appears above What to explore next in the right
  column on desktop, with the same sequence on mobile. Cards no longer stretch
  to fill the full height of their neighbour.
- Show skill evidence is 12px, blue and centred beneath the learner's name.
  Open full profile has a separate 12px margin above it and a larger touch area;
  its arrow stays with the last word when the mobile cell wraps.
- All 17 Node tests pass, covering score consistency, uneven response counts,
  missing domains, default routing, subject navigation and saved chart choices.
- The teacher Chromium suite passes at 1440, 1024, 768, 640, 390 and 320px.
  It measures widget order, class action colour/size/spacing, domain scores
  and support counts and checks point clicks, keyboard activation, charts,
  evidence, portraits, local preferences and unavailable storage.
- Landing Chromium checks pass at the same six widths, including navigation,
  artwork, carousel and signup frontend handling with a mocked API. No script
  errors, failed assets or page overflow were reported. Desktop/mobile profile
  and learner-cell screenshots were inspected under
  /workspace/educade-validation/profile-overall.
- The static upload ZIP contains only public website files at its root. Archive
  integrity and every file's bytes are checked against the tested source; it
  contains no Wrangler configuration, package manifests or development tools.
- Development branch only. No production deployment or change to hosting
  configuration is part of this revision.


## Class dashboard heading, search and subject tabs — 11 October 2026

- Teacher Dashboard is H1, with the selected class as H2. Removed the summary
  tiles, Reading skills at a glance heading and expansion instruction. Search
  now appears at the top of the comparison card, before the subject tabs.
  The sidebar class navigation is labelled Classes.
- Overall, Reading, Writing, Grammar and Vocabulary are functional class tabs.
  Overall compares the same four domain totals as student profiles, and its
  cells open that learner's subject. Reading retains the four original skills;
  each other subject uses the six skills from its profile. Scores and original
  evidence records are unchanged. Missing evidence stays unassessed.
- Evidence expansion and table spans adapt to four/six axes. Search, sort,
  portraits, chart mode and the expanded learner survive tab changes. Back to
  class restores the selected tab. Keyboard navigation includes Home/End.
- Reading suggestions remain explicitly scoped on Overall and Reading. Their
  review action selects Reading before expanding the relevant evidence column.
  Recent evidence in other subject tabs comes from those subject skills.
- All 18 Node tests pass. Both existing Chromium suites pass, including six
  viewport sizes, all class/profile subjects, keyboard/evidence interactions,
  portrait assignments, stored preferences and storage fallback.
- Desktop screenshots were inspected at 1440 and 1024px under
  /workspace/educade-validation/class-subject-tabs. The current design review
  prioritises desktop; further phone-specific polish is deferred at the user's
  request. Automated smaller-viewport checks had already completed.
- Corrected a browser-test timing assumption: wait for the subject profile
  tab to exist before checking its selection after leaving the class view.
- Static upload ZIP is checked for archive integrity and byte equality against
  public. It contains only website assets with no Wrangler configuration.
- Development branch only; no production merge or deployment.
