import { useCallback, useEffect, useRef, useState } from 'react';

export interface Attempt {
  correct: boolean;
  ms: number;
  /** Free-form label so a drill can break its own results down (e.g. "heading-down"). */
  tag?: string;
}

/** Shared countdown and attempt log, so every drill reports in the same shape. */
export function useRun(durationMs: number) {
  const [running, setRunning] = useState(false);
  const [msLeft, setMsLeft] = useState(durationMs);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const endAt = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const left = Math.max(0, endAt.current - performance.now());
      setMsLeft(left);
      if (left <= 0) setRunning(false);
    }, 200);
    return () => window.clearInterval(id);
  }, [running]);

  const start = useCallback(() => {
    setAttempts([]);
    endAt.current = performance.now() + durationMs;
    setMsLeft(durationMs);
    setRunning(true);
  }, [durationMs]);

  const stop = useCallback(() => setRunning(false), []);
  const record = useCallback((a: Attempt) => setAttempts(xs => [...xs, a]), []);
  const reset = useCallback(() => { setAttempts([]); setMsLeft(durationMs); }, [durationMs]);

  return { running, msLeft, attempts, start, stop, record, reset };
}

export const accuracy = (as: Attempt[]) =>
  as.length ? Math.round((100 * as.filter(a => a.correct).length) / as.length) : null;

export const meanMs = (as: Attempt[]) =>
  as.length ? as.reduce((t, a) => t + a.ms, 0) / as.length : null;

/** Second half minus first half reaction time — the vigilance signal. */
export function drift(as: Attempt[]): number | null {
  const ok = as.filter(a => a.correct);
  if (ok.length < 6) return null;
  const half = Math.floor(ok.length / 2);
  const early = ok.slice(0, half).reduce((t, a) => t + a.ms, 0) / half;
  const late = ok.slice(half).reduce((t, a) => t + a.ms, 0) / (ok.length - half);
  return Math.round(late - early);
}

/**
 * Rounds up by default, which is what a countdown wants: 0.2s remaining still
 * reads as a second left. An elapsed clock has to round down instead, or it
 * shows 0:01 the instant it starts.
 */
export const clock = (ms: number, mode: 'countdown' | 'elapsed' = 'countdown') => {
  const s = mode === 'elapsed' ? Math.floor(ms / 1000) : Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
