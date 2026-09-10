/**
 * The logbook: every run the user has completed, kept in localStorage.
 *
 * Nothing leaves the browser — that promise is on the front page — so this file
 * stores scores and timestamps and nothing else. No identifier, ever.
 *
 * The aggregation below is pure and tested. Only the four functions at the
 * bottom touch storage, and each is guarded: private browsing, a locked-down
 * profile and a full quota all throw, and a lost logbook must never take the
 * drill down with it.
 */
const KEY = 'atc-drills:runs';
/** The v1 key, which held only the most recent run per drill. */
const KEY_V1 = 'atc-drills:last';

/** Kept per drill. Sixty runs is months of daily practice, and bounds the quota. */
export const MAX_PER_DRILL = 60;

export interface RunRecord {
  /** Registry id of the drill. */
  id: string;
  /** Epoch ms at the end of the run. */
  at: number;
  /** Percentage, or null when nothing was answered. */
  accuracy: number | null;
  /** Items attempted. */
  count: number;
  /** Mean time per item in ms, or null. */
  meanMs: number | null;
  /** The one figure that matters for this drill, e.g. "span 7". */
  headline?: string;
}

export interface Summary {
  runs: number;
  items: number;
  /** Best accuracy achieved, over runs that answered something. */
  best: number | null;
  latest: RunRecord | null;
  first: RunRecord | null;
  /** Latest accuracy minus first accuracy. Null until there are two to compare. */
  change: number | null;
  /** Fastest mean time per item across runs. */
  bestMs: number | null;
}

const byTime = (a: RunRecord, b: RunRecord) => a.at - b.at;

/** Oldest runs fall off the end. Order out is always oldest first. */
export function capRuns(runs: readonly RunRecord[], max = MAX_PER_DRILL): RunRecord[] {
  const byDrill = new Map<string, RunRecord[]>();
  for (const r of runs) {
    const list = byDrill.get(r.id) ?? [];
    list.push(r);
    byDrill.set(r.id, list);
  }
  const kept: RunRecord[] = [];
  for (const list of byDrill.values()) kept.push(...list.sort(byTime).slice(-max));
  return kept.sort(byTime);
}

export const runsFor = (runs: readonly RunRecord[], id: string): RunRecord[] =>
  runs.filter(r => r.id === id).sort(byTime);

export function summarise(runs: readonly RunRecord[]): Summary {
  const sorted = [...runs].sort(byTime);
  const scored = sorted.filter(r => r.accuracy !== null);
  const timed = sorted.filter(r => r.meanMs !== null);
  const first = scored[0] ?? null;
  const latest = sorted[sorted.length - 1] ?? null;
  const lastScored = scored[scored.length - 1] ?? null;
  return {
    runs: sorted.length,
    items: sorted.reduce((t, r) => t + r.count, 0),
    best: scored.length ? Math.max(...scored.map(r => r.accuracy as number)) : null,
    bestMs: timed.length ? Math.min(...timed.map(r => r.meanMs as number)) : null,
    latest,
    first,
    change:
      scored.length >= 2 && first && lastScored
        ? (lastScored.accuracy as number) - (first.accuracy as number)
        : null
  };
}

/**
 * Reads the v1 store, which kept one result per drill. Anything unrecognised is
 * dropped rather than guessed at: a corrupt logbook should cost the history, not
 * throw on every page load.
 */
export function migrateV1(raw: unknown): RunRecord[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  const out: RunRecord[] = [];
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const v = value as Record<string, unknown>;
    if (typeof v.at !== 'number' || typeof v.count !== 'number') continue;
    out.push({
      id,
      at: v.at,
      count: v.count,
      accuracy: typeof v.accuracy === 'number' ? v.accuracy : null,
      meanMs: typeof v.meanMs === 'number' ? v.meanMs : null,
      ...(typeof v.headline === 'string' ? { headline: v.headline } : {})
    });
  }
  return out.sort(byTime);
}

/** Same shape as the on-screen table, so an exported file is readable as-is. */
export function toCsv(runs: readonly RunRecord[], name: (id: string) => string = id => id): string {
  const cell = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [...runs].sort(byTime).map(r => [
    new Date(r.at).toISOString(),
    cell(name(r.id)),
    r.accuracy === null ? '' : r.accuracy,
    r.count,
    r.meanMs === null ? '' : Math.round(r.meanMs),
    cell(r.headline ?? '')
  ].join(','));
  return ['date,drill,accuracy_pct,items,mean_ms,headline', ...rows].join('\n');
}

/** Coarse and human. Exact timestamps invite comparison that helps nobody. */
export function ago(at: number, now = Date.now()): string {
  const mins = Math.floor((now - at) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? 'last week' : `${weeks} weeks ago`;
}

/* ---- storage ---- */

export function readRuns(): RunRecord[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? capRuns(parsed as RunRecord[]) : [];
    }
    // First load after the upgrade: fold the old single-result store in and retire it.
    const old = window.localStorage.getItem(KEY_V1);
    if (!old) return [];
    const migrated = migrateV1(JSON.parse(old) as unknown);
    window.localStorage.setItem(KEY, JSON.stringify(migrated));
    window.localStorage.removeItem(KEY_V1);
    return migrated;
  } catch {
    return [];
  }
}

export function recordRun(r: RunRecord): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(capRuns([...readRuns(), r])));
  } catch {
    /* Storage unavailable or full: the logbook is a convenience, never a requirement. */
  }
}

export function clearAll(): void {
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(KEY_V1);
  } catch { /* nothing to do */ }
}

export function clearDrill(id: string): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(readRuns().filter(r => r.id !== id)));
  } catch { /* nothing to do */ }
}
