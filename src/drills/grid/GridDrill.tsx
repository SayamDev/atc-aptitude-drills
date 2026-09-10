import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DrillShell } from '../../components/DrillShell';
import { Briefing } from '../../components/Briefing';
import { Report } from '../../components/Report';
import { Verdict, type Tone } from '../../components/Verdict';
import { randomRng } from '../../lib/rng';
import { useRun } from '../../lib/useRun';
import {
  LADDER, cellName, explain, makeTrial, mark, nextLevel, studyMs,
  type Mark, type Trial
} from './logic';
import { GridFigure } from './GridFigure';
import './grid.css';

const RUN_MS = 300_000;                      // Aon give gridChallenge about five minutes

type Phase = 'idle' | 'study' | 'recall' | 'review';

export function GridDrill() {
  const run = useRun(RUN_MS);
  const [slow, setSlow] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [level, setLevel] = useState(0);
  const [streak, setStreak] = useState(0);
  const [trial, setTrial] = useState<Trial>(() => makeTrial(randomRng, LADDER[0]));
  const [picked, setPicked] = useState<number[]>([]);
  const [result, setResult] = useState<Mark | null>(null);
  const [best, setBest] = useState(0);
  const [cursor, setCursor] = useState(0);
  const shownAt = useRef(0);
  const timers = useRef<number[]>([]);

  const clearTimers = () => { timers.current.forEach(window.clearTimeout); timers.current = []; };
  useEffect(() => clearTimers, []);

  const present = useCallback((atLevel: number) => {
    clearTimers();
    const t = makeTrial(randomRng, LADDER[atLevel]);
    setTrial(t);
    setPicked([]);
    setResult(null);
    setCursor(0);
    setPhase('study');
    timers.current.push(window.setTimeout(() => {
      setPhase('recall');
      shownAt.current = performance.now();
    }, studyMs(t.count, slow)));
  }, [slow]);

  const submit = useCallback((chosen: number[]) => {
    const m = mark(trial, chosen);
    setResult(m);
    setPhase('review');
    run.record({ correct: m.correct, ms: performance.now() - shownAt.current, tag: `n${trial.count}` });
    if (m.correct) setBest(b => Math.max(b, trial.count));

    const step = nextLevel(level, streak, m.correct);
    setLevel(step.level);
    setStreak(step.streak);
    timers.current.push(window.setTimeout(() => present(step.level), m.correct ? 900 : 2600));
  }, [trial, level, streak, run, present]);

  const toggle = useCallback((cell: number) => {
    if (phase !== 'recall') return;
    setPicked(prev => (prev.includes(cell) ? prev.filter(c => c !== cell) : [...prev, cell]));
  }, [phase]);

  // The real item advances as soon as the target number of cells is placed. This
  // has to be an effect rather than a branch inside the updater: a state updater
  // must stay pure, and React invokes it twice in development.
  useEffect(() => {
    if (phase !== 'recall' || picked.length !== trial.count) return;
    const id = window.setTimeout(() => submit(picked), 180);
    return () => window.clearTimeout(id);
  }, [picked, phase, trial.count, submit]);

  // Roving arrow-key navigation, so a 36-cell board does not cost 36 tab stops.
  const onGridKey = (e: React.KeyboardEvent) => {
    const { size } = trial;
    const move: Record<string, number> = {
      ArrowRight: 1, ArrowLeft: -1, ArrowDown: size, ArrowUp: -size
    };
    if (e.key in move) {
      e.preventDefault();
      const to = cursor + move[e.key];
      const wraps = (e.key === 'ArrowRight' && to % size === 0) || (e.key === 'ArrowLeft' && cursor % size === 0);
      if (to >= 0 && to < size * size && !wraps) setCursor(to);
    }
  };

  useEffect(() => {
    if (phase !== 'recall') return;
    document.querySelector<HTMLButtonElement>(`[data-cell="${cursor}"]`)?.focus();
  }, [cursor, phase]);

  const toggleRun = () => {
    if (run.running) { clearTimers(); run.stop(); setPhase('idle'); return; }
    setLevel(0); setStreak(0); setBest(0);
    run.start();
    present(0);
  };

  const spanCounts = useMemo(() => {
    const bySpan = new Map<number, { right: number; total: number }>();
    for (const a of run.attempts) {
      const n = Number(a.tag?.slice(1));
      const e = bySpan.get(n) ?? { right: 0, total: 0 };
      bySpan.set(n, { right: e.right + (a.correct ? 1 : 0), total: e.total + 1 });
    }
    return bySpan;
  }, [run.attempts]);

  const advice = useMemo(() => {
    if (run.attempts.length === 0) return 'Nothing attempted.';
    const missRate = run.attempts.filter(a => !a.correct).length / run.attempts.length;
    if (best <= 4)
      return 'Span of four or under. You are almost certainly reading the board cell by cell. Say the shape out loud instead — "top row pair, one under the gap" — and the load halves.';
    if (missRate > 0.5)
      return `Span ${best}, but over half the trials failed. You are being pushed past your ceiling and losing the easy ones on the way back down. Slow the study window on and rebuild from a clean base.`;
    if (best >= 8) return `Span ${best} — strong. Hold it under time pressure and the module is not your limiting factor.`;
    return `Span ${best}. The step from ${best} to ${best + 1} is a chunking step, not a memory step: look for the row runs before the pattern clears.`;
  }, [run.attempts, best]);

  const finished = !run.running && run.attempts.length > 0 && run.msLeft <= 0;
  const tone: Tone = !result ? 'neutral' : result.correct ? 'good' : 'bad';
  const feedback =
    phase === 'idle' ? 'Press start when you are ready.' :
    phase === 'study' ? 'Hold the pattern.' :
    phase === 'recall' ? `Place ${trial.count - picked.length} more.` :
    result ? explain(trial, result) : '';

  return (
    <DrillShell
      title="Visual memory"
      testCode="gridChallenge"
      summary="A pattern flashes, then clears. Reproduce it. The load rises while you keep getting it right."
      clockMs={run.running ? run.msLeft : null}
      running={run.running}
      runLabel={run.running ? 'Stop run' : 'Start 5-minute run'}
      onToggleRun={toggleRun}
      controls={
        <>
          <span className="grid__level">
            {trial.size}×{trial.size} · {trial.count} cells{best > 0 && ` · best span ${best}`}
          </span>
          <label className="field field--check">
            <input type="checkbox" checked={slow} onChange={e => setSlow(e.target.checked)} />
            <span>Longer study window</span>
          </label>
        </>
      }
      briefing={
        <Briefing
          testCode="gridChallenge"
          minutes={5}
          measures="Visual-spatial short-term memory"
          format={[
            <>A square grid appears with some cells lit in blue.</>,
            <>The pattern clears after a second or two. There is no warning beep — it simply goes.</>,
            <>Click the cells that were lit. The trial ends the moment you place the last one, so count as you go.</>,
            <>Get two right in a row and the grid or the number of cells goes up. Get one wrong and it comes back down.</>
          ]}
          method={[
            <><b>Never list coordinates.</b> Four separate cells sits at the edge of most people&rsquo;s raw span.</>,
            <><b>Read row runs.</b> Two side by side is one thing to remember, not two.</>,
            <><b>Name the shape</b> &mdash; &ldquo;pair top middle, pair below left&rdquo;. Words survive the blank screen.</>,
            <><b>Anchor to an edge.</b> Patterns floating in the middle are the ones that slip.</>
          ]}
          figure={<GridFigure />}
          figureCaption="Same four cells. Two pairs is half the load of four coordinates."
        />
      }
      aside={<GridTips />}
    >
      {finished ? (
        <Report
          drillId="grid"
          title="Five-minute run"
          attempts={run.attempts}
          extra={[
            { label: 'span', value: best ? String(best) : '—' },
            { label: 'top level', value: `${LADDER[level].size}×${LADDER[level].size}` }
          ]}
          advice={advice}
          onAgain={toggleRun}
          onPractice={() => { run.reset(); setLevel(0); setStreak(0); present(0); }}
        >
          {spanCounts.size > 0 && (
            <table className="grid__breakdown">
              <caption>Trials by load</caption>
              <thead><tr><th scope="col">cells</th><th scope="col">clean</th><th scope="col">shown</th></tr></thead>
              <tbody>
                {[...spanCounts.entries()].sort((a, b) => a[0] - b[0]).map(([n, v]) => (
                  <tr key={n}><th scope="row">{n}</th><td>{v.right}</td><td>{v.total}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Report>
      ) : (
        <>
          <p className="grid__ask">
            {phase === 'study' ? 'Study' : phase === 'recall' ? `Reproduce — ${trial.count} cells` : 'Ready'}
          </p>

          {/* The pattern is visual, so it is also read out for anyone who cannot see it. */}
          <p className="visually-hidden" role="status" aria-live="assertive">
            {phase === 'study' ? `Lit cells: ${trial.cells.map(c => cellName(c, trial.size)).join(', ')}.` : ''}
          </p>

          <div
            className="grid__board"
            style={{ '--cols': trial.size } as React.CSSProperties}
            role="group"
            aria-label={`${trial.size} by ${trial.size} grid`}
            onKeyDown={onGridKey}
          >
            {Array.from({ length: trial.size * trial.size }, (_, i) => {
              const lit = phase === 'study' && trial.cells.includes(i);
              const chosen = picked.includes(i);
              const missed = phase === 'review' && result?.misses.includes(i);
              const wrong = phase === 'review' && result?.falseAlarms.includes(i);
              const hit = phase === 'review' && result?.hits.includes(i);
              const cls = [
                'grid__cell',
                lit && 'is-lit', chosen && phase === 'recall' && 'is-chosen',
                hit && 'is-hit', missed && 'is-missed', wrong && 'is-wrong'
              ].filter(Boolean).join(' ');
              return (
                <button
                  key={i}
                  type="button"
                  data-cell={i}
                  className={cls}
                  tabIndex={phase === 'recall' && i === cursor ? 0 : -1}
                  disabled={phase !== 'recall'}
                  aria-pressed={phase === 'recall' ? chosen : undefined}
                  aria-label={cellName(i, trial.size)}
                  onFocus={() => setCursor(i)}
                  onClick={() => toggle(i)}
                >
                  {missed && <span aria-hidden="true" className="grid__glyph">·</span>}
                  {wrong && <span aria-hidden="true" className="grid__glyph">×</span>}
                </button>
              );
            })}
          </div>

          <Verdict tone={tone}>{feedback}</Verdict>
        </>
      )}
    </DrillShell>
  );
}

function GridTips() {
  return (
    <>
      <section className="panel">
        <h2>Chunk, do not list</h2>
        <ol>
          <li>Four separate cells is at the edge of raw span. Three <b>groups</b> is comfortable.</li>
          <li>Read the board in <b>row runs</b>: two together, a gap, one more.</li>
          <li>Name the shape — &ldquo;an L in the corner&rdquo; survives the blank screen; coordinates do not.</li>
          <li>Anchor to an edge or corner. Patterns floating in the middle are the ones that slip.</li>
        </ol>
      </section>
      <section className="panel">
        <h2>Under pressure</h2>
        <ol>
          <li>Place your <b>certain</b> cells first. Uncertainty grows while you hesitate.</li>
          <li>Count as you place. The board advances on the last cell, so a miscount ends the trial early.</li>
          <li>After a failure the load drops. Take the easy trial cleanly rather than rushing back up.</li>
        </ol>
      </section>
    </>
  );
}
