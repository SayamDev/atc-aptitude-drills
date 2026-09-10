import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../lib/rng';
import {
  LADDER, chunkCount, cellName, clampLevel, makeTrial, mark, nextLevel, studyMs
} from './logic';

const seeds = Array.from({ length: 2000 }, (_, i) => i + 1);

describe('makeTrial', () => {
  it('lights exactly count cells, all distinct and in range, for every level', () => {
    for (const seed of seeds) {
      const level = LADDER[seed % LADDER.length];
      const t = makeTrial(mulberry32(seed), level);
      expect(t.cells).toHaveLength(level.count);
      expect(new Set(t.cells).size).toBe(level.count);
      for (const c of t.cells) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThan(level.size * level.size);
      }
    }
  });

  it('returns cells in ascending order, so review output is stable', () => {
    for (const seed of seeds.slice(0, 500)) {
      const t = makeTrial(mulberry32(seed), LADDER[seed % LADDER.length]);
      expect(t.cells).toEqual([...t.cells].sort((a, b) => a - b));
    }
  });

  it('is deterministic for a seed and varied across seeds', () => {
    const level = LADDER[4];
    expect(makeTrial(mulberry32(7), level).cells).toEqual(makeTrial(mulberry32(7), level).cells);
    const distinct = new Set(seeds.slice(0, 300).map(s => makeTrial(mulberry32(s), level).cells.join()));
    expect(distinct.size).toBeGreaterThan(250);
  });

  it('spreads lit cells over the whole grid across many trials', () => {
    const level = { size: 4, count: 4 };
    const seen = new Set<number>();
    for (const seed of seeds) makeTrial(mulberry32(seed), level).cells.forEach(c => seen.add(c));
    expect(seen.size).toBe(level.size * level.size);
  });
});

describe('mark', () => {
  it('accepts the exact set in any order', () => {
    for (const seed of seeds.slice(0, 800)) {
      const t = makeTrial(mulberry32(seed), LADDER[seed % LADDER.length]);
      const shuffled = [...t.cells].reverse();
      const m = mark(t, shuffled);
      expect(m.correct).toBe(true);
      expect(m.hits).toEqual(t.cells);
      expect(m.misses).toEqual([]);
      expect(m.falseAlarms).toEqual([]);
    }
  });

  it('rejects a missing cell and names it', () => {
    for (const seed of seeds.slice(0, 800)) {
      const t = makeTrial(mulberry32(seed), LADDER[seed % LADDER.length]);
      const m = mark(t, t.cells.slice(1));
      expect(m.correct).toBe(false);
      expect(m.misses).toEqual([t.cells[0]]);
      expect(m.falseAlarms).toEqual([]);
    }
  });

  it('rejects an extra cell even when every lit cell was found', () => {
    for (const seed of seeds.slice(0, 800)) {
      const t = makeTrial(mulberry32(seed), LADDER[seed % LADDER.length]);
      const spare = Array.from({ length: t.size * t.size }, (_, i) => i).find(i => !t.cells.includes(i))!;
      const m = mark(t, [...t.cells, spare]);
      expect(m.correct).toBe(false);
      expect(m.misses).toEqual([]);
      expect(m.falseAlarms).toEqual([spare]);
    }
  });

  it('ignores duplicate picks of the same cell', () => {
    const t = makeTrial(mulberry32(3), LADDER[0]);
    expect(mark(t, [...t.cells, ...t.cells]).correct).toBe(true);
  });

  it('never counts a cell as both a hit and a false alarm', () => {
    for (const seed of seeds.slice(0, 500)) {
      const t = makeTrial(mulberry32(seed), LADDER[seed % LADDER.length]);
      const picks = [t.cells[0], (t.cells[0] + 1) % (t.size * t.size)];
      const m = mark(t, picks);
      expect(m.hits.filter(h => m.falseAlarms.includes(h))).toEqual([]);
    }
  });
});

describe('nextLevel', () => {
  it('needs two clean trials to move up, and never skips a rung', () => {
    const a = nextLevel(3, 0, true);
    expect(a).toEqual({ level: 3, streak: 1 });
    expect(nextLevel(a.level, a.streak, true)).toEqual({ level: 4, streak: 0 });
  });

  it('drops one rung on any failure and clears the streak', () => {
    expect(nextLevel(5, 1, false)).toEqual({ level: 4, streak: 0 });
  });

  it('stays inside the ladder at both ends', () => {
    expect(nextLevel(nextLevel(0, 0, false).level, 0, false).level).toBe(0);
    const top = LADDER.length - 1;
    expect(nextLevel(top, 1, true).level).toBe(top);
  });

  it('cannot escape the ladder from any reachable state', () => {
    let level = 0, streak = 0;
    for (const seed of seeds) {
      ({ level, streak } = nextLevel(level, streak, seed % 3 !== 0));
      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThan(LADDER.length);
      expect(streak).toBeLessThan(2);
    }
  });

  it('settles upward when the user passes most trials', () => {
    let level = 0, streak = 0;
    for (let i = 0; i < 40; i++) ({ level, streak } = nextLevel(level, streak, true));
    expect(level).toBe(LADDER.length - 1);
  });
});

describe('ladder', () => {
  it('never decreases in load as the index rises', () => {
    for (let i = 1; i < LADDER.length; i++) {
      expect(LADDER[i].size).toBeGreaterThanOrEqual(LADDER[i - 1].size);
      expect(LADDER[i].count).toBeGreaterThanOrEqual(LADDER[i - 1].count);
      expect(LADDER[i].size + LADDER[i].count).toBeGreaterThan(LADDER[i - 1].size + LADDER[i - 1].count);
    }
  });

  it('always leaves more unlit cells than lit ones, so recall is not trivial', () => {
    for (const l of LADDER) expect(l.count * 2).toBeLessThan(l.size * l.size);
  });

  it('clamps out-of-range indices', () => {
    expect(clampLevel(-5)).toBe(0);
    expect(clampLevel(99)).toBe(LADDER.length - 1);
  });
});

describe('studyMs', () => {
  it('rises with load and is always longer in slow mode', () => {
    for (let n = 3; n <= 12; n++) {
      expect(studyMs(n + 1, false)).toBeGreaterThan(studyMs(n, false));
      expect(studyMs(n, true)).toBeGreaterThan(studyMs(n, false));
    }
  });
});

describe('chunkCount', () => {
  it('counts one run for a contiguous row', () => {
    expect(chunkCount({ size: 4, count: 3, cells: [4, 5, 6] })).toBe(1);
  });

  it('does not join cells that wrap across a row edge', () => {
    expect(chunkCount({ size: 4, count: 2, cells: [3, 4] })).toBe(2);
  });

  it('counts scattered cells separately', () => {
    expect(chunkCount({ size: 4, count: 3, cells: [0, 5, 10] })).toBe(3);
  });

  it('is never zero, and never more than the number of lit cells', () => {
    for (const seed of seeds.slice(0, 800)) {
      const t = makeTrial(mulberry32(seed), LADDER[seed % LADDER.length]);
      const c = chunkCount(t);
      expect(c).toBeGreaterThan(0);
      expect(c).toBeLessThanOrEqual(t.count);
    }
  });
});

describe('cellName', () => {
  it('reads column letter then row number, from one', () => {
    expect(cellName(0, 4)).toBe('A1');
    expect(cellName(3, 4)).toBe('D1');
    expect(cellName(4, 4)).toBe('A2');
    expect(cellName(15, 4)).toBe('D4');
  });

  it('is unique across every cell of every ladder grid', () => {
    for (const l of LADDER) {
      const names = Array.from({ length: l.size * l.size }, (_, i) => cellName(i, l.size));
      expect(new Set(names).size).toBe(names.length);
    }
  });
});
