# EDUCADE website

Starting point for developing the EDUCADE business website, based on the
approved EDUCADE-Website-Redesign2.zip. The original logo, cleaned hero artwork,
blue-gradient headline and class/student dashboard illustrations are retained.

## Develop locally

Requirements: Node.js 22 or newer and npm.

```sh
npm ci
npm run dev
```

Edit files in `public/`; Wrangler serves the static website locally.
There is no framework or frontend compilation step.

Check the Cloudflare deployment configuration without deploying:

```sh
npm run build
```

## Project layout

- `public/index.html`: landing page.
- `public/style.css`: responsive styles and the blue-gradient headline.
- `public/script.js`: menu, sample challenge and dashboard switching.
- `public/world-carousel.js`: manual future-world navigation, keyboard controls
  and touch swipes.
- `public/signup.html` and `public/signup.js`: supplied signup interface.
- `public/assets/`: approved artwork, logos and dashboard illustrations.
- `wrangler.jsonc`: static asset configuration for the Cloudflare Worker `educade-preview`.
- `tests/browser_smoke.py`: desktop/mobile layout and interaction checks.

The signup interface is retained, but this fresh project has no contact-storage
backend. Backend development is outside the current scope.

## Browser checks

Use Python 3.12 and Chromium. Install test dependencies outside the checkout:

```sh
python -m venv /workspace/educade-tools
/workspace/educade-tools/bin/python -m pip install -r requirements-dev.txt
/workspace/educade-tools/bin/python tests/browser_smoke.py
```

Set `CHROMIUM_PATH` if Chromium is not at `/usr/bin/chromium`.
Screenshots default to `/tmp/educade-screenshots`; set `EDUCADE_SCREENSHOTS`
to choose another directory. Set `EDUCADE_BASE_URL` to test an already-running
local server, such as the Wrangler development server.
Tests cover six widths from 320px to 1440px, image loading, page overflow,
mobile menu, dashboard switching and keyboard controls, the sample challenge,
and signup interface behavior with mocked API responses.

## Development and previews

Work on the `development` branch. `main` is the production branch: do not merge
or push to it, deploy to production, or change educade.io without user approval.

The default Wrangler configuration on this branch targets the separate
`educade-preview` Worker, with workers.dev enabled and no custom domain routes.
`npm run deploy` deploys only this preview Worker when Cloudflare authentication
is available. It does not target the existing `educade` or `nameless-unit-6af8`
Workers. Production release commands use a separate configuration below.

To create a hosted preview through the Cloudflare dashboard, create a separate
Worker named `educade-preview` connected to `MatthewGilfillan/EDUCADE`:

- Branch: `development`.
- Root directory: `/`.
- Build command: `npm run build` (validates packaging without deploying).
- Deploy command: `npm run deploy`.
- Preview command: `npx wrangler versions upload`.
- Use its workers.dev address. Do not attach educade.io or www.educade.io.

Do not reconnect the existing production Worker to the development branch.
Cloudflare installs the dependencies using package-lock.json.

## Production release

The user approved publishing the current website version on 9 October 2026,
including the illustrated rewards and five-world carousel. The release also
includes the labelled fictional teacher dashboard and supplied photo/Viking
portraits. The carousel currently uses the existing Viking art and four styled
title panels; the five newly shared character/world artworks still need their
original files supplied. It does not implement accounts or a signup backend.

Use the **existing `nameless-unit-6af8` Worker** that already serves educade.io.
Do not create another application or move the domain. To connect it to GitHub,
open Cloudflare → Workers & Pages → nameless-unit-6af8 → Settings → Builds and
connect `MatthewGilfillan/EDUCADE` using:

- Production branch: `main`.
- Root directory: `/`.
- Build command: `npm run build:production`.
- Deploy command: `npm run deploy:production`.
- Preview/non-production branch builds: disabled for this live Worker.

The separate `educade-preview` Worker continues to use `development` and its
existing preview commands. Do not use the generic `npm run deploy` for production.

`wrangler.production.jsonc` targets the existing live Worker. The production
command uploads a version tagged with the committed Git revision, then deploys
that tag to 100% of traffic. It preserves existing domain routes by using
`versions upload` / `versions deploy` and never `triggers deploy`. Existing
dashboard-set variables and secrets are retained. An upload failure stops the
release before any traffic is switched.

For a direct deployment from this cloud workspace, Cloudflare credentials are
required: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Enter them securely
in environment settings, never in chat or the repository. The token should be
scoped to the existing Cloudflare account with Workers Scripts Edit permission.
Cloudflare's GitHub Builds supplies its own build token when using the dashboard
route above; a separate token in this workspace is unnecessary for that route.

Before deploying, run `npm test`, both browser suites and
`npm run build:production`. After deployment, verify the Teacher sign in link,
`/teacher.html`, demo labels, charts and mobile menu on https://educade.io/.
If the release fails after deployment, use the live Worker's Deployments tab to
roll back to the previously active version. Future production updates still
require explicit approval.

For an offline preview, download the prepared preview ZIP, extract it, and open
index.html in a browser. All artwork, menu controls, dashboards and sample
challenge work locally. Signup submission is unavailable in this static preview.

## Interactive teacher dashboard prototype

Choose **Teacher sign in** in the landing-page header (or the mobile Menu). For
now, this is a link to the sample dashboard, labelled **Demo dashboard · Fictional
data**. It does not request credentials or implement authentication. The link's
`data-teacher-entry` attribute provides an entry point for a future sign-in flow.
The approved landing content and artwork remain unchanged.

You can also open `public/teacher.html` directly after extracting the repository
ZIP, or visit `/teacher.html` on the local server started by `npm run dev`.

Hosted preview: https://educade-preview.silent-wildflower-6cb0.workers.dev/teacher

- Class overview: six fictional learners, a class heatmap or segmented RPG HP
  bars, search and sorting. Choose a learner's name to open their profile; choose
  a score cell to inspect the same skill's learning evidence.
- Student profiles: Reading, Writing, Grammar and Vocabulary tabs.
- Reading separates Foundations from Comprehension.
- Curriculum structure: domain → section where relevant → skill group → individual
  EDUCADE skill → learning evidence. Detailed groups expand independently.
- HP bars/radar switch: charts summarize only assessed groups, at most four in this
  representative dataset. A radar requires at least three assessed groups.
- Unassessed skills show “No evidence yet” and are excluded from summaries.
- Evidence: fictional responses, model examples, support mode and hint shown.
- Progress: cumulative correct-response percentages by support type, with an
  accessible table of exact chart values.
- Independent controls: portrait style, class data view and student data view.
  Switching presentation preserves learner/domain selection, expanded skill
  groups, selected evidence, search and sorting. Radar preference is retained
  when Foundations temporarily falls back to bars.
- Presentation preferences use browser `localStorage`, with a safe fallback when
  storage is blocked. They are local to the teacher's browser profile/device,
  not synced or associated with a signed-in account. Fictional learning records
  are never written to browser storage.

### Portrait styles

Choose **Photos**, **Viking avatars** or **Initials** in the Portrait style control.
The supplied originals from Archive.zip are included unchanged. SVG viewports
frame each portrait without modifying or regenerating the original artwork.
New browser profiles start with Photos; an existing saved style stays selected.

`public/teacher-portraits.js` contains stable assignments for all six learners.
The unmodified sheets are at `public/assets/portraits/sample-students.png`
(1536 × 1024) and `public/assets/portraits/viking-adventurers.png` (1312 × 1199),
with verified dimensions and framing. Both styles are enabled.
Photo assignments follow the names printed on the sheet. Viking assignments are:
Alex top left, Maya bottom left, Leo bottom middle, Sofia top middle, Noah top
right and Ella bottom right. Initials remain available independently of artwork.

All scores, charts, counts and evidence come from the same fictional response
records in `public/teacher-data.js`. There are no accounts, payments, live student
data, learning-record storage or live AI assessment. The exact logo file remains
unchanged. The landing page also has the labelled teacher demo entry,
illustrated planned rewards and the potential-world carousel described below.

`EDU.G5.*` identifiers belong to the prototype's own curriculum scaffold.
CCSS alignments are maintained separately as mapping metadata, not as skill IDs.
The Grade 5 CCSS wording was checked separately against a published reference
mirror on 9 October 2026. Prototype task alignments remain candidates: each task
practices part of its standard and scores are not mastery claims. The accessible
reference site identifies itself as unofficial; access to the California Department
of Education primary publication remains blocked. See `docs/CCSS-MAPPING-REVIEW.md`
for sources, scope and review notes.

Checks:

```sh
npm test
/workspace/educade-tools/bin/python tests/teacher_browser.py
/workspace/educade-tools/bin/python tests/browser_smoke.py
npm run build
```

Set `EDUCADE_BASE_URL` to test an already-running preview. Screenshot outputs can
be selected with `EDUCADE_SCREENSHOTS`. Publish only the development branch;
never merge into main or update educade.io without explicit user approval.

## Potential-world carousel

Open the landing page and scroll to **New worlds. New reasons to learn.**
The section also has the `#worlds` anchor. It shows Viking Quest (first world
planned), Scribe of the Nile (Egypt), The Oracle’s Quest (Greece), Roads of Rome
and Jade Scrolls (China). The latter four are labelled **Future concept**.

Use the previous/next arrows, the five selection dots, or a horizontal touch
swipe. Focus the carousel to use Left/Right, Home and End. It wraps at either
end, announces the selected world to screen readers, and never auto-rotates.
Vertical gestures remain normal page scrolling; reduced-motion settings are
respected. These cards do not start playable games.

The original Viking hero art is reused unchanged. The new world/character PNGs
are visible in chat but have not been supplied as downloadable files yet, so
the carousel currently uses styled title panels. In `public/index.html`, each
`data-world` slide contains its own `.world-art` panel and caption. Once the
original files arrive, replace that panel's title content with an image using
the existing `.world-art img` styles (`object-fit: contain` preserves the full
artwork); the controls and selection logic need no changes. All five new
artworks, including the new Viking Quest image, remain pending integration.


## Dashboard evidence and header update — 10 October 2026

The class toolbar places **Portrait style** beside **Sort learners**. The
header contains a class dropdown and a three-line menu with Settings, Help and
My Account. Two fictional classes exercise the selector: Class 5A retains the
six approved learners and portraits; Class 5B adds three fictional learners
shown with initials when their portrait has no supplied image. My Account is
an explanatory placeholder and does not collect credentials.

The `#` column numbers the displayed rows after filtering and sorting. Skill
headings insert an evidence column immediately to their right. Student names
expand evidence beneath the row; **Open full profile** remains a separate
action. One skill and one student may be expanded at the same time, and their
state survives portrait/chart changes. Narrow screens scroll the comparison
inside its container while the number and student columns stay visible.

Radar and Progress Bars use the same individual skills: eight for Reading
Comprehension and six each for Writing, Grammar and Vocabulary. The radar
centre follows the photo/avatar/initials choice; points support click, Enter
and Space to open evidence. Missing skill evidence stays unassessed, breaks the
polygon, and is never positioned as zero. Reading Foundations still falls
back to Progress Bars where fewer than three skills have evidence. Additional
fictional examples have no CCSS mapping until that alignment is reviewed.

`npm test` now includes DOM interaction checks via jsdom. These verify behavior
and data consistency but do not replace Chromium layout/screenshot checks.

## Class teaching suggestions — 11 October 2026

The number column is fixed at 32 pixels on desktop and 28 pixels on phones.
An explicit column group prevents older table styles from widening it; student
names remain sticky beside it when comparison or evidence columns scroll.

Suggested next steps shows a whole-class skill with Model, Practise together
and Check independently steps, then named small groups and individual check-ins.
Recommendations use the selected class's four comparison skills and the same
records as its profiles, rather than the current search results. Class 5A's
focus is explaining similes and metaphors in context: four of six learners
are below 70%, with 73 of 120 responses correct (61%). Evidence links open the
matching learner/skill or expand that skill's class evidence column.

Planning rules are explicit: rank skills by learners below 70%, then accuracy;
recommend a class lesson only where at least half of assessed learners share
that need. Up to two other skills with at least two learners below 70% form
practice groups. A learner's lowest skill below 50% receives an individual
check-in. Missing evidence is excluded, and no teaching need is invented when
the records do not support one. These are practice cues, not mastery decisions
or live AI assessment; the next step is a new independent response.

Dashboard copy uses Search students and removes repeated sample/fictional
wording at the user's request. The existing prototype and Demo data footer
remain. The landing page, account behavior and hosting configuration are unchanged.
