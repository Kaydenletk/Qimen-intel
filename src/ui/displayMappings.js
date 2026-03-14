import { PALACE_META } from '../core/tables.js';
import { ORDER, PALACE_TO_SLOT, SLOT_TO_PALACE } from '../core/palaceLayout.js';

export const DISPLAY_MODE_WEB1 = 'web1Naming';
export const VISUAL_SCAN_ORDER = [...ORDER];

export const WEB1_DIRECTION_LABELS = {
  SE: 'Đông Nam',
  S: 'Nam',
  SW: 'Tây Nam',
  E: 'Đông',
  C: 'Trung Cung',
  W: 'Tây',
  NE: 'Đông Bắc',
  N: 'Bắc',
  NW: 'Tây Bắc',
};

export const WEB1_SECTION_LABELS = {
  'Dương Độn': 'Dương Độn',
  'Âm Độn': 'Âm Độn',
  'Cục': 'Cục',
  'Địa Bàn': 'Địa Bàn',
  'Thiên Bàn': 'Thiên Bàn',
  'Bát Môn': 'Bát Môn',
  'Cửu Tinh': 'Cửu Tinh',
  'Bát Thần': 'Bát Thần',
  'Giờ': 'Giờ',
  'Ngày': 'Ngày',
  'Tháng': 'Tháng',
  'Năm': 'Năm',
  'Trung Cung': 'Trung Cung',
  'Trực Phù': 'Trực Phù',
  'Trực Sử': 'Trực Sử',
  'Không Vong': 'Không Vong',
  'Dịch Mã': 'Dịch Mã',
  'Ngày Can': 'Ngày Can',
  'Giờ Can': 'Giờ Can',
  'Ngày Marker': 'Ngày',
  'Giờ Marker': 'Giờ',
  'Hướng': 'Hướng',
  'Cung': 'Cung',
  'Phi Tinh': 'Phi Tinh',
  'Tinh': 'Tinh',
  'Môn': 'Môn',
  'Thần': 'Thần',
  'Thiên Can': 'Thiên Can',
  'Địa Can': 'Địa Can',
  'Flags': 'Cờ',
  'Developer / Expert Mode (Raw Tables)': 'Chế Độ Chuyên Gia',
};

const STAR_LABELS = createEntityMap({
  Bồng: { internalName: 'Thiên Bồng', displayName: 'Bồng', displayShort: 'Bồng' },
  'Thiên Bồng': { internalName: 'Thiên Bồng', displayName: 'Bồng', displayShort: 'Bồng' },
  Nhậm: { internalName: 'Thiên Nhậm', displayName: 'Nhậm', displayShort: 'Nhậm' },
  Nhâm: { internalName: 'Thiên Nhậm', displayName: 'Nhậm', displayShort: 'Nhậm' },
  'Thiên Nhậm': { internalName: 'Thiên Nhậm', displayName: 'Nhậm', displayShort: 'Nhậm' },
  Xung: { internalName: 'Thiên Xung', displayName: 'Xung', displayShort: 'Xung' },
  'Thiên Xung': { internalName: 'Thiên Xung', displayName: 'Xung', displayShort: 'Xung' },
  Phụ: { internalName: 'Thiên Phụ', displayName: 'Phụ', displayShort: 'Phụ' },
  'Thiên Phụ': { internalName: 'Thiên Phụ', displayName: 'Phụ', displayShort: 'Phụ' },
  Anh: { internalName: 'Thiên Anh', displayName: 'Anh', displayShort: 'Anh' },
  'Thiên Anh': { internalName: 'Thiên Anh', displayName: 'Anh', displayShort: 'Anh' },
  Tâm: { internalName: 'Thiên Tâm', displayName: 'Tâm', displayShort: 'Tâm' },
  'Thiên Tâm': { internalName: 'Thiên Tâm', displayName: 'Tâm', displayShort: 'Tâm' },
  Trụ: { internalName: 'Thiên Trụ', displayName: 'Trụ', displayShort: 'Trụ' },
  'Thiên Trụ': { internalName: 'Thiên Trụ', displayName: 'Trụ', displayShort: 'Trụ' },
  Nhuế: { internalName: 'Thiên Nhuế', displayName: 'Nhuế', displayShort: 'Nhuế' },
  'Thiên Nhuế': { internalName: 'Thiên Nhuế', displayName: 'Nhuế', displayShort: 'Nhuế' },
  Cầm: { internalName: 'Thiên Cầm', displayName: 'Cầm', displayShort: 'Cầm' },
  'Thiên Cầm': { internalName: 'Thiên Cầm', displayName: 'Cầm', displayShort: 'Cầm' },
});

const DOOR_LABELS = createEntityMap({
  Thương: { internalName: 'Thương Môn', displayName: 'Thương', displayShort: 'Thương' },
  'Thương Môn': { internalName: 'Thương Môn', displayName: 'Thương', displayShort: 'Thương' },
  Đỗ: { internalName: 'Đỗ Môn', displayName: 'Đỗ', displayShort: 'Đỗ' },
  'Đỗ Môn': { internalName: 'Đỗ Môn', displayName: 'Đỗ', displayShort: 'Đỗ' },
  Cảnh: { internalName: 'Cảnh Môn', displayName: 'Cảnh', displayShort: 'Cảnh' },
  'Cảnh Môn': { internalName: 'Cảnh Môn', displayName: 'Cảnh', displayShort: 'Cảnh' },
  Sinh: { internalName: 'Sinh Môn', displayName: 'Sinh', displayShort: 'Sinh' },
  'Sinh Môn': { internalName: 'Sinh Môn', displayName: 'Sinh', displayShort: 'Sinh' },
  Tử: { internalName: 'Tử Môn', displayName: 'Tử', displayShort: 'Tử' },
  'Tử Môn': { internalName: 'Tử Môn', displayName: 'Tử', displayShort: 'Tử' },
  Hưu: { internalName: 'Hưu Môn', displayName: 'Hưu', displayShort: 'Hưu' },
  'Hưu Môn': { internalName: 'Hưu Môn', displayName: 'Hưu', displayShort: 'Hưu' },
  Khai: { internalName: 'Khai Môn', displayName: 'Khai', displayShort: 'Khai' },
  'Khai Môn': { internalName: 'Khai Môn', displayName: 'Khai', displayShort: 'Khai' },
  Kinh: { internalName: 'Kinh Môn', displayName: 'Kinh', displayShort: 'Kinh' },
  'Kinh Môn': { internalName: 'Kinh Môn', displayName: 'Kinh', displayShort: 'Kinh' },
});

const DEITY_LABELS = createEntityMap({
  'Trực Phù': { internalName: 'Trực Phù', displayName: 'Trực Phù', displayShort: 'Trực Phù' },
  'Đằng Xà': { internalName: 'Đằng Xà', displayName: 'Đằng Xà', displayShort: 'Đằng Xà' },
  'Thái Âm': { internalName: 'Thái Âm', displayName: 'Thái Âm', displayShort: 'Thái Âm' },
  'Lục Hợp': { internalName: 'Lục Hợp', displayName: 'Lục Hợp', displayShort: 'Lục Hợp' },
  'Câu Trần': { internalName: 'Câu Trần', displayName: 'Câu Trận', displayShort: 'Câu Trận' },
  'Câu Trận': { internalName: 'Câu Trận', displayName: 'Câu Trận', displayShort: 'Câu Trận' },
  'Bạch Hổ': { internalName: 'Bạch Hổ', displayName: 'Câu Trận', displayShort: 'Câu Trận' },
  'Chu Tước': { internalName: 'Chu Tước', displayName: 'Chu Tước', displayShort: 'Chu Tước' },
  'Huyền Vũ': { internalName: 'Huyền Vũ', displayName: 'Chu Tước', displayShort: 'Chu Tước' },
  'Cửu Địa': { internalName: 'Cửu Địa', displayName: 'Cửu Địa', displayShort: 'Cửu Địa' },
  'Cửu Thiên': { internalName: 'Cửu Thiên', displayName: 'Cửu Thiên', displayShort: 'Cửu Thiên' },
});

const STEM_LABELS = createEntityMap({
  Giáp: { internalName: 'Giáp', displayName: 'Giáp', displayShort: 'Giáp' },
  Ất: { internalName: 'Ất', displayName: 'Ất', displayShort: 'Ất' },
  Bính: { internalName: 'Bính', displayName: 'Bính', displayShort: 'Bính' },
  Đinh: { internalName: 'Đinh', displayName: 'Đinh', displayShort: 'Đinh' },
  Mậu: { internalName: 'Mậu', displayName: 'Mậu', displayShort: 'Mậu' },
  Kỷ: { internalName: 'Kỷ', displayName: 'Kỷ', displayShort: 'Kỷ' },
  Canh: { internalName: 'Canh', displayName: 'Canh', displayShort: 'Canh' },
  Tân: { internalName: 'Tân', displayName: 'Tân', displayShort: 'Tân' },
  Nhâm: { internalName: 'Nhâm', displayName: 'Nhâm', displayShort: 'Nhâm' },
  Quý: { internalName: 'Quý', displayName: 'Quý', displayShort: 'Quý' },
});

const BRANCH_LABELS = createEntityMap({
  Tý: { internalName: 'Tý', displayName: 'Tý', displayShort: 'Tý' },
  Sửu: { internalName: 'Sửu', displayName: 'Sửu', displayShort: 'Sửu' },
  Dần: { internalName: 'Dần', displayName: 'Dần', displayShort: 'Dần' },
  Mão: { internalName: 'Mão', displayName: 'Mão', displayShort: 'Mão' },
  Thìn: { internalName: 'Thìn', displayName: 'Thìn', displayShort: 'Thìn' },
  Tỵ: { internalName: 'Tỵ', displayName: 'Tỵ', displayShort: 'Tỵ' },
  Tị: { internalName: 'Tỵ', displayName: 'Tỵ', displayShort: 'Tỵ' },
  Ngọ: { internalName: 'Ngọ', displayName: 'Ngọ', displayShort: 'Ngọ' },
  Mùi: { internalName: 'Mùi', displayName: 'Mùi', displayShort: 'Mùi' },
  Thân: { internalName: 'Thân', displayName: 'Thân', displayShort: 'Thân' },
  Dậu: { internalName: 'Dậu', displayName: 'Dậu', displayShort: 'Dậu' },
  Tuất: { internalName: 'Tuất', displayName: 'Tuất', displayShort: 'Tuất' },
  Hợi: { internalName: 'Hợi', displayName: 'Hợi', displayShort: 'Hợi' },
});

function createEntityMap(entries) {
  return Object.fromEntries(
    Object.entries(entries).map(([key, value]) => [
      key,
      typeof value === 'string'
        ? {
          internalName: key,
          displayName: value,
          displayShort: value,
        }
        : value,
    ])
  );
}

function defaultLabel(rawValue, fallback = '—') {
  if (!rawValue) {
    return {
      internalName: '',
      displayName: fallback,
      displayShort: fallback,
    };
  }
  return {
    internalName: rawValue,
    displayName: rawValue,
    displayShort: rawValue,
  };
}

function getEntityLabel(map, rawValue, fallback = '—') {
  if (!rawValue) return defaultLabel('', fallback);
  return map[String(rawValue).trim()] || defaultLabel(String(rawValue).trim(), fallback);
}

export function getSectionLabel(rawValue) {
  return WEB1_SECTION_LABELS[rawValue] || rawValue;
}

export function getDirectionLabel(slot) {
  return WEB1_DIRECTION_LABELS[slot] || slot;
}

export function getStemLabel(rawValue, fallback = '—') {
  return getEntityLabel(STEM_LABELS, rawValue, fallback);
}

export function getBranchLabel(rawValue, fallback = '—') {
  return getEntityLabel(BRANCH_LABELS, rawValue, fallback);
}

export function getStarLabel(rawValue, fallback = '—') {
  return getEntityLabel(STAR_LABELS, rawValue, fallback);
}

export function getDoorLabel(rawValue, fallback = '—') {
  return getEntityLabel(DOOR_LABELS, rawValue, fallback);
}

export function getDeityLabel(rawValue, fallback = '—') {
  return getEntityLabel(DEITY_LABELS, rawValue, fallback);
}

export function getPalaceDisplayLabel(palaceNum) {
  const slot = PALACE_TO_SLOT[palaceNum] || (Number(palaceNum) === 5 ? 'C' : '');
  const internalName = PALACE_META[palaceNum]?.name || (Number(palaceNum) === 5 ? 'Trung Cung' : `Cung ${palaceNum}`);
  const displayName = getDirectionLabel(slot) || internalName;
  return {
    internalName,
    displayName,
    displayShort: displayName,
  };
}

function enrichEntity(entity, labelFactory, rawValue) {
  if (!entity) return null;
  const label = labelFactory(rawValue);
  return {
    ...entity,
    internalName: label.internalName,
    displayName: label.displayName,
    displayShort: label.displayShort,
  };
}

function buildFlagLabels(palace) {
  const labels = [];
  if (palace?.trucPhu) labels.push({ key: 'trucPhu', ...getSectionLabelObject('Trực Phù') });
  if (palace?.trucSu) labels.push({ key: 'trucSu', ...getSectionLabelObject('Trực Sử') });
  if (palace?.khongVong) labels.push({ key: 'khongVong', ...getSectionLabelObject('Không Vong') });
  if (palace?.dichMa) labels.push({ key: 'dichMa', ...getSectionLabelObject('Dịch Mã') });
  return labels;
}

function buildTemporalBadgeLabels(palace) {
  const labels = [];
  const badgeNames = Array.isArray(palace?.temporalBadges) ? palace.temporalBadges : [];
  for (const badgeName of badgeNames) {
    labels.push({
      key: badgeName === 'Ngày'
        ? 'dayMarker'
        : badgeName === 'Tháng'
          ? 'monthMarker'
          : 'hourMarker',
      ...getSectionLabelObject(
        badgeName === 'Ngày'
          ? 'Ngày Marker'
          : badgeName === 'Tháng'
            ? 'Tháng'
            : 'Giờ Marker'
      ),
    });
  }
  return labels;
}

function buildCachCucLabels(palace) {
  if (!Array.isArray(palace?.cachCuc)) return [];
  return palace.cachCuc
    .filter(item => item && item.name)
    .map((item, index) => ({
      key: `cachCuc_${index}_${item.name}`,
      internalName: item.name,
      displayName: `🔥 ${item.name}`,
      displayShort: `🔥 ${item.name}`,
      type: item.type || '',
      desc: item.desc || '',
      priority: Number(item.priority || 0),
      source: 'cachCuc',
    }));
}

function buildSpecialPatternLabels(palace) {
  if (!Array.isArray(palace?.specialPatterns)) return [];
  return palace.specialPatterns
    .filter(item => item && item.name)
    .map((item, index) => ({
      key: `specialPattern_${index}_${item.name}`,
      internalName: item.name,
      displayName: `⚠ ${item.name}`,
      displayShort: `⚠ ${item.name}`,
      type: item.type || '',
      desc: item.desc || '',
      priority: Number(item.priority || 0),
      source: 'specialPattern',
    }));
}

function buildMergedPatternLabels(sourcePalace = {}) {
  return [
    ...buildSpecialPatternLabels(sourcePalace),
    ...buildCachCucLabels(sourcePalace),
  ].sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));
}

function getSectionLabelObject(rawValue) {
  return {
    internalName: rawValue,
    displayName: getSectionLabel(rawValue),
    displayShort: getSectionLabel(rawValue),
  };
}

function buildDisplayPalace(palaceNum, sourcePalace = {}) {
  const slot = PALACE_TO_SLOT[palaceNum] || (Number(palaceNum) === 5 ? 'C' : '');
  const directionMeta = {
    internalName: PALACE_META[palaceNum]?.dir || sourcePalace.direction || '',
    displayName: getDirectionLabel(slot),
    displayShort: getDirectionLabel(slot),
  };
  const palaceLabel = getPalaceDisplayLabel(palaceNum);
  const starValue = sourcePalace.star?.short || sourcePalace.star?.name || '';
  const sentStarValue = sourcePalace.sentStar?.short || sourcePalace.sentStar?.name || '';
  const doorValue = sourcePalace.mon?.short || sourcePalace.mon?.name || '';
  const deityValue = sourcePalace.than?.name || '';
  const heavenStemValue = sourcePalace.can?.name || '';
  const earthStemValue = sourcePalace.earthStem || '';

  return {
    ...sourcePalace,
    palaceNum,
    palaceName: sourcePalace.palaceName || PALACE_META[palaceNum]?.name || (Number(palaceNum) === 5 ? 'Trung Cung' : `Cung ${palaceNum}`),
    direction: sourcePalace.direction || PALACE_META[palaceNum]?.dir || '',
    slot,
    directionLabel: directionMeta,
    palaceLabel,
    can: enrichEntity(sourcePalace.can, getStemLabel, heavenStemValue),
    earthStemLabel: getStemLabel(earthStemValue, ''),
    star: enrichEntity(sourcePalace.star, getStarLabel, starValue),
    sentStar: enrichEntity(sourcePalace.sentStar, getStarLabel, sentStarValue),
    mon: enrichEntity(sourcePalace.mon, getDoorLabel, doorValue),
    than: enrichEntity(sourcePalace.than, getDeityLabel, deityValue),
    score: sourcePalace.score ?? 0,
    backgroundTone: sourcePalace.backgroundTone || sourcePalace.tone || 'neutral',
    tone: sourcePalace.backgroundTone || sourcePalace.tone || 'neutral',
    toneDetail: sourcePalace.toneDetail || 'neutral',
    verdict: sourcePalace.verdict || 'trung',
    alertTags: Array.isArray(sourcePalace.alertTags) ? [...sourcePalace.alertTags] : [],
    backgroundDebug: sourcePalace.backgroundDebug || null,
    specialTags: Array.isArray(sourcePalace.specialTags) ? [...sourcePalace.specialTags] : [],
    temporalBadgeLabels: buildTemporalBadgeLabels(sourcePalace),
    flagLabels: buildFlagLabels(sourcePalace),
    cachCucLabels: buildCachCucLabels(sourcePalace),
    specialPatternLabels: buildSpecialPatternLabels(sourcePalace),
    patternLabels: buildMergedPatternLabels(sourcePalace),
  };
}

export function buildDisplayChart(chart) {
  const palaces = {};
  for (let palaceNum = 1; palaceNum <= 9; palaceNum++) {
    palaces[palaceNum] = buildDisplayPalace(palaceNum, chart?.palaces?.[palaceNum] || {});
  }

  return {
    mode: DISPLAY_MODE_WEB1,
    visualOrder: [...VISUAL_SCAN_ORDER],
    dayMarkerPalace: chart?.dayMarkerPalace || null,
    hourMarkerPalace: chart?.hourMarkerPalace || null,
    monthMarkerPalace: chart?.monthMarkerPalace || null,
    dayMarkerResolutionSource: chart?.dayMarkerResolutionSource || 'unresolved',
    hourMarkerResolutionSource: chart?.hourMarkerResolutionSource || 'unresolved',
    monthMarkerResolutionSource: chart?.monthMarkerResolutionSource || 'unresolved',
    temporalBadgesByPalace: chart?.temporalBadgesByPalace || {},
    boardPalaces: chart?.boardPalaces || {},
    hourEnergyScore: chart?.hourEnergyScore ?? null,
    hourEnergyTone: chart?.hourEnergyTone || 'neutral',
    hourEnergyVerdict: chart?.hourEnergyVerdict || 'trung',
    directEnvoyActionPalace: chart?.directEnvoyActionPalace || null,
    directEnvoyActionScore: chart?.directEnvoyActionScore ?? null,
    directEnvoyActionTone: chart?.directEnvoyActionTone || 'neutral',
    directEnvoyActionVerdict: chart?.directEnvoyActionVerdict || 'trung',
    hourQuickReadSummary: chart?.hourQuickReadSummary || '',
    sections: {
      earthPlate: getSectionLabel('Địa Bàn'),
      heavenPlate: getSectionLabel('Thiên Bàn'),
      doors: getSectionLabel('Bát Môn'),
      stars: getSectionLabel('Cửu Tinh'),
      deities: getSectionLabel('Bát Thần'),
      structure: getSectionLabel('Cục'),
      structurePolarity: getSectionLabel(chart?.isDuong ? 'Dương Độn' : 'Âm Độn'),
    },
    dayPillar: chart?.dayPillar ? {
      ...chart.dayPillar,
      stem: getStemLabel(chart.dayPillar.stemName),
      branch: getBranchLabel(chart.dayPillar.branchName),
    } : null,
    gioPillar: chart?.gioPillar ? {
      ...chart.gioPillar,
      stem: getStemLabel(chart.gioPillar.stemName),
      branch: getBranchLabel(chart.gioPillar.branchName),
    } : null,
    monthPillar: chart?.monthPillar ? {
      ...chart.monthPillar,
      stem: getStemLabel(chart.monthPillar.stemName),
      branch: getBranchLabel(chart.monthPillar.branchName),
    } : null,
    yearPillar: chart?.yearPillar ? {
      ...chart.yearPillar,
      stem: getStemLabel(chart.yearPillar.stemName),
      branch: getBranchLabel(chart.yearPillar.branchName),
    } : null,
    khongVong: chart?.khongVong ? {
      ...chart.khongVong,
      void1: chart.khongVong.void1 ? {
        ...chart.khongVong.void1,
        branch: getBranchLabel(chart.khongVong.void1.name),
      } : null,
      void2: chart.khongVong.void2 ? {
        ...chart.khongVong.void2,
        branch: getBranchLabel(chart.khongVong.void2.name),
      } : null,
    } : null,
    dichMa: chart?.dichMa ? {
      ...chart.dichMa,
      horseBranchLabel: getBranchLabel(chart.dichMa.horseBranch),
      directionLabel: getDirectionLabel(PALACE_TO_SLOT[chart.dichMa.palace] || ''),
    } : null,
    palaces,
  };
}

export function getVisualPalaceEntries(palacesByNum) {
  return VISUAL_SCAN_ORDER.map(slot => [slot, palacesByNum[SLOT_TO_PALACE[slot]]]);
}
