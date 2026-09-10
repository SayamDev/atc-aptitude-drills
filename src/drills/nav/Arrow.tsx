import type { Bearing } from './logic';
import { BEARING_NAME } from './logic';

/** A single heading arrow. Always labelled, so it is not colour or shape alone. */
export function Arrow({ bearing, tone = 'ink', size = 96 }:
  { bearing: Bearing; tone?: 'ink' | 'accent'; size?: number }) {
  const colour = tone === 'accent' ? 'var(--accent)' : 'var(--ink)';
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img"
         aria-label={`pointing ${BEARING_NAME[bearing]}`}>
      <g transform={`rotate(${bearing} 50 50)`}>
        <line x1="50" y1="78" x2="50" y2="32" stroke={colour} strokeWidth="10" strokeLinecap="round" />
        <polygon points="50,12 30,44 70,44" fill={colour} />
      </g>
    </svg>
  );
}
