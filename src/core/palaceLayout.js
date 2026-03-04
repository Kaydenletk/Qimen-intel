import { PALACE_META } from './tables.js';

export const ORDER = ['SE', 'S', 'SW', 'E', 'C', 'W', 'NE', 'N', 'NW'];

export const SLOT_TO_PALACE = {
  SE: 4,
  S: 9,
  SW: 2,
  E: 3,
  C: 5,
  W: 7,
  NE: 8,
  N: 1,
  NW: 6,
};

export const PALACE_TO_SLOT = Object.fromEntries(
  Object.entries(SLOT_TO_PALACE).map(([slot, palaceNum]) => [palaceNum, slot])
);

export function displayStarShort(pal) {
  if (!pal) return '';
  // SelfPlus-compatible: show Nhuế when Trực Phù lands on Cầm
  if (pal.star?.short === 'Cầm' && pal.trucPhu) return 'Nhuế';
  return pal.star?.short || '';
}

export function normalizePalaces(rawPalaces) {
  const palacesByNum = {};

  for (let palaceNum = 1; palaceNum <= 9; palaceNum++) {
    const src = rawPalaces?.[palaceNum] || {};
    palacesByNum[palaceNum] = {
      ...src,
      palaceNum,
      palaceName: src.palaceName || PALACE_META[palaceNum]?.name || (palaceNum === 5 ? 'Trung Cung' : `Cung ${palaceNum}`),
      directionLabel: PALACE_TO_SLOT[palaceNum] || '',
      mon: src.mon || null,
      star: src.star || null,
      than: src.than || null,
      can: src.can || null,
      earthStem: src.earthStem || '',
    };
  }

  return palacesByNum;
}
