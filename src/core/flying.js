/**
 * flying.js — Layer 2: Palace Flying Engine (Phi Bàn / Chuyển Bàn)
 *
 * Implements the CORRECT Zhuǎn Pán (Rotating Palace) system:
 * 1. Earth Plate (Địa Bàn): Stems distributed based on Cục number
 * 2. Lead Stem (Tuần Thủ): From Hour Pillar's Xun
 * 3. Star Rotation: Lead Star moves to Hour Stem palace
 * 4. Door Rotation: Lead Door counts from Xun branch to Hour branch
 * 5. Deity Rotation: Lead Deity follows Lead Star
 */

import { PALACE_META, CUU_TINH, BAT_MON_DIABAN, BAT_THAN, CAN_SEQUENCE_9, STEMS, BRANCHES } from './tables.js';
import { getSolarTermInfo } from './calendar.js';
import { getDayPillar, getGioChi, getGioCan, getKhongVong, getMonthPillar, getYearPillar } from './stems.js';
import { resolveHiddenStemForHourStem } from './jiaHiddenStem.js';
import { annotateTemporalMarkers } from './temporalMarkers.js';
import { evaluateCachCuc } from './cachcuc.js';
import { evaluateSpecialPatterns } from './specialPatterns.js';

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

// Luo Shu perimeter sequence (skip center 5)
// 1(N) → 8(NE) → 3(E) → 4(SE) → 9(S) → 2(SW) → 7(W) → 6(NW) → back to 1
const PERIMETER = [1, 8, 3, 4, 9, 2, 7, 6];
const PERIM_INDEX = { 1: 0, 8: 1, 3: 2, 4: 3, 9: 4, 2: 5, 7: 6, 6: 7 };

// ══════════════════════════════════════════════════════════════════════════════
// RULE 2: YIN DUN DEITY ARRAY (Bộ Mã Âm Độn)
// For Yin Dun, replace "Câu Trận" and "Chu Tước" with "Bạch Hổ" and "Huyền Vũ"
// ══════════════════════════════════════════════════════════════════════════════
const BAT_THAN_YANG = BAT_THAN; // Use standard array for Yang Dun

const BAT_THAN_YIN = [
  { idx: 0, name: 'Trực Phù', element: 'Thổ', type: 'cat' },
  { idx: 1, name: 'Đằng Xà', element: 'Hỏa', type: 'hung' },
  { idx: 2, name: 'Thái Âm', element: 'Kim', type: 'cat' },
  { idx: 3, name: 'Lục Hợp', element: 'Mộc', type: 'cat' },
  { idx: 4, name: 'Bạch Hổ', element: 'Kim', type: 'hung' },   // Replaces Câu Trận
  { idx: 5, name: 'Huyền Vũ', element: 'Thủy', type: 'hung' }, // Replaces Chu Tước
  { idx: 6, name: 'Cửu Địa', element: 'Thổ', type: 'cat' },
  { idx: 7, name: 'Cửu Thiên', element: 'Kim', type: 'cat' },
];

/**
 * Get the appropriate Bát Thần array based on Yin/Yang Dun
 * @param {boolean} isDuong - True for Yang Dun, False for Yin Dun
 * @returns {Array} - The deity array to use
 */
function getBatThan(isDuong) {
  return isDuong ? BAT_THAN_YANG : BAT_THAN_YIN;
}

// Luo Shu flight sequence through all 9 palaces
const LUO_SHU_YANG = [1, 8, 3, 4, 9, 2, 7, 6, 5];
const LUO_SHU_YIN = [...LUO_SHU_YANG].reverse();

function flyLuoShu(startPalace, steps, isDuong) {
  const path = isDuong ? LUO_SHU_YANG : LUO_SHU_YIN;
  let idx = path.indexOf(startPalace);
  if (idx === -1) {
    throw new Error(`Invalid start palace for Luo Shu flight: ${startPalace}`);
  }
  let dest = path[(idx + (steps % 9) + 9) % 9];
  if (dest === 5) dest = 2; // parasitize to Kun
  return dest;
}

// The 60 Can Chi cycles for Xun extraction
const LUC_THAP_HOA_GIAP = [
  ['Giáp Tý', 'Ất Sửu', 'Bính Dần', 'Đinh Mão', 'Mậu Thìn', 'Kỷ Tỵ', 'Canh Ngọ', 'Tân Mùi', 'Nhâm Thân', 'Quý Dậu'],
  ['Giáp Tuất', 'Ất Hợi', 'Bính Tý', 'Đinh Sửu', 'Mậu Dần', 'Kỷ Mão', 'Canh Thìn', 'Tân Tỵ', 'Nhâm Ngọ', 'Quý Mùi'],
  ['Giáp Thân', 'Ất Dậu', 'Bính Tuất', 'Đinh Hợi', 'Mậu Tý', 'Kỷ Sửu', 'Canh Dần', 'Tân Mão', 'Nhâm Thìn', 'Quý Tỵ'],
  ['Giáp Ngọ', 'Ất Mùi', 'Bính Thân', 'Đinh Dậu', 'Mậu Tuất', 'Kỷ Hợi', 'Canh Tý', 'Tân Sửu', 'Nhâm Dần', 'Quý Mão'],
  ['Giáp Thìn', 'Ất Tỵ', 'Bính Ngọ', 'Đinh Mùi', 'Mậu Thân', 'Kỷ Dậu', 'Canh Tuất', 'Tân Hợi', 'Nhâm Tý', 'Quý Sửu'],
  ['Giáp Dần', 'Ất Mão', 'Bính Thìn', 'Đinh Tỵ', 'Mậu Ngọ', 'Kỷ Mùi', 'Canh Thân', 'Tân Dậu', 'Nhâm Tuất', 'Quý Hợi'],
];

// ══════════════════════════════════════════════════════════════════════════════
// XUN LEAD STEM MAPPING (Joey Yap / Self-Plus method)
// 6 Giáp ẩn dưới Lục Nghi - CRITICAL FIX
// ══════════════════════════════════════════════════════════════════════════════
const XUN_LEAD_STEM = {
  'Giáp Tý': 'Mậu',   // Lục Nghi 1 - Giáp Tý ẩn dưới Mậu
  'Giáp Tuất': 'Kỷ',  // Lục Nghi 2 - Giáp Tuất ẩn dưới Kỷ
  'Giáp Thân': 'Canh', // Lục Nghi 3 - Giáp Thân ẩn dưới Canh
  'Giáp Ngọ': 'Tân',  // Lục Nghi 4 - Giáp Ngọ ẩn dưới Tân
  'Giáp Thìn': 'Nhâm', // Lục Nghi 5 - Giáp Thìn ẩn dưới Nhâm
  'Giáp Dần': 'Quý',  // Lục Nghi 6 - Giáp Dần ẩn dưới Quý
};

const TUAN_THU_BY_OFFSET = {
  0: 'Mậu',
  2: 'Kỷ',
  4: 'Canh',
  6: 'Tân',
  8: 'Nhâm',
  10: 'Quý',
};

// Branch name to index mapping for door step calculation
const STEM_NAME_TO_IDX = {};
Object.entries(STEMS).forEach(([idx, stem]) => {
  STEM_NAME_TO_IDX[stem.name] = parseInt(idx, 10);
});

const BRANCH_NAME_TO_IDX = {};
Object.entries(BRANCHES).forEach(([idx, b]) => {
  BRANCH_NAME_TO_IDX[b.name] = parseInt(idx);
});

const BRANCH_NAME_ALIASES = {
  Tị: 'Tỵ',
};

function normalizeCanChiText(rawValue) {
  const normalized = String(rawValue || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return '';

  for (const stem of Object.values(STEMS)) {
    if (normalized.startsWith(stem.name)) {
      const rawBranchPart = normalized.slice(stem.name.length).trim();
      const branchPart = BRANCH_NAME_ALIASES[rawBranchPart] || rawBranchPart;
      if (branchPart) return `${stem.name} ${branchPart}`;
      return stem.name;
    }
  }

  return BRANCH_NAME_ALIASES[normalized] || normalized;
}

function parseCanChiComponents(rawValue) {
  const normalized = normalizeCanChiText(rawValue);
  if (!normalized) return null;

  for (const [stemIdx, stem] of Object.entries(STEMS)) {
    if (!normalized.startsWith(stem.name)) continue;

    const branchName = normalized.slice(stem.name.length).trim();
    const branchIdx = BRANCH_NAME_TO_IDX[branchName];
    if (!Number.isInteger(branchIdx)) return null;

    return {
      normalized,
      stemIdx: parseInt(stemIdx, 10),
      stemName: stem.name,
      branchIdx,
      branchName,
    };
  }

  return null;
}

function coerceStemIndex(rawValue) {
  if (Number.isInteger(rawValue)) return rawValue;
  const normalized = String(rawValue ?? '').replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  if (/^\d+$/.test(normalized)) return Number(normalized);
  return STEM_NAME_TO_IDX[normalized] ?? null;
}

function coerceBranchIndex(rawValue) {
  if (Number.isInteger(rawValue)) return rawValue;
  const normalized = String(rawValue ?? '').replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  if (/^\d+$/.test(normalized)) return Number(normalized);
  const aliased = BRANCH_NAME_ALIASES[normalized] || normalized;
  return BRANCH_NAME_TO_IDX[aliased] ?? null;
}

export function getTuanThu(stemInput, branchInput) {
  const stemIdx = coerceStemIndex(stemInput);
  const branchIdx = coerceBranchIndex(branchInput);

  if (!Number.isInteger(stemIdx) || !Number.isInteger(branchIdx)) {
    return {
      offset: 0,
      tuanName: 'Giáp Tý',
      tuanBranchIdx: 0,
      leadStemName: 'Mậu',
      invalidInput: true,
      stemIdx,
      branchIdx,
    };
  }

  const offset = ((stemIdx - branchIdx) % 12 + 12) % 12;
  const tuanBranchIdx = ((branchIdx - stemIdx) % 12 + 12) % 12;
  const tuanBranchName = BRANCHES[tuanBranchIdx]?.name || 'Tý';
  const tuanName = `Giáp ${tuanBranchName}`;
  return {
    offset,
    tuanName,
    tuanBranchIdx,
    leadStemName: TUAN_THU_BY_OFFSET[offset] || XUN_LEAD_STEM[tuanName] || 'Mậu',
  };
}

function resolveExplicitJiaXun(hourCanChi) {
  const parsed = parseCanChiComponents(hourCanChi);
  if (!parsed || parsed.stemName !== 'Giáp') return null;

  const tuanThu = getTuanThu(parsed.stemIdx, parsed.branchIdx);

  return {
    tuanName: tuanThu.tuanName,
    leadStemName: tuanThu.leadStemName,
    posInTuan: 0,
    tuanBranchIdx: tuanThu.tuanBranchIdx,
  };
}

/**
 * Get Xun (Tuần) info from Hour Can Chi
 * Returns: tuanName, leadStemName, posInTuan, tuanBranchIdx
 *
 * CRITICAL FIX: leadStemName is now derived from XUN_LEAD_STEM mapping
 * (previously incorrectly took tuan[9].split(' ')[0])
 */
export function getXunInfo(hourCanChi) {
  const explicitJiaXun = resolveExplicitJiaXun(hourCanChi);
  if (explicitJiaXun) return explicitJiaXun;

  const parsed = parseCanChiComponents(hourCanChi);
  if (!parsed) {
    return { tuanName: 'Giáp Tý', leadStemName: 'Mậu', posInTuan: 0, tuanBranchIdx: 0 };
  }

  const tuanThu = getTuanThu(parsed.stemIdx, parsed.branchIdx);
  const posInTuan = ((parsed.branchIdx - tuanThu.tuanBranchIdx) % 12 + 12) % 12;

  return {
    tuanName: tuanThu.tuanName,
    leadStemName: tuanThu.leadStemName,
    posInTuan,
    tuanBranchIdx: tuanThu.tuanBranchIdx,
  };
}

// Stem name to CAN_SEQUENCE_9 index mapping (for Earth Plate lookup)
const STEM_TO_CAN9_IDX = {};
CAN_SEQUENCE_9.forEach((c, i) => { STEM_TO_CAN9_IDX[c.name] = i; });

// 8 Doors in their original palace order (index = original palace)
const BAT_MON_ARRAY = [
  null, // 0 unused
  { idx: 0, name: 'Hưu Môn', short: 'Hưu', element: 'Thủy', type: 'cat', origPalace: 1 },
  { idx: 1, name: 'Tử Môn', short: 'Tử', element: 'Thổ', type: 'hung', origPalace: 2 },
  { idx: 2, name: 'Thương Môn', short: 'Thương', element: 'Mộc', type: 'binh', origPalace: 3 },
  { idx: 3, name: 'Đỗ Môn', short: 'Đỗ', element: 'Mộc', type: 'binh', origPalace: 4 },
  null, // 5 center - no door
  { idx: 4, name: 'Khai Môn', short: 'Khai', element: 'Kim', type: 'cat', origPalace: 6 },
  { idx: 5, name: 'Kinh Môn', short: 'Kinh', element: 'Kim', type: 'hung', origPalace: 7 },
  { idx: 6, name: 'Sinh Môn', short: 'Sinh', element: 'Thổ', type: 'cat', origPalace: 8 },
  { idx: 7, name: 'Cảnh Môn', short: 'Cảnh', element: 'Hỏa', type: 'binh', origPalace: 9 },
];

const BASE_DOOR_RING = PERIMETER.map((palace) => BAT_MON_ARRAY[palace]).filter(Boolean);

// Dịch Mã calculation based on branch
// Tam Hợp frames: Thân-Tý-Thìn → Dần, Dần-Ngọ-Tuất → Thân, Tỵ-Dậu-Sửu → Hợi, Hợi-Mão-Mùi → Tỵ
const DICH_MA_MAP = {
  0: { horse: 'Dần', branchIdx: 2, palace: 8 }, // Tý → Dần
  4: { horse: 'Dần', branchIdx: 2, palace: 8 }, // Thìn → Dần
  8: { horse: 'Dần', branchIdx: 2, palace: 8 }, // Thân → Dần
  2: { horse: 'Thân', branchIdx: 8, palace: 2 }, // Dần → Thân
  6: { horse: 'Thân', branchIdx: 8, palace: 2 }, // Ngọ → Thân
  10: { horse: 'Thân', branchIdx: 8, palace: 2 }, // Tuất → Thân
  1: { horse: 'Hợi', branchIdx: 11, palace: 6 }, // Sửu → Hợi
  5: { horse: 'Hợi', branchIdx: 11, palace: 6 }, // Tỵ → Hợi
  9: { horse: 'Hợi', branchIdx: 11, palace: 6 }, // Dậu → Hợi
  3: { horse: 'Tỵ', branchIdx: 5, palace: 4 },  // Mão → Tỵ
  7: { horse: 'Tỵ', branchIdx: 5, palace: 4 },  // Mùi → Tỵ
  11: { horse: 'Tỵ', branchIdx: 5, palace: 4 },  // Hợi → Tỵ
};

// ══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get the Xun (Tuần) from stem and branch indices
 * Returns the starting branch index of the Xun (0, 2, 4, 6, 8, or 10)
 */
function getXunStart(stemIdx, branchIdx) {
  // Formula: xunStart = (branchIdx - stemIdx) mod 12
  // This gives us the branch where Giáp starts in this Xun
  return ((branchIdx - stemIdx) % 12 + 12) % 12;
}

/**
 * Get the Xun data (lead stem info) from stem and branch using math (deprecated, kept for reference).
 */
function getXunData(stemIdx, branchIdx) {
  const xunStart = getXunStart(stemIdx, branchIdx);
  return { name: `Giáp ${BRANCHES[xunStart]?.name}`, leadStemName: 'Mậu' }; // dummy fallback
}

/**
 * Move along the perimeter by a number of steps
 * @param {number} startPalace - Starting palace (1-9, not 5)
 * @param {number} steps - Number of steps to move (positive = forward, negative = backward)
 * @param {boolean} isDuong - True for Yang (forward), False for Yin (backward)
 * @returns {number} - Destination palace
 */
function moveOnPerimeter(startPalace, steps, isDuong) {
  if (startPalace === 5) startPalace = 2; // Palace 5 parasitizes on 2
  const startIdx = PERIM_INDEX[startPalace];
  const direction = isDuong ? 1 : -1;
  const newIdx = ((startIdx + steps * direction) % 8 + 8) % 8;
  return PERIMETER[newIdx];
}

/**
 * Count door steps from Tuần Branch to Hour Branch
 * Joey Yap method: Count along 12 Earthly Branches
 *
 * @param {number} tuanBranchIdx - Starting branch index (0-11)
 * @param {number} hourBranchIdx - Target branch index (0-11)
 * @param {boolean} isDuong - Yang (forward) or Yin (backward)
 * @returns {number} - Number of steps (0-11)
 */
function countDoorSteps(tuanBranchIdx, hourBranchIdx, isDuong) {
  if (isDuong) {
    // Yang: count forward from Tuần to Hour
    return (hourBranchIdx - tuanBranchIdx + 12) % 12;
  } else {
    // Yin: count backward from Tuần to Hour
    return (tuanBranchIdx - hourBranchIdx + 12) % 12;
  }
}

/**
 * Move on perimeter by exact step count (for door rotation)
 * Uses the 8-palace perimeter sequence, skipping Trung Cung
 *
 * Sequence (Dương/Yang): 1 → 8 → 3 → 4 → 9 → 2 → 7 → 6 → 1
 * Sequence (Âm/Yin): 1 → 6 → 7 → 2 → 9 → 4 → 3 → 8 → 1
 *
 * @param {number} startPalace - Starting palace (1-9)
 * @param {number} steps - Number of steps to move
 * @param {boolean} isDuong - Direction (Yang=clockwise, Yin=counter-clockwise)
 * @returns {number} - Destination palace
 */
function moveOnPerimeterBySteps(startPalace, steps, isDuong) {
  if (startPalace === 5) startPalace = 2; // Trung Cung parasitizes to Khôn
  let currentIdx = PERIM_INDEX[startPalace];
  const direction = isDuong ? 1 : -1;
  for (let i = 0; i < steps; i++) {
    currentIdx = ((currentIdx + direction) % 8 + 8) % 8;
  }
  return PERIMETER[currentIdx];
}

function moveOnNumberSequence(startPalace, steps, isDuong) {
  const zeroBased = startPalace - 1;
  const shifted = isDuong
    ? ((zeroBased + steps) % 9 + 9) % 9
    : ((zeroBased - steps) % 9 + 9) % 9;
  let destination = shifted + 1;
  if (destination === 5) destination = isDuong ? 2 : 8;
  return destination;
}

function distributeDoors(targetPalace, trucSuDoor, isDuong) {
  const doorMap = { 5: null };
  const startPalaceIndex = PERIMETER.indexOf(targetPalace);
  const startDoorIndex = BASE_DOOR_RING.findIndex(door => door?.name === trucSuDoor?.name);
  const direction = isDuong ? 1 : -1;

  if (startPalaceIndex === -1 || startDoorIndex === -1) {
    for (const palace of PERIMETER) {
      doorMap[palace] = BAT_MON_ARRAY[palace] || null;
    }
    return doorMap;
  }

  for (let i = 0; i < 8; i++) {
    const palaceIndex = ((startPalaceIndex + i * direction) % 8 + 8) % 8;
    const doorIndex = ((startDoorIndex + i * direction) % 8 + 8) % 8;
    doorMap[PERIMETER[palaceIndex]] = BASE_DOOR_RING[doorIndex];
  }

  return doorMap;
}

function calculateTrucSuPalace(tuanThuPalace, canTuanIndex, canGioIndex, isDuongDon) {
  // Bước 1: Tính số bước dịch chuyển từ Tuần Thủ đến Giờ hiện tại
  const steps = Math.abs(canGioIndex - canTuanIndex);

  let finalPalace = tuanThuPalace;

  // Bước 2: Dịch chuyển trên trục 9 số Lạc Thư
  if (isDuongDon) {
    finalPalace += steps;
    // Quấn vòng nếu vượt quá 9
    while (finalPalace > 9) {
      finalPalace -= 9;
    }
  } else {
    // Âm Độn đi lùi
    finalPalace -= steps;
    // Quấn vòng nếu rớt xuống dưới 1
    while (finalPalace < 1) {
      finalPalace += 9;
    }
  }

  // Bước 3: Xử lý điểm mù Trung Cung
  // Nếu điểm rơi cuối cùng là 5, Trực Sử tự động gửi ra Khôn (2)
  if (finalPalace === 5) {
    finalPalace = 2;
  }

  return finalPalace;
}

// ══════════════════════════════════════════════════════════════════════════════
// EARTH PLATE (ĐỊA BÀN) - Stem Distribution
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Earth Plate stem distribution - linear palace sequence used by Self-Plus.
 *
 * Khởi Mậu tại Cục Số (cucSo).
 * Dương Độn bay tiến: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9
 * Âm Độn bay lùi: 9 → 8 → 7 → 6 → 5 → 4 → 3 → 2 → 1
 *
 * Phân bổ đúng 9 Thiên Can: Mậu, Kỷ, Canh, Tân, Nhâm, Quý, Đinh, Bính, Ất.
 */
function distributeEarthPlateStems(cucSo, isDuong) {
  const earthPlate = {};
  const path = isDuong
    ? [1, 2, 3, 4, 5, 6, 7, 8, 9]
    : [9, 8, 7, 6, 5, 4, 3, 2, 1];
  let startIdx = path.indexOf(cucSo);
  if (startIdx === -1) startIdx = 0;

  for (let i = 0; i < 9; i++) {
    const targetPalace = path[(startIdx + i) % 9];
    earthPlate[targetPalace] = {
      stem: CAN_SEQUENCE_9[i].name,
      stemIdx: CAN_SEQUENCE_9[i].stemIdx,
      can9Idx: i,
    };
  }

  return earthPlate;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN FLYING FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Find the palace containing a specific stem on the Earth Plate
 */
function findStemPalace(earthPlate, stemName) {
  for (const [palace, data] of Object.entries(earthPlate)) {
    if (data.stem === stemName) return parseInt(palace);
  }
  return null;
}

/**
 * Build complete rotating chart (Chuyển Bàn)
 * OVERHAULED to follow Joey Yap / Self-Plus method strictly
 *
 * @param {number} cucSo - Cục number (1-9)
 * @param {boolean} isDuong - Yang (true) or Yin (false)
 * @param {number} hourStemIdx - Hour stem index (0-9)
 * @param {number} hourBranchIdx - Hour branch index (0-11)
 * @param {number} dayStemIdx - Day stem index (for reference)
 * @param {number} dayBranchIdx - Day branch index (for Dịch Mã option)
 * @param {string} hourCanChi - Hour pillar string (e.g., "Tân Mão")
 */
export function buildRotatingChart(cucSo, isDuong, hourStemIdx, hourBranchIdx, dayStemIdx, dayBranchIdx, hourCanChi) {
  const palaces = {};

  // Initialize all 9 palaces
  for (let p = 1; p <= 9; p++) {
    palaces[p] = {
      palaceNum: p,
      palaceName: PALACE_META[p].name,
      dir: PALACE_META[p].dir,
      direction: PALACE_META[p].dir,
      element: PALACE_META[p].element,
      trigram: PALACE_META[p].trigram,
      // Will be filled in:
      earthStem: null,    // Địa Bàn stem
      star: null,         // Cửu Tinh
      can: null,          // Thiên Can (Heaven Plate stem)
      mon: null,          // Bát Môn
      than: null,         // Bát Thần
      // Flags
      trucPhu: false,
      trucSu: false,
      khongVong: false,
      dichMa: false,
      isNgayCan: false,
      isGioCan: false,
      phucAm: false,
      phanNgam: false,
      sentStar: null,     // Parasite Star (Thiên Cầm)
      sentCan: null,      // Parasite Can
      hasCam: false,      // Flag: Thiên Cầm is here
      cachCuc: [],
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 1: Build Earth Plate (Địa Bàn) - Distribute stems based on Cục
  // ════════════════════════════════════════════════════════════════════════════
  const earthPlate = distributeEarthPlateStems(cucSo, isDuong);
  for (let p = 1; p <= 9; p++) {
    if (earthPlate[p]) {
      palaces[p].earthStem = earthPlate[p].stem;
      palaces[p].earthStemIdx = earthPlate[p].stemIdx;
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 2: Determine Xun (Tuần) and Lead Stem (Tuần Thủ)
  // CRITICAL FIX: Use XUN_LEAD_STEM mapping for correct Tuần Thủ
  // ════════════════════════════════════════════════════════════════════════════
  const xunData = getXunInfo(hourCanChi);
  const leadStemName = xunData.leadStemName;  // Now correctly derived from XUN_LEAD_STEM
  const tuanBranchIdx = xunData.tuanBranchIdx; // Branch index for door step calculation

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 3: Find Lead Star (Trực Phù) and Lead Door (Trực Sử) origin palaces
  // The Lead Stem's position on Earth Plate determines the original Star and Door
  // ════════════════════════════════════════════════════════════════════════════
  const leadStemPalace = findStemPalace(earthPlate, leadStemName);
  const tuanThuPalace = leadStemPalace; // Palace of Tuần Thủ

  const effectiveLeadStemPalace = leadStemPalace === 5 ? 2 : leadStemPalace;

  // The Star at the Lead Stem's palace becomes Trực Phù (Lead Star)
  // Star index = palace - 1 (except palace 5 → Thiên Cầm idx 4)
  const leadStarIdx = leadStemPalace === 5 ? 4 : leadStemPalace - 1;
  const leadStar = CUU_TINH[leadStarIdx];

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 4: Find Hour Stem Palace (where Trực Phù will land)
  // ════════════════════════════════════════════════════════════════════════════
  const originalHourStemName = STEMS[hourStemIdx].name;
  let hourStemName = originalHourStemName;
  // If hour stem is Giáp, it hides under the current Xun's Tuần Thủ
  if (hourStemName === 'Giáp') {
    hourStemName = leadStemName;
  }
  const hourStemPalace = findStemPalace(earthPlate, hourStemName);
  const effectiveHourStemPalace = hourStemPalace === 5 ? 2 : hourStemPalace;
  const doorSteps = countDoorSteps(tuanBranchIdx, hourBranchIdx, isDuong);
  const isJiaHourOffsetZero = originalHourStemName === 'Giáp' && doorSteps === 0;

  // Chuyển Bàn chuẩn lấy Trực Phù / Trực Sử khởi từ cung Tuần Thủ,
  // không neo cứng vào Mậu cung.
  const leadDoorOriginPalace = effectiveLeadStemPalace;
  const leadDoor = BAT_MON_ARRAY[leadDoorOriginPalace] || BAT_MON_ARRAY[1];

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 5: STAR ROTATION (Chuyển Tinh) - Joey Yap / SELF PLUS method
  //
  // Trực Phù lấy sao đứng đầu từ cung Tuần Thủ rồi chuyển tới cung Can Giờ.
  // Thiên Cầm (palace 5) vẫn đi theo Thiên Nhuế.
  // ════════════════════════════════════════════════════════════════════════════

  // Destination palace: where Hour Stem is on Earth Plate
  const trucPhuDestPalace = effectiveHourStemPalace;

  // Origin palace: the Tuần Thủ palace that defines the lead star.
  const trucPhuOrigPalace = effectiveLeadStemPalace;

  // Calculate star shift on perimeter
  const srcPerimIdx = PERIM_INDEX[trucPhuOrigPalace];
  const dstPerimIdx = PERIM_INDEX[trucPhuDestPalace];
  const starShift = dstPerimIdx - srcPerimIdx; // Can be negative

  // Place all 8 stars (skip Thiên Cầm which follows Thiên Nhuế)
  const starPlacements = {}; // palace -> star

  for (let starIdx = 0; starIdx < 9; starIdx++) {
    const star = CUU_TINH[starIdx];
    const origPalace = star.palace;

    // Skip Thiên Cầm - it follows Thiên Nhuế
    if (origPalace === 5) {
      continue;
    }

    // Calculate new position with shift
    const origIdx = PERIM_INDEX[origPalace];
    const newIdx = ((origIdx + starShift) % 8 + 8) % 8;
    const newPalace = PERIMETER[newIdx];

    starPlacements[newPalace] = star;
  }

  // Assign stars to palaces
  for (let p = 1; p <= 9; p++) {
    if (p === 5) {
      palaces[p].star = null; // Trung Cung empty
    } else if (starPlacements[p]) {
      palaces[p].star = starPlacements[p];
    }
  }

  // Find where Thiên Nhuế (palace 2) landed - Thiên Cầm follows it
  const nhueNewIdx = ((PERIM_INDEX[2] + starShift) % 8 + 8) % 8;
  const nhueLandingPalace = PERIMETER[nhueNewIdx];

  // Mark Trực Phù palace
  palaces[trucPhuDestPalace].trucPhu = true;

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 6: HEAVEN PLATE STEMS (Thiên Can)
  // CHIẾN THUẬT: TINH ĐI ĐÂU, CAN THEO ĐÓ (Stars carry Earth stems to Heaven)
  // Cửu Tinh hạ cánh ở cung nào, mang Thiên Can Địa Bàn từ quê gốc của nó theo.
  // ════════════════════════════════════════════════════════════════════════════

  const heavenPlateCan = {};

  for (let p = 1; p <= 9; p++) {
    if (p === 5) continue;

    const landedStar = starPlacements[p];
    if (landedStar) {
      const origPalace = landedStar.palace;
      const carriedEarthStem = earthPlate[origPalace];

      if (carriedEarthStem) {
        heavenPlateCan[p] = CAN_SEQUENCE_9.find(c => c.name === carriedEarthStem.stem);
      }
    }
  }

  // RULE 1: THIÊN CẦM BINDING (Thiên Cầm ký bám Thiên Nhuế)
  // Thiên Can tại cung số 5 (Trung Cung) bị Thiên Cầm cuốn theo và hạ cánh cùng Thiên Nhuế
  const palace5EarthStem = earthPlate[5]?.stem;
  if (palace5EarthStem && nhueLandingPalace !== 5) {
    const palace5StemData = CAN_SEQUENCE_9.find(c => c.name === palace5EarthStem);
    if (palaces[nhueLandingPalace]) {
      palaces[nhueLandingPalace].sentCan = palace5StemData;
    }
  }

  // Khớp lệnh: Gán cấu trúc Thiên Bàn vừa tạo vào ma trận các cung
  for (let p = 1; p <= 9; p++) {
    if (heavenPlateCan[p]) {
      palaces[p].can = heavenPlateCan[p];
    } else if (p === 5) {
      palaces[p].can = null;
    } else {
      palaces[p].can = null;
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 7: DOOR ROTATION (Chuyển Môn)
  //
  // Trực Sử is independent from Trực Phù:
  // 1. Start from the Tuần Thủ palace on Earth Plate
  // 2. Count branch steps from the Xun head branch to the current hour branch
  // 3. Move Trực Sử on the numeric 1→9 sequence (Yang forward, Yin backward)
  // 4. Once Trực Sử lands, spread the 8-door ring on the perimeter
  // ════════════════════════════════════════════════════════════════════════════

  const trucSuOrigPalace = effectiveLeadStemPalace;
  const trucSuDestPalace = moveOnNumberSequence(trucSuOrigPalace, doorSteps, isDuong);
  const trucSuDestPerimIdx = PERIM_INDEX[trucSuDestPalace];
  const doorPlacements = distributeDoors(trucSuDestPalace, leadDoor, isDuong);

  // Assign doors to palaces
  for (let p = 1; p <= 9; p++) {
    if (p === 5) continue;
    palaces[p].mon = doorPlacements[p] || null;
  }

  const isPhucAm = isJiaHourOffsetZero || (starShift === 0);
  const doorPerimShift = trucSuDestPerimIdx - PERIM_INDEX[trucSuOrigPalace];
  const dayStemPalace = null;
  const trucSuMarkedPalace = trucSuDestPalace;
  palaces[trucSuMarkedPalace].trucSu = true;

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 8: DEITY ROTATION (Chuyển Thần)
  // Trực Phù deity follows Lead Star to trucPhuDestPalace
  // Other 7 deities rotate around perimeter: Yang=clockwise, Yin=counter-clockwise
  // ════════════════════════════════════════════════════════════════════════════

  const currentBatThan = getBatThan(isDuong);
  const deityPlacements = {};

  // Place Trực Phù deity at Lead Star destination
  deityPlacements[trucPhuDestPalace] = currentBatThan[0];

  // Place remaining 7 deities around perimeter
  const trucPhuPerimIdx = PERIM_INDEX[trucPhuDestPalace];
  const direction = isDuong ? 1 : -1;

  for (let i = 1; i < 8; i++) {
    const deity = currentBatThan[i];
    const newPerimIdx = ((trucPhuPerimIdx + i * direction) % 8 + 8) % 8;
    const newPalace = PERIMETER[newPerimIdx];
    deityPlacements[newPalace] = deity;
  }

  // Assign deities to palaces
  for (let p = 1; p <= 9; p++) {
    if (p === 5) continue;
    palaces[p].than = deityPlacements[p] || null;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 9: Ký Cung Trung Cung - Thiên Cầm parasite
  // Thiên Cầm follows Thiên Nhuế (already at nhueLandingPalace)
  // Mark the palace with hasCam flag and sentStar
  // ════════════════════════════════════════════════════════════════════════════

  // Thiên Cầm lands where Thiên Nhuế lands
  palaces[nhueLandingPalace].hasCam = true;
  palaces[nhueLandingPalace].sentStar = CUU_TINH[4]; // Thiên Cầm

  // Palace 5's Earth Stem follows Thiên Cầm
  if (earthPlate[5]?.stem) {
    palaces[nhueLandingPalace].sentCan = CAN_SEQUENCE_9.find(c => c.name === earthPlate[5].stem);
  }

  // Clear Trung Cung (palace 5)
  palaces[5].star = null;
  palaces[5].mon = null;
  palaces[5].than = null;
  palaces[5].can = null;

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 10: Phục Âm / Phản Ngâm Detection
  // ════════════════════════════════════════════════════════════════════════════
  const isPhanNgam = Math.abs(starShift % 8) === 4; // Shift of 4 = 180 degrees

  for (let p = 1; p <= 9; p++) {
    palaces[p].phucAm = isPhucAm;
    palaces[p].phanNgam = isPhanNgam;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 11: CỬU CUNG PHI TINH (Flying Stars Numbers)
  // ════════════════════════════════════════════════════════════════════════════
  // Web1 reference board uses 1 as the center for the current phi number layer.
  const centralStar = 1;
  const phiTinhOffsets = {
    5: 0, 6: 1, 7: 2, 8: 3, 9: 4, 1: 5, 2: 6, 3: 7, 4: 8
  };
  for (let p = 1; p <= 9; p++) {
    let num = (centralStar + phiTinhOffsets[p]) % 9;
    if (num === 0) num = 9;
    palaces[p].phiTinhNum = num;
  }

  for (let p = 1; p <= 9; p++) {
    if (p === 5) {
      palaces[p].cachCuc = [];
      palaces[p].specialPatterns = [];
      palaces[p].patternScoreDelta = 0;
      continue;
    }
    palaces[p].cachCuc = evaluateCachCuc(palaces[p].can, palaces[p].earthStem);
    palaces[p].specialPatterns = [];
    palaces[p].patternScoreDelta = 0;
  }

  return {
    palaces,
    isPhucAm,
    isPhanNgam,
    leadStemName,
    leadStemPalace,
    leadStar: leadStar.name,
    leadDoor: leadDoor?.name,
    hourStemPalace,
    trucPhuPalace: trucPhuDestPalace,
    trucSuPalace: trucSuMarkedPalace,
    xunName: xunData.tuanName || 'Unknown',
    starShift,
    dayStemPalace,
    doorPerimShift,
  };
}

/**
 * Calculate Dịch Mã based on Hour branch (or Day branch)
 * @param {number} branchIdx - Branch index (0-11)
 * @param {string} type - 'hour' or 'day'
 */
export function getDichMa(branchIdx, type = 'hour') {
  const dm = DICH_MA_MAP[branchIdx];
  if (!dm) return null;
  return {
    horseBranch: dm.horse,
    horseBranchIdx: dm.branchIdx,
    palace: dm.palace,
    palaceName: PALACE_META[dm.palace].name,
    dir: PALACE_META[dm.palace].dir,
    basedOn: type,
  };
}

/**
 * buildFullChart(date, hour) → ChartData
 * Main entry point. Returns the complete annotated 9-palace chart.
 */
export function buildFullChart(date, hourStr) {
  const yearPillar = getYearPillar(date);
  const monthPillar = getMonthPillar(date, yearPillar.stemIdx);
  const dayPillar = getDayPillar(date);
  const tk = getSolarTermInfo(date, dayPillar.jiazi);
  const hour = parseInt(hourStr, 10);
  const gioChiIdx = getGioChi(hour);
  const gioCanIdx = getGioCan(hour, dayPillar.stemIdx);
  const gioPillar = {
    stemIdx: gioCanIdx,
    branchIdx: gioChiIdx,
    stemName: STEMS[gioCanIdx].name,
    displayStemName: hour === 23 ? STEMS[getGioCan(0, (dayPillar.stemIdx + 1) % 10)].name : STEMS[gioCanIdx].name,
    branchName: BRANCHES[gioChiIdx]?.name || 'Unknown'
  };

  // Build the rotating chart
  const hourCanChi = `${STEMS[gioCanIdx].name} ${BRANCHES[gioChiIdx]?.name || ''}`.trim();
  const chartResult = buildRotatingChart(
    tk.cucSo,
    tk.isDuong,
    gioCanIdx,
    gioChiIdx,
    dayPillar.stemIdx,
    dayPillar.branchIdx,
    hourCanChi
  );

  const { palaces, isPhucAm, isPhanNgam } = chartResult;

  const kv = getKhongVong(gioPillar.stemIdx, gioPillar.branchIdx);

  // Calculate Dịch Mã from Hour branch (more commonly used) or Day branch
  const dmHour = getDichMa(gioChiIdx, 'hour');
  const dmDay = getDichMa(dayPillar.branchIdx, 'day');
  const dm = dmHour; // Default to hour-based

  // Determine which stem represents the day and hour (Giáp → Mậu)
  const yearStem = yearPillar.stemIdx === 0 ? 'Mậu' : yearPillar.stemName;
  const monthStem = monthPillar.stemIdx === 0 ? 'Mậu' : monthPillar.stemName;
  const dayStem = dayPillar.stemIdx === 0 ? 'Mậu' : dayPillar.stemName;
  const gioStem = resolveHiddenStemForHourStem(gioPillar.stemName, gioPillar.branchName);

  // Mark special palaces
  for (const p of Object.keys(palaces)) {
    const pal = palaces[p];
    if (pal.can?.name === yearStem) pal.isNamCan = true;
    if (pal.can?.name === monthStem) pal.isThangCan = true;
    // Mark day stem palace
    if (pal.can?.name === dayStem) pal.isNgayCan = true;
    // Mark hour stem palace
    if (pal.can?.name === gioStem) pal.isGioCan = true;
    // Mark Không Vong palaces
    if (kv.voidPalaces.includes(+p)) pal.khongVong = true;
    // Mark Dịch Mã palace
    if (dm && dm.palace === +p) pal.dichMa = true;
  }

  const XU = ['Giáp Tý', 'Giáp Tuất', 'Giáp Thân', 'Giáp Ngọ', 'Giáp Thìn', 'Giáp Dần'];

  const chartWithMarkers = {
    date,
    hour,
    solarTerm: tk,
    cucSo: tk.cucSo,
    isDuong: tk.isDuong,
    isPhucAm,
    isPhanNgam,
    dayPillar,
    monthPillar,
    yearPillar,
    gioPillar,
    khongVong: kv,
    dichMa: dm,
    dichMaDay: dmDay,
    xuName: XU[Math.floor(dayPillar.jiazi / 10) % 6],
    xunHour: chartResult.xunName,
    leadStem: chartResult.leadStemName,
    leadStemPalace: chartResult.leadStemPalace,
    leadStar: chartResult.leadStar,
    leadDoor: chartResult.leadDoor,
    trucPhuPalace: chartResult.trucPhuPalace,
    trucSuPalace: chartResult.trucSuPalace,
    palaces,
  };

  const patternSummary = evaluateSpecialPatterns(chartWithMarkers);
  for (let palaceNum = 1; palaceNum <= 9; palaceNum++) {
    palaces[palaceNum].specialPatterns = patternSummary.byPalace[palaceNum] || [];
    palaces[palaceNum].patternScoreDelta = patternSummary.patternScoreDelta[palaceNum] || 0;
  }

  chartWithMarkers.allSpecialPatterns = patternSummary.allPatterns;
  chartWithMarkers.topSpecialPatterns = patternSummary.topPatterns;

  return annotateTemporalMarkers(chartWithMarkers);
}

// Legacy export for compatibility
export function flyStars(cucSo, isDuong) {
  // This is a simplified version - full rotation requires hour pillar
  const result = buildRotatingChart(cucSo, isDuong, 0, 0, 0, 0);
  return {
    palaces: result.palaces,
    isPhucAm: result.isPhucAm,
    isPhanNgam: result.isPhanNgam,
  };
}

/**
 * Safe render cho bất kỳ giá trị palace nào.
 * Không bao giờ in ra "undefined" hay "null".
 *
 * @param {*} value - Giá trị cần render
 * @param {string} fallback - Mặc định nếu null/undefined (default: "")
 */
export function safeRender(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object' && value.name) return value.name;
  return String(value);
}
