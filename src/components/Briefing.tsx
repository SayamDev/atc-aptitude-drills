import type { ReactNode } from 'react';
import './briefing.css';

export interface BriefingProps {
  /** The module code as it appears in an invitation email. */
  testCode: string;
  minutes: number;
  measures: string;
  /** How an item actually runs, in order. Answers "what is about to happen?". */
  format: ReactNode[];
  /** The method to practise. This is the teaching content, not filler. */
  method: ReactNode[];
  /** A worked example, drawn rather than described, for anyone who reads pictures first. */
  figure: ReactNode;
  figureCaption: string;
}

/**
 * Shown before the first run of every drill: what the module is, how an item
 * runs, the method, and the same rule as a picture. A candidate who starts
 * cold learns the interface instead of the test.
 */
export function Briefing(p: BriefingProps) {
  return (
    <section className="brief" aria-label="How this drill works">
      <p className="brief__meta">
        <span className="brief__code">{p.testCode}</span>
        <span>{p.minutes} min test</span>
        <span>{p.measures}</span>
      </p>

      <div className="brief__cols">
        <div className="brief__text">
          <h2>What happens</h2>
          <ol className="brief__list">{p.format.map((f, i) => <li key={i}>{f}</li>)}</ol>

          <h2>The method</h2>
          <ol className="brief__list">{p.method.map((m, i) => <li key={i}>{m}</li>)}</ol>
        </div>

        <figure className="brief__figure">
          {p.figure}
          <figcaption>{p.figureCaption}</figcaption>
        </figure>
      </div>
    </section>
  );
}
