import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../lib/rng';
import {
  BEARING_NAME, EIGHT, FOUR, makeQuestion, manoeuvreFor, norm, notches, type Bearing
} from './logic';

describe('bearing arithmetic', () => {
  it('wraps in both directions', () => {
    expect(norm(-45)).toBe(315);
    expect(norm(405)).toBe(45);
  });

  it('treats clockwise as a right turn from every starting bearing', () => {
    for (const from of EIGHT) {
      expect(manoeuvreFor(from, norm(from + 90))).toBe(90);   // right
      expect(manoeuvreFor(from, norm(from - 90))).toBe(270);  // left
    }
  });

  it('gives a right turn when a car heading south ends up pointing west', () => {
    // The case candidates get wrong: on screen the new arrow points left.
    expect(manoeuvreFor(180, 270)).toBe(90);
  });

  it('names every bearing', () => {
    for (const b of EIGHT) expect(BEARING_NAME[b]).toBeTruthy();
  });
});

describe('notch counting', () => {
  it('never counts more than four', () => {
    for (const t of EIGHT) expect(notches(t).count).toBeLessThanOrEqual(4);
  });
  it('maps one notch to a bear and three to a sharp turn', () => {
    expect(notches(45)).toEqual({ count: 1, side: 'right' });
    expect(notches(225)).toEqual({ count: 3, side: 'left' });
  });
});

describe('question generation', () => {
  const rng = mulberry32(42);

  it('produces a solvable "which manoeuvre" question every time', () => {
    for (let i = 0; i < 2000; i++) {
      const q = makeQuestion(rng, { eightWay: i % 2 === 0, downOnly: false, kind: 'which' });
      if (q.kind !== 'which') throw new Error('wrong kind');
      expect(manoeuvreFor(q.from, q.to)).toBe(q.answer);
      expect(q.options).toContain(q.answer);
    }
  });

  it('chains multi-step questions correctly', () => {
    for (let i = 0; i < 2000; i++) {
      const q = makeQuestion(rng, { eightWay: i % 3 === 0, downOnly: false, kind: 'where' });
      if (q.kind !== 'where') throw new Error('wrong kind');
      const end = q.steps.reduce<Bearing>((cur, s) => norm(cur + s), q.from);
      expect(end).toBe(q.answer);
      expect(q.options).toContain(q.answer);
    }
  });

  it('only serves downward headings when asked to', () => {
    for (let i = 0; i < 500; i++) {
      const q = makeQuestion(rng, { eightWay: true, downOnly: true, kind: 'which' });
      expect(q.from).toBeGreaterThan(90);
      expect(q.from).toBeLessThan(270);
    }
  });

  it('uses only the four cardinal bearings in four-way mode', () => {
    for (let i = 0; i < 500; i++) {
      const q = makeQuestion(rng, { eightWay: false, downOnly: false, kind: 'which' });
      expect(FOUR).toContain(q.from);
    }
  });
});
