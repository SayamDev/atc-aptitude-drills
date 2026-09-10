/*
 * Briefing content for the standalone drills, keyed by file name.
 *
 * The method lists are the teaching content that already lived in each page's
 * sidebar. They are repeated up front because a candidate meeting the format
 * for the first time under a clock learns the interface, not the test. Each
 * entry also carries the same rule as a diagram, for anyone who reads a picture
 * faster than a paragraph.
 */
(function () {
  'use strict';

  var C = {
    line: 'var(--rule)', ink: 'var(--ink)', mute: 'var(--muted)',
    blue: 'var(--blue)', good: 'var(--good)', bad: 'var(--bad)', face: 'var(--face)'
  };

  function svg(inner, h) {
    return '<svg viewBox="0 0 300 ' + (h || 140) + '" role="img" aria-hidden="true" ' +
      'font-family="ui-sans-serif, system-ui, sans-serif">' + inner + '</svg>';
  }
  function label(x, y, t, fill, size, weight, anchor) {
    return '<text x="' + x + '" y="' + y + '" fill="' + (fill || C.mute) + '" font-size="' +
      (size || 12) + '"' + (weight ? ' font-weight="' + weight + '"' : '') +
      (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + t + '</text>';
  }
  function chip(x, y, shape, fill) {
    var g = '<rect x="' + x + '" y="' + y + '" width="26" height="26" rx="3" fill="' + C.face +
      '" stroke="' + C.line + '"/>';
    var cx = x + 13, cy = y + 13;
    if (shape === 'circle') g += '<circle cx="' + cx + '" cy="' + cy + '" r="7" fill="' + fill + '"/>';
    if (shape === 'tri') g += '<path d="M' + cx + ' ' + (cy - 8) + ' L' + (cx + 8) + ' ' + (cy + 7) +
      ' L' + (cx - 8) + ' ' + (cy + 7) + ' z" fill="' + fill + '"/>';
    if (shape === 'square') g += '<rect x="' + (cx - 7) + '" y="' + (cy - 7) + '" width="14" height="14" fill="' + fill + '"/>';
    if (shape === 'cross') g += '<path d="M' + (cx - 7) + ' ' + (cy - 7) + ' L' + (cx + 7) + ' ' + (cy + 7) +
      ' M' + (cx + 7) + ' ' + (cy - 7) + ' L' + (cx - 7) + ' ' + (cy + 7) + '" stroke="' + fill +
      '" stroke-width="3" stroke-linecap="round"/>';
    if (shape === 'q') g += '<text x="' + cx + '" y="' + (cy + 7) + '" text-anchor="middle" font-size="18" font-weight="700" fill="' + C.blue + '">?</text>';
    return g;
  }

  var BRIEFS = {

    'geo-sudo-drill.html': {
      format: [
        'A grid is part filled with shapes. Every shape appears exactly once in each row and once in each column.',
        'One cell is marked <b>?</b>. Choose the shape that belongs there from the tray underneath.',
        'Number keys pick from the tray. The counts down the sides show how full each line already is.',
        'The real module runs about five minutes and gets harder as you go.'
      ],
      method: [
        '<b>Start at the ?</b>. List what its row is missing, then what its column is missing. The answer is in both lists.',
        'Still tied? <b>Fill the tightest cell you can find first</b> — the one with fewest candidates — and the ? often follows.',
        'If nothing is forced anywhere, <b>hunt one shape</b>: take a line missing it and ask which cells in that line could still take it.',
        'Never guess to save time. A wrong answer costs more than the seconds it saves.'
      ],
      figure: svg(
        label(10, 20, 'row is missing') +
        chip(112, 6, 'tri', '#E8B33A') + chip(144, 6, 'circle', C.good) +
        label(10, 62, 'column is missing') +
        chip(112, 48, 'circle', C.good) + chip(144, 48, 'cross', C.bad) +
        '<line x1="10" y1="84" x2="290" y2="84" stroke="' + C.line + '"/>' +
        label(10, 110, 'in both lists', C.good, 12, 600) +
        chip(112, 94, 'circle', C.good) +
        label(150, 111, '← the answer', C.ink)
      ),
      figureCaption: 'The answer is the shape the row and the column are both missing.'
    },

    'ndb-orientation-drill.html': {
      format: [
        'You are shown two instruments: a <b>gyro</b> giving the aircraft heading, and an <b>RBI</b> whose needle points at a beacon.',
        'From those two dials alone, work out which cell of the map the aircraft is sitting in, and which way it is pointing.',
        'Answer both parts. Getting the heading right and the cell wrong still scores nothing.',
        'The real module allows about three minutes.'
      ],
      method: [
        '<b>Read the gyro first, always.</b> That is your heading, and it decides which aircraft you are.',
        '<b>Read the RBI needle as an angle from the top</b> — how far right of the nose the beacon lies.',
        '<b>Add them.</b> Heading + needle = the direction of the beacon from you.',
        '<b>Flip it 180&deg;.</b> You sit on the opposite side of the beacon, and that is your cell.'
      ],
      figure: svg(
        '<circle cx="76" cy="48" r="34" fill="' + C.face + '" stroke="' + C.line + '"/>' +
        '<line x1="76" y1="48" x2="76" y2="20" stroke="' + C.mute + '" stroke-width="4"/>' +
        label(76, 98, 'gyro 040', C.mute, 12, null, 'middle') +
        '<circle cx="200" cy="48" r="34" fill="' + C.face + '" stroke="' + C.line + '"/>' +
        '<line x1="200" y1="48" x2="223" y2="27" stroke="' + C.blue + '" stroke-width="4"/>' +
        label(200, 98, 'needle 050', C.mute, 12, null, 'middle') +
        '<line x1="20" y1="112" x2="280" y2="112" stroke="' + C.line + '"/>' +
        label(150, 134, '040 + 050 = 090', C.ink, 13, 600, 'middle') +
        label(150, 154, 'flip 180 — you sit east of the beacon', C.good, 12, 600, 'middle'),
        168
      ),
      figureCaption: 'Heading plus needle gives the bearing to the beacon; the flip gives your own cell.'
    },

    'clx-rule-drill.html': {
      format: [
        'Two example tiles are shown. They share one rule and differ in everything else.',
        'Decide which of the answer tiles obeys that same rule.',
        'The rule is never stated. Everything that differs between the two examples is deliberate noise.',
        'The real module runs about six minutes.'
      ],
      method: [
        '<b>Count first.</b> Total symbols, or how many of one shape. Counting catches more rules than anything else.',
        '<b>Compare the two examples.</b> Anything that differs between them is noise, and can be ignored for good.',
        '<b>Rows and columns.</b> Is one line uniform, or deliberately all-different?',
        '<b>Position, then symmetry.</b> Centre, corners, diagonal; then mirrored left-right, top-bottom or rotated.',
        '<b>Empty cells count as information too.</b>'
      ],
      figure: svg(
        '<rect x="14" y="14" width="72" height="72" rx="4" fill="' + C.face + '" stroke="' + C.line + '"/>' +
        '<circle cx="38" cy="38" r="7" fill="' + C.blue + '"/><circle cx="62" cy="62" r="7" fill="' + C.blue + '"/>' +
        '<rect x="102" y="14" width="72" height="72" rx="4" fill="' + C.face + '" stroke="' + C.line + '"/>' +
        '<path d="M126 30 l10 18 l-20 0 z" fill="#E8B33A"/><path d="M150 54 l10 18 l-20 0 z" fill="#E8B33A"/>' +
        label(14, 106, 'two symbols', C.mute) + label(102, 106, 'two symbols', C.mute) +
        label(196, 40, 'shape differs', C.bad, 12) +
        label(196, 58, '= noise', C.bad, 12) +
        label(196, 84, 'count matches', C.good, 12, 600) +
        label(196, 102, '= the rule', C.good, 12, 600)
      ),
      figureCaption: 'What the two examples share is the rule. What differs between them is noise.'
    },

    'cmo-count-drill.html': {
      format: [
        'Dots move around the screen. Some are the target colour, some are not.',
        'Count the targets while they move, then enter the number.',
        'They cross and overlap on purpose, so a dot you have already counted can reappear somewhere else.',
        'The real module runs about two minutes.'
      ],
      method: [
        '<b>Hold your gaze on the centre.</b> Do not let your eyes chase a dot.',
        '<b>Count in threes, not ones</b> — 3, 6, 9, 12. Grouping is faster and far more robust.',
        '<b>Sweep once</b>, top band to bottom band, and commit.',
        '<b>Never recount.</b> A second pass counts a different arrangement, not the same one again.',
        'If it is crowded, count the gaps or the tight clusters instead.'
      ],
      figure: svg(
        '<rect x="14" y="10" width="200" height="96" rx="4" fill="' + C.face + '" stroke="' + C.line + '"/>' +
        '<ellipse cx="58" cy="38" rx="34" ry="20" fill="none" stroke="' + C.good + '" stroke-dasharray="4 3"/>' +
        '<circle cx="42" cy="34" r="6" fill="' + C.blue + '"/><circle cx="60" cy="44" r="6" fill="' + C.blue + '"/>' +
        '<circle cx="76" cy="32" r="6" fill="' + C.blue + '"/>' +
        '<ellipse cx="150" cy="72" rx="40" ry="20" fill="none" stroke="' + C.good + '" stroke-dasharray="4 3"/>' +
        '<circle cx="128" cy="70" r="6" fill="' + C.blue + '"/><circle cx="150" cy="78" r="6" fill="' + C.blue + '"/>' +
        '<circle cx="172" cy="66" r="6" fill="' + C.blue + '"/>' +
        '<path d="M108 58 l8 0 M112 54 l0 8" stroke="' + C.mute + '" stroke-width="2"/>' +
        label(96, 40, '3', C.good, 14, 700) + label(196, 74, '6', C.good, 14, 700) +
        label(228, 50, 'count in', C.ink, 12) + label(228, 68, 'threes', C.ink, 13, 600)
      ),
      figureCaption: 'Group as you go. Three at a time survives the movement; one at a time does not.'
    },

    'rt-reaction-drill.html': {
      format: [
        'Two cards appear side by side, each a short row of symbols.',
        'Say whether they are the <b>same</b> or <b>different</b>, as fast as you can, using two keys.',
        'It repeats without pause. Speed and accuracy are both scored.',
        'The real module runs about three minutes.'
      ],
      method: [
        '<b>Rest a finger on each key before the pair appears.</b> Most of your time is movement, not decision.',
        '<b>Scan position by position, left to right</b>, both cards at once.',
        '<b>Stop the moment you find a difference.</b> There is nothing to gain by checking the rest.',
        '&ldquo;Same&rdquo; always costs longer, because you have to check every position. Expect that and do not panic.',
        'After a mistake, take the next one at normal speed. Chasing it causes the second error.'
      ],
      figure: svg(
        '<rect x="14" y="20" width="120" height="40" rx="4" fill="' + C.face + '" stroke="' + C.line + '"/>' +
        '<rect x="14" y="72" width="120" height="40" rx="4" fill="' + C.face + '" stroke="' + C.line + '"/>' +
        '<circle cx="38" cy="40" r="8" fill="' + C.blue + '"/><circle cx="38" cy="92" r="8" fill="' + C.blue + '"/>' +
        '<rect x="60" y="32" width="16" height="16" fill="#E8B33A"/><rect x="60" y="84" width="16" height="16" fill="#E8B33A"/>' +
        '<path d="M98 32 l10 16 l-20 0 z" fill="' + C.good + '"/>' +
        '<circle cx="98" cy="92" r="8" fill="' + C.bad + '"/>' +
        '<rect x="86" y="26" width="26" height="92" rx="4" fill="none" stroke="' + C.bad + '" stroke-width="2"/>' +
        label(146, 60, 'first difference', C.bad, 12, 600) +
        label(146, 78, 'stop here — do not', C.mute, 12) +
        label(146, 94, 'check position four', C.mute, 12)
      ),
      figureCaption: 'Left to right, and stop on the first difference. Checking the rest earns nothing.'
    },

    'e3-concentration-drill.html': {
      format: [
        'A single image appears: a letter, with a number of dots above and below it.',
        'Answer yes or no to one fixed rule, over and over, for the whole run.',
        'Most images are a &ldquo;no&rdquo;. The task is staying accurate while nothing happens.',
        'The real module runs about two minutes, and measures whether you drift.'
      ],
      method: [
        '<b>Check the letter first, then the dots.</b> Never both at once.',
        '<b>Count dots in one glance</b> — two plus one, not one-two-three.',
        '<b>Most images are &ldquo;no&rdquo;.</b> Do not let a run of them make you careless.',
        'Keep a finger on each key so answering costs no movement.',
        'Blink between trials, never during one.'
      ],
      figure: svg(
        '<rect x="34" y="14" width="92" height="92" rx="4" fill="' + C.face + '" stroke="' + C.line + '"/>' +
        '<circle cx="66" cy="32" r="5" fill="' + C.ink + '"/><circle cx="94" cy="32" r="5" fill="' + C.ink + '"/>' +
        '<text x="80" y="72" text-anchor="middle" font-size="30" font-weight="700" fill="' + C.blue + '">K</text>' +
        '<circle cx="80" cy="90" r="5" fill="' + C.ink + '"/>' +
        '<path d="M142 46 l18 0" stroke="' + C.good + '" stroke-width="2"/>' +
        label(168, 36, '1. the letter', C.good, 12, 600) +
        label(168, 54, 'is it in the set?', C.mute, 12) +
        label(168, 82, '2. then the dots', C.good, 12, 600) +
        label(168, 100, 'two above, one below', C.mute, 12)
      ),
      figureCaption: 'One thing at a time. Reading letter and dots together is what produces drift.'
    },

    'motion-planning-drill.html': {
      format: [
        'A board holds a ball, a target square and several blocks.',
        'Slide blocks to open a path. Pieces slide until they hit something, so a move goes further than you expect.',
        'You are scored on <b>moves over the best possible</b>, not on time alone.',
        'The real module runs about six minutes.'
      ],
      method: [
        '<b>Trace the route backwards from the target first.</b> Work out where the ball must arrive from.',
        '<b>Only touch blocks sitting on that route.</b> Everything else is a distraction placed there on purpose.',
        '<b>Biggest blocker first.</b> Small pieces have more places to park, so they stay flexible.',
        '<b>Remember pieces slide until they hit something.</b> Check what will stop it before you move it.',
        'Tangled? Reset and replan. It is cheaper than untangling.'
      ],
      figure: svg(
        '<rect x="14" y="10" width="132" height="96" rx="4" fill="' + C.face + '" stroke="' + C.line + '"/>' +
        '<circle cx="36" cy="86" r="9" fill="#E13A2D"/>' +
        '<rect x="112" y="20" width="22" height="22" rx="2" fill="#1B2028"/>' +
        '<circle cx="123" cy="31" r="7" fill="none" stroke="#E13A2D" stroke-width="2.5"/>' +
        '<rect x="60" y="52" width="40" height="18" rx="2" fill="' + C.mute + '"/>' +
        '<path d="M123 46 L123 78 L45 78" stroke="' + C.good + '" stroke-width="2" stroke-dasharray="5 4" fill="none"/>' +
        label(160, 34, 'work back from', C.mute, 12) +
        label(160, 50, 'the target', C.ink, 13, 600) +
        label(160, 78, 'this block is on', C.mute, 12) +
        label(160, 94, 'the route — move it', C.good, 12, 600)
      ),
      figureCaption: 'The ringed square is where the ball must land. Plan backwards from it; only the blocks on that line are worth a move.'
    },

    'digit-numeracy-drill.html': {
      format: [
        'You are given a target number and a set of digits.',
        'Build an expression that reaches the target. Each digit can be used once.',
        'It is arithmetic under a clock, not hard arithmetic. Speed is the whole difficulty.',
        'The real module runs about six minutes.'
      ],
      method: [
        '<b>Times before plus.</b> Work out the multiplication part first, always.',
        '<b>Start from the biggest chunk</b> — it has the fewest options, so it prunes the search fastest.',
        '<b>Use the last digit as a filter.</b> 7 &times; 3 ends in 1, so the rest must supply the rest.',
        '<b>Odd or even?</b> An odd total cannot come from two even parts.',
        'Each digit appears once only. That alone kills a lot of near misses.'
      ],
      figure: svg(
        '<rect x="14" y="24" width="86" height="44" rx="4" fill="' + C.face + '" stroke="' + C.blue + '" stroke-width="2"/>' +
        '<text x="57" y="54" text-anchor="middle" font-size="21" font-weight="700" fill="' + C.ink + '">7 × 3</text>' +
        '<text x="116" y="54" text-anchor="middle" font-size="21" fill="' + C.mute + '">+</text>' +
        '<rect x="132" y="24" width="46" height="44" rx="4" fill="' + C.face + '" stroke="' + C.line + '"/>' +
        '<text x="155" y="54" text-anchor="middle" font-size="21" font-weight="700" fill="' + C.ink + '">4</text>' +
        '<text x="196" y="54" text-anchor="middle" font-size="21" fill="' + C.mute + '">=</text>' +
        '<text x="234" y="54" text-anchor="middle" font-size="21" font-weight="700" fill="' + C.good + '">25</text>' +
        label(14, 88, 'this first', C.blue, 12, 600) +
        label(14, 108, 'ends in 1, so the rest must supply 4', C.mute, 12)
      ),
      figureCaption: 'Settle the multiplication, then let its last digit tell you what is left to find.'
    },

    'english-language-drill.html': {
      format: [
        'Mixed items: fluency, vocabulary and spelling, one after another.',
        'Each has one correct option. Wrong answers may cost you marks, so a blind guess is not free.',
        'It is the longest module in the set, at about ten minutes.',
        'Pace matters more than difficulty: never spend more than about fifteen seconds on one item.'
      ],
      method: [
        '<b>Read the whole sentence before looking at the options.</b> The ending usually decides the answer.',
        '<b>For spelling, sound out the syllables one at a time.</b> Doubled letters are where the traps live.',
        '<b>For vocabulary, decide positive or negative first.</b> That alone kills two options.',
        '<b>Eliminate before you guess</b>, and move on at fifteen seconds whatever happens.'
      ],
      figure: svg(
        label(14, 24, 'is the word positive or negative?', C.mute, 12) +
        '<rect x="14" y="34" width="126" height="26" rx="3" fill="' + C.face + '" stroke="' + C.line + '"/>' +
        label(24, 52, 'generous', C.ink, 13) +
        '<line x1="18" y1="47" x2="136" y2="47" stroke="' + C.bad + '" stroke-width="2"/>' +
        '<rect x="152" y="34" width="126" height="26" rx="3" fill="' + C.face + '" stroke="' + C.line + '"/>' +
        label(162, 52, 'cautious', C.ink, 13) +
        '<line x1="156" y1="47" x2="274" y2="47" stroke="' + C.bad + '" stroke-width="2"/>' +
        '<rect x="14" y="70" width="126" height="26" rx="3" fill="' + C.face + '" stroke="' + C.good + '" stroke-width="2"/>' +
        label(24, 88, 'reckless', C.ink, 13) +
        '<rect x="152" y="70" width="126" height="26" rx="3" fill="' + C.face + '" stroke="' + C.good + '" stroke-width="2"/>' +
        label(162, 88, 'rash', C.ink, 13) +
        label(14, 118, 'two gone before you have read them properly', C.good, 12, 600)
      ),
      figureCaption: 'Sort by sense before meaning. Half the options usually fall out immediately.'
    }
  };

  var file = window.location.pathname.split('/').pop();
  if (BRIEFS[file]) window.DRILL_BRIEF = BRIEFS[file];
})();
