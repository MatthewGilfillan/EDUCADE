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


## Dashboard wording cleanup — 11 October 2026

- Removed visible demo/fictional/sample wording, including the footer, evidence
  badge, chart labels, page titles, profile scores and landing teacher entry.
- Removed the general presentation notice. Local preferences and their storage
  fallback remain functional. Original landing preview images are preserved;
  CSS overlays conceal their embedded sample-data and concept-preview labels.
- All 18 Node tests pass. Both existing Chromium browser suites pass after the
  copy changes, including the class/profile tabs, charts, evidence, portraits
  and local preference behavior. The preview Worker packaging dry run passed.
- Desktop class and Overall profile screenshots were inspected. Original data
  and the profile layout remain unchanged.
- Browser assertions now expect the requested cleaned teacher link and footer.
  The jsdom route helper waits for navigation and hashchange task turns rather
  than a fixed 10ms delay that failed under concurrent browser-test load.
- The website-only ZIP has 28 files at its root, with checked archive integrity
  and byte equality against public. It excludes Wrangler and package files.
- Direct file navigation is blocked by this machine's browser policy. The
  extracted ZIP is instead validated through a local HTTP server.
- Only development/feature branches are updated. Production remains unchanged.

## Column-aligned evidence and Glows & Grows — 11 October 2026

- Learner evidence expands inside the existing table row, underneath each
  category's original comparison control. Header evidence columns and expanded
  learner details contain no repeated progress bars. Counts, hint use, latest
  responses and question/response links are retained.
- Tests check one table row per learner, matching header/cell boundaries,
  increased row height, stable expansion across subject/view changes, accessible
  controls and evidence links. Clicking response text leaves the row open.
- Glows & Grows uses the strongest and lowest-scoring assessed subjects/groups
  from the existing records. Alex's Overall highlights Vocabulary (68%) and
  Writing (62%); Vocabulary highlights Idioms and adages (90%) and Prefixes and
  suffixes (40%). Actions open the correct subject/group and learning evidence.
  A view without evidence has no recommendation score or action. The practice
  cue uses the existing challenge hint, followed by a fresh independent check.
- All 19 Node tests pass. Both Chromium suites pass at their six existing
  widths, including evidence interaction, charts, portraits, local preferences,
  storage fallback and landing-page behavior. Signup tests use a mocked API.
- Desktop table and profile screenshots were inspected at 1920/1440px, with
  the existing 390px profile check also inspected. Outputs are under
  /workspace/educade-validation/aligned-evidence-glows-grows.
- Student records, scores, portraits, landing page and hosting configuration
  are unchanged. This revision stays on development, with no production merge
  or deployment.

## Visible evidence expansion controls — 11 October 2026

- Separated the learner name from an outlined blue Show skill evidence button.
  Category headings have an outlined Show evidence control with a plus icon.
  Both controls visibly switch to Hide/minus when expanded and have accessible
  names identifying the affected learner or category.
- Existing interaction checks activate the controls by accessible name,
  confirm their state changes and retain the evidence alignment and data
  invariance checks. Browser checks confirm visible borders, minimum action
  height, blue text and spacing from the full-profile link.
- All 19 Node tests and both Chromium browser suites pass. Desktop class and
  learner-action screenshots and the existing smaller-width header screenshot
  were inspected under /workspace/educade-validation/visible-evidence-controls.
- Reading, Writing, Grammar, Vocabulary, portraits, saved views, Glows & Grows
  and existing evidence links remain functional. No landing, data or hosting
  configuration changes. Development only; production remains unchanged.
- The hosted preview read check returned HTTP 403 from this execution
  environment, so its currently served build could not be verified here.

## One evidence block per original skill cell — 11 October 2026

- Category expansion now shares the learner row's existing evidence container,
  rather than adding an adjacent column. Both controls use a union: an expanded
  learner/skill intersection has one block, and closing either preserves the
  details still requested by the other. Comparison bars remain in their original
  cells. No repeated bars or separate learner evidence cards are rendered.
- A regression check exercises Alex's Writing > Transitions: 40% and
  `8/20 correct · 5 hints`. It verifies both toggle orders, fixed header/row cell
  counts, stable table width, one bar per cell and unchanged source records.
- Chromium checks measure the counts directly below their matching bars and
  check identical horizontal starts, unchanged column offsets/widths and no
  extra cells. These checks pass across all six existing widths. Existing
  portrait, saved presentation, storage fallback, profile and evidence checks
  also pass. All 20 Node tests and the landing browser suite pass.
- The upload packager uses committed public files, fingerprints the four
  teacher assets and links Teacher sign in to a revision-specific dashboard
  entry. It checks ZIP integrity and byte equality with its prepared website,
  excluding Wrangler and package files. Compatibility filenames remain for
  existing URLs; the generated entry requests the versioned resources.
- Screenshots are under /workspace/educade-validation/single-cell-evidence.
  No assessment records, portraits, landing artwork or hosting configuration
  changes; development and download branches only.

## Compact rows and inline Overall evidence — 11 October 2026

- The name and its Click to view profile cue form one accessible profile button.
  The separate full-profile action is removed; the outlined learner evidence
  button stays on one line. Desktop student columns are 280px wide, and the
  measured collapsed row height at 1920px is 94px. Expanded rows retain evidence
  beneath their original subject/skill controls, with no duplicate bars.
- Overall subject links now toggle a collection in the same learner/subject
  cell. Reading includes Foundations and Comprehension. Assessed skills expose
  all recorded responses, questions, example answers, dates, outcomes, support
  and hints. Alex's collection includes all nine assessed reading skills and
  all 180 responses; other subjects each retain their 120 responses.
- The regression check compares every rendered response ID with the source
  records and checks response/support/hint content, all four subject links,
  Alex/Maya isolation, unchanged data and empty-domain behavior. Open collections
  and skills persist through portrait/chart changes, filtering, sorting, subject
  tabs and profile round trips. All 21 Node tests pass.
- Browser checks exercise keyboard disclosure and profile navigation, complete
  response histories, stable skill columns/table width, one-line controls and
  collapsed desktop rows under 100px. Sticky headers' changing scroll offsets
  are excluded from the fixed skill-column position comparison; all header
  widths and the number/student alignment remain checked.
- The teacher browser suite passes at all six existing widths, including
  portrait assignments, independent charts, persisted preferences and malformed
  or blocked storage. Scroll padding keeps category controls clear of pinned
  identity cells on narrow screens.
- Desktop compact table/cell and complete reading collection screenshots were
  inspected under /workspace/educade-validation/overall-subject-evidence. The
  landing browser suite passes. Source assessment data, portraits, artwork and
  deployment configuration remain unchanged.


## Grouped reading catalogue — 11 October 2026

- Class and student Reading views share five comprehension navigation groups:
  Meaning and evidence, Characters and events, Author’s craft, Structure and
  features, and Comparing and evaluating. All 39 individual comprehension
  skills are accessible; Reading Foundations retains its eight separate skills.
  Seven literary/informational context entries are listed as text contexts,
  rather than achievement scores or comparison columns.
- Added seven unassessed catalogue entries for supporting evidence, setting,
  tone, text structure/features and integrating information. Original skill IDs
  and definitions, standards mappings, challenge text and every learner/response
  record match the pre-change snapshot exactly. No scores or assessments were
  generated for new entries, and no new standards alignment is claimed.
- Coverage, strongest recorded individual skill and teaching priority use actual
  response counts. Groups receive no combined score or achievement stage. Class
  summaries and suggestions remain class-wide during search; suggestions scope
  to the selected group. The summary sits below the class table to keep more
  learners visible initially.
- Profile charts, support counts, progress and Reading Glows & Grows scope to
  the selected group. Unassessed skills remain in the catalogue, are omitted
  from assessed charts, and expose an empty evidence view. Groups without any
  evidence have no scored recommendation and a concise chart empty state. The
  Overall profile still starts with its four-subject radar.
- All 26 Node tests pass. Catalogue checks cover complete, unique assignment,
  separate foundations/contexts, every skill’s accessible evidence, scoped
  counts, no-evidence behavior, deep links, class/profile navigation and preserved
  preferences/source data. Existing Transitions alignment and full Overall
  subject-response checks remain in place.
- Teacher Chromium checks pass at 1440, 1024, 768, 640, 390 and 320px, exercising
  all five groups in class/profile views, separate foundations, no duplicated
  bars, exact response alignment, charts, keyboard navigation and compact rows.
  Portrait and storage-fallback checks also pass. The landing browser suite
  passes at all six widths, including signup behavior with a mocked API.
- Desktop class/profile and smaller-width class screenshots were inspected
  under /workspace/educade-validation/reading-catalogue. Landing artwork,
  portraits, authentication behavior and deployment configuration are unchanged.

## Eight-skill Reading overview and floating navigation — 11 October 2026

- Default class and student Reading Comprehension views use the same eight
  existing skill IDs, labels, scores and order: Inference, Vocabulary in context,
  Figurative language, Character analysis, Main idea, Cause and effect,
  Comparing perspectives and Theme. All five catalogue groups and 39 individual
  comprehension skills remain accessible; Foundations stays separate.
- Readable class columns scroll horizontally. A 64px semitransparent arrow
  floats at the right edge of the visible table rows, jumps to the last columns,
  and switches left to return. It follows the visible table area during page
  scrolling, hides when there is no overflow, and respects reduced motion.
  Student names and numbers remain pinned; a more specific sticky selector fixes
  the previously overridden student-name offset during horizontal scrolling.
- Learner and category expansion still share evidence in the original skill
  cells, with one progress bar per skill and response counts directly beneath it.
  Missing results keep their overview axis with No evidence yet, rather than a
  zero score. Selected catalogue groups retain charts of assessed skills and
  separate coverage summaries without a combined achievement stage.
- All 27 Node tests pass, covering eight-skill class/radar parity, scores,
  missing evidence, scoped records and preserved source data. Browser checks
  pass at 1440, 1024, 768, 640, 390 and 320px, including native end/return clicks,
  pinned names, viewport-following navigation, Theme counts and both evidence
  controls. Narrow-width follow-up checks account for native header focus panning
  and wait for the page-scroll event before measuring the floating arrow. Portrait
  and storage-fallback checks pass. The landing suite passes at all six widths.
- Desktop class/profile and smaller-width table screenshots were inspected under
  /workspace/educade-validation/eight-reading-scroll. Learner records, challenge
  text, standards mappings, portraits, landing assets, authentication behavior
  and deployment configuration are unchanged.

## Clear scroll controls in every class category — 11 October 2026

- Overall, Reading, Writing, Grammar and Vocabulary use the same floating
  end/return control whenever their comparison columns overflow. Guide text and
  accessible labels name the relevant skills or subjects. The arrow remains
  available in both progress-bar and heatmap views.
- A reserved space to the right of the table keeps the entire arrow outside
  score and evidence cells. Desktop controls have a 16px gap from the table
  edge; smaller-width controls also avoid overlapping the table. When all
  columns fit, both the arrow and its reserved space disappear.
- All 27 Node tests pass. The complete teacher browser suite passes at 1440,
  1024, 768, 640, 390 and 320px. New checks use native clicks in every class tab,
  verify both scroll directions, confirm pinned names, and measure that arrows
  sit outside the table and inside the viewport. Evidence alignment, portraits,
  charts, coverage, preferences and storage-fallback checks also pass.
- The landing suite passes at all six widths with mocked signup responses.
  Desktop Writing and smaller-width Reading screenshots were inspected under
  /workspace/educade-validation/all-category-scroll. Assessment data, profile
  charts, landing artwork and deployment configuration are unchanged.

## Rounded double-chevron navigation — 12 October 2026

- Replaced the scroll arrow glyph with two rounded SVG chevrons matching the
  supplied reference. The icon uses the existing blue colour and semitransparent
  button, stays in the clear space outside the table, and mirrors left after
  reaching the last columns. Accessible button labels still describe the action;
  the decorative SVG is hidden from screen readers.
- All 27 Node tests and both complete browser suites pass. Updated existing
  browser checks verify two chevron strokes and the rendered left/right transform
  during native end/return clicks in every class tab and both data views.
  Six screen widths, evidence alignment, pinned names, portraits and saved
  preferences pass. Desktop Writing and smaller-width Reading screenshots were
  inspected under /workspace/educade-validation/double-chevron.
- Scroll destinations, control position, assessment data, profile charts, landing
  assets and deployment configuration remain unchanged.

## Raised sidebar buttons and class navigation — 12 October 2026

- The existing EDUCADE wordmark and Back to EDUCADE link now use raised surfaces,
  bevels, hover and pressed feedback, and visible keyboard focus. Native browser
  clicks on both links reach index.html. The approved wordmark artwork is intact.
- Classes is a disclosure button with 5A and 5B visible by default on desktop.
  Each class name opens its overview; a separate arrow reveals Student profiles
  and Settings. Profile choosers list only the selected class's learners and open
  their Overall profile. Settings identify the class and explain that display
  preferences apply across the dashboard. Closing panels and using Escape return
  focus to the relevant navigation button.
- Import class and Create new class are visible entry points. Their panels state
  that roster imports and class creation need connected teacher accounts; no
  backend import, class creation or persistence is implied.
- All 29 Node tests pass. Teacher navigation checks use native clicks at six
  widths and verify class-specific rosters, profiles, disclosure state and focus
  restoration. The landing suite passes at all six widths with mocked signup.
  Desktop and smaller-width screenshots were inspected under
  /workspace/educade-validation/class-navigation. Both menus and the home button
  remain reachable in a 680px-high desktop sidebar.

## Separate Reading Foundations and Literacy tabs — 12 October 2026

- Class comparisons and student profiles now share six top-level tabs: Overall,
  Reading Foundations, Literacy, Writing, Grammar and Vocabulary. Removed the
  Reading Foundations/Reading Comprehension sub-tab row. Literacy retains the
  eight-skill overview and all five comprehension catalogue groups; Foundations
  opens its eight existing skills directly.
- Navigation labels, panel associations, keyboard traversal, chart titles and
  evidence headings follow the selected reading section. Existing reading URL
  fragments still select the corresponding new tab. Catalogue selections,
  class searches, portraits and saved chart preferences survive tab changes.
- Reading evidence IDs, standards mappings and recorded responses are unchanged.
  Overall still combines reading evidence in its existing four-subject summary;
  only navigation is split. Missing results remain unassessed.
- All 30 Node tests pass, including separate evidence scopes, legacy links and
  keyboard traversal between the two reading tabs. Both browser suites pass at
  all six widths, including chart/evidence interactions, class navigation,
  portraits and browser-storage fallback. Desktop and smaller-width previews of
  both reading sections were inspected under
  /workspace/educade-validation/reading-tabs/review.

## Landing page and downloadable website — 12 October 2026

- The selected warm-orange joystick appears to the left of the preserved wordmark.
  The header has one blue-gradient Sign In button; the hero pairs Start your
  adventure with a smaller Sign In button. Sign In opens the teacher dashboard;
  authentication and account-role routing are not connected yet.
- The compact hero identifies EDUCADE as an English language arts role-playing
  game and shows the protagonist on an isometric harbour map with four learning
  callouts. Reading, writing, grammar and vocabulary each have a learning card.
  The next section is visible in the checked desktop first-screen layouts.
- The landing suite passes at all six widths, including mocked signup, header
  controls, both hero actions, the joystick position and four learning callouts.
  Desktop and smaller-width layouts were inspected under
  /workspace/educade-validation/rpg-hero/review.
- Static packaging now versions the shared landing/signup stylesheet as well as
  the teacher assets. The archive contains public website files only, with no
  Wrangler configuration, package manifests or build tools.

## Standards Progress in the downloadable build — 12 October 2026

- Added Standards Progress alongside the existing class views and profile charts.
  It uses text labels, distinct colours and four position markers for Beginning,
  Approaching, Meeting and Exceeding. Subject summaries show counts of individual
  levels rather than an averaged achievement stage.
- Initial layout levels provide the requested quick mockup: over 95% Beginning or
  Approaching, three Meeting assignments and no default Exceeding levels. They
  are separate from practice percentages and are not validated attainment claims.
  Teacher changes replace or clear those display levels. Saving Meeting requires
  explicit consistency and independence
  confirmations; Exceeding also requires extension confirmation and an evidence
  note. Unreviewed evidence and unassessed skills remain separate from Beginning.
  Existing candidate standards references are not represented as validated mastery.
- The review panel provides all recorded skill responses in a bounded, keyboard
  accessible history. It saves judgments separately from practice records and
  display preferences, in browser storage, with a visit-only fallback when blocked.
  Both axes of table evidence expansion stay aligned without repeated bars.
- All 33 Node tests pass. The full teacher and landing suites pass at six widths.
  Dedicated native browser checks pass at 1440, 1024, 390 and 320px, covering
  required rubric confirmations, note validation, shared class/profile levels,
  restored choices, the conservative initial display, original percentages and data integrity. Desktop and smaller
  screenshots were inspected under /workspace/educade-validation/standards-progress.

## Account buttons, stable view toggle and sidebar artwork — 12 October 2026

- Restored an orange Sign Up button beside the blue Sign In button in the landing
  header. Both remain visible in the mobile menu; native Sign Up navigation reaches
  the existing registration form. Compact desktop spacing prevents header overflow.
- The class-view toggle stays anchored on the right in Progress Bars, Class heatmap
  and Standards Progress. Hiding the practice legend preserves its layout space;
  the legend is hidden visually and from accessibility APIs in Standards Progress.
  Dedicated browser checks measure unchanged toggle coordinates in all three modes.
- Replaced the sidebar's star with the selected warm-orange joystick, above its
  existing message. A new transparent Viking longship illustration replaces the
  sunset and mountain scene. The raised home buttons and original wordmark remain.
- All 33 Node tests and the full teacher and landing browser suites pass. Standards
  checks pass at four widths, including toggle position, rubric review, all recorded
  responses, restored choices and unchanged practice scores. Desktop and smaller
  screenshots were inspected under /workspace/educade-validation/layout-refinements.
  Both expanded class menus and the home link remain reachable on a short desktop.

## Student profile actions and evidence summaries — 12 October 2026

- Overall Radar, Progress Bars and Standards Progress separate Reading Foundations
  and Literacy alongside Writing, Grammar and Vocabulary. Reading axes and level
  distributions use section-specific evidence; the overall total is unchanged.
- Profile columns flow independently. Reports sit below the learning chart,
  latest evidence below reports, and the partner planner below Glows & Grows.
- Report comments and learning targets are generated from recorded practice and
  local activity templates, editable by teachers, and retained in browser storage.
  Printable reports can include the radar and Glows & Grows. No model service,
  authentication service or production backend was added.
- Skill grouping handles complementary partners, similar needs, mixed strengths,
  group sizes, participants, teacher moves, local persistence and printable output.
- Expanded class evidence keeps counts and support totals, replaces the latest
  response snippet with encountered sub-skills and successful work, and keeps all
  original response history behind the evidence link. Used words/forms must occur
  in a correct response; recognition examples are identified separately.
- `npm test`: 37 checks pass, including section scores, keyboard navigation,
  immutable evidence, grouping exclusions/moves and escaped teacher report text.
- `tests/browser_smoke.py`: six viewport widths and mocked signup scenarios pass.
- `tests/standards_browser.py`: 1440, 1024, 390 and 320 pixel checks pass.
- `tests/profile_widgets_browser.py`: desktop/mobile report windows, actual PDF
  rendering, optional sections, saved teacher drafts and group recovery pass.
  Reviewed screenshots and PDF artifacts are in
  `/workspace/educade-validation/profile-widgets`.
