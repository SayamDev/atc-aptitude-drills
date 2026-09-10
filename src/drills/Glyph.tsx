/**
 * One mark per drill, drawn from the drill's own task rather than a generic
 * category icon: the arrow that swings, the pattern that flashes, the two cards
 * you compare. On an index a candidate opens daily, the shape is what they
 * recognise — the name is what they read once.
 *
 * All are 24x24 on the same stroke weight so the column reads as one set, and
 * all use currentColor so they follow the card's own hover and theme states.
 */
const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
};

const PATHS: Record<string, React.ReactNode> = {
  // scales nav — a heading that swings through a right-angle turn
  nav: <><path d="M5 20V9a4 4 0 0 1 4-4h8" /><path d="m14 2 4 3-4 3" /></>,
  // scales ndb — a compass needle bearing on a beacon
  ndb: <><circle cx="12" cy="12" r="8" /><path d="m9 15 3-8 3 8-3-2z" /></>,
  // scales lst — shapes that each appear once, and the one slot still empty.
  // Drawn as shapes rather than a plain grid so it cannot be mistaken for
  // gridChallenge, which is the other grid in the set.
  geosudo: <><circle cx="7" cy="7" r="2.6" /><path d="m17 4.4 2.6 5.2h-5.2z" /><rect x="4.4" y="14.4" width="5.2" height="5.2" rx="1" /><rect x="14.2" y="14.2" width="5.6" height="5.6" rx="1" strokeDasharray="2 2" opacity=".8" /></>,
  // scales clx — one item in the set breaks the rule
  clx: <><circle cx="7" cy="7" r="2.6" /><circle cx="17" cy="7" r="2.6" /><circle cx="7" cy="17" r="2.6" /><rect x="14.2" y="14.2" width="5.6" height="5.6" rx="1" /></>,
  // scales cmo — moving dots with their trails
  cmo: <><circle cx="8" cy="8" r="2" /><circle cx="17" cy="14" r="2" /><circle cx="9" cy="18" r="2" /><path d="M3 8h2.5M12.5 14H15M3.5 18H6" /></>,
  // scales rt — two cards, same or different
  rt: <><rect x="2.5" y="6" width="8" height="12" rx="1.5" /><rect x="13.5" y="6" width="8" height="12" rx="1.5" /><path d="M6.5 12h0M17.5 10.5v3" /></>,
  // scales e3+ — one signal, over and over
  e3: <><rect x="6" y="4" width="12" height="16" rx="2" /><path d="M9.5 8.5h0M14.5 8.5h0M12 15.5h0" /></>,
  // motionChallenge — a ball routed to a target
  motion: <><circle cx="6" cy="6" r="2.5" /><rect x="16" y="16" width="5" height="5" rx="1" /><path d="M6 10v6a2 2 0 0 0 2 2h6" strokeDasharray="2.5 2.5" /></>,
  // gridChallenge — a pattern held in the grid
  grid: <><rect x="3.5" y="3.5" width="17" height="17" rx="2" /><path d="M12 3.5v17M3.5 12h17" /><rect x="12" y="3.5" width="8.5" height="8.5" fill="currentColor" stroke="none" opacity=".9" /><rect x="3.5" y="12" width="8.5" height="8.5" fill="currentColor" stroke="none" opacity=".35" /></>,
  // digitChallenge — times before plus
  digit: <><path d="M4 7.5h6M7 4.5v6" /><path d="m14.5 5.5 5 5M19.5 5.5l-5 5" /><path d="M4.5 17.5h6M13.5 15.5h6M13.5 19.5h6" /></>,
  // circle recall — points held as a shape through a gap
  vwm: <><circle cx="6.5" cy="8" r="2.2" /><circle cx="17.5" cy="6.5" r="2.2" /><circle cx="18" cy="17" r="2.2" /><path d="M8.5 9.5 15.8 16M8 10.2l8.2-2.6" strokeDasharray="2 2.5" opacity=".85" /><circle cx="7" cy="18" r="2.2" strokeDasharray="2 2" opacity=".6" /></>,
  // scales lt-e — lines of language, one picked
  lt: <><path d="M4 6h16M4 11h11M4 16h7" /><path d="m15.5 17 2 2 4-4.5" /></>
};

export function Glyph({ id }: { id: string }) {
  const d = PATHS[id];
  if (!d) return null;
  return (
    <svg className="glyph" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...S}>
      {d}
    </svg>
  );
}
