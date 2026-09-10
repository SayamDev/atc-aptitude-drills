import './sparkline.css';

interface Props {
  /** Oldest first. Nulls are runs that scored nothing and are skipped. */
  values: (number | null)[];
  /** Fixed scale, so two drills side by side are actually comparable. */
  max?: number;
  label: string;
}

/**
 * A run of accuracies, drawn small. Deliberately unlabelled: it answers
 * "is this going up?" at a glance, and the table underneath answers everything
 * else. Fewer than two points is not a trend, so nothing is drawn.
 */
export function Sparkline({ values, max = 100, label }: Props) {
  const pts = values.map((v, i) => ({ v, i })).filter(p => p.v !== null) as { v: number; i: number }[];
  if (pts.length < 2) return null;

  const w = 100, h = 32, pad = 4;
  const stepX = (w - pad * 2) / Math.max(1, values.length - 1);
  const y = (v: number) => h - pad - (Math.max(0, Math.min(max, v)) / max) * (h - pad * 2);
  const x = (i: number) => pad + i * stepX;
  const d = pts.map((p, k) => `${k === 0 ? 'M' : 'L'} ${x(p.i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  const rising = last.v >= pts[0].v;
  const tone = rising ? 'var(--good)' : 'var(--bad)';
  // Filled to the floor: at this size a bare line is too easy to miss.
  const area = `${d} L ${x(last.i).toFixed(1)} ${h - pad} L ${x(pts[0].i).toFixed(1)} ${h - pad} Z`;

  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} preserveAspectRatio="none">
      <line x1="0" y1={h - pad} x2={w} y2={h - pad} stroke="var(--line)" strokeWidth="1"
            vectorEffect="non-scaling-stroke" />
      <path d={area} fill={tone} opacity="0.16" />
      <path d={d} fill="none" strokeWidth="1.8" vectorEffect="non-scaling-stroke"
            stroke={tone} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last.i)} cy={y(last.v)} r="2.6" fill={tone} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
