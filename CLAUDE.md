# Working on this repo with Claude Code

## What this project is

Practice drills for air traffic controller aptitude tests (Aon / cut-e `scales` modules).
Static site, no backend, no data collection.

## Commands

- `npm run dev` — dev server
- `npm test` — Vitest over the pure logic
- `npm run typecheck` — tsc, strict
- `npm run build` — static output to `dist/`

## Conventions that matter

- **Puzzle logic is pure and tested.** It lives in `src/drills/<id>/logic.ts`, takes an
  injected `Rng`, and never touches the DOM. If you change a generator or a solver, add
  or update tests in the sibling `logic.test.ts` and run them before claiming it works.
- **Correctness is the whole point.** These drills teach method. A generator that emits an
  unsolvable puzzle, or a marker that rejects a valid answer, actively harms the user.
  When you touch that code, verify by generating thousands of items in a test, not by eye.
- **Accessibility is not optional.** See `docs/accessibility.md`. No colour-only signals,
  keep the 44px targets, keep focus visible.
- **Styling** uses the tokens in `src/styles/tokens.css`. Do not hardcode colours.
- **The logbook is the user's data.** `lib/history.ts` keeps every run in `localStorage`
  and nothing else — no identifier, ever. Its aggregation is pure and tested; only the
  four functions at the bottom of the file touch storage, and every one is wrapped in
  try/catch, because private browsing, a locked profile and a full quota all throw and a
  lost logbook must never take a drill down with it. Storage-shape changes need a
  migration like `migrateV1`, not a silent reset: people practise for weeks.
- **Hover and press mix toward `--ink`, never `filter: brightness()`.** A one-way
  brightness filter darkens on both themes, so on the dark theme hover read as *disabled*
  rather than *live*. `color-mix(in srgb, var(--ink) N%, <base>)` lightens on dark and
  darkens on light, which is what both themes need.
- **The clock starts when the candidate does.** Nothing may time reading. In the React
  drills `DrillShell` shows `ready` while the briefing is open and `onBegin` re-anchors any
  per-item stopwatch when it is skipped. The standalone pages each time items differently,
  so instead of nine edits their boot script freezes `performance.now()` at the load
  instant and `window.__armDrillClock()` resumes it as if no time had passed.
- **Colour set as an SVG attribute is invisible to the CSS theme.** Several drills draw
  their stimulus at runtime with `fill="#18222C"`, which the generated dark theme cannot
  see, so the item rendered near-black on a near-black panel. Runtime-drawn marks use
  `fill="currentColor"` and inherit `--ink`. The exception is the `ndb` dial, whose face is
  deliberately black in both themes like the real instrument; its markings stay light.
- **The standalone pages' dark theme is generated, not hand-written.** A script rewrites
  each page's own rules into `:where(:root[data-theme="dark"]) <selector>` counterparts.
  `:where()` is load-bearing: it contributes zero specificity, so each generated rule keeps
  exactly the weight of the light rule it shadows. Scoping with a plain
  `:root[data-theme="dark"] .btn` raised the base rule above `.btn.primary` and painted the
  primary button's own background over itself. Content colours — piece fills, shape fills,
  the ball — are deliberately not remapped; they are the drill's vocabulary, not chrome.
- **`vwm` is a spatial complex span, and the interleaving is the construct.** Encoding and
  processing alternate — judge, locate, judge, locate — and recall comes only at the end of
  a run. An earlier version showed all the locations then one delay; that measures how long
  a visual image persists, not working memory. Do not "simplify" it back. Serial order is
  scored, the processing deadline comes from the candidate's own warm-up (mean + 2.5 SD),
  and processing accuracy below 85% invalidates the span figure rather than being ignored.
  Sources are cited in the file header; check them before changing a parameter.
- **A test must not be able to leak its own answer.** The whole matrix is selectable at
  recall, so no cell is marked as special; the session is generated once and never
  regenerated on a phase change; and every cell is visually identical, so location and
  order are the only things carrying information.
- **Report writes the logbook from a guarded effect.** React runs effects twice in
  development and that write has no cleanup, so every finished run was being logged twice
  until the guard was added. Do not remove it.
- **Every drill carries a glyph drawn from its own task** (`src/drills/Glyph.tsx`), not a
  generic category icon, and no two may read alike at 24px - the first `lst` glyph was a
  plain grid and collided with `gridChallenge`. One stroke weight across the set, and
  `currentColor` so they follow the card's hover and theme.
- **Never auto-scale a sparkline.** `Sparkline` is fixed to 0–100 so two drills are
  actually comparable and a flat run looks flat. Rescaling to fit turns noise into a trend.
- **Teaching content is the product.** The tips panels, briefings and explanations took
  more thought than the code. Do not strip them when refactoring.
- **Every drill opens with a briefing.** `components/Briefing.tsx` takes the format, the
  method and a `figure` — an inline SVG drawing the same rule — and `DrillShell` shows it
  before the first run, hiding the aside while it is open. A drill without one is not
  finished. The standalone pages get the equivalent from `public/legacy/briefs.js`.
- **Diagrams are inline SVG using the tokens**, never an image and never a new dependency.
  Check text fits the viewBox; several early ones did not.

## Current state

`src/drills/nav/` and `src/drills/grid/` are the reference implementations: pure logic,
tests, React component using the shared shell. The other eight drills are working
standalone pages in `public/legacy/` awaiting a port — see `docs/adding-a-drill.md`.

Those pages share `public/legacy/shell.js`, which gives them a breadcrumb back to the
index, a document language, and a briefing built from `briefs.js`. They are deliberately
light-only: they hardcode over a hundred colours outside their palettes, and retrofitting
a dark theme onto pages that are being deleted one by one is not worth it. Porting a page
is what fixes its theme.
