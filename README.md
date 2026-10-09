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
Workers. The main branch's existing configuration is unchanged.

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

For an offline preview, download the prepared preview ZIP, extract it, and open
index.html in a browser. All artwork, menu controls, dashboards and sample
challenge work locally. Signup submission is unavailable in this static preview.

## Interactive teacher dashboard prototype

Open `/teacher.html` on the development preview, or `/teacher.html` on the local
server started by `npm run dev`. The landing page is unchanged; the dashboard is
an independent page.

Hosted preview: https://educade-preview.silent-wildflower-6cb0.workers.dev/teacher

- Class overview: six fictional learners, segmented HP bars, search and sorting.
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

All scores, charts, counts and evidence come from the same fictional response
records in `public/teacher-data.js`. There are no accounts, payments, live student
data, storage or live AI assessment. New dashboard files do not change the exact
logo file or any landing-page file.

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
