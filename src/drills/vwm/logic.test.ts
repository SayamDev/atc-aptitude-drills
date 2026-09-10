import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../lib/rng';
import {
  CELL_COUNT, DEADLINE_FALLBACK_MS, DEADLINE_MAX_MS, DEADLINE_MIN_MS, MATRIX_N,
  MAX_ABSOLUTE_SPAN, PROCESSING_TARGET, SET_SIZES, SYMMETRY_N, TRIALS_PER_SET_SIZE,
  buildMatrix, buildSession, cellName, computeDeadline, generateSymmetry, generateTrial,
  isSymmetric, scoreSession, scoreTrial, type TrialRecord
} from './logic';

const seeds = Array.from({ length: 2000 }, (_, i) => i + 1);

describe('buildMatrix', () => {
  it('is a full 4 by 4 of distinct cells', () => {
    const m = buildMatrix();
    expect(m).toHaveLength(CELL_COUNT);
    expect(new Set(m.map(c => c.id)).size).toBe(CELL_COUNT);
  });

  it('places every centre inside the panel, none on an edge', () => {
    for (const c of buildMatrix()) {
      expect(c.x).toBeGreaterThan(0);
      expect(c.x).toBeLessThan(1);
      expect(c.y).toBeGreaterThan(0);
      expect(c.y).toBeLessThan(1);
    }
  });

  it('spaces cells evenly, so no two can be confused', () => {
    const m = buildMatrix();
    const step = 1 / MATRIX_N;
    for (const a of m)
      for (const b of m)
        if (a.id !== b.id) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(step - 1e-9);
  });

  it('is stable: the matrix never moves between phases', () => {
    expect(buildMatrix()).toEqual(buildMatrix());
  });
});

describe('cellName', () => {
  it('reads as column letter then row number, from one', () => {
    expect(cellName('r0c0')).toBe('A1');
    expect(cellName('r0c3')).toBe('D1');
    expect(cellName('r3c0')).toBe('A4');
  });
  it('is unique across the matrix, so a name never marks a target', () => {
    const names = buildMatrix().map(c => cellName(c.id));
    expect(new Set(names).size).toBe(CELL_COUNT);
  });
});

describe('generateSymmetry', () => {
  it('reports its own symmetry truthfully, every time', () => {
    for (const s of seeds) {
      const item = generateSymmetry(mulberry32(s));
      expect(item.symmetric).toBe(isSymmetric(item.grid));
    }
  });

  it('produces a genuinely symmetric pattern when asked', () => {
    for (const s of seeds.slice(0, 600)) {
      const item = generateSymmetry(mulberry32(s), true);
      expect(item.symmetric).toBe(true);
    }
  });

  it('produces a genuinely asymmetric pattern when asked', () => {
    for (const s of seeds.slice(0, 600)) {
      const item = generateSymmetry(mulberry32(s), false);
      expect(item.symmetric).toBe(false);
    }
  });

  it('fills the whole grid', () => {
    for (const s of seeds.slice(0, 300))
      expect(generateSymmetry(mulberry32(s)).grid).toHaveLength(SYMMETRY_N * SYMMETRY_N);
  });

  it('is never blank or completely full, which would be trivial', () => {
    for (const s of seeds.slice(0, 600)) {
      const on = generateSymmetry(mulberry32(s)).grid.filter(Boolean).length;
      expect(on).toBeGreaterThan(0);
      expect(on).toBeLessThan(SYMMETRY_N * SYMMETRY_N);
    }
  });

  it('is roughly balanced between symmetric and asymmetric over many items', () => {
    const sym = seeds.filter(s => generateSymmetry(mulberry32(s)).symmetric).length;
    expect(sym / seeds.length).toBeGreaterThan(0.35);
    expect(sym / seeds.length).toBeLessThan(0.65);
  });

  it('is deterministic for a seed', () => {
    expect(generateSymmetry(mulberry32(12))).toEqual(generateSymmetry(mulberry32(12)));
  });
});

describe('computeDeadline', () => {
  it('is the mean plus 2.5 standard deviations', () => {
    // mean 3000, population SD 816.5 -> 3000 + 2.5 * 816.5
    expect(computeDeadline([2000, 3000, 4000, 3000, 2000, 4000])).toBe(5041);
  });

  it('never goes below the floor or above the ceiling', () => {
    expect(computeDeadline([10, 10, 10])).toBe(DEADLINE_MIN_MS);
    expect(computeDeadline([60000, 1, 60000])).toBe(DEADLINE_MAX_MS);
  });

  it('falls back when there is no practice data', () => {
    expect(computeDeadline([])).toBe(DEADLINE_FALLBACK_MS);
  });

  it('gives a slower candidate a longer deadline', () => {
    expect(computeDeadline([4000, 4200, 4400])).toBeGreaterThan(computeDeadline([2100, 2200, 2300]));
  });
});

describe('generateTrial', () => {
  it('presents the requested number of locations', () => {
    for (const s of seeds) {
      const size = SET_SIZES[s % SET_SIZES.length];
      const t = generateTrial(mulberry32(s), size);
      expect(t.sequence).toHaveLength(size);
      expect(t.setSize).toBe(size);
    }
  });

  it('never repeats a location inside one set', () => {
    for (const s of seeds) {
      const t = generateTrial(mulberry32(s), 5);
      expect(new Set(t.sequence).size).toBe(t.sequence.length);
    }
  });

  it('only ever uses real matrix cells', () => {
    const ids = new Set(buildMatrix().map(c => c.id));
    for (const s of seeds.slice(0, 500))
      for (const id of generateTrial(mulberry32(s), 5).sequence) expect(ids.has(id)).toBe(true);
  });

  it('pairs exactly one processing item with each location', () => {
    for (const s of seeds.slice(0, 500)) {
      const t = generateTrial(mulberry32(s), 4);
      expect(t.processing).toHaveLength(t.setSize);
    }
  });

  it('spreads locations across the whole matrix over many trials', () => {
    const seen = new Set<string>();
    for (const s of seeds) generateTrial(mulberry32(s), 5).sequence.forEach(id => seen.add(id));
    expect(seen.size).toBe(CELL_COUNT);
  });

  it('does not favour any cell as the first item', () => {
    const counts = new Map<string, number>();
    for (const s of seeds) {
      const id = generateTrial(mulberry32(s), 3).sequence[0];
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    const expected = seeds.length / CELL_COUNT;
    for (const n of counts.values()) expect(Math.abs(n - expected)).toBeLessThan(expected * 0.6);
  });

  it('is deterministic for a seed', () => {
    expect(generateTrial(mulberry32(3), 4)).toEqual(generateTrial(mulberry32(3), 4));
  });
});

describe('buildSession', () => {
  it('runs three trials at each set size', () => {
    for (const s of seeds.slice(0, 300)) {
      const session = buildSession(mulberry32(s));
      expect(session).toHaveLength(SET_SIZES.length * TRIALS_PER_SET_SIZE);
      for (const size of SET_SIZES)
        expect(session.filter(t => t.setSize === size)).toHaveLength(TRIALS_PER_SET_SIZE);
    }
  });

  it('does not run the set sizes in a predictable order', () => {
    const orders = new Set(seeds.slice(0, 300).map(s => buildSession(mulberry32(s)).map(t => t.setSize).join()));
    expect(orders.size).toBeGreaterThan(200);
  });

  it('is deterministic for a seed', () => {
    expect(buildSession(mulberry32(5))).toEqual(buildSession(mulberry32(5)));
  });
});

describe('scoreTrial', () => {
  const trial = (seed: number, size = 4) => generateTrial(mulberry32(seed), size);

  it('scores a perfect ordered recall', () => {
    for (const s of seeds.slice(0, 500)) {
      const t = trial(s);
      const r = scoreTrial(t, t.sequence);
      expect(r.perfect).toBe(true);
      expect(r.correctInPosition).toBe(t.setSize);
      expect(r.partial).toBe(1);
    }
  });

  it('requires serial order, not just the right set', () => {
    for (const s of seeds.slice(0, 500)) {
      const t = trial(s);
      const swapped = [...t.sequence];
      [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
      const r = scoreTrial(t, swapped);
      expect(r.perfect).toBe(false);
      expect(r.correctInPosition).toBe(t.setSize - 2);
      // the set was right, so this separates an order error from a memory failure
      expect(r.correctAnyPosition).toBe(t.setSize);
    }
  });

  it('gives partial credit for a prefix', () => {
    const t = trial(9, 5);
    const r = scoreTrial(t, t.sequence.slice(0, 3));
    expect(r.correctInPosition).toBe(3);
    expect(r.partial).toBeCloseTo(0.6);
    expect(r.perfect).toBe(false);
  });

  it('scores an empty response as zero rather than throwing', () => {
    const t = trial(4);
    expect(scoreTrial(t, [])).toMatchObject({ correctInPosition: 0, correctAnyPosition: 0, perfect: false, partial: 0 });
  });

  it('ignores anything responded past the set size', () => {
    const t = trial(6, 3);
    const extra = [...t.sequence, 'r0c0', 'r1c1'];
    expect(scoreTrial(t, extra).correctInPosition).toBe(3);
    expect(scoreTrial(t, extra).correctAnyPosition).toBe(3);
  });

  it('does not credit a repeated answer twice', () => {
    const t = trial(8, 4);
    const spam = new Array(4).fill(t.sequence[0]);
    const r = scoreTrial(t, spam);
    expect(r.correctAnyPosition).toBe(1);
    expect(r.correctInPosition).toBe(1);
    expect(r.perfect).toBe(false);
  });

  it('gives no credit for a wholly wrong answer', () => {
    const t = trial(10, 3);
    const wrong = buildMatrix().map(c => c.id).filter(id => !t.sequence.includes(id)).slice(0, 3);
    expect(scoreTrial(t, wrong)).toMatchObject({ correctInPosition: 0, correctAnyPosition: 0, partial: 0 });
  });
});

describe('scoreSession', () => {
  const rec = (setSize: number, inPos: number, pc = 10, pt = 10): TrialRecord => ({
    setSize,
    correctInPosition: inPos,
    correctAnyPosition: inPos,
    perfect: inPos === setSize,
    partial: inPos / setSize,
    processingCorrect: pc,
    processingTotal: pt,
    processingTimeouts: 0,
    recallMs: 4000
  });

  it('absolute span sums the set sizes of perfect sets only', () => {
    const s = scoreSession([rec(2, 2), rec(3, 2), rec(5, 5)]);
    expect(s.absoluteSpan).toBe(7);
    expect(s.bestSetSize).toBe(5);
  });

  it('partial-credit unit averages the per-trial proportions', () => {
    expect(scoreSession([rec(4, 2), rec(4, 4)]).partialCreditUnit).toBeCloseTo(0.75);
  });

  it('a perfect session reaches the maximum absolute span', () => {
    const all = SET_SIZES.flatMap(s => Array.from({ length: TRIALS_PER_SET_SIZE }, () => rec(s, s)));
    expect(scoreSession(all).absoluteSpan).toBe(MAX_ABSOLUTE_SPAN);
    expect(scoreSession(all).partialCreditUnit).toBe(1);
  });

  it('flags a session where the processing task was neglected', () => {
    const s = scoreSession([rec(4, 4, 5, 10), rec(4, 4, 5, 10)]);
    expect(s.processingAccuracy).toBeCloseTo(0.5);
    expect(s.processingValid).toBe(false);
  });

  it('accepts a session at the published threshold', () => {
    const s = scoreSession([rec(4, 4, 85, 100)]);
    expect(s.processingAccuracy).toBeCloseTo(PROCESSING_TARGET);
    expect(s.processingValid).toBe(true);
  });

  it('never reports a span from nothing', () => {
    expect(scoreSession([])).toMatchObject({ trials: 0, absoluteSpan: 0, processingValid: false });
  });

  it('cannot report a span above the maximum from any reachable session', () => {
    for (const s of seeds.slice(0, 200)) {
      const session = buildSession(mulberry32(s));
      const records = session.map(t => rec(t.setSize, t.setSize));
      expect(scoreSession(records).absoluteSpan).toBeLessThanOrEqual(MAX_ABSOLUTE_SPAN);
    }
  });
});
