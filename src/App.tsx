import { useEffect, useMemo, useState } from 'react';
import { DRILLS, findDrill, type DrillMeta } from './drills/registry';
import { Logbook } from './components/Logbook';
import { ThemeToggle } from './components/ThemeToggle';
import { Glyph } from './drills/Glyph';
import { ago, readRuns, runsFor, summarise, type RunRecord } from './lib/history';
import './app.css';

/** Hash routing: no dependency, and it works on static hosting without server rewrites. */
function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash.slice(1));
  useEffect(() => {
    const on = () => setHash(window.location.hash.slice(1));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash;
}

export default function App() {
  const route = useHashRoute();
  const drill = route ? findDrill(route) : undefined;
  const isLog = route === 'log';

  useEffect(() => {
    document.title = isLog
      ? 'Logbook — ATC Aptitude Drills'
      : drill ? `${drill.name} — ATC Aptitude Drills` : 'ATC Aptitude Drills';
    // Move focus to the main region on navigation so keyboard and screen reader
    // users land in the new content rather than at the top of the document.
    document.getElementById('main')?.focus();
  }, [drill, isLog]);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="shell">
        <div className="topbar">
          {route ? (
            <nav aria-label="Breadcrumb" className="crumb">
              <a href="#">All drills</a>
            </nav>
          ) : <span />}
          <ThemeToggle />
        </div>
        {isLog ? <Logbook /> : drill?.component ? <drill.component /> : <Home />}
      </div>
    </>
  );
}

function Home() {
  const runs = useMemo(readRuns, []);
  const logged = new Set(runs.map(r => r.id)).size;

  const families = useMemo(() => ([
    {
      key: 'scales' as const,
      title: 'scales modules',
      note: 'The classic cut-e battery. Short, strictly timed, and marked on accuracy under pressure rather than on how much you finish.',
      drills: DRILLS.filter(d => d.family === 'scales')
    },
    {
      key: 'challenge' as const,
      title: 'Challenge series',
      note: 'Aon’s gamified modules. They look like games and adapt to you: the load rises while you keep getting it right, so the score is the level you reach, not the number you answer.',
      drills: DRILLS.filter(d => d.family === 'challenge')
    },
    {
      key: 'lab' as const,
      title: 'Underlying skills',
      note: 'Not modules any employer sets, but the capacities the published ones lean on. Worth training if a battery keeps catching you in the same place.',
      drills: DRILLS.filter(d => d.family === 'lab')
    }
  ].filter(f => f.drills.length > 0)), []);

  return (
    <main id="main" tabIndex={-1}>
      <header className="home__head">
        <h1>ATC aptitude drills</h1>
        <p className="home__lede">
          Free, open practice for the aptitude tests used in trainee air traffic controller
          selection. Every drill explains the format before you start, teaches a method, and
          reports where you are losing marks. Nothing is uploaded — it all runs in your browser.
        </p>
        <p className="home__actions">
          <a className="btn" href="#log">
            {runs.length > 0
              ? `Logbook — ${runs.length} run${runs.length === 1 ? '' : 's'} across ${logged} drill${logged === 1 ? '' : 's'}`
              : 'Logbook'}
          </a>
        </p>
      </header>

      {families.map(f => (
        <section key={f.key} className="home__family">
          <div className="home__family-head">
            <h2>{f.title}</h2>
            <p>{f.note}</p>
          </div>
          <ul className="cards">
            {f.drills.map(d => <Card key={d.id} drill={d} runs={runsFor(runs, d.id)} />)}
          </ul>
        </section>
      ))}

      <section className="panel home__note">
        <h2>What this is not</h2>
        <p>
          These are re-implementations built from publicly documented test formats. They are not
          the real items, which are generated at run time and are not published by anyone.
          Practise the method and the pacing; treat any site selling &ldquo;real questions&rdquo; with suspicion.
        </p>
      </section>
    </main>
  );
}

function Card({ drill, runs }: { drill: DrillMeta; runs: RunRecord[] }) {
  const href = drill.status === 'react' ? `#${drill.id}` : drill.legacyPath!;
  const s = summarise(runs);
  return (
    <li className="panel card">
      <div className="card__head">
        <Glyph id={drill.id} />
        <h3 className="card__name"><a className="card__link" href={href}>{drill.name}</a></h3>
      </div>
      <p className="card__meta">
        <span className="card__code">{drill.testCode}</span>
        <span>{drill.testMinutes} min</span>
      </p>
      <p className="card__measures">{drill.measures}</p>
      {drill.status !== 'react' ? null : s.latest ? (
        <p className="card__last">
          <span className="card__figure">
            {s.latest.accuracy === null ? '\u2014' : `${s.latest.accuracy}%`}
          </span>
          {s.latest.headline && <span className="card__figure">{s.latest.headline}</span>}
          <span className="card__when">
            {s.runs > 1 ? `${s.runs} runs · ` : ''}{ago(s.latest.at)}
          </span>
        </p>
      ) : (
        <p className="card__last card__last--none">not yet attempted</p>
      )}
    </li>
  );
}
