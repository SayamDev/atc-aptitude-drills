import type { ComponentType } from 'react';
import { GridDrill } from './grid/GridDrill';
import { VwmDrill } from './vwm/VwmDrill';
import { NavDrill } from './nav/NavDrill';

export interface DrillMeta {
  id: string;
  name: string;
  /** The Aon/cut-e module this practises, as it appears in an invitation email. */
  testCode: string;
  measures: string;
  testMinutes: number;
  /** 'react' drills are part of the app; 'legacy' ones are standalone pages awaiting a port. */
  status: 'react' | 'legacy';
  /**
   * Which battery the module belongs to. 'lab' is not an employer's module: it is a
   * research-style task included because it trains something the published ones
   * assume you already have.
   */
  family: 'scales' | 'challenge' | 'lab';
  component?: ComponentType;
  legacyPath?: string;
}

export const DRILLS: DrillMeta[] = [
  {
    id: 'nav', name: 'Sense of direction', family: 'scales', testCode: 'scales nav',
    measures: 'Orientation after changes of direction', testMinutes: 1,
    status: 'react', component: NavDrill
  },
  {
    id: 'ndb', name: 'Spatial orientation', family: 'scales', testCode: 'scales ndb',
    measures: 'Position and course from a gyro and radio compass', testMinutes: 3,
    status: 'legacy', legacyPath: 'legacy/ndb-orientation-drill.html'
  },
  {
    id: 'geosudo', name: 'Gap challenge', family: 'scales', testCode: 'scales lst',
    measures: 'Applying rules in logical steps', testMinutes: 5,
    status: 'legacy', legacyPath: 'legacy/geo-sudo-drill.html'
  },
  {
    id: 'clx', name: 'Rule finding', family: 'scales', testCode: 'scales clx',
    measures: 'Inductive-logical reasoning', testMinutes: 6,
    status: 'legacy', legacyPath: 'legacy/clx-rule-drill.html'
  },
  {
    id: 'cmo', name: 'Monitoring ability', family: 'scales', testCode: 'scales cmo',
    measures: 'Counting moving objects', testMinutes: 2,
    status: 'legacy', legacyPath: 'legacy/cmo-count-drill.html'
  },
  {
    id: 'rt', name: 'Reaction speed', family: 'scales', testCode: 'scales rt',
    measures: 'Same or different, at speed', testMinutes: 3,
    status: 'legacy', legacyPath: 'legacy/rt-reaction-drill.html'
  },
  {
    id: 'e3', name: 'Concentration', family: 'scales', testCode: 'scales e3+',
    measures: 'Sustained attention on a repetitive signal', testMinutes: 2,
    status: 'legacy', legacyPath: 'legacy/e3-concentration-drill.html'
  },
  {
    id: 'motion', name: 'Complex planning', family: 'challenge', testCode: 'motionChallenge',
    measures: 'Planning a route in the fewest moves', testMinutes: 6,
    status: 'legacy', legacyPath: 'legacy/motion-planning-drill.html'
  },
  {
    id: 'grid', name: 'Visual memory', family: 'challenge', testCode: 'gridChallenge',
    measures: 'Reproducing a pattern from short-term memory', testMinutes: 5,
    status: 'react', component: GridDrill
  },
  {
    id: 'digit', name: 'Numeracy', family: 'challenge', testCode: 'digitChallenge',
    measures: 'Mental arithmetic against the clock', testMinutes: 6,
    status: 'legacy', legacyPath: 'legacy/digit-numeracy-drill.html'
  },
  {
    id: 'lt', name: 'English language', family: 'scales', testCode: 'scales lt-e',
    measures: 'Fluency, vocabulary and spelling', testMinutes: 10,
    status: 'legacy', legacyPath: 'legacy/english-language-drill.html'
  },
  {
    id: 'vwm', name: 'Circle recall', family: 'lab', testCode: 'spatial complex span',
    measures: 'Visuo-spatial working memory capacity', testMinutes: 8,
    status: 'react', component: VwmDrill
  }
];

export const findDrill = (id: string) => DRILLS.find(d => d.id === id);
