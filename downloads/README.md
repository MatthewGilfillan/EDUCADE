# EDUCADE website download

Download **EDUCADE-latest-layout-refinements.zip** as an individual file using
Download raw file or View raw. GitHub's Code > Download ZIP is the source
repository archive, rather than this prepared static website.

This build uses source revision 249424427d5e00689513c0a80af68c5e239626db.
Extract it into a new folder and open index.html, then Sign In. The dashboard
entry is teacher-2494244.html. Upload the extracted contents, with index.html at
the root, when using a static-site uploader.

The ZIP has 39 static website files. It contains no Wrangler configuration,
package manifests or build tools. Dashboard scripts and styles, and the shared
landing/signup stylesheet, have content-based filenames to avoid older cached
assets.

Included changes:

- Restored orange Sign Up beside blue Sign In in the landing header.
- View toggles keep the same position across all three class display modes.
- The sidebar message now has the orange joystick above it and a Viking
  longship below it, replacing the sunset and mountains.

- Overall, Reading Foundations, Literacy, Writing, Grammar and Vocabulary tabs
  in both class comparisons and student profiles. Literacy has eight matching
  class/radar skills and all five comprehension catalogue groups.
- Standards Progress beside the existing views. Initial layout levels are a
  quick mockup: over 95% Beginning or Approaching, three Meeting assignments and
  no default Exceeding assignments. They are independent of practice percentages
  and are not validated assessments. Unassessed skills stay No evidence yet.
- Optional teacher review of all collected responses. Saving Meeting requires
  consistency and independence confirmations; Exceeding also requires extension
  confirmation and an evidence note. Changes are stored in this browser.
- Raised EDUCADE return buttons and expandable 5A/5B class menus, with class-specific
  profile choosers, Settings, Import class and Create new class entries.
- Rounded double-chevron scroll controls outside the scores in every class
  category, original-column evidence expansion and compact learner rows.
- The warm-orange joystick, blue Sign In buttons, compact role-playing-game hero
  with the protagonist on an isometric map, and all four learning callouts.

Original practice records, percentages, skill IDs and candidate CCSS mappings
are preserved. Standards levels are separate display/review values. Overall
profiles still start on their existing four-subject radar.

All 33 Node tests pass. The complete teacher and landing browser suites pass at
six widths; dedicated Standards Progress checks pass at four widths. The exact
extracted archive was verified with native navigation, all collected skill
responses, teacher review, saved class/profile levels, original charts and
records, versioned assets, and no stale requests or browser/asset errors.

SHA256: 92f9a9cb4e43153b8b6dd7bb0ba38c3bb825f8fdfc5b5bc15c19b8b8c7548ebb

This download does not deploy to production or change educade.io.
