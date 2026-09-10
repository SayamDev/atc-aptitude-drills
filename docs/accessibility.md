# Accessibility

Target: WCAG 2.2 AA.

## What is implemented

- **Keyboard.** Every drill is fully operable from the keyboard. Number keys select
  answers; the tab order follows the visual order; there are no keyboard traps.
- **Focus.** A single visible focus style, never removed. Route changes move focus to
  `#main` so keyboard and screen reader users land in the new content.
- **Skip link** to the main region.
- **Live results.** Feedback uses `role="status"` with `aria-live="polite"`. The
  countdown clock is `aria-hidden`, because announcing it every second would drown out
  everything else; the final result is announced instead.
- **Never colour alone.** Correct and incorrect carry a word and a border weight as well
  as a colour.
- **Targets.** Minimum 44×44px, per WCAG 2.5.8.
- **Motion.** `prefers-reduced-motion` disables transitions and animation.
- **Colour scheme.** Auto, light and dark. Auto follows `prefers-color-scheme`; the other
  two stamp `data-theme` on the root and win over it. The control is a radio group, because
  it is one choice out of three and that is what a screen reader should hear. All three
  palettes meet AA for body text and UI borders, on the app and the standalone pages.
- **No timing of reading.** The clock reads `ready` until the candidate starts, so nobody
  is scored on how long they spent on the instructions.
- **Zoom and reflow.** Fluid type and single-column reflow below 860px; usable at 320px
  wide and at 200% zoom.
- **Document language** is declared on every page, including the standalone ones.
- **Instructions before the task.** Each drill states its format and method, with a
  diagram, before the first timed run rather than only alongside it.
- **Grid navigation.** The visual-memory board is a roving-tabindex group: arrow keys move
  between cells, so a 36-cell board costs one tab stop rather than thirty-six.
- **Circle recall** names every cell (`C2` style): each location is announced as it is
  presented, and the recall buttons carry the same names plus the position already assigned
  to them, so the ordered response is reportable without sight. Every cell has a name, so a
  name never marks a target. The symmetry pattern itself is `aria-hidden` — it is a visual
  judgement with no text equivalent, and is labelled as such rather than faked.
- **Visual tasks get a text equivalent where one is possible.** The visual-memory pattern
  is announced by cell reference while it is on screen.
- **The logbook is a real table**, with `scope` on every header, a caption, and figures in
  a tabular-numeral font. The trend sparkline beside it is decorative-by-redundancy: every
  number it draws is in the table underneath, and it carries an `aria-label` saying what
  it plots. A wide table scrolls inside its own box; the page never scrolls sideways.
- **Destructive actions are reversible or confirmed.** Erasing the whole logbook asks
  first and names the count; erasing one drill's history does not, because the rest of the
  logbook survives it.

## Known gaps

- The moving-dot and sliding-block drills are inherently visual and have no non-visual
  equivalent. They are labelled as such rather than pretending otherwise.
- The legacy single-file drills in `public/legacy/` predate this standard. They now
  declare a language, carry a breadcrumb back to the index, open with a briefing, and pass
  the axe sweep below. Their keyboard order and screen-reader flow have still not been
  walked by hand. Porting them is tracked as the main open task.
- The legacy pages are light-only by design and declare `color-scheme: light` so the
  browser does not half-darken their controls. The ported drills follow the system theme.
- No automated axe run in CI yet. It is run by hand; wiring it into CI is open.

## Last axe-core sweep

axe-core 4.10.2, rules `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`. Clean across the
four React routes in **both** themes, the visual-memory drill's study, recall and review
states, and all nine standalone drills in dark as well as light.

One note for whoever runs this next: axe reads rendered colours, so sampling during a CSS
transition reports the interpolated value. A contrast failure that disappears on a second
run was measured mid-fade, not fixed by accident — settle the UI before asserting.

Fixed in that sweep:

- `color-contrast` — the logbook's destructive button hardcoded `#fff`, which is 2.43:1 on
  the dark theme's `--bad`. It now uses `--accent-ink` (7.0:1 light, 7.8:1 dark).
- `color-contrast` — the shared legacy breadcrumb and figure caption sat at 3.99:1 and
  3.49:1 on `--bezel`. Both were introduced by the shell, and both are fixed.
- `color-contrast` — `.answers kbd` and the `ndb` compass labels, at 11px, failed on every
  surface those pages use. Both now use `#525C66`, which clears 4.5:1 on all of them.
- `aria-prohibited-attr` — the legacy grids labelled cells with `aria-label` on a roleless
  `<div>`, which assistive technology discards, so the labels reached nobody. `shell.js`
  now gives them `role="img"`, and a `MutationObserver` keeps re-rendered cells labelled.
- `scrollable-region-focusable` — the logbook's horizontally scrolling table could not be
  reached from the keyboard. It now takes focus and has a visible ring.
- `color-contrast` — the standalone pages' primary button was unreadable in dark: a
  generated rule scoped as `:root[data-theme="dark"] .btn` outranked the page's own
  `.btn.primary` and painted the base grey over the blue, leaving near-black text on it.
  Generated rules are now scoped with `:where()`, which adds no specificity.
- `color-contrast` — the `e3` stimulus and the `ndb` aircraft silhouettes are drawn at
  runtime with an SVG `fill` attribute, which no stylesheet can reach. In dark they were
  `#18222C` on a `#1b2229` panel: 1.03:1, invisible. They use `currentColor` now. Worth
  remembering that an automated CSS sweep cannot find this class of bug.
- `color-contrast` — the shell's start button and selected theme chip hardcoded `#fff`,
  which is 2.4:1 on the dark theme's lighter blue. Both use a token now.

## Testing an accessibility change

1. Unplug the mouse and complete a full run.
2. Zoom to 200% and to 320px width.
3. Check both colour schemes.
4. Run a screen reader over one full question cycle.
