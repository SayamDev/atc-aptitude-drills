import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Briefing } from '../../components/Briefing';
import { DrillShell } from '../../components/DrillShell';
import { Report } from '../../components/Report';
import { Verdict, type Tone } from '../../components/Verdict';
import { randomRng } from '../../lib/rng';
import {
  MATRIX_N, MAX_ABSOLUTE_SPAN, PRACTICE_ITEMS, PROCESSING_TARGET, SQUARE_MS, SYMMETRY_N,
  buildMatrix, buildSession, cellName, computeDeadline, generateSymmetry, scoreSession,
  scoreTrial, type SymmetryItem, type Trial, type TrialRecord
} from './logic';
import { VwmFigure } from './VwmFigure';
import './vwm.css';

/**
 * Explicit phases. The session and the current trial live in state and survive
 * every transition — nothing is regenerated when the screen changes.
 */
type Phase = 'idle' | 'practice' | 'processing' | 'square' | 'recall' | 'feedback' | 'complete';

const MATRIX = buildMatrix();
const pct = (v: number) => `${Math.round(v * 100)}%`;

export function VwmDrill() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [session, setSession] = useState<Trial[]>([]);
  const [trialIndex, setTrialIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [item, setItem] = useState<SymmetryItem | null>(null);
  const [response, setResponse] = useState<string[]>([]);
  const [records, setRecords] = useState<TrialRecord[]>([]);
  const [lastScore, setLastScore] = useState<ReturnType<typeof scoreTrial> | null>(null);

  const [practiceTimes, setPracticeTimes] = useState<number[]>([]);
  const [practiceLeft, setPracticeLeft] = useState(PRACTICE_ITEMS);
  const [deadline, setDeadline] = useState(0);
  /* Warm-up is marked. Without feedback people rush it, and because the deadline
     is derived from these times, a rushed warm-up produces a cut-off they then
     cannot meet — every judgement times out and the run races past them. */
  const [practiceMark, setPracticeMark] = useState<'right' | 'wrong' | null>(null);
  /** Milliseconds left on the current judgement, for the visible countdown. */
  const [judgeLeft, setJudgeLeft] = useState(0);
  /** Set when a judgement ran out of time, so the skip is never silent. */
  const [timedOut, setTimedOut] = useState(false);
  /** Elapsed session time. The test is self-paced, so the header counts up. */
  const [elapsed, setElapsed] = useState<number | null>(null);
  const startedAt = useRef(0);

  const tally = useRef({ correct: 0, total: 0, timeouts: 0 });
  const itemShownAt = useRef(0);
  const recallStart = useRef(0);
  const timers = useRef<number[]>([]);

  const clearTimers = () => { timers.current.forEach(window.clearTimeout); timers.current = []; };
  useEffect(() => clearTimers, []);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const trial = session[trialIndex];

  useEffect(() => {
    if (phase === 'idle') return;
    const id = window.setInterval(() => setElapsed(performance.now() - startedAt.current), 500);
    return () => window.clearInterval(id);
  }, [phase]);

  /** Show the location for this step, then move on to the next pair or to recall. */
  const showSquare = useCallback((t: Trial, at: number) => {
    setPhase('square');
    later(() => {
      if (at + 1 < t.setSize) {
        setStep(at + 1);
        setItem(t.processing[at + 1]);
        itemShownAt.current = performance.now();
        setPhase('processing');
      } else {
        setResponse([]);
        recallStart.current = performance.now();
        setPhase('recall');
      }
    }, SQUARE_MS);
  }, []);

  const answerProcessing = useCallback((saidSymmetric: boolean | null) => {
    if (!trial || phase !== 'processing' || !item) return;
    clearTimers();
    tally.current.total++;
    if (saidSymmetric === null) tally.current.timeouts++;
    else if (saidSymmetric === item.symmetric) tally.current.correct++;
    if (saidSymmetric !== null) setTimedOut(false);
    showSquare(trial, step);
  }, [trial, phase, item, step, showSquare]);

  /* The processing deadline is a hard cut: running over is a processing error. */
  useEffect(() => {
    if (phase !== 'processing' || deadline <= 0) return;
    const id = window.setTimeout(() => { setTimedOut(true); answerProcessing(null); }, deadline);
    timers.current.push(id);
    return () => window.clearTimeout(id);
  }, [phase, deadline, step, trialIndex, answerProcessing]);

  /* Shown as a bar. Driven by an interval, not a CSS animation, because the
     reduced-motion rule would otherwise collapse it to nothing. */
  useEffect(() => {
    if (phase !== 'processing' || deadline <= 0) { setJudgeLeft(0); return; }
    const end = performance.now() + deadline;
    setJudgeLeft(deadline);
    const id = window.setInterval(() => setJudgeLeft(Math.max(0, end - performance.now())), 80);
    return () => window.clearInterval(id);
  }, [phase, deadline, step, trialIndex]);

  const startTrial = useCallback((s: Trial[], index: number) => {
    clearTimers();
    tally.current = { correct: 0, total: 0, timeouts: 0 };
    setTrialIndex(index);
    setStep(0);
    setItem(s[index].processing[0]);
    itemShownAt.current = performance.now();
    setPhase('processing');
  }, []);

  const begin = () => {
    clearTimers();
    setRecords([]);
    setPracticeTimes([]);
    setPracticeLeft(PRACTICE_ITEMS);
    setPracticeMark(null);
    setTimedOut(false);
    startedAt.current = performance.now();
    setElapsed(0);
    setItem(generateSymmetry(randomRng));
    itemShownAt.current = performance.now();
    setPhase('practice');
  };

  const answerPractice = (saidSymmetric: boolean) => {
    if (!item || practiceMark !== null) return;
    const times = [...practiceTimes, performance.now() - itemShownAt.current];
    const remaining = practiceLeft - 1;
    setPracticeTimes(times);
    setPracticeLeft(remaining);
    setPracticeMark(saidSymmetric === item.symmetric ? 'right' : 'wrong');

    later(() => {
      setPracticeMark(null);
      if (remaining > 0) {
        setItem(generateSymmetry(randomRng));
        itemShownAt.current = performance.now();
        return;
      }
      setDeadline(computeDeadline(times));
      const s = buildSession(randomRng);
      setSession(s);
      startTrial(s, 0);
    }, 550);
  };

  const stop = () => { clearTimers(); setPhase('idle'); setElapsed(null); };

  const tapCell = (id: string) => {
    if (phase !== 'recall' || !trial) return;
    setResponse(prev =>
      prev.includes(id) ? prev.filter(c => c !== id)
      : prev.length >= trial.setSize ? prev
      : [...prev, id]);
  };

  const submit = () => {
    if (!trial || phase !== 'recall') return;
    const sc = scoreTrial(trial, response);
    setLastScore(sc);
    setRecords(rs => [...rs, {
      ...sc,
      processingCorrect: tally.current.correct,
      processingTotal: tally.current.total,
      processingTimeouts: tally.current.timeouts,
      recallMs: Math.round(performance.now() - recallStart.current)
    }]);
    setPhase('feedback');
  };

  const advance = () => {
    const next = trialIndex + 1;
    if (next >= session.length) { setPhase('complete'); return; }
    startTrial(session, next);
  };

  const overall = useMemo(() => scoreSession(records), [records]);
  const attempts = useMemo(
    () => records.map(r => ({ correct: r.perfect, ms: r.recallMs, tag: `n${r.setSize}` })),
    [records]
  );

  const advice = useMemo(() => {
    if (records.length === 0) return 'Nothing completed.';
    if (!overall.processingValid)
      return `Symmetry accuracy ${pct(overall.processingAccuracy)}, below the ${pct(PROCESSING_TARGET)} the task expects. The span figure is not trustworthy at that level — the standard reading is that the judgements were being skipped to protect the locations.`;
    if (overall.absoluteSpan === 0)
      return 'No set recalled perfectly. Order is what usually breaks first: rehearse the path between locations rather than the locations themselves.';
    if (overall.partialCreditUnit - overall.absoluteSpan / MAX_ABSOLUTE_SPAN > 0.25)
      return `You are recalling most locations but losing the order — partial credit ${pct(overall.partialCreditUnit)} against an absolute span of ${overall.absoluteSpan}. Encode the sequence as a route, not a set of points.`;
    return `Absolute span ${overall.absoluteSpan} of ${MAX_ABSOLUTE_SPAN}, partial credit ${pct(overall.partialCreditUnit)}, symmetry ${pct(overall.processingAccuracy)}. Longest set held perfectly: ${overall.bestSetSize}.`;
  }, [records, overall]);

  const running = phase !== 'idle' && phase !== 'complete';
  const tone: Tone = !lastScore ? 'neutral' : lastScore.perfect ? 'good' : 'bad';

  return (
    <DrillShell
      title="Visual working memory"
      testCode="spatial complex span"
      summary="Judge a pattern, remember a location, repeat. Recall the whole run in order."
      clockMs={elapsed}
      clockMode="elapsed"
      running={running}
      runLabel={running ? 'Stop test' : 'Start test'}
      onToggleRun={running ? stop : begin}
      runTone={running ? 'quiet' : 'primary'}
      onBegin={() => setPhase('idle')}
      controls={
        running && phase !== 'practice' && trial
          ? <span className="vwm__level">trial {trialIndex + 1} of {session.length} · {trial.setSize} locations</span>
          : undefined
      }
      aside={running ? <VwmTips /> : undefined}
      briefing={
        <Briefing
          testCode="spatial complex span"
          minutes={8}
          measures="Visuo-spatial working memory capacity"
          format={[
            <>First a short warm-up of symmetry judgements. It sets your own time limit for the rest of the test — nothing is scored.</>,
            <>Then each run alternates: <b>judge a pattern, then a circle appears briefly. Judge, circle, judge, circle.</b> Runs are two to five circles long.</>,
            <>At the end of a run the grid returns empty. Tap the locations <b>in the order they appeared</b>.</>,
            <>Twelve runs, three at each length, shuffled. Keep the symmetry judgements above {pct(PROCESSING_TARGET)} or the span figure does not count.</>
          ]}
          method={[
            <><b>Encode a route, not a set.</b> Order is scored, and it is what breaks first.</>,
            <><b>Do the judgement properly.</b> Stalling on it to rehearse is what the time limit exists to stop, and it is scored against you.</>,
            <><b>Link each new location to the last one</b> — a direction and a distance is one step, a coordinate is a new item.</>,
            <>Anchor to the edges and corners. Locations floating in the middle go first.</>
          ]}
          figure={<VwmFigure />}
          figureCaption="Judge, then remember, then judge again. The interleaving is what makes it working memory."
        />
      }
    >
      {phase === 'complete' ? (
        <Report
          drillId="vwm"
          title="Session complete"
          attempts={attempts}
          extra={[
            { label: 'absolute span', value: `${overall.absoluteSpan}/${MAX_ABSOLUTE_SPAN}` },
            { label: 'partial credit', value: pct(overall.partialCreditUnit) },
            { label: 'symmetry', value: pct(overall.processingAccuracy), tone: overall.processingValid ? 'good' : 'bad' },
            { label: 'best run', value: String(overall.bestSetSize) }
          ]}
          advice={advice}
          onAgain={begin}
          onPractice={begin}
        >
          <table className="vwm__table">
            <caption>Every run</caption>
            <thead>
              <tr>
                <th scope="col">length</th><th scope="col">in order</th>
                <th scope="col">any order</th><th scope="col">symmetry</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i}>
                  <th scope="row">{r.setSize}</th>
                  <td>{r.correctInPosition}/{r.setSize}</td>
                  <td>{r.correctAnyPosition}/{r.setSize}</td>
                  <td>{r.processingCorrect}/{r.processingTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Report>
      ) : phase === 'idle' ? (
        <p className="vwm__idle">Press start when you are ready.</p>
      ) : phase === 'practice' || phase === 'processing' ? (
        <div className="vwm__judge">
          <p className="vwm__phase">
            {phase === 'practice'
              ? `Warm-up — ${practiceLeft} to go`
              : `Run ${trialIndex + 1} · is this symmetrical?`}
          </p>
          {item && <SymmetryGrid item={item} />}

          {/* The limit has to be visible, or running out of time reads as the
              test skipping ahead on its own. */}
          {phase === 'processing' && deadline > 0 && (
            <div
              className={`vwm__deadline${judgeLeft < deadline * 0.3 ? ' is-low' : ''}`}
              role="timer"
              aria-label={`${Math.ceil(judgeLeft / 1000)} seconds left to answer`}
            >
              <span style={{ width: `${(judgeLeft / deadline) * 100}%` }} />
            </div>
          )}

          <div className="vwm__judge-actions">
            <button
              className="btn btn--primary"
              disabled={practiceMark !== null}
              onClick={() => phase === 'practice' ? answerPractice(true) : answerProcessing(true)}
            >
              Symmetrical
            </button>
            <button
              className="btn btn--primary"
              disabled={practiceMark !== null}
              onClick={() => phase === 'practice' ? answerPractice(false) : answerProcessing(false)}
            >
              Not symmetrical
            </button>
          </div>

          {phase === 'practice' ? (
            <Verdict tone={practiceMark === 'right' ? 'good' : practiceMark === 'wrong' ? 'bad' : 'neutral'}>
              {practiceMark === 'right' ? 'Correct.'
                : practiceMark === 'wrong' ? `Not symmetrical about the centre line.`
                : 'Answer at the speed you actually mean to work at — this sets your time limit.'}
            </Verdict>
          ) : (
            <p className="vwm__count">
              {Math.ceil(judgeLeft / 1000)}s left · location {step + 1} of {trial?.setSize}
            </p>
          )}
        </div>
      ) : (
        <>
          <p className="vwm__phase">
            {phase === 'square' && timedOut ? `Out of time — remember this anyway (${step + 1} of ${trial?.setSize})`
              : phase === 'square' ? `Remember this — ${step + 1} of ${trial?.setSize}`
              : phase === 'recall' ? 'Tap the locations in the order they appeared'
              : lastScore?.perfect ? 'Run recalled exactly' : 'Run not exact'}
          </p>

          {/* The task is otherwise unavailable without sight, so each location is
              named as it appears and the recall cells carry the same names. */}
          <p className="visually-hidden" role="status" aria-live="assertive">
            {phase === 'square' && trial ? `Location ${step + 1}: ${cellName(trial.sequence[step])}.` : ''}
          </p>

          <div
            className="vwm__matrix"
            role="group"
            aria-label={`${MATRIX_N} by ${MATRIX_N} location grid`}
            style={{ '--n': MATRIX_N } as React.CSSProperties}
          >
            {MATRIX.map(cell => {
              const lit = phase === 'square' && trial && trial.sequence[step] === cell.id;
              const order = response.indexOf(cell.id);
              const shown = phase === 'feedback' && trial ? trial.sequence.indexOf(cell.id) : -1;
              const rightHere = phase === 'feedback' && trial && trial.sequence[order] === cell.id && order >= 0;
              const cls = [
                'vwm__cell',
                lit && 'is-lit',
                phase === 'recall' && order >= 0 && 'is-chosen',
                phase === 'feedback' && order >= 0 && (rightHere ? 'is-hit' : 'is-wrong'),
                phase === 'feedback' && order < 0 && shown >= 0 && 'is-missed'
              ].filter(Boolean).join(' ');
              return (
                <button
                  key={cell.id}
                  type="button"
                  className={cls}
                  disabled={phase !== 'recall'}
                  aria-pressed={phase === 'recall' ? order >= 0 : undefined}
                  aria-label={order >= 0 ? `${cellName(cell.id)}, position ${order + 1}` : cellName(cell.id)}
                  onClick={() => tapCell(cell.id)}
                >
                  {order >= 0 && <span className="vwm__ord">{order + 1}</span>}
                  {phase === 'feedback' && order < 0 && shown >= 0 && <span className="vwm__ord">{shown + 1}</span>}
                </button>
              );
            })}
          </div>

          {phase === 'recall' && trial && (
            <div className="vwm__actions">
              <span className="vwm__count">{response.length} of {trial.setSize} placed</span>
              <div className="vwm__row">
                <button className="btn" onClick={() => setResponse(r => r.slice(0, -1))} disabled={response.length === 0}>
                  Undo
                </button>
                <button className="btn btn--primary" onClick={submit} disabled={response.length === 0}>
                  Submit run
                </button>
              </div>
            </div>
          )}

          {phase === 'feedback' && lastScore && (
            <div className="vwm__result">
              <dl className="vwm__figures">
                <div><dt>in order</dt><dd>{lastScore.correctInPosition}/{lastScore.setSize}</dd></div>
                <div><dt>any order</dt><dd>{lastScore.correctAnyPosition}/{lastScore.setSize}</dd></div>
                <div><dt>symmetry</dt><dd>{tally.current.correct}/{tally.current.total}</dd></div>
              </dl>
              <Verdict tone={tone}>
                {lastScore.perfect ? 'Exact — that whole run counts towards your span.'
                  : lastScore.correctAnyPosition === lastScore.setSize
                    ? 'Every location was right, but not in the order they appeared. Only exact runs count.'
                    : `${lastScore.correctInPosition} of ${lastScore.setSize} in the right position.`}
              </Verdict>
              <button className="btn btn--primary" onClick={advance}>
                {trialIndex + 1 >= session.length ? 'See results' : 'Next run'}
              </button>
            </div>
          )}
        </>
      )}
    </DrillShell>
  );
}

function SymmetryGrid({ item }: { item: SymmetryItem }) {
  return (
    <div className="vwm__sym" style={{ '--n': SYMMETRY_N } as React.CSSProperties} aria-hidden="true">
      {item.grid.map((on, i) => <span key={i} className={on ? 'is-on' : ''} />)}
    </div>
  );
}

function VwmTips() {
  return (
    <>
      <section className="panel">
        <h2>Encoding</h2>
        <ol>
          <li>Join each location to the last one: <b>a direction and a distance</b>, not a coordinate.</li>
          <li>Anchor the route to an edge or a corner.</li>
          <li>Order is scored. A run recalled out of order counts for nothing.</li>
        </ol>
      </section>
      <section className="panel">
        <h2>The judgements</h2>
        <ol>
          <li>Answer them properly. Stalling to rehearse is what the time limit stops.</li>
          <li>Look at the middle two columns first — asymmetry usually shows there.</li>
          <li>Drop below 85% and the span figure is not reportable.</li>
        </ol>
      </section>
    </>
  );
}
