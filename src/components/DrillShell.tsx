import { useEffect, useState, type ReactNode } from 'react';
import { clock } from '../lib/useRun';
import './drill-shell.css';

interface Props {
  title: string;
  testCode: string;
  summary: string;
  /** Live clock text: a countdown during a run, per-question time otherwise. */
  clockMs: number | null;
  /**
   * 'countdown' is time remaining and warns when it runs low. 'elapsed' counts
   * up, for a self-paced test that has no deadline to warn about.
   */
  clockMode?: 'countdown' | 'elapsed';
  running: boolean;
  onToggleRun: () => void;
  runLabel: string;
  controls?: ReactNode;
  aside?: ReactNode;
  /**
   * Instructions shown before the first run. While it is open it replaces the
   * stage, so a candidate reads the format before meeting it under a clock.
   */
  briefing?: ReactNode;
  /**
   * Called when the candidate leaves the instructions without starting a run.
   * A drill that times each item from the moment it was built must re-anchor
   * here, or reading time is charged to the first answer.
   */
  onBegin?: () => void;
  /** 'quiet' when the stage itself owns the primary action, so they do not compete. */
  runTone?: 'primary' | 'quiet';
  children: ReactNode;
}

export function DrillShell(p: Props) {
  const [showBrief, setShowBrief] = useState(true);

  // Starting a run always dismisses the instructions, however the run began.
  useEffect(() => { if (p.running) setShowBrief(false); }, [p.running]);

  const briefOpen = Boolean(p.briefing) && showBrief;
  // While the instructions are open the clock is timing reading, not answering.
  const clockMs = briefOpen ? null : p.clockMs;
  const low = p.clockMode !== 'elapsed' && p.running && clockMs !== null && clockMs < 30_000;

  return (
    <div className={`drill${briefOpen ? ' drill--brief' : ''}`}>
      <header className="panel drill__head">
        <div>
          <h1>{p.title}</h1>
          <p className="drill__summary">{p.summary}</p>
        </div>
        <div className="drill__clock-wrap">
          <p
            className={`drill__clock${low ? ' drill__clock--low' : ''}`}
            /* Announced only at the end of a run; a live countdown would flood a screen reader. */
            aria-hidden="true"
          >
            {clockMs === null ? 'ready'
              : p.clockMode === 'elapsed' ? clock(clockMs, 'elapsed')
              : p.running ? clock(clockMs)
              : `${(clockMs / 1000).toFixed(1)}s`}
          </p>
          <span className="visually-hidden">Test code {p.testCode}</span>
        </div>
      </header>

      <main id="main" className="panel drill__stage" tabIndex={-1}>
        {briefOpen ? (
          <>
            {p.briefing}
            <div className="drill__controls">
              <button className="btn btn--primary" onClick={p.onToggleRun}>{p.runLabel}</button>
              <button
                className="btn"
                onClick={() => { setShowBrief(false); p.onBegin?.(); }}
              >
                Skip to practice
              </button>
            </div>
          </>
        ) : (
          <>
            {p.children}
            <div className="drill__controls">
              <button
                className={`btn${p.runTone === 'quiet' ? '' : ' btn--primary'}`}
                onClick={p.onToggleRun}
              >
                {p.runLabel}
              </button>
              {p.controls}
              {p.briefing && (
                <button className="btn btn--quiet" onClick={() => setShowBrief(true)}>How it works</button>
              )}
            </div>
          </>
        )}
      </main>

      {p.aside && !briefOpen && <aside className="drill__aside">{p.aside}</aside>}
    </div>
  );
}
