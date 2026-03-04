/**
 * states.js — Layer 3: Element State Engine
 * Seasonal strength: Vượng · Tướng · Hưu · Tù · Tử
 */

import { PALACE_META } from './tables.js';

export const SEASON_MAP = {
  'Lập Xuân':'Xuân','Vũ Thủy':'Xuân','Kinh Trập':'Xuân',
  'Xuân Phân':'Xuân','Thanh Minh':'Xuân','Cốc Vũ':'Xuân',
  'Lập Hạ':'Hạ','Tiểu Mãn':'Hạ','Mang Chủng':'Hạ',
  'Hạ Chí':'Hạ','Tiểu Thử':'Hạ','Đại Thử':'Hạ',
  'Lập Thu':'Thu','Xử Thử':'Thu','Bạch Lộ':'Thu',
  'Thu Phân':'Thu','Hàn Lộ':'Thu','Sương Giáng':'Thu',
  'Lập Đông':'Đông','Tiểu Tuyết':'Đông','Đại Tuyết':'Đông',
  'Đông Chí':'Đông','Tiểu Hàn':'Đông','Đại Hàn':'Đông',
};

export const SEASON_STATES = {
  Xuân: { Mộc:'Vượng', Hỏa:'Tướng', Thổ:'Tử',   Kim:'Tù',   Thủy:'Hưu'  },
  Hạ:   { Hỏa:'Vượng', Thổ:'Tướng', Kim:'Tử',   Thủy:'Tù',  Mộc:'Hưu'   },
  Thu:  { Kim:'Vượng',  Thủy:'Tướng',Mộc:'Tử',  Hỏa:'Tù',   Thổ:'Hưu'   },
  Đông: { Thủy:'Vượng', Mộc:'Tướng', Hỏa:'Tử',  Thổ:'Tù',   Kim:'Hưu'   },
};

export const STATE_SCORES = { Vượng: 4, Tướng: 3, Hưu: 2, Tù: 1, Tử: 0 };

/**
 * getElementState(element, solarTermName)
 * Returns { state, season, score, isStrong, isWeak }
 */
export function getElementState(element, solarTermName) {
  const season = SEASON_MAP[solarTermName] || 'Xuân';
  const state  = SEASON_STATES[season][element] || 'Hưu';
  return { state, season, score: STATE_SCORES[state],
           isStrong: STATE_SCORES[state] >= 3,
           isWeak:   STATE_SCORES[state] <= 1 };
}

/**
 * scoreChartStates(chart)
 * Annotates every palace with palaceState, starState, doorState objects.
 */
export function scoreChartStates(chart) {
  const tkName = chart.solarTerm.name;
  return Object.fromEntries(
    Object.keys(chart.palaces).map(p => [p, {
      palaceState: getElementState(PALACE_META[p].element, tkName),
      starState:   chart.palaces[p].star?.element ? getElementState(chart.palaces[p].star.element, tkName) : null,
      doorState:   chart.palaces[p].mon?.element  ? getElementState(chart.palaces[p].mon.element,  tkName) : null,
    }])
  );
}
