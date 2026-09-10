import { describe, expect, it } from 'vitest';
import {
  MAX_PER_DRILL, ago, capRuns, migrateV1, runsFor, summarise, toCsv, type RunRecord
} from './history';

const run = (id: string, at: number, accuracy: number | null = 80, extra: Partial<RunRecord> = {}): RunRecord =>
  ({ id, at, accuracy, count: 10, meanMs: 2000, ...extra });

describe('capRuns', () => {
  it('keeps the newest runs per drill, not the newest overall', () => {
    // One drill floods the log; the other must keep its single old run.
    const flood = Array.from({ length: MAX_PER_DRILL + 20 }, (_, i) => run('grid', 1000 + i));
    const kept = capRuns([run('nav', 1), ...flood]);
    expect(runsFor(kept, 'nav')).toHaveLength(1);
    expect(runsFor(kept, 'grid')).toHaveLength(MAX_PER_DRILL);
    expect(runsFor(kept, 'grid')[0].at).toBe(1000 + 20);
  });

  it('returns oldest first regardless of input order', () => {
    const out = capRuns([run('nav', 30), run('nav', 10), run('nav', 20)]);
    expect(out.map(r => r.at)).toEqual([10, 20, 30]);
  });

  it('never drops anything while under the cap', () => {
    const runs = Array.from({ length: MAX_PER_DRILL }, (_, i) => run('grid', i));
    expect(capRuns(runs)).toHaveLength(MAX_PER_DRILL);
  });

  it('caps every drill independently over many drills', () => {
    const runs: RunRecord[] = [];
    for (const id of ['a', 'b', 'c']) {
      for (let i = 0; i < MAX_PER_DRILL + 5; i++) runs.push(run(id, i));
    }
    const kept = capRuns(runs);
    expect(kept).toHaveLength(3 * MAX_PER_DRILL);
    for (const id of ['a', 'b', 'c']) expect(runsFor(kept, id)).toHaveLength(MAX_PER_DRILL);
  });

  it('handles an empty log', () => {
    expect(capRuns([])).toEqual([]);
  });
});

describe('summarise', () => {
  it('reports best accuracy and fastest mean across runs', () => {
    const s = summarise([
      run('nav', 1, 60, { meanMs: 3000 }),
      run('nav', 2, 91, { meanMs: 2200 }),
      run('nav', 3, 74, { meanMs: 1800 })
    ]);
    expect(s.best).toBe(91);
    expect(s.bestMs).toBe(1800);
    expect(s.runs).toBe(3);
    expect(s.items).toBe(30);
  });

  it('measures change from the first scored run to the last', () => {
    expect(summarise([run('nav', 1, 55), run('nav', 2, 70), run('nav', 3, 82)]).change).toBe(27);
  });

  it('reports a negative change honestly', () => {
    expect(summarise([run('nav', 1, 90), run('nav', 2, 60)]).change).toBe(-30);
  });

  it('has no change to report from a single run', () => {
    expect(summarise([run('nav', 1, 70)]).change).toBeNull();
  });

  it('orders by time, not by array order', () => {
    const s = summarise([run('nav', 3, 82), run('nav', 1, 55), run('nav', 2, 70)]);
    expect(s.first?.at).toBe(1);
    expect(s.latest?.at).toBe(3);
    expect(s.change).toBe(27);
  });

  it('ignores unscored runs when comparing, but still counts them', () => {
    const s = summarise([run('nav', 1, null, { count: 0 }), run('nav', 2, 60), run('nav', 3, 75)]);
    expect(s.runs).toBe(3);
    expect(s.change).toBe(15);
    expect(s.best).toBe(75);
  });

  it('returns empty figures for an empty log rather than throwing', () => {
    const s = summarise([]);
    expect(s).toMatchObject({ runs: 0, items: 0, best: null, bestMs: null, latest: null, first: null, change: null });
  });
});

describe('migrateV1', () => {
  it('turns the old one-result-per-drill store into run records', () => {
    const out = migrateV1({
      grid: { at: 200, accuracy: 64, count: 11, headline: 'span 6' },
      nav: { at: 100, accuracy: 88, count: 19 }
    });
    expect(out.map(r => r.id)).toEqual(['nav', 'grid']);
    expect(out[1]).toEqual({ id: 'grid', at: 200, accuracy: 64, count: 11, meanMs: null, headline: 'span 6' });
  });

  it('drops entries missing the fields it cannot invent', () => {
    expect(migrateV1({ a: { accuracy: 50 }, b: { at: 1, count: 2 } })).toHaveLength(1);
  });

  it('survives every shape of rubbish', () => {
    for (const junk of [null, undefined, 'text', 42, [], [1, 2], { a: null }, { a: 'x' }]) {
      expect(migrateV1(junk)).toEqual([]);
    }
  });

  it('keeps a null accuracy as null rather than zero', () => {
    expect(migrateV1({ a: { at: 1, count: 0, accuracy: null } })[0].accuracy).toBeNull();
  });
});

describe('toCsv', () => {
  it('writes a header and one row per run, oldest first', () => {
    const lines = toCsv([run('nav', 2000, 70), run('nav', 1000, 60)]).split('\n');
    expect(lines[0]).toBe('date,drill,accuracy_pct,items,mean_ms,headline');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('60');
    expect(lines[2]).toContain('70');
  });

  it('uses the display name when one is supplied', () => {
    expect(toCsv([run('nav', 1)], () => 'Sense of direction')).toContain('Sense of direction');
  });

  it('quotes and escapes any field that would break the format', () => {
    const csv = toCsv([run('nav', 1, 80, { headline: 'span 6, "best" yet' })]);
    expect(csv).toContain('"span 6, ""best"" yet"');
    expect(csv.split('\n')).toHaveLength(2);
  });

  it('leaves missing figures empty rather than writing a misleading zero', () => {
    const row = toCsv([run('nav', 1, null, { meanMs: null })]).split('\n')[1];
    expect(row.split(',').slice(2, 5)).toEqual(['', '10', '']);
  });

  it('emits only a header for an empty log', () => {
    expect(toCsv([]).split('\n')).toHaveLength(1);
  });
});

describe('ago', () => {
  const now = Date.UTC(2026, 0, 20, 12, 0, 0);
  const back = (ms: number) => ago(now - ms, now);

  it('reads naturally across the scale', () => {
    expect(back(30_000)).toBe('just now');
    expect(back(5 * 60_000)).toBe('5 min ago');
    expect(back(3 * 3_600_000)).toBe('3 hr ago');
    expect(back(26 * 3_600_000)).toBe('yesterday');
    expect(back(4 * 86_400_000)).toBe('4 days ago');
    expect(back(9 * 86_400_000)).toBe('last week');
    expect(back(30 * 86_400_000)).toBe('4 weeks ago');
  });

  it('does not read a run from a few seconds ago as being in the future', () => {
    expect(back(-5_000)).toBe('just now');
  });
});
