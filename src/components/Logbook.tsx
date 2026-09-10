import { useMemo, useState } from 'react';
import { DRILLS, findDrill } from '../drills/registry';
import {
  MAX_PER_DRILL, ago, clearAll, clearDrill, readRuns, runsFor, summarise, toCsv, type RunRecord
} from '../lib/history';
import { Sparkline } from './Sparkline';
import './logbook.css';

const pct = (v: number | null) => (v === null ? '—' : `${v}%`);
const secs = (ms: number | null) => (ms === null ? '—' : `${(ms / 1000).toFixed(1)}s`);
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${Math.abs(n)}`;

const stamp = (at: number) =>
  new Date(at).toLocaleString(undefined, {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });

/** Hands the user a file of their own runs. There is no server to ask for it. */
function download(name: string, type: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function Logbook() {
  const [runs, setRuns] = useState<RunRecord[]>(readRuns);
  const [confirming, setConfirming] = useState(false);

  const drills = useMemo(
    () => DRILLS.map(d => ({ drill: d, runs: runsFor(runs, d.id) })).filter(x => x.runs.length > 0),
    [runs]
  );
  const overall = useMemo(() => summarise(runs), [runs]);
  const name = (id: string) => findDrill(id)?.name ?? id;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main id="main" tabIndex={-1} className="log">
      <header className="log__head">
        <h1>Logbook</h1>
        <p className="log__lede">
          Every run you have finished, kept in this browser only. Use it to answer the one
          question practice is for: is this getting better? The last {MAX_PER_DRILL} runs of each
          drill are held; older ones fall off.
        </p>
      </header>

      {runs.length === 0 ? (
        <section className="panel log__empty">
          <h2>Nothing logged yet</h2>
          <p>
            Finish a timed run and it appears here. The standalone drills keep their own
            figures on the page and do not write to the logbook yet.
          </p>
          <p><a className="btn" href="#">Pick a drill</a></p>
        </section>
      ) : (
        <>
          <section className="panel log__totals" aria-label="Totals">
            <dl className="log__figures">
              <div><dt>runs</dt><dd>{overall.runs}</dd></div>
              <div><dt>items answered</dt><dd>{overall.items}</dd></div>
              <div><dt>drills used</dt><dd>{drills.length} of {DRILLS.length}</dd></div>
              <div><dt>last run</dt><dd className="log__soft">{overall.latest ? ago(overall.latest.at) : '—'}</dd></div>
            </dl>
            <div className="log__actions">
              <button className="btn" onClick={() => download(`atc-drills-${today}.csv`, 'text/csv', toCsv(runs, name))}>
                Export CSV
              </button>
              <button className="btn" onClick={() => download(`atc-drills-${today}.json`, 'application/json', JSON.stringify(runs, null, 2))}>
                Export JSON
              </button>
              {confirming ? (
                <>
                  <button className="btn btn--danger" onClick={() => { clearAll(); setRuns([]); setConfirming(false); }}>
                    Delete all {overall.runs} runs
                  </button>
                  <button className="btn btn--quiet" onClick={() => setConfirming(false)}>Cancel</button>
                </>
              ) : (
                <button className="btn btn--quiet" onClick={() => setConfirming(true)}>Erase logbook</button>
              )}
            </div>
          </section>

          {drills.map(({ drill, runs: rs }) => {
            const s = summarise(rs);
            return (
              <section key={drill.id} className="panel log__drill">
                <div className="log__drill-head">
                  <h2><a href={drill.status === 'react' ? `#${drill.id}` : drill.legacyPath!}>{drill.name}</a></h2>
                  <span className="log__code">{drill.testCode}</span>
                  <Sparkline
                    values={rs.map(r => r.accuracy)}
                    label={`Accuracy over ${rs.length} runs of ${drill.name}`}
                  />
                </div>

                <dl className="log__figures">
                  <div><dt>runs</dt><dd>{s.runs}</dd></div>
                  <div><dt>best</dt><dd>{pct(s.best)}</dd></div>
                  <div><dt>latest</dt><dd>{pct(s.latest?.accuracy ?? null)}</dd></div>
                  <div>
                    <dt>since first</dt>
                    <dd className={s.change === null ? '' : s.change >= 0 ? 'log__up' : 'log__down'}>
                      {s.change === null ? '—' : `${signed(s.change)} pts`}
                    </dd>
                  </div>
                  <div><dt>fastest item</dt><dd>{secs(s.bestMs)}</dd></div>
                </dl>

                {/* A scrollable box must be reachable by keyboard, or someone
                    without a mouse cannot scroll the table at narrow widths. */}
                <div
                  className="log__scroll"
                  tabIndex={0}
                  role="region"
                  aria-label={`${drill.name} run history, scrollable`}
                >
                  <table className="log__table">
                    <caption className="visually-hidden">Every logged run of {drill.name}, newest first</caption>
                    <thead>
                      <tr>
                        <th scope="col">when</th>
                        <th scope="col">accuracy</th>
                        <th scope="col">items</th>
                        <th scope="col">per item</th>
                        <th scope="col">note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...rs].reverse().map(r => (
                        <tr key={r.at}>
                          <th scope="row"><time dateTime={new Date(r.at).toISOString()}>{stamp(r.at)}</time></th>
                          <td>{pct(r.accuracy)}</td>
                          <td>{r.count}</td>
                          <td>{secs(r.meanMs)}</td>
                          <td className="log__note">{r.headline ?? ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  className="btn btn--quiet"
                  onClick={() => { clearDrill(drill.id); setRuns(readRuns()); }}
                >
                  Erase {drill.name} history
                </button>
              </section>
            );
          })}
        </>
      )}
    </main>
  );
}
