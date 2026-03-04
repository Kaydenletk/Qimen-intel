import { PALACE_META } from '../../core/tables.js';

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

export function normalizeTopicContext({ chart, topicResult }) {
  const usefulPalaceNum = Number(topicResult?.usefulGodPalace) || 1;
  const palace = chart?.palaces?.[usefulPalaceNum] || {};
  const door = normalizeDoor(palace?.mon?.name || palace?.mon?.short || '');
  const star = normalizeStar(palace?.star?.name || palace?.star?.short || '');
  const deity = normalizeDeity(palace?.than?.name || '');

  return {
    usefulPalaceNum,
    palace,
    palaceName: PALACE_META[usefulPalaceNum]?.name || topicResult?.usefulGodPalaceName || '',
    direction: topicResult?.usefulGodDir || getDirectionLabel(usefulPalaceNum),
    door,
    star,
    deity,
    heavenStem: palace?.can?.name || '',
    earthStem: palace?.earthStem || '',
    flags: deriveFlags(chart, palace),
  };
}
