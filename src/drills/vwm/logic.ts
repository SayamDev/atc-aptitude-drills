/**
 * Visual working memory — a spatial complex span.
 *
 * Modelled on the automated symmetry span (Kane et al. 2004; Unsworth et al.
 * 2005, 2009), which is the standard laboratory measure of visuo-spatial working
 * memory capacity. The structure that matters, and that a simple span does not
 * have, is that encoding and processing alternate:
 *
 *   judge · remember · judge · remember · … · recall the whole set in order
 *
 * A single block of locations followed by one delay measures how long a visual
 * image persists. Interleaving a demanding visuo-spatial judgement between every
 * location blocks rehearsal, so what is recalled has to be actively maintained.
 * That is the construct.
 *
 * Faithful to the published procedure:
 * - set sizes 2 to 5, three trials of each, in random order
 * - one processing item immediately before each location
 * - each location shown briefly, then cleared
 * - recall requires serial order, not just the set
 * - the processing deadline is derived from the candidate's own practice times,
 *   as mean + 2.5 SD; running over is recorded as a processing error
 * - scored as absolute span and as partial-credit unit, alongside processing
 *   accuracy, which is expected to stay at or above 85%
 */
import { shuffle, type Rng } from '../../lib/rng';

/** The recall matrix is 4x4, as in the published task. */
export const MATRIX_N = 4;
export const CELL_COUNT = MATRIX_N * MATRIX_N;

export const SET_SIZES = [2, 3, 4, 5] as const;
export const TRIALS_PER_SET_SIZE = 3;

/** How long each location is shown before it clears. */
export const SQUARE_MS = 650;
/**
 * Practice items used to calibrate the processing deadline. Kept reasonably long
 * because the estimate feeds a hard cut-off: six items rushed by someone who
 * assumes practice does not count produces a deadline they cannot then meet.
 */
export const PRACTICE_ITEMS = 12;
/** Published expectation for the processing task. */
export const PROCESSING_TARGET = 0.85;

export const DEADLINE_SD = 2.5;
/*
 * The floor is deliberately generous. The deadline exists to stop the processing
 * slot being used for rehearsal, not to make the judgement itself hard, and a
 * floor that a thinking person cannot meet turns every run into a series of
 * silent timeouts.
 */
export const DEADLINE_MIN_MS = 3500;
export const DEADLINE_MAX_MS = 10000;
export const DEADLINE_FALLBACK_MS = 5000;

export interface Cell {
  id: string;
  /** Normalised centre within the matrix, so the panel can be any size. */
  x: number;
  y: number;
  row: number;
  col: number;
}

/** The full matrix. Every cell is selectable at recall, so all are candidates. */
export function buildMatrix(): Cell[] {
  const out: Cell[] = [];
  for (let row = 0; row < MATRIX_N; row++) {
    for (let col = 0; col < MATRIX_N; col++) {
      out.push({
        id: `r${row}c${col}`,
        row,
        col,
        x: (col + 0.5) / MATRIX_N,
        y: (row + 0.5) / MATRIX_N
      });
    }
  }
  return out;
}

/** "C2" is the third column, second row. Every cell has one. */
export function cellName(id: string): string {
  const m = /^r(\d+)c(\d+)$/.exec(id);
  if (!m) return id;
  return `${String.fromCharCode(65 + Number(m[2]))}${Number(m[1]) + 1}`;
}

/* ---- the processing task ---- */

export const SYMMETRY_N = 8;

export interface SymmetryItem {
  /** Row-major filled cells of an 8x8 pattern. */
  grid: boolean[];
  symmetric: boolean;
}

/**
 * A pattern that is either mirror-symmetric about the vertical axis or clearly
 * is not. Deliberately visuo-spatial: it has to compete with the locations being
 * held, which a verbal or arithmetic filler would not.
 */
export function generateSymmetry(rng: Rng, symmetric = rng() < 0.5): SymmetryItem {
  const half = SYMMETRY_N / 2;
  const grid = new Array<boolean>(SYMMETRY_N * SYMMETRY_N).fill(false);

  for (let r = 0; r < SYMMETRY_N; r++) {
    for (let c = 0; c < half; c++) {
      const on = rng() < 0.45;
      grid[r * SYMMETRY_N + c] = on;
      grid[r * SYMMETRY_N + (SYMMETRY_N - 1 - c)] = on;
    }
  }

  if (!symmetric) {
    // Break it in several places, or a near-miss becomes a perception test
    // rather than a judgement.
    const breaks = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < breaks; i++) {
      const r = Math.floor(rng() * SYMMETRY_N);
      const c = Math.floor(rng() * half);
      const mirror = r * SYMMETRY_N + (SYMMETRY_N - 1 - c);
      grid[mirror] = !grid[mirror];
    }
    // A flip can land back on symmetry; force at least one difference.
    if (isSymmetric(grid)) {
      const i = 0 * SYMMETRY_N + (SYMMETRY_N - 1);
      grid[i] = !grid[i];
    }
  }

  return { grid, symmetric: isSymmetric(grid) };
}

export function isSymmetric(grid: readonly boolean[]): boolean {
  for (let r = 0; r < SYMMETRY_N; r++)
    for (let c = 0; c < SYMMETRY_N / 2; c++)
      if (grid[r * SYMMETRY_N + c] !== grid[r * SYMMETRY_N + (SYMMETRY_N - 1 - c)]) return false;
  return true;
}

/**
 * The candidate's own processing deadline. Published procedure: mean of the
 * practice times plus 2.5 standard deviations, so it is generous for that
 * person but still forecloses using the processing slot to rehearse.
 */
export function computeDeadline(times: readonly number[]): number {
  if (times.length === 0) return DEADLINE_FALLBACK_MS;
  const mean = times.reduce((t, v) => t + v, 0) / times.length;
  const variance = times.reduce((t, v) => t + (v - mean) ** 2, 0) / times.length;
  const raw = mean + DEADLINE_SD * Math.sqrt(variance);
  return Math.round(Math.min(DEADLINE_MAX_MS, Math.max(DEADLINE_MIN_MS, raw)));
}

/* ---- trials ---- */

export interface Trial {
  setSize: number;
  /** Cell ids in the order presented. Order is part of the answer. */
  sequence: string[];
  /** One processing item per location, shown immediately before it. */
  processing: SymmetryItem[];
}

export function generateTrial(rng: Rng, setSize: number): Trial {
  const cells = shuffle(rng, buildMatrix()).slice(0, setSize);
  return {
    setSize,
    sequence: cells.map(c => c.id),
    processing: Array.from({ length: setSize }, () => generateSymmetry(rng))
  };
}

/** Twelve trials: three at each set size, in random order. */
export function buildSession(rng: Rng): Trial[] {
  const sizes: number[] = [];
  for (const s of SET_SIZES) for (let i = 0; i < TRIALS_PER_SET_SIZE; i++) sizes.push(s);
  return shuffle(rng, sizes).map(s => generateTrial(rng, s));
}

/* ---- scoring ---- */

export interface TrialScore {
  setSize: number;
  /** Recalled in the right serial position. */
  correctInPosition: number;
  /** Recalled somewhere, ignoring order. Reported to separate the two failures. */
  correctAnyPosition: number;
  /** Every location, in the right order. */
  perfect: boolean;
  /** correctInPosition / setSize. */
  partial: number;
}

export function scoreTrial(trial: Trial, response: readonly string[]): TrialScore {
  let inPosition = 0;
  for (let i = 0; i < trial.setSize; i++) if (response[i] === trial.sequence[i]) inPosition++;

  const remaining = [...trial.sequence];
  let anyPosition = 0;
  for (const id of response.slice(0, trial.setSize)) {
    const at = remaining.indexOf(id);
    if (at !== -1) { remaining.splice(at, 1); anyPosition++; }
  }

  return {
    setSize: trial.setSize,
    correctInPosition: inPosition,
    correctAnyPosition: anyPosition,
    perfect: inPosition === trial.setSize,
    partial: inPosition / trial.setSize
  };
}

export interface TrialRecord extends TrialScore {
  /** Processing items answered correctly, and how many were asked. */
  processingCorrect: number;
  processingTotal: number;
  /** Items where the deadline ran out. Counted as processing errors. */
  processingTimeouts: number;
  recallMs: number;
}

export interface SessionScore {
  trials: number;
  /** Sum of the set sizes of perfectly recalled sets — the published headline. */
  absoluteSpan: number;
  /** Mean proportion of locations recalled in the correct position. */
  partialCreditUnit: number;
  /** Largest set size recalled perfectly at least once. */
  bestSetSize: number;
  processingAccuracy: number;
  /** Below the published 85% invalidates the span estimate. */
  processingValid: boolean;
  totalRecalled: number;
  totalPresented: number;
}

export function scoreSession(records: readonly TrialRecord[]): SessionScore {
  if (records.length === 0)
    return {
      trials: 0, absoluteSpan: 0, partialCreditUnit: 0, bestSetSize: 0,
      processingAccuracy: 0, processingValid: false, totalRecalled: 0, totalPresented: 0
    };

  const perfect = records.filter(r => r.perfect);
  const pTotal = records.reduce((t, r) => t + r.processingTotal, 0);
  const pRight = records.reduce((t, r) => t + r.processingCorrect, 0);

  return {
    trials: records.length,
    absoluteSpan: perfect.reduce((t, r) => t + r.setSize, 0),
    partialCreditUnit: records.reduce((t, r) => t + r.partial, 0) / records.length,
    bestSetSize: perfect.length ? Math.max(...perfect.map(r => r.setSize)) : 0,
    processingAccuracy: pTotal === 0 ? 0 : pRight / pTotal,
    processingValid: pTotal > 0 && pRight / pTotal >= PROCESSING_TARGET,
    totalRecalled: records.reduce((t, r) => t + r.correctInPosition, 0),
    totalPresented: records.reduce((t, r) => t + r.setSize, 0)
  };
}

/** The highest absolute span obtainable, for reporting the score out of a total. */
export const MAX_ABSOLUTE_SPAN =
  SET_SIZES.reduce((t, s) => t + s * TRIALS_PER_SET_SIZE, 0);
