/*
 * Shared chrome for the standalone drills.
 *
 * These pages predate the React shell and are being ported to it one at a time.
 * Until then this script gives them the three things their users actually miss:
 * a way back to the index, a stated language for assistive technology, and the
 * same instructions-before-you-start briefing the ported drills have.
 *
 * A page opts into the briefing by defining window.DRILL_BRIEF before loading
 * this file. Everything here is progressive: with the script blocked, the drill
 * still works exactly as it did.
 */
(function () {
  'use strict';

  var brief = window.DRILL_BRIEF;

  document.documentElement.lang = document.documentElement.lang || 'en-GB';

  var css = document.createElement('style');
  css.textContent = [
    ':root{--shell-on-blue:#ffffff}',
    ':root[data-theme="dark"]{--shell-on-blue:#0d1216}',
    '.shell-bar{display:flex;align-items:center;gap:16px;flex-wrap:wrap;max-width:980px;margin:0 auto 14px}',
    // --blue on the --bezel page background is only 3.99:1; --ink is 12.2:1.
    '.shell-bar a{color:var(--ink);font-size:14px;text-underline-offset:2px}',
    '.shell-bar button{font:inherit;font-size:14px;min-height:44px;padding:0 14px;border:1px solid var(--rule);',
    'border-radius:3px;background:var(--face);color:var(--ink);cursor:pointer}',
    '.shell-bar button:hover,.shell-brief__go:hover{background:color-mix(in srgb,var(--ink) 8%,var(--face));',
    'border-color:var(--muted)}',
    '.shell-bar :focus-visible,.shell-brief :focus-visible{outline:3px solid var(--blue);outline-offset:2px}',
    '.shell-brief{max-width:980px;margin:0 auto 16px;background:var(--face);border:1px solid var(--rule);',
    'border-radius:4px;border-top:3px solid var(--blue);padding:18px}',
    '.shell-brief h2{margin:0 0 8px;font-size:13px;font-weight:650;color:var(--muted);',
    'text-transform:uppercase;letter-spacing:.06em}',
    '.shell-brief__cols{display:grid;gap:22px;grid-template-columns:minmax(0,1fr) minmax(220px,300px);align-items:start}',
    '@media(max-width:760px){.shell-brief__cols{grid-template-columns:minmax(0,1fr)}}',
    '.shell-brief ol{margin:0 0 18px;padding-left:20px;font-size:14.5px}',
    '.shell-brief ol:last-child{margin-bottom:0}',
    '.shell-brief li{margin-bottom:7px}',
    '.shell-brief figure{margin:0;padding:12px;border:1px solid var(--rule);border-radius:4px;background:var(--face)}',
    '.shell-brief figure svg{display:block;width:100%;height:auto}',
    '.shell-brief figcaption{margin-top:8px;font-size:13px;color:var(--muted)}',
    '.shell-brief__go{margin-top:18px;font:inherit;font-size:15px;min-height:44px;padding:0 18px;',
    'border:1px solid var(--blue);border-radius:3px;background:var(--blue);color:var(--shell-on-blue);cursor:pointer;',
    'transition:background-color 120ms ease,border-color 120ms ease}',
    '.shell-brief__go:hover{background:color-mix(in srgb,var(--ink) 14%,var(--blue));',
    'border-color:color-mix(in srgb,var(--ink) 14%,var(--blue))}',
    '.shell-theme{display:inline-flex;margin:0 0 0 auto;padding:2px;gap:2px;border:1px solid var(--rule);',
    'border-radius:3px;background:var(--face)}',
    '.shell-theme label{display:inline-flex;align-items:center;min-height:36px;padding:0 10px;',
    'font-size:13px;color:var(--muted);border-radius:2px;cursor:pointer}',
    '.shell-theme label:hover{color:var(--ink)}',
    '.shell-theme label.on{background:var(--blue);color:var(--shell-on-blue)}',
    '.shell-theme label:has(input:focus-visible){outline:3px solid var(--blue);outline-offset:2px}',
    '.shell-theme input{position:absolute;width:1px;height:1px;opacity:0}'
  ].join('');
  document.head.appendChild(css);

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function list(items) {
    var ol = el('ol');
    items.forEach(function (item) {
      var li = el('li');
      li.innerHTML = item;               // Content is authored in this repo, not user input.
      ol.appendChild(li);
    });
    return ol;
  }

  var bar = el('nav', 'shell-bar');
  bar.setAttribute('aria-label', 'Breadcrumb');
  var back = el('a', null, 'All drills');
  back.href = '../';
  bar.appendChild(back);

  var panel = null;
  if (brief) {
    panel = el('section', 'shell-brief');
    panel.setAttribute('aria-label', 'How this drill works');

    var cols = el('div', 'shell-brief__cols');
    var text = el('div');
    text.appendChild(el('h2', null, 'What happens'));
    text.appendChild(list(brief.format));
    text.appendChild(el('h2', null, 'The method'));
    text.appendChild(list(brief.method));
    cols.appendChild(text);

    var fig = el('figure');
    fig.innerHTML = brief.figure;
    var cap = el('figcaption', null, brief.figureCaption);
    fig.appendChild(cap);
    cols.appendChild(fig);
    panel.appendChild(cols);

    var go = el('button', 'shell-brief__go', 'Got it — start');
    go.addEventListener('click', function () {
      panel.hidden = true;
      toggle.textContent = 'How it works';
      if (window.__armDrillClock) window.__armDrillClock();
      var first = document.querySelector('.btn, button');
      if (first) first.focus();
    });
    panel.appendChild(go);

    var toggle = el('button', null, 'Hide instructions');
    toggle.addEventListener('click', function () {
      // Hiding the instructions is also a way of starting.
      if (panel.hidden === false && window.__armDrillClock) window.__armDrillClock();
      panel.hidden = !panel.hidden;
      toggle.textContent = panel.hidden ? 'How it works' : 'Hide instructions';
      if (!panel.hidden) panel.scrollIntoView({ block: 'nearest' });
    });
    bar.appendChild(toggle);
  }

  var THEME_KEY = 'atc-drills:theme';
  function currentTheme() {
    try { var v = window.localStorage.getItem(THEME_KEY);
          return (v === 'light' || v === 'dark') ? v : 'system'; }
    catch (e) { return 'system'; }
  }
  function applyTheme(t) {
    var root = document.documentElement;
    if (t === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', t);
    root.style.colorScheme = t === 'system' ? 'light dark' : t;
    try { window.localStorage.setItem(THEME_KEY, t); } catch (e) {}
  }
  var themes = [['system', 'Auto'], ['light', 'Light'], ['dark', 'Dark']];
  var group = el('fieldset', 'shell-theme');
  var legend = el('legend', null, 'Colour scheme');
  legend.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)';
  group.appendChild(legend);
  themes.forEach(function (pair) {
    var lab = el('label', currentTheme() === pair[0] ? 'on' : null);
    var input = document.createElement('input');
    input.type = 'radio'; input.name = 'shell-theme'; input.value = pair[0];
    input.checked = currentTheme() === pair[0];
    input.addEventListener('change', function () {
      applyTheme(pair[0]);
      var labels = group.querySelectorAll('label');
      for (var i = 0; i < labels.length; i++) labels[i].className = '';
      lab.className = 'on';
    });
    lab.appendChild(input);
    lab.appendChild(el('span', null, pair[1]));
    group.appendChild(lab);
  });
  bar.appendChild(group);

  document.body.insertBefore(bar, document.body.firstChild);
  if (panel) document.body.insertBefore(panel, bar.nextSibling);

  function armOnFirstUse(e) {
    if (bar.contains(e.target) || (panel && panel.contains(e.target))) return;
    if (window.__armDrillClock) window.__armDrillClock();
  }
  document.addEventListener('pointerdown', armOnFirstUse, true);
  document.addEventListener('keydown', armOnFirstUse, true);

  /*
   * These pages label their grid cells with aria-label on a plain <div>. ARIA
   * discards aria-label on an element with no role, so those labels reach no
   * one. The cells are pictures of a shape, so role="img" is the honest one,
   * and it makes the existing labels count. Puzzles re-render, hence the
   * observer.
   */
  function nameOrphans(root) {
    var nodes = root.querySelectorAll('div[aria-label]:not([role]), span[aria-label]:not([role])');
    for (var i = 0; i < nodes.length; i++) nodes[i].setAttribute('role', 'img');
  }
  nameOrphans(document);
  if (window.MutationObserver) {
    new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var added = records[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          if (added[j].nodeType === 1) nameOrphans(added[j].parentNode || document);
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }
})();
