import { useCallback, useEffect, useMemo, useState } from 'react';
import { DrillShell } from '../../components/DrillShell';
import { Briefing } from '../../components/Briefing';
import { Report } from '../../components/Report';
import { Verdict, type Tone } from '../../components/Verdict';
import { randomRng } from '../../lib/rng';
import { accuracy, meanMs, useRun } from '../../lib/useRun';
import { Arrow } from './Arrow';
import { NavFigure } from './NavFigure';
import {
  BEARING_NAME, MANOEUVRES, explain, makeQuestion, type Bearing, type Question
} from './logic';
import './nav.css';

const RUN_MS = 60_000;                       // Aon give scales nav one minute of test time

type Focus = 'all' | 'down' | 'mistakes';

export function NavDrill() {
  const run = useRun(RUN_MS);
  const [eightWay, setEightWay] = useState(false);
  const [kind, setKind] = useState<'which' | 'where'>('which');
  const [focus, setFocus] = useState<Focus>('all');
  const [exam, setExam] = useState(false);
  const [q, setQ] = useState<Question | null>(null);
  const [answered, setAnswered] = useState<Bearing | null>(null);
  const [shownAt, setShownAt] = useState(0);
  const [missed, setMissed] = useState<Question[]>([]);
  const [elapsed, setElapsed] = useState(0);

  const next = useCallback(() => {
    if (focus === 'mistakes') {
      if (missed.length === 0) { setQ(null); return; }
      setQ(missed[Math.floor(Math.random() * missed.length)]);
    } else {
      setQ(makeQuestion(randomRng, { eightWay, downOnly: focus === 'down', kind }));
    }
    setAnswered(null);
    setShownAt(performance.now());
  }, [eightWay, focus, kind, missed]);

  useEffect(() => { next(); }, [eightWay, kind, focus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Per-question stopwatch, only while a question is open and no run is counting down.
  useEffect(() => {
    if (run.running || answered !== null || !q) return;
    const id = window.setInterval(() => setElapsed(performance.now() - shownAt), 100);
    return () => window.clearInterval(id);
  }, [run.running, answered, q, shownAt]);

  const answer = useCallback((choice: Bearing) => {
    if (!q || answered !== null) return;
    const ms = performance.now() - shownAt;
    const correct = choice === q.answer;
    setAnswered(choice);
    run.record({ correct, ms, tag: q.from > 90 && q.from < 270 ? 'down' : 'up' });

    setMissed(prev => {
      const key = (x: Question) => JSON.stringify([x.kind, x.from, x.answer]);
      if (!correct) return prev.some(m => key(m) === key(q)) ? prev : [...prev, q];
      return prev.filter(m => key(m) !== key(q));
    });

    window.setTimeout(next, exam ? 120 : correct ? 550 : 1900);
  }, [q, answered, shownAt, run, exam, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (!q || Number.isNaN(n) || n < 1 || n > q.options.length) return;
      answer(q.options[n - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, answer]);

  const down = run.attempts.filter(a => a.tag === 'down');
  const up = run.attempts.filter(a => a.tag === 'up');
  const pct = (xs: typeof run.attempts) =>
    xs.length ? `${Math.round((100 * xs.filter(a => a.correct).length) / xs.length)}%` : '—';

  const advice = useMemo(() => {
    const acc = accuracy(run.attempts);
    const mean = meanMs(run.attempts);
    if (acc === null || mean === null) return 'Nothing answered.';
    const dAcc = down.length >= 3 ? down.filter(a => a.correct).length / down.length : 1;
    const uAcc = up.length >= 2 ? up.filter(a => a.correct).length / up.length : 0;
    if (dAcc < uAcc - 0.2)
      return 'You are much weaker when the car heads down the screen. Switch Focus to "heading down only" and drill that alone — the swing rule removes the mirror.';
    if (acc < 80) return `Accuracy ${acc}%. Slow down slightly and read the swing, not where the arrow ends up.`;
    if (mean > 4000) return `Accurate but slow at ${(mean / 1000).toFixed(1)}s. The real test allows one minute in total, so aim for two to three seconds.`;
    return `${acc}% at ${(mean / 1000).toFixed(1)}s each — about ${Math.round(60000 / mean)} in a one-minute test.`;
  }, [run.attempts, down, up]);

  const finished = !run.running && run.attempts.length > 0 && run.msLeft <= 0;

  const tone: Tone = answered === null ? 'neutral' : answered === q?.answer ? 'good' : 'bad';
  const feedback = !q ? '' :
    answered === null ? '' :
    answered === q.answer ? 'Correct.' : `Not quite. ${explain(q)}`;

  return (
    <DrillShell
      title="Sense of direction"
      testCode="scales nav"
      summary="Bird's-eye view. The manoeuvre is from the driver's seat, not yours."
      clockMs={run.running ? run.msLeft : answered === null ? elapsed : null}
      running={run.running}
      runLabel={run.running ? 'Stop run' : 'Start 1-minute run'}
      onToggleRun={() => { run.running ? run.stop() : run.start(); next(); }}
      controls={
        <>
          <label className="field">
            <span>Task</span>
            <select value={kind} disabled={exam} onChange={e => setKind(e.target.value as 'which' | 'where')}>
              <option value="which">Which manoeuvre?</option>
              <option value="where">Where do you end up?</option>
            </select>
          </label>
          <label className="field">
            <span>Focus</span>
            <select value={focus} disabled={exam} onChange={e => setFocus(e.target.value as Focus)}>
              <option value="all">All headings</option>
              <option value="down">Heading down only</option>
              <option value="mistakes">My mistakes ({missed.length})</option>
            </select>
          </label>
          <label className="field field--check">
            <input type="checkbox" checked={eightWay} onChange={e => setEightWay(e.target.checked)} />
            <span>Eight directions</span>
          </label>
          <label className="field field--check">
            <input type="checkbox" checked={exam} onChange={e => {
              setExam(e.target.checked);
              if (e.target.checked) { setKind('which'); setFocus('all'); }
            }} />
            <span>Exam conditions</span>
          </label>
        </>
      }
      onBegin={next}
      briefing={
        <Briefing
          testCode="scales nav"
          minutes={1}
          measures="Orientation after changes of direction"
          format={[
            <>You look down on a car from above. An arrow shows the way it is pointing.</>,
            <>A second arrow shows the way it points after one manoeuvre &mdash; or you are given the manoeuvres and asked where it ends up.</>,
            <>Pick the answer. Number keys 1 to 4 work, and are faster than the mouse.</>,
            <>The real module allows one minute in total, so the target is two to three seconds an item.</>
          ]}
          method={[
            <><b>Watch the swing, not the destination.</b> Where the arrow ends up pointing is a trap.</>,
            <><b>Clockwise is right, anticlockwise is left</b> &mdash; from any starting heading, with no exceptions.</>,
            <><b>Count notches.</b> Each is 45&deg;: one is a bear, two a turn, three a sharp, four a turn back.</>,
            <>Heading down the screen the car faces you, so its left is your right. The swing rule sidesteps that entirely.</>
          ]}
          figure={<NavFigure />}
          figureCaption="Heading down, swinging clockwise: a right turn, even though it now points left."
        />
      }
      aside={exam ? null : <NavTips />}
    >
      {finished ? (
        <Report
          drillId="nav"
          title="One-minute run"
          attempts={run.attempts}
          extra={[{ label: 'heading up', value: pct(up) }, { label: 'heading down', value: pct(down) }]}
          advice={advice}
          onAgain={() => { run.start(); next(); }}
          onPractice={() => { run.reset(); next(); }}
        />
      ) : !q ? (
        <p>No mistakes saved yet. Practise the other modes first — anything you get wrong is collected here.</p>
      ) : (
        <>
          <p className="nav__ask">
            {q.kind === 'which' ? 'Which manoeuvre did the driver make?' : 'Which way is the car pointing at the end?'}
          </p>

          {q.kind === 'which' ? (
            <div className="nav__arrows">
              <figure><div className="nav__box"><Arrow bearing={q.from} /></div><figcaption>before</figcaption></figure>
              <span aria-hidden="true" className="nav__to">→</span>
              <figure><div className="nav__box"><Arrow bearing={q.to} tone="accent" /></div><figcaption>after</figcaption></figure>
            </div>
          ) : (
            <div className="nav__arrows">
              <figure><div className="nav__box"><Arrow bearing={q.from} /></div><figcaption>start</figcaption></figure>
              <ol className="nav__steps">
                {q.steps.map((s, i) => <li key={i}>{MANOEUVRES[s]}</li>)}
              </ol>
            </div>
          )}

          <div className={`nav__options${q.kind === 'where' ? ' nav__options--arrows' : ''}`} role="group"
               aria-label="answer options">
            {q.options.map((o, i) => {
              const state = answered === null ? '' : o === q.answer ? ' is-right' : o === answered ? ' is-wrong' : '';
              return (
                <button key={o} className={`nav__opt${state}`} onClick={() => answer(o)}
                        disabled={answered !== null}>
                  {q.kind === 'which'
                    ? MANOEUVRES[o]
                    : <><Arrow bearing={o} size={34} /><span className="visually-hidden">{BEARING_NAME[o]}</span></>}
                  <kbd aria-hidden="true">{i + 1}</kbd>
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

function NavTips() {
  return (
    <>
      <section className="panel">
        <h2>The one rule</h2>
        <ol>
          <li>Watch the <b>swing</b>, not where the arrow ends up pointing.</li>
          <li><b>Clockwise is right</b>, anticlockwise is left — from any starting direction.</li>
          <li>Heading down, the car faces you, so its left is your right. The swing rule dodges that.</li>
          <li>Identical arrows means straight on; exact opposites means turn back. Neither needs thinking.</li>
        </ol>
      </section>
      <section className="panel">
        <h2>Bear, turn, sharp</h2>
        <p>Count how many notches the arrow moved. Each notch is 45°.</p>
        <ol>
          <li><b>1 — bear.</b> A gentle veer, like a fork in the road.</li>
          <li><b>2 — turn.</b> The ordinary 90° junction.</li>
          <li><b>3 — sharp.</b> Doubling back at an angle.</li>
          <li><b>4 — turn back.</b> A U-turn.</li>
        </ol>
        <p>Count first, then pick the side.</p>
      </section>
    </>
  );
}
