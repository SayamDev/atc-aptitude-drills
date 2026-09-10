/**
 * Colour scheme choice, shared with the standalone drills through one key so a
 * candidate picks a theme once for the whole site.
 *
 * "system" is the default and stamps nothing on the root, leaving
 * prefers-color-scheme in charge. The other two stamp data-theme, which the
 * tokens are written to obey over the media query.
 */
export type Theme = 'system' | 'light' | 'dark';

export const THEME_KEY = 'atc-drills:theme';
export const THEMES: Theme[] = ['system', 'light', 'dark'];

const isTheme = (v: unknown): v is Theme => THEMES.includes(v as Theme);

export function readTheme(): Theme {
  try {
    const v = window.localStorage.getItem(THEME_KEY);
    return isTheme(v) ? v : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(t: Theme): void {
  const root = document.documentElement;
  if (t === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', t);
  // Keeps form controls, scrollbars and the browser's own UI in step.
  root.style.colorScheme = t === 'system' ? 'light dark' : t;
}

export function setTheme(t: Theme): void {
  applyTheme(t);
  try {
    window.localStorage.setItem(THEME_KEY, t);
  } catch {
    /* Choice still applies for this page; it just will not be remembered. */
  }
}
