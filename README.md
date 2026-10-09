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
- `wrangler.jsonc`: static asset configuration for the Cloudflare Worker `educade`.
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

## Cloudflare Git integration

Connect the existing `educade` Worker to `MatthewGilfillan/EDUCADE` with:

- Production branch: `main`.
- Root directory: `/`.
- Build command: leave empty (static files need no compilation).
- Deploy command: `npm run deploy`.

Cloudflare installs dependencies from `package-lock.json` before deploying.
The deployment configuration defines static assets only and does not change
domain routes. The separate Worker `nameless-unit-6af8` currently has the
educade.io route according to the supplied screenshot; moving that domain
is a separate action. No domain migration is performed by this repository.
