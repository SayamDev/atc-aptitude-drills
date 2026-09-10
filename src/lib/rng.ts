/** Deterministic PRNG so any drill can be replayed from a seed in tests and bug reports. */
export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const randomRng: Rng = Math.random;
export const int = (rng: Rng, n: number) => Math.floor(rng() * n);
export const pick = <T,>(rng: Rng, xs: readonly T[]): T => xs[int(rng, xs.length)];

export function shuffle<T>(rng: Rng, xs: readonly T[]): T[] {
  const out = xs.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = int(rng, i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
