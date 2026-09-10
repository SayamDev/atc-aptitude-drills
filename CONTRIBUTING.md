# Contributing

## Ground rules

1. **No real test items.** Never add content copied from a live assessment, and never
   claim material is "the real questions". Build from publicly documented formats and
   say where the format description came from.
2. **Logic is tested.** Anything that generates a puzzle or decides an answer needs unit
   tests. A drill that marks a correct answer wrong is worse than no drill.
3. **Explain, don't just score.** Every drill should teach a method and report *where*
   the user is losing marks, not just how many.
4. **Accessible by default.** Keyboard operable, focus visible, no colour-only signals.

## Workflow

```bash
npm install
npm run dev
npm test -- --watch
```

Before opening a pull request: `npm run typecheck && npm test && npm run build`.

## Style

- TypeScript, `strict` on.
- Pure logic in `logic.ts`, React in the component. No DOM access in logic files.
- Plain CSS with the tokens in `src/styles/tokens.css`. No hardcoded colours.
- Comments explain *why*, not what.

## Adding a drill

See [docs/adding-a-drill.md](docs/adding-a-drill.md).
