import { useState } from 'react';
import { THEMES, readTheme, setTheme, type Theme } from '../lib/theme';
import './theme-toggle.css';

const LABEL: Record<Theme, string> = { system: 'Auto', light: 'Light', dark: 'Dark' };
const HINT: Record<Theme, string> = {
  system: 'Follow the system setting',
  light: 'Always light',
  dark: 'Always dark'
};

/**
 * Three states rather than two, because "follow my system" is a real preference
 * and a two-way switch silently overrides it. Radios, not buttons: it is one
 * choice out of three, and that is what a screen reader should hear.
 */
export function ThemeToggle() {
  const [theme, setLocal] = useState<Theme>(readTheme);

  const choose = (t: Theme) => { setTheme(t); setLocal(t); };

  return (
    <fieldset className="theme">
      <legend className="visually-hidden">Colour scheme</legend>
      {THEMES.map(t => (
        <label key={t} className={`theme__opt${theme === t ? ' is-on' : ''}`} title={HINT[t]}>
          <input
            type="radio"
            name="theme"
            value={t}
            checked={theme === t}
            onChange={() => choose(t)}
            className="visually-hidden"
          />
          <span>{LABEL[t]}</span>
        </label>
      ))}
    </fieldset>
  );
}
