import { PALACE_META, STEMS_BY_NAME } from '../../core/tables.js';
import { compareNguHanh } from './nguHanhRelation.js';

const DOOR_NORMALIZE = {
  'Khai Môn': 'Khai',
  'Sinh Môn': 'Sinh',
  'Hưu Môn': 'Hưu',
  'Đỗ Môn': 'Đỗ',
  'Thương Môn': 'Thương',
  'Cảnh Môn': 'Cảnh',
  'Kinh Môn': 'Kinh',
  'Tử Môn': 'Tử',
};

const STAR_NORMALIZE = {
  'Thiên Bồng': 'Bồng',
  'Thiên Nhuế': 'Nhuế',
  'Thiên Xung': 'Xung',
  'Thiên Phụ': 'Phụ',
  'Thiên Cầm': 'Cầm',
  'Thiên Tâm': 'Tâm',
  'Thiên Trụ': 'Trụ',
  'Thiên Nhậm': 'Nhâm',
  'Thiên Anh': 'Anh',
};

const DEITY_NORMALIZE = {
  'Trực Phù': 'Trực Phù',
  'Đằng Xà': 'Đằng Xà',
  'Thái Âm': 'Thái Âm',
  'Lục Hợp': 'Lục Hợp',
  'Bạch Hổ': 'Bạch Hổ',
  'Huyền Vũ': 'Huyền Vũ',
  'Cửu Địa': 'Cửu Địa',
  'Cửu Thiên': 'Cửu Thiên',
};

export function normalizeDoor(rawDoor) {
  if (!rawDoor) return '';
  return DOOR_NORMALIZE[rawDoor] || rawDoor;
}

export function normalizeStar(rawStar) {
  if (!rawStar) return '';
  return STAR_NORMALIZE[rawStar] || rawStar;
}

export function normalizeDeity(rawDeity) {
  if (!rawDeity) return '';
  return DEITY_NORMALIZE[rawDeity] || rawDeity;
}

export function deriveFlags(chart, palace) {
  return {
    VOID: Boolean(palace?.khongVong),
    GRAVE: false, // TODO: add dedicated Nhập Mộ detector
    FU_YIN: Boolean(chart?.isPhucAm),
    FAN_YIN: Boolean(chart?.isPhanNgam),
    DOOR_COMPELLING: Boolean(palace?.trucSu),
    PALACE_COMPELLING: Boolean(palace?.trucPhu),
    DICH_MA: Boolean(palace?.dichMa),
  };
}

export function getDirectionLabel(palaceNum) {
  return PALACE_META[palaceNum]?.dir || `Cung ${palaceNum}`;
}

export function findPalaceByStemName(chart, stemName) {
  if (!chart?.palaces || !stemName) return { palaceNum: null, palace: null };
  for (const [key, palace] of Object.entries(chart.palaces)) {
    if (Number(key) === 5) continue;
    if (palace?.can?.name === stemName) {
      return { palaceNum: Number(key), palace };
    }
  }
  return { palaceNum: null, palace: null };
}

export function normalizeTopicContext({ chart, topicResult }) {
  const usefulPalaceNum = Number(topicResult?.usefulGodPalace) || 1;
  const palace = chart?.palaces?.[usefulPalaceNum] || {};
  const door = normalizeDoor(palace?.mon?.name || palace?.mon?.short || '');
  const star = normalizeStar(palace?.star?.name || palace?.star?.short || '');
  const deity = normalizeDeity(palace?.than?.name || '');
  const dayStemName = chart?.dayPillar?.stemName || '';
  const dayStemElement = STEMS_BY_NAME[dayStemName]?.element || '';
  const capitalStemName = 'Mậu';
  const { palaceNum: capitalPalaceNum, palace: capitalPalace } = findPalaceByStemName(chart, capitalStemName);
  const { palaceNum: userPalaceNum } = findPalaceByStemName(chart, dayStemName);
  const nguHanhRelation = (userPalaceNum && usefulPalaceNum)
    ? compareNguHanh(userPalaceNum, usefulPalaceNum, dayStemName)
    : null;
  const actionPalaceNum = chart?.trucSuPalace || null;
  const blockerFlags = [];
  const rawTopicScore = Number(topicResult?.score || 0);
  let effectiveTopicScore = rawTopicScore;
  let voidPressure = null;

  if (palace?.khongVong) blockerFlags.push('Không Vong');
  if (door.includes('Tử')) blockerFlags.push('Tử Môn');
  if (door.includes('Đỗ')) blockerFlags.push('Đỗ Môn');

  if (palace?.khongVong) {
    const scoreMagnitude = Math.max(2, Math.ceil(Math.abs(rawTopicScore) * 0.75));
    effectiveTopicScore = rawTopicScore > 0
      ? Math.min(0, rawTopicScore - scoreMagnitude)
      : rawTopicScore - 1;
    voidPressure = {
      palaceNum: usefulPalaceNum,
      palaceName: PALACE_META[usefulPalaceNum]?.name || '',
      rawTopicScore,
      effectiveTopicScore,
      summary: 'Dụng Thần dính Không Vong: điểm đẹp chỉ còn là vỏ bọc, phải hạ nhiệt trước khi luận chiến thuật.',
    };
  }

  const markersForAI = {
    rootCausePalace: usefulPalaceNum,
    rootCausePalaceName: PALACE_META[usefulPalaceNum]?.name || '',
    userPalace: userPalaceNum,
    userPalaceName: PALACE_META[userPalaceNum]?.name || '',
    actionPalace: actionPalaceNum,
    actionPalaceName: PALACE_META[actionPalaceNum]?.name || '',
    blockerPalace: blockerFlags.length ? usefulPalaceNum : null,
    blockerFlags,
    nguHanhRelation,
  };

  return {
    chart,
    usefulPalaceNum,
    palace,
    palaceName: PALACE_META[usefulPalaceNum]?.name || topicResult?.usefulGodPalaceName || '',
    direction: topicResult?.usefulGodDir || getDirectionLabel(usefulPalaceNum),
    door,
    star,
    deity,
    heavenStem: palace?.can?.name || '',
    earthStem: palace?.earthStem || '',
    dayStemName,
    dayStemElement,
    userPalaceNum,
    userPalaceName: PALACE_META[userPalaceNum]?.name || '',
    capitalStemName,
    capitalPalaceNum,
    capitalPalaceName: PALACE_META[capitalPalaceNum]?.name || '',
    capitalPalace,
    capitalFlags: deriveFlags(chart, capitalPalace),
    flags: deriveFlags(chart, palace),
    rawTopicScore,
    effectiveTopicScore,
    voidPressure,
    nguHanhRelation,
    markersForAI,
  };
}
