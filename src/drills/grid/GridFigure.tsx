/**
 * The chunking rule, drawn: the identical pattern held as four coordinates
 * (over raw span for most people) and as two pairs (comfortably inside it).
 */
const CELL = 24, GAP = 4, N = 4;
const at = (i: number, ox: number, oy: number) => ({
  x: ox + (i % N) * (CELL + GAP),
  y: oy + Math.floor(i / N) * (CELL + GAP)
});

function Board({ ox, lit, groups }: { ox: number; lit: number[]; groups?: number[][] }) {
  const oy = 34;
  return (
    <>
      {Array.from({ length: N * N }, (_, i) => {
        const { x, y } = at(i, ox, oy);
        const on = lit.includes(i);
        return (
          <rect key={i} x={x} y={y} width={CELL} height={CELL} rx="3"
                fill={on ? 'var(--accent)' : 'var(--surface)'}
                stroke="var(--line)" strokeWidth="1" />
        );
      })}
      {groups?.map((g, k) => {
        const first = at(g[0], ox, oy), last = at(g[g.length - 1], ox, oy);
        return (
          <rect key={k} x={first.x - 5} y={first.y - 5}
                width={last.x - first.x + CELL + 10} height={last.y - first.y + CELL + 10}
                rx="6" fill="none" stroke="var(--good)" strokeWidth="2" strokeDasharray="5 3" />
        );
      })}
    </>
  );
}

export function GridFigure() {
  return (
    <svg viewBox="0 0 300 168" role="img"
         aria-label="The same four lit cells shown twice: on the left held as four separate coordinates, on the right held as two adjacent pairs.">
      <text x="14" y="22" fill="var(--ink-muted)" fontSize="12" fontFamily="var(--font)">listing</text>
      <text x="170" y="22" fill="var(--ink-muted)" fontSize="12" fontFamily="var(--font)">chunking</text>

      <Board ox={14} lit={[1, 2, 8, 9]} />
      <Board ox={170} lit={[1, 2, 8, 9]} groups={[[1, 2], [8, 9]]} />

      <text x="14" y="152" fill="var(--bad)" fontSize="12.5" fontWeight="600" fontFamily="var(--font)">
        4 things to hold
      </text>
      <text x="170" y="152" fill="var(--good)" fontSize="12.5" fontWeight="600" fontFamily="var(--font)">
        2 things to hold
      </text>
    </svg>
  );
}
