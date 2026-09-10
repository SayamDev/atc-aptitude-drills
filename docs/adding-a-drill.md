# Adding a drill

## 1. Research the format

Write down what you know and where it came from, in a comment at the top of `logic.ts`:
what the task is, how long the real test runs, how many items, whether it adapts, and
whether wrong answers are penalised. If a detail is uncertain, say so rather than guessing.

## 2. Write the logic first

Create `src/drills/<id>/logic.ts` containing pure functions only:

```ts
export interface Question { /* everything the component needs to render and mark */ }
export function makeQuestion(rng: Rng, opts: Options): Question
export function explain(q: Question): string   // used by hints and the review list
```

Take an `Rng` rather than calling `Math.random()` directly, so tests can seed it.

## 3. Test the logic

`logic.test.ts` should cover, at minimum:

- every generated question has exactly one correct answer, and it is reachable
- distractors are distinct from the answer and from each other
- any stated "optimal" (fewest moves, shortest route) really is optimal
- option filters do what they claim — a "hard" setting must actually be harder

Generate thousands of items in the test, not three.

## 4. Build the component

Use `DrillShell` for the frame, `Verdict` for feedback and `Report` for the end of a run.
Record every answer with `run.record({ correct, ms, tag })`. The `tag` is how a drill
reports its own breakdown — the navigation drill tags each attempt `up` or `down` so the
report can show that the user only struggles when the car faces them.

## 5. Write the briefing

Every drill opens with one, via `DrillShell`'s `briefing` prop and the shared
`Briefing` component. It needs four things:

- `format` — what actually happens, in order. Answers "what is about to happen to me?".
- `method` — the technique to practise. This is the same content as the aside, stated
  before it matters rather than during.
- `figure` — an inline SVG drawing the same rule. Not decoration: it should carry the
  method for someone who reads a picture faster than a paragraph. Use the tokens, and
  check every `<text>` fits inside the `viewBox` — measure it, do not eyeball it.
- `figureCaption` — one line saying what the picture shows.

## 6. Register it

Add an entry to `src/drills/registry.ts` with `status: 'react'` and the right `family`.
Pass `drillId` to `Report` so the run reaches the home page's progress board.

## Porting a legacy drill

The single-file drills in `public/legacy/` are working implementations. Port one by
lifting its generator into a typed `logic.ts`, writing tests against it, then rebuilding
the interface with the shared components. Keep the teaching content — the tips panels
and explanations are the most valuable part of each drill. The briefing text and diagram
already exist in `public/legacy/briefs.js`; move them across rather than rewriting them,
and delete the entry once the page is gone.
