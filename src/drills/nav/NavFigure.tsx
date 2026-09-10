/**
 * The swing rule, drawn in the same before/after shape the drill itself uses, so
 * the picture and the task read the same way round. The example is deliberately
 * a car heading down the screen — the case people get wrong, because the car is
 * then facing them and its left is their right.
 */
const BOX = 74, AY = 20;
const AX = 34, BX = 192;

/** Arrow drawn from the centre of a box, pointing along a compass bearing. */
function CarArrow({ x, bearing, colour }: { x: number; bearing: number; colour: string }) {
  const cx = x + BOX / 2, cy = AY + BOX / 2, r = 22;
  const rad = (bearing * Math.PI) / 180;
  const tipX = cx + r * Math.sin(rad), tipY = cy - r * Math.cos(rad);
  const tailX = cx - r * Math.sin(rad), tailY = cy + r * Math.cos(rad);
  return (
    <line x1={tailX} y1={tailY} x2={tipX} y2={tipY}
          stroke={colour} strokeWidth="4" strokeLinecap="round" markerEnd={`url(#nf-${colour === 'var(--accent)' ? 'a' : 'm'})`} />
  );
}

export function NavFigure() {
  return (
    <svg viewBox="0 0 300 168" role="img"
         aria-label="Before: the car points down the screen. After: it points left. The swing between them is clockwise, which is a right turn — two notches, so a turn rather than a bear.">
      <defs>
        <marker id="nf-m" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--ink-muted)" />
        </marker>
        <marker id="nf-a" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)" />
        </marker>
        <marker id="nf-g" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--good)" />
        </marker>
      </defs>

      <rect x={AX} y={AY} width={BOX} height={BOX} rx="4" fill="var(--surface)" stroke="var(--line)" />
      <rect x={BX} y={AY} width={BOX} height={BOX} rx="4" fill="var(--surface)" stroke="var(--line)" />

      <CarArrow x={AX} bearing={180} colour="var(--ink-muted)" />
      <CarArrow x={BX} bearing={270} colour="var(--accent)" />

      {/* The swing itself: over the gap, bowing upward so its direction is unmistakable. */}
      <path d={`M ${AX + BOX + 6} ${AY + 34} Q 150 ${AY - 6} ${BX - 6} ${AY + 34}`}
            fill="none" stroke="var(--good)" strokeWidth="2.5" markerEnd="url(#nf-g)" />

      <text x={AX + BOX / 2} y={AY + BOX + 18} textAnchor="middle"
            fill="var(--ink-muted)" fontSize="12" fontFamily="var(--font)">before</text>
      <text x={BX + BOX / 2} y={AY + BOX + 18} textAnchor="middle"
            fill="var(--ink-muted)" fontSize="12" fontFamily="var(--font)">after</text>

      <text x="150" y="138" textAnchor="middle" fill="var(--good)"
            fontSize="13" fontWeight="600" fontFamily="var(--font)">clockwise swing = right turn</text>
      <text x="150" y="158" textAnchor="middle" fill="var(--ink-muted)"
            fontSize="12" fontFamily="var(--font)">two notches, so a turn — not &ldquo;it points left&rdquo;</text>
    </svg>
  );
}
