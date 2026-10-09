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

The user approved publishing the current website version on 9 October 2026.
The release includes the labelled fictional teacher dashboard; photo and Viking
image files are still pending. It does not implement accounts or a signup backend.

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

### Portrait artwork pending file attachments

The supplied photo and Viking sheets are visible in the conversation, but their
downloadable original files are not present in this workspace. Initials work
now; Photos and Viking avatars remain visibly unavailable until the originals
are attached as files. No substitute or regenerated portraits are included.

`public/teacher-portraits.js` contains stable assignments for all six learners.
Place the unmodified sheets at `public/assets/portraits/sample-students.png`
(1536 × 1024) and `public/assets/portraits/viking-adventurers.png` (1312 × 1199),
then set their `available` flags to `true` after verifying the dimensions and
framing. SVG viewports display individual panels without modifying the originals.
Photo assignments follow the names printed on the sheet. Viking assignments are:
Alex top left, Maya bottom left, Leo bottom middle, Sofia top middle, Noah top
right and Ella bottom right. Initials remain available independently of artwork.

All scores, charts, counts and evidence come from the same fictional response
records in `public/teacher-data.js`. There are no accounts, payments, live student
data, learning-record storage or live AI assessment. The exact logo file remains
unchanged. The only landing-page addition is the labelled teacher demo entry.

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
