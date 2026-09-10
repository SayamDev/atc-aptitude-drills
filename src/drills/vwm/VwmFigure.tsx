/**
 * The structure of the task, drawn: encoding and processing alternate, and
 * recall comes only at the end of the run. That interleaving is the whole
 * difference between this and a simple memory test, so it is what the figure
 * shows rather than any advice about the locations themselves.
 */
const Y = 34, BOX = 34;

function Judge({ x }: { x: number }) {
  return (
    <>
      <rect x={x} y={Y} width={BOX} height={BOX} rx="3"
            fill="var(--surface)" stroke="var(--line)" />
      {[0, 1, 2, 3].map(r =>
        [0, 1, 2, 3].map(c => {
          // A small mirror-symmetric motif, echoing the real judgement.
          const on = (c === 1 || c === 2) ? r % 2 === 0 : r === 1;
          return on ? (
            <rect key={`${r}-${c}`} x={x + 5 + c * 6} y={Y + 5 + r * 6}
                  width="6" height="6" fill="var(--ink-muted)" />
          ) : null;
        })
      )}
    </>
  );
}

function Locate({ x, at }: { x: number; at: number }) {
  const cell = 8;
  return (
    <>
      <rect x={x} y={Y} width={BOX} height={BOX} rx="3"
            fill="var(--surface)" stroke="var(--line)" />
      <rect x={x + 3 + (at % 3) * cell} y={Y + 3 + Math.floor(at / 3) * cell}
            width={cell} height={cell} rx="2" fill="var(--accent)" />
    </>
  );
}

const Arrow = ({ x }: { x: number }) => (
  <path d={`M${x} ${Y + BOX / 2} h10`} stroke="var(--ink-muted)" strokeWidth="1.5"
        markerEnd="url(#vwm-a)" fill="none" />
);

export function VwmFigure() {
  return (
    <svg viewBox="0 0 300 132" role="img"
         aria-label="A run alternates: judge a pattern, then a location appears, then judge again, then another location. Only at the end of the run is the order recalled.">
      <defs>
        <marker id="vwm-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--ink-muted)" />
        </marker>
      </defs>

      <text x="8" y="20" fill="var(--ink-muted)" fontSize="11.5" fontFamily="var(--font)">one run</text>

      <Judge x={8} />
      <Arrow x={44} />
      <Locate x={58} at={1} />
      <Arrow x={94} />
      <Judge x={108} />
      <Arrow x={144} />
      <Locate x={158} at={5} />
      <Arrow x={194} />

      <rect x={208} y={Y} width={BOX + 10} height={BOX} rx="3"
            fill="none" stroke="var(--good)" strokeWidth="2" strokeDasharray="4 3" />
      <text x={230} y={Y + 21} textAnchor="middle" fill="var(--good)"
            fontSize="11" fontWeight="600" fontFamily="var(--font)">recall</text>

      <text x="8" y="92" fill="var(--ink-muted)" fontSize="11.5" fontFamily="var(--font)">judge</text>
      <text x="58" y="92" fill="var(--accent)" fontSize="11.5" fontFamily="var(--font)">remember</text>
      <text x="108" y="92" fill="var(--ink-muted)" fontSize="11.5" fontFamily="var(--font)">judge</text>
      <text x="158" y="92" fill="var(--accent)" fontSize="11.5" fontFamily="var(--font)">remember</text>

      <text x="8" y="118" fill="var(--ink)" fontSize="12" fontWeight="600" fontFamily="var(--font)">
        The judgements are what stop you rehearsing.
      </text>
    </svg>
  );
}
