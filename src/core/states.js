/**
 * states.js — Layer 3: Element State Engine
 * Seasonal strength: Vượng · Tướng · Hưu · Tù · Tử
 */

import { PALACE_META } from './tables.js';
import QMDJ_DICTIONARY from '../lib/qmdj_dictionary.json' with { type: 'json' };

const BRANCH_TO_PALACE = {
  Tý: 1,
  Sửu: 8,
  Dần: 8,
  Mão: 3,
  Thìn: 4,
  Tỵ: 4,
  Tị: 4,
  Ngọ: 9,
  Mùi: 2,
  Thân: 2,
  Dậu: 7,
  Tuất: 6,
  Hợi: 6,
};

const STEM_GRAVE_BRANCH = QMDJ_DICTIONARY?.stateRules?.stemGraveBranches || {};
const NET_STEMS = QMDJ_DICTIONARY?.stateRules?.netStems || {};
const HINH_BACH_BRANCHES_BY_STEM = QMDJ_DICTIONARY?.stateRules?.hinhBachBranchesByStem || {};

const PALACE_TO_BRANCH = Object.fromEntries(
  Object.entries(BRANCH_TO_PALACE).map(([branch, palaceNum]) => [palaceNum, branch])
);

function getPatternDef(patternKey, fallback = {}) {
  return {
    ...(QMDJ_DICTIONARY?.majorPatterns?.[patternKey] || {}),
    ...fallback,
  };
}

function createStateHit(def, palaceNum, overrides = {}) {
  return {
    id: def.id,
    name: def.name,
    type: def.type || 'warning',
    priority: def.priority || 0,
    desc: def.desc || '',
    source: def.source || 'state-pattern',
    scope: def.scope || 'palace',
    palace: palaceNum,
    dir: PALACE_META[palaceNum]?.dir || '',
    scoreDelta: Number(def.scoreDelta || 0),
    formationScore: Number(def.formationScore || def.scoreDelta || 0),
    ...overrides,
  };
}

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

export function evaluateStates(palace = {}, options = {}) {
  const {
    palaceNum = Number(palace?.palaceNum || 0) || null,
    isUsefulGod = false,
    isActionPalace = false,
  } = options;

  if (!palaceNum || palaceNum === 5) return [];

  const hits = [];
  const heavenStem = palace?.can?.name || palace?.can || '';
  const starStem = palace?.starStem || palace?.sentCan?.name || '';
  const graveBranch = STEM_GRAVE_BRANCH[heavenStem] || '';
  const gravePalace = graveBranch ? BRANCH_TO_PALACE[graveBranch] : null;
  const palaceBranch = PALACE_TO_BRANCH[palaceNum] || '';

  if (gravePalace && gravePalace === palaceNum) {
    const graveDef = getPatternDef('nhap_mo', {
      id: 'nhap_mo',
      name: 'Nhập Mộ',
      type: 'warning',
      priority: 8,
      desc: 'Khí bị chôn, việc dễ kẹt, chủ thể hoặc cơ hội khó bung lực ra ngoài.',
      scoreDelta: -4,
      source: 'stem-grave',
      scope: 'state',
      isPhysicalConstraint: true,
    });
    hits.push(createStateHit(graveDef, palaceNum, {
      id: `STATE_GRAVE_${heavenStem}_${graveBranch}`,
      desc: `${heavenStem} nhập mộ tại ${graveBranch}: ${graveDef.desc}`,
      isPhysicalConstraint: true,
      relatedStem: heavenStem,
      relatedBranch: graveBranch,
    }));
  }

  if (starStem) {
    const starGraveBranch = STEM_GRAVE_BRANCH[starStem] || '';
    const starGravePalace = starGraveBranch ? BRANCH_TO_PALACE[starGraveBranch] : null;
    if (starGravePalace && starGravePalace === palaceNum) {
      const graveDef = getPatternDef('nhap_mo', {
        id: 'nhap_mo',
        name: 'Nhập Mộ',
        type: 'warning',
        priority: 8,
        desc: 'Khí bị chôn, việc dễ kẹt, chủ thể hoặc cơ hội khó bung lực ra ngoài.',
        scoreDelta: -4,
        source: 'star-grave',
        scope: 'state',
        isPhysicalConstraint: true,
      });
      hits.push(createStateHit(graveDef, palaceNum, {
        id: `STATE_STAR_GRAVE_${starStem}_${starGraveBranch}`,
        desc: `Tinh mang khí ${starStem} nhập mộ tại ${starGraveBranch}: ${graveDef.desc}`,
        isPhysicalConstraint: true,
        relatedStem: starStem,
        relatedBranch: starGraveBranch,
      }));
    }
  }

  if ((isUsefulGod || isActionPalace) && NET_STEMS[heavenStem]) {
    const netDef = getPatternDef('thien_la_dia_vong', {
      id: 'thien_la_dia_vong',
      name: 'Thiên La/Địa Võng',
      type: 'warning',
      priority: 8,
      desc: 'Lưới thủ tục và ràng buộc vô hình đang quấn quanh cung hành động hoặc Dụng Thần.',
      scoreDelta: -3,
      source: 'useful-god-net',
      scope: 'state',
      isPhysicalConstraint: true,
    });
    hits.push(createStateHit(netDef, palaceNum, {
      id: `STATE_NET_${heavenStem}_${palaceNum}`,
      desc: `${heavenStem} xuất hiện tại cung trọng điểm: ${netDef.desc}`,
      isPhysicalConstraint: true,
      relatedStem: heavenStem,
      netType: NET_STEMS[heavenStem],
    }));
  }

  const hostileBranches = HINH_BACH_BRANCHES_BY_STEM[heavenStem] || [];
  if (palaceBranch && hostileBranches.includes(palaceBranch)) {
    const hinhDef = getPatternDef('hinh_bach', {
      id: 'hinh_bach',
      name: 'Hình Bách',
      type: 'warning',
      priority: 7,
      desc: 'Can Thiên bàn rơi vào chi xung/hình của cung, tạo lực siết, va đập hoặc kháng cự khó chịu.',
      scoreDelta: -2,
      source: 'stem-branch-conflict',
      scope: 'state',
      isPhysicalConstraint: true,
    });
    hits.push(createStateHit(hinhDef, palaceNum, {
      id: `STATE_HINH_BACH_${heavenStem}_${palaceBranch}`,
      desc: `${heavenStem} lâm chi ${palaceBranch}: ${hinhDef.desc}`,
      isPhysicalConstraint: true,
      relatedStem: heavenStem,
      relatedBranch: palaceBranch,
    }));
  }

  return hits;
}
