import { int, pick, type Rng } from '../../lib/rng';

/** Bearings in degrees clockwise from north (north = up the screen). */
export type Bearing = 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;

export const FOUR: Bearing[] = [0, 90, 180, 270];
export const EIGHT: Bearing[] = [0, 45, 90, 135, 180, 225, 270, 315];

export const norm = (d: number): Bearing => (((d % 360) + 360) % 360) as Bearing;

export interface Manoeuvre { turn: Bearing; label: string }

export const MANOEUVRES: Record<Bearing, string> = {
  0: 'Keep straight on',
  45: 'Bear right',
  90: 'Turn right',
  135: 'Sharp right',
  180: 'Turn back',
  225: 'Sharp left',
  270: 'Turn left',
  315: 'Bear left'
};

export const BEARING_NAME: Record<Bearing, string> = {
  0: 'north (up)', 45: 'north-east', 90: 'east (right)', 135: 'south-east',
  180: 'south (down)', 225: 'south-west', 270: 'west (left)', 315: 'north-west'
};

/**
 * The manoeuvre a driver made, given the bearing before and after.
 * Clockwise is always a right turn, whichever way the car was pointing —
 * that single fact removes the mirror problem when the car heads down the screen.
 */
export const manoeuvreFor = (from: Bearing, to: Bearing): Bearing => norm(to - from);

/** How many 45-degree notches, and which side. Used for the bear/turn/sharp wording. */
export function notches(turn: Bearing): { count: number; side: 'right' | 'left' | 'none' } {
  if (turn === 0) return { count: 0, side: 'none' };
  if (turn === 180) return { count: 4, side: 'none' };
  return turn < 180
    ? { count: turn / 45, side: 'right' }
    : { count: (360 - turn) / 45, side: 'left' };
}

export interface WhichQuestion {
  kind: 'which';
  from: Bearing;
  to: Bearing;
  answer: Bearing;
  options: Bearing[];
}

export interface WhereQuestion {
  kind: 'where';
  from: Bearing;
  steps: Bearing[];
  answer: Bearing;
  options: Bearing[];
}

export type Question = WhichQuestion | WhereQuestion;

export interface Options {
  eightWay: boolean;
  /** Restrict starting bearings to those pointing down the screen — the mirror case. */
  downOnly: boolean;
  kind: 'which' | 'where';
}

export function makeQuestion(rng: Rng, o: Options): Question {
  const dirs = o.eightWay ? EIGHT : FOUR;
  const starts = o.downOnly ? dirs.filter(d => d > 90 && d < 270) : dirs;
  const turns = dirs;
  const from = pick(rng, starts);

  if (o.kind === 'which') {
    const turn = pick(rng, turns.filter(t => t !== 0 || rng() < 0.35));
    return { kind: 'which', from, to: norm(from + turn), answer: turn, options: turns.slice() };
  }

  const count = 2 + int(rng, 2);
  const steps: Bearing[] = [];
  let cur = from;
  for (let i = 0; i < count; i++) {
    const t = pick(rng, turns.filter(x => x !== 180));
    steps.push(t);
    cur = norm(cur + t);
  }
  const wrong = dirs.filter(d => d !== cur).sort(() => rng() - 0.5).slice(0, 3);
  return { kind: 'where', from, steps, answer: cur, options: [cur, ...wrong].sort(() => rng() - 0.5) };
}

/** Plain-English explanation used by the walkthrough and the review list. */
export function explain(q: Question): string {
  if (q.kind === 'which') {
    const n = notches(q.answer);
    const swing = q.answer === 0 || q.answer === 180
      ? 'no swing at all'
      : `${n.count} notch${n.count === 1 ? '' : 'es'} ${n.side === 'right' ? 'clockwise' : 'anticlockwise'}`;
    return `From ${BEARING_NAME[q.from]} to ${BEARING_NAME[q.to]} is ${swing}, so: ${MANOEUVRES[q.answer].toLowerCase()}.`;
  }
  const total = q.steps.reduce<number>((t, s) => t + s, 0);
  return `Starting ${BEARING_NAME[q.from]} and turning ${norm(total)}° in total leaves you facing ${BEARING_NAME[q.answer]}.`;
}
