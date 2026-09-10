import { useEffect, useRef } from 'react';
import { recordRun } from '../lib/history';
import type { Attempt } from '../lib/useRun';
import { accuracy, meanMs } from '../lib/useRun';
import './report.css';

export interface Score { label: string; value: string; tone?: 'good' | 'bad' }

interface Props {
  /** Registry id. Given one, the run is remembered so the home page can show progress. */
  drillId?: string;
  title: string;
  attempts: Attempt[];
  /** Drill-specific figures shown alongside the standard ones. */
  extra?: Score[];
  advice: string;
  onAgain: () => void;
  onPractice: () => void;
  children?: React.ReactNode;
}

export function Report(p: Props) {
  const acc = accuracy(p.attempts);
  const mean = meanMs(p.attempts);
  const right = p.attempts.filter(a => a.correct).length;
  const headline = p.extra?.[0] ? `${p.extra[0].label} ${p.extra[0].value}` : undefined;

  const { drillId, attempts } = p;
  /*
   * Written once per finished run. React invokes effects twice in development,
   * and this one has no cleanup to undo, so without the guard every run landed
   * in the logbook twice. Keying on the run's own figures rather than a plain
   * "already ran" flag means a genuinely different run still gets recorded.
   */
  const written = useRef('');
  useEffect(() => {
    if (!drillId || attempts.length === 0) return;
    const key = `${drillId}|${attempts.length}|${accuracy(attempts)}|${meanMs(attempts)}|${headline ?? ''}`;
    if (written.current === key) return;
    written.current = key;
    recordRun({
      id: drillId, at: Date.now(), accuracy: accuracy(attempts),
      count: attempts.length, meanMs: meanMs(attempts), headline
    });
  }, [drillId, attempts, headline]);

  const scores: Score[] = [
    { label: 'correct', value: String(right), tone: 'good' },
    { label: 'wrong', value: String(p.attempts.length - right), tone: 'bad' },
    { label: 'accuracy', value: acc === null ? '—' : `${acc}%` },
    { label: 'per item', value: mean === null ? '—' : `${(mean / 1000).toFixed(1)}s` },
    ...(p.extra ?? [])
  ];

  return (
    <section className="report" aria-label={p.title}>
      <h2>{p.title}</h2>
      <dl className="report__scores">
        {scores.map(s => (
          <div key={s.label}>
            <dt>{s.label}</dt>
            <dd className={s.tone ? `report__v report__v--${s.tone}` : 'report__v'}>{s.value}</dd>
          </div>
        ))}
      </dl>
      <p className="report__advice">{p.advice}</p>
      {p.children}
      <div className="report__actions">
        <button className="btn btn--primary" onClick={p.onAgain}>Run again</button>
        <button className="btn" onClick={p.onPractice}>Untimed practice</button>
      </div>
    </section>
  );
}
