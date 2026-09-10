# Architecture

Moved out of the README so that the front page stays readable for people who
are not going to open the source. Nothing here has changed.

## How the code is laid out

```
src/
  lib/           rng.ts (seedable PRNG), useRun.ts (timer + attempt log),
                 history.ts (the logbook: pure aggregation + a thin storage layer)
  components/    DrillShell, Briefing, Report, Verdict, Logbook, Sparkline
  drills/
    registry.ts  one entry per drill; drives the home page
    nav/         logic.ts (pure, tested) + NavDrill.tsx (presentation)
    grid/        the same shape, for gridChallenge
public/legacy/   standalone single-file drills, still fully playable
  shell.js       shared chrome for those pages: breadcrumb, lang, briefing host
  briefs.js      per-page briefing content and diagrams
```

The important rule: **puzzle logic is pure and lives in `logic.ts`, separate from the
component.** Generators and solvers are where the real bugs hide — a spatial drill that
silently marks a correct answer wrong teaches the wrong thing — so that code is
dependency-free, seedable and unit tested.

`public/legacy/` holds the original single-file versions. They work today and are linked
from the home page; porting them to the React shell is the main open task. See
[docs/adding-a-drill.md](docs/adding-a-drill.md).

## Light and dark

A three-way control in the top bar: **Auto** follows the system setting, **Light** and
**Dark** override it. The choice is stored under one key and honoured by the standalone
drills too, so it is made once for the whole site. Both the app and those pages apply it
in a small inline script before first paint, so navigating never flashes the wrong theme.
