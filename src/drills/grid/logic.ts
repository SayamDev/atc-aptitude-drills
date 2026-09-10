/**
 * gridChallenge — visual-spatial short-term memory.
 *
 * Format, from Aon's published description of the Challenge series and from
 * candidate reports: a square grid is shown with some cells lit. The pattern
 * disappears after a short study window and the candidate reproduces it by
 * clicking the cells that were lit. The real item is adaptive — the load rises
 * after success and falls after failure — and the reported figure is the span
 * reached, not raw accuracy. Published test time is around 5 minutes.
 *
 * Uncertain, and therefore chosen rather than claimed: the exact study duration,
 * the exact ladder of grid sizes, and whether Aon award partial credit. This
 * implementation marks a trial correct only on an exact set match, which is the
 * stricter reading, and reports partial hits separately so the user can still
 * see near misses.
 */
import { shuffle, type Rng } from '../../lib/rng';

export interface Level {
  /** Grid is size x size. */
  size: number;
  /** Number of lit cells to remember. */
  count: number;
}

export interface Trial extends Level {
  /** Lit cell indices, row-major, ascending. */
  cells: number[];
}

export interface Mark {
  correct: boolean;
  /** Lit cells the user found. */
  hits: number[];
  /** Lit cells the user missed. */
  misses: number[];
  /** Cells the user picked that were never lit. */
  falseAlarms: number[];
}

/**
 * The load ladder. Span grows first, then the grid, so the jump in difficulty
 * is one dimension at a time rather than both at once.
 */
export const LADDER: readonly Level[] = [
  { size: 4, count: 3 }, { size: 4, count: 4 }, { size: 4, count: 5 }, { size: 4, count: 6 },
  { size: 5, count: 6 }, { size: 5, count: 7 }, { size: 5, count: 8 },
  { size: 6, count: 8 }, { size: 6, count: 9 }, { size: 6, count: 10 }
];

export const clampLevel = (i: number) => Math.max(0, Math.min(LADDER.length - 1, i));

/**
 * Adaptive staircase: two clean trials in a row move up, one failure moves down.
 * Asymmetric on purpose — it settles near the level the user passes most of the
 * time rather than oscillating around their ceiling.
 */
export function nextLevel(level: number, streak: number, correct: boolean): { level: number; streak: number } {
  if (!correct) return { level: clampLevel(level - 1), streak: 0 };
  const s = streak + 1;
  return s >= 2 ? { level: clampLevel(level + 1), streak: 0 } : { level, streak: s };
}

/**
 * Study window. Longer patterns need longer to encode, but not proportionally —
 * chunking means the marginal cell is cheaper than the first.
 */
export function studyMs(count: number, slow: boolean): number {
  const base = 600 + 260 * count;
  return slow ? Math.round(base * 1.8) : base;
}

export function makeTrial(rng: Rng, level: Level): Trial {
  const total = level.size * level.size;
  const all = Array.from({ length: total }, (_, i) => i);
  const cells = shuffle(rng, all).slice(0, level.count).sort((a, b) => a - b);
  return { ...level, cells };
}

export function mark(trial: Trial, picked: readonly number[]): Mark {
  const lit = new Set(trial.cells);
  const chose = new Set(picked);
  const hits = trial.cells.filter(c => chose.has(c));
  const misses = trial.cells.filter(c => !chose.has(c));
  const falseAlarms = [...chose].filter(c => !lit.has(c)).sort((a, b) => a - b);
  return { correct: misses.length === 0 && falseAlarms.length === 0, hits, misses, falseAlarms };
}

export const rowOf = (i: number, size: number) => Math.floor(i / size);
export const colOf = (i: number, size: number) => i % size;

/** Human cell reference, e.g. "B3" — used by the review line so advice is concrete. */
export const cellName = (i: number, size: number) =>
  `${String.fromCharCode(65 + colOf(i, size))}${rowOf(i, size) + 1}`;

/**
 * How many separate horizontal runs the pattern breaks into. A pattern that
 * chunks into few runs is far easier to hold, and saying so is the method this
 * drill teaches.
 */
export function chunkCount(trial: Trial): number {
  let runs = 0;
  for (let k = 0; k < trial.cells.length; k++) {
    const c = trial.cells[k];
    const prev = trial.cells[k - 1];
    const adjacent = k > 0 && c - prev === 1 && rowOf(c, trial.size) === rowOf(prev, trial.size);
    if (!adjacent) runs++;
  }
  return runs;
}

export function explain(trial: Trial, m: Mark): string {
  const chunks = chunkCount(trial);
  if (m.misses.length && m.falseAlarms.length)
    return `Missed ${m.misses.map(c => cellName(c, trial.size)).join(', ')} and added ${m.falseAlarms.map(c => cellName(c, trial.size)).join(', ')}. The pattern was ${chunks} group${chunks === 1 ? '' : 's'} — name the groups, not the squares.`;
  if (m.misses.length)
    return `Missed ${m.misses.map(c => cellName(c, trial.size)).join(', ')}. It was ${chunks} group${chunks === 1 ? '' : 's'}; a dropped cell usually means a group you never named.`;
  if (m.falseAlarms.length)
    return `Added ${m.falseAlarms.map(c => cellName(c, trial.size)).join(', ')} that were never lit. Count your picks against the target before the last one lands.`;
  return `Clean — ${chunks} group${chunks === 1 ? '' : 's'}.`;
}
