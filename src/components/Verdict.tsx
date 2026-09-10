import './verdict.css';

export type Tone = 'neutral' | 'good' | 'bad';

/**
 * Feedback line. Uses aria-live so the result reaches screen readers, and always
 * carries a word as well as a colour — colour is never the only signal.
 */
export function Verdict({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <p className={`verdict verdict--${tone}`} role="status" aria-live="polite">
      {children}
    </p>
  );
}
