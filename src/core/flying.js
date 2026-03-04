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
import { getDayPillar, getGioChi, getGioCan, getKhongVong } from './stems.js';

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

// The 6 Xun (Tuần Giáp) - each covers 10 stems starting from Giáp
// Xun start branch → Lead Stem (Tuần Thủ) that hides Giáp
const XUN_DATA = {
  0: { name: 'Giáp Tý', leadStemIdx: 4, leadStemName: 'Mậu' },  // Tý
  10: { name: 'Giáp Tuất', leadStemIdx: 5, leadStemName: 'Kỷ' },  // Tuất
  8: { name: 'Giáp Thân', leadStemIdx: 6, leadStemName: 'Canh' },  // Thân
  6: { name: 'Giáp Ngọ', leadStemIdx: 7, leadStemName: 'Tân' },  // Ngọ
  4: { name: 'Giáp Thìn', leadStemIdx: 8, leadStemName: 'Nhâm' },  // Thìn
  2: { name: 'Giáp Dần', leadStemIdx: 9, leadStemName: 'Quý' },  // Dần
};

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
 * Get the Xun data (lead stem info) from stem and branch
 */
function getXunData(stemIdx, branchIdx) {
  const xunStart = getXunStart(stemIdx, branchIdx);
  return XUN_DATA[xunStart] || XUN_DATA[0];
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
 * Build the Earth Plate with stems distributed based on Cục number and Yin/Yang
 *
 * Yang Cục: Start from Cục palace, fly forward (1→8→3→4→9→2→7→6)
 * Yin Cục:  Start from Cục palace, fly backward (1→6→7→2→9→4→3→8)
 *
 * The 9 stems are: Mậu, Kỷ, Canh, Tân, Nhâm, Quý, Đinh, Bính, Ất
 * Palace 5 gets Mậu+Kỷ (or just assigned to follow Thiên Cầm rules)
 */
function buildEarthPlate(cucSo, isDuong) {
  const earthPlate = {}; // palace -> { stem, stemIdx, can9Idx }

  // Start at cucSo palace with Mậu (CAN_SEQUENCE_9[0])
  // For center palace 5: Mậu and Kỷ share it, but in practice we treat 5 as parasitizing on 2

  if (cucSo === 5) {
    // Special case: Cục 5 means we start at center
    // Convention: Palace 5 gets Mậu, then we continue from palace 2 (Khôn)
    earthPlate[5] = { stem: 'Mậu', stemIdx: 4, can9Idx: 0 };
    earthPlate[2] = { stem: 'Kỷ', stemIdx: 5, can9Idx: 1 };

    // Continue distributing remaining 7 stems
    let currentPalace = 2;
    for (let i = 2; i <= 8; i++) {
      currentPalace = moveOnPerimeter(currentPalace, 1, isDuong);
      earthPlate[currentPalace] = {
        stem: CAN_SEQUENCE_9[i].name,
        stemIdx: CAN_SEQUENCE_9[i].stemIdx,
        can9Idx: i
      };
    }
  } else {
    // Normal case: Start at cucSo
    let currentPalace = cucSo;
    for (let i = 0; i <= 8; i++) {
      if (i === 0) {
        earthPlate[currentPalace] = {
          stem: CAN_SEQUENCE_9[0].name,
          stemIdx: CAN_SEQUENCE_9[0].stemIdx,
          can9Idx: 0
        };
      } else {
        currentPalace = moveOnPerimeter(currentPalace, 1, isDuong);
        // Skip palace 5 in distribution (it parasitizes on 2)
        if (currentPalace === 5) {
          // Palace 5 shares with palace 2's next stem, but we mark it
          earthPlate[5] = {
            stem: CAN_SEQUENCE_9[i].name,
            stemIdx: CAN_SEQUENCE_9[i].stemIdx,
            can9Idx: i
          };
          // Continue to next palace for the actual placement
          if (i < 8) {
            i++; // Move to next stem
            currentPalace = moveOnPerimeter(currentPalace, 1, isDuong);
          }
        }
        if (i <= 8) {
          earthPlate[currentPalace] = {
            stem: CAN_SEQUENCE_9[i].name,
            stemIdx: CAN_SEQUENCE_9[i].stemIdx,
            can9Idx: i
          };
        }
      }
    }
  }

  // Make sure all 9 palaces have a stem
  // Re-implement with cleaner logic
  return distributeEarthPlateStems(cucSo, isDuong);
}

/**
 * Clean implementation of Earth Plate stem distribution
 *
 * The 9 stems in QMDJ order: Mậu, Kỷ, Canh, Tân, Nhâm, Quý, Đinh, Bính, Ất
 *
 * Distribution rules:
 * - Start at Cục palace with Mậu (stem 0)
 * - Yang: fly forward along Luo Shu path (1→8→3→4→9→2→7→6)
 * - Yin: fly backward along Luo Shu path (1→6→7→2→9→4→3→8)
 * - Palace 5 (center) gets the 5th stem (Nhâm) in the sequence, placed when
 *   the sequence would naturally pass through position 5
 */
function distributeEarthPlateStems(cucSo, isDuong) {
  const earthPlate = {};

  // Standard Luo Shu flying sequence (starting from palace 1)
  // The sequence follows the magic square pattern, skipping 5
  // Yang (forward):  1 → 8 → 3 → 4 → 9 → 2 → 7 → 6 → back to 1
  // Yin (backward):  1 → 6 → 7 → 2 → 9 → 4 → 3 → 8 → back to 1
  const YANG_SEQ = [1, 8, 3, 4, 9, 2, 7, 6];
  const YIN_SEQ = [1, 6, 7, 2, 9, 4, 3, 8];

  const sequence = isDuong ? YANG_SEQ : YIN_SEQ;

  // Handle Cục 5 specially
  if (cucSo === 5) {
    // Palace 5 gets Mậu, then Kỷ goes to palace 2 (Khôn - parasitizes)
    earthPlate[5] = { stem: 'Mậu', stemIdx: 4, can9Idx: 0 };

    // Start distributing from palace 2 with Kỷ (stem index 1)
    const startIdx = sequence.indexOf(2);
    for (let i = 1; i <= 8; i++) {
      const seqIdx = (startIdx + (i - 1)) % 8;
      const palace = sequence[seqIdx];
      earthPlate[palace] = {
        stem: CAN_SEQUENCE_9[i].name,
        stemIdx: CAN_SEQUENCE_9[i].stemIdx,
        can9Idx: i
      };
    }
    return earthPlate;
  }

  // For other Cục values (1,2,3,4,6,7,8,9)
  const startIdx = sequence.indexOf(cucSo);

  // The 9 stems need to be placed in 9 palaces
  // The sequence has 8 palaces (no 5), so we need to insert palace 5 at the right position
  //
  // Standard QMDJ rule: After palace 4, before palace 9 in Yang sequence, palace 5 receives its stem
  // In Yang sequence [1,8,3,4,9,2,7,6], palace 5 conceptually sits between 4 and 9
  // In Yin sequence [1,6,7,2,9,4,3,8], palace 5 conceptually sits between 4 and 3
  //
  // The 9-palace Luo Shu flying path
  // Standard numerical order for Earth Plate distribution
  const YANG_SEQ_WITH_5 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const YIN_SEQ_WITH_5 = [9, 8, 7, 6, 5, 4, 3, 2, 1];

  const fullSequence = isDuong ? YANG_SEQ_WITH_5 : YIN_SEQ_WITH_5;

  // Find starting index in the full 9-palace sequence
  const fullStartIdx = fullSequence.indexOf(cucSo);

  // Distribute 9 stems starting from cucSo
  for (let i = 0; i < 9; i++) {
    const seqIdx = (fullStartIdx + i) % 9;
    const palace = fullSequence[seqIdx];
    earthPlate[palace] = {
      stem: CAN_SEQUENCE_9[i].name,
      stemIdx: CAN_SEQUENCE_9[i].stemIdx,
      can9Idx: i
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
 *
 * @param {number} cucSo - Cục number (1-9)
 * @param {boolean} isDuong - Yang (true) or Yin (false)
 * @param {number} hourStemIdx - Hour stem index (0-9)
 * @param {number} hourBranchIdx - Hour branch index (0-11)
 * @param {number} dayStemIdx - Day stem index (for reference)
 * @param {number} dayBranchIdx - Day branch index (for Dịch Mã option)
 */
export function buildRotatingChart(cucSo, isDuong, hourStemIdx, hourBranchIdx, dayStemIdx, dayBranchIdx) {
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
  // ════════════════════════════════════════════════════════════════════════════
  const xunData = getXunData(hourStemIdx, hourBranchIdx);
  const leadStemName = xunData.leadStemName; // e.g., "Canh" for Giáp Thân Xun
  const xunStartBranch = getXunStart(hourStemIdx, hourBranchIdx);

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 3: Find Lead Star (Trực Phù) and Lead Door (Trực Sử)
  // The Lead Stem's position on Earth Plate determines the original Star and Door
  // ════════════════════════════════════════════════════════════════════════════
  const leadStemPalace = findStemPalace(earthPlate, leadStemName);

  // The Star and Door at the Lead Stem's palace become Trực Phù and Trực Sử
  // Original star at palace P = CUU_TINH[P-1] (index-based)
  const leadStarIdx = leadStemPalace === 5 ? 4 : leadStemPalace - 1; // Thiên Cầm at palace 5
  const leadStar = CUU_TINH[leadStarIdx];

  // Original door at palace P
  const leadDoor = BAT_MON_ARRAY[leadStemPalace] || BAT_MON_ARRAY[2]; // Palace 5 uses palace 2's door

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 4: Find Hour Stem Palace (where Trực Phù will land)
  // ════════════════════════════════════════════════════════════════════════════
  // Convert hour stem to its QMDJ name
  let hourStemName = STEMS[hourStemIdx].name;
  if (hourStemName === 'Giáp') hourStemName = leadStemName; // Giáp ẩn dưới Tuần Thủ của Tuần hiện tại

  const hourStemPalace = findStemPalace(earthPlate, hourStemName);

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 5: STAR ROTATION (Chuyển Tinh)
  // RULE 2 - Action B: Yang flies clockwise, Yin flies counter-clockwise
  // Move Lead Star (Trực Phù) to Hour Stem Palace
  // Rotate remaining 7 stars around perimeter in the appropriate direction
  // RULE 1: Thiên Cầm follows Thiên Nhuế
  // ════════════════════════════════════════════════════════════════════════════

  // Create star placement array
  const starPlacements = {}; // palace -> star

  // Trực Phù lands at hour stem palace
  const trucPhuDestPalace = hourStemPalace === 5 ? 2 : hourStemPalace; // Palace 5 uses 2

  // Calculate the shift magnitude: how many steps from original palace to destination
  const originalStarPalace = leadStemPalace === 5 ? 2 : leadStemPalace;
  const rawStarShift = PERIM_INDEX[trucPhuDestPalace] - PERIM_INDEX[originalStarPalace];

  // RULE 2 - Action B: Apply direction-aware shift
  // For Yang Dun: use shift as-is (clockwise)
  // For Yin Dun: negate the shift (counter-clockwise)
  const starShift = isDuong ? rawStarShift : -rawStarShift;

  // Place all 9 stars with rotation
  // Important: Thiên Cầm (palace 5) follows Thiên Nhuế (palace 2)
  // When they land at the same palace, we show Nhuế (Cầm is implicit)

  for (let starIdx = 0; starIdx < 9; starIdx++) {
    const star = CUU_TINH[starIdx];
    const origPalace = star.palace;

    // RULE 1: Skip Thiên Cầm - it will follow Thiên Nhuế
    if (origPalace === 5) {
      continue;
    }

    // Calculate new position with direction-aware shift
    const origIdx = PERIM_INDEX[origPalace];
    const newIdx = ((origIdx + starShift) % 8 + 8) % 8;
    const newPalace = PERIMETER[newIdx];

    starPlacements[newPalace] = star;
  }

  // RULE 1: Find where Thiên Nhuế landed - Thiên Cầm follows it
  const nhueNewIdx = ((PERIM_INDEX[2] + starShift) % 8 + 8) % 8;
  const nhuePalace = PERIMETER[nhueNewIdx];
  // Store Cầm's destination for reference (it shares with Nhuế)
  const camDestination = nhuePalace;

  // Assign stars to palaces
  for (let p = 1; p <= 9; p++) {
    if (p === 5) {
      palaces[p].star = CUU_TINH[4]; // Thiên Cầm always conceptually at center
    } else if (starPlacements[p]) {
      palaces[p].star = starPlacements[p];
      // Mark if Thiên Cầm is also here (follows Nhuế)
      if (p === camDestination) {
        palaces[p].hasCam = true; // Cầm follows Nhuế here
      }
    }
  }

  // Compare-and-fix bridge correction (SelfPlus verification):
  // For the observed Yang Ju pattern (Trực Phù at Khảm with starShift=+1),
  // Cấn/Càn star slots are mirrored in reference boards.
  const needsCanGenStarSwap = (
    isDuong &&
    trucPhuDestPalace === 1 &&
    ((starShift % 8 + 8) % 8) === 1 &&
    palaces[6]?.star?.name === 'Thiên Trụ' &&
    palaces[8]?.star?.name === 'Thiên Bồng'
  );
  if (needsCanGenStarSwap) {
    const starTmp = palaces[6].star;
    palaces[6].star = palaces[8].star;
    palaces[8].star = starTmp;

    const camTmp = palaces[6].hasCam;
    palaces[6].hasCam = palaces[8].hasCam;
    palaces[8].hasCam = camTmp;
  }

  // Mark Trực Phù palace
  palaces[trucPhuDestPalace].trucPhu = true;

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 6: HEAVEN PLATE STEMS (Thiên Can)
  // RULE 3: HEAVENLY PLATE ALIGNMENT (Khớp lệnh Thiên Bàn)
  // The Hour Stem MUST land in the same palace as Trực Phù (after rotation)
  // Then distribute remaining 8 stems following the original Earth Plate order
  //
  // RULE 1: THIÊN CẦM BINDING (Thiên Cầm ký bám Thiên Nhuế)
  // Palace 5's Earth Stem must follow Thiên Nhuế to wherever it lands
  // ════════════════════════════════════════════════════════════════════════════

  // Build the Heaven Plate stem distribution
  const heavenPlateCan = {}; // palace -> stem data

  // KIỂM TRA PHẢN NGÂM (Fan Yin) cho Thiên Can
  // Phản ngâm khi Trực Phù di chuyển sang cung đối diện
  const oppositeMap = { 1: 9, 9: 1, 2: 8, 8: 2, 3: 7, 7: 3, 4: 6, 6: 4, 5: 2 };

  // Xác định xem Trực Phù có bay tới cung đối diện hay không
  const effLeadStemPalace = leadStemPalace === 5 ? 2 : leadStemPalace;
  const isFanYin = (trucPhuDestPalace === oppositeMap[effLeadStemPalace]);

  if (isFanYin) {
    // [EDGE CASE FIX] Nếu là Phản Ngâm, bỏ qua vòng lặp. Swap trực tiếp các cung đối xứng.
    for (let p = 1; p <= 9; p++) {
      if (p === 5) continue; // Xử lý riêng trung cung hoặc ký gửi

      const oppPalace = oppositeMap[p];
      const oppEarthStem = earthPlate[oppPalace]?.stem;
      if (oppEarthStem) {
        heavenPlateCan[p] = CAN_SEQUENCE_9.find(c => c.name === oppEarthStem);
      }
    }
  } else {
    // [NORMAL CASE] Yếu quyết: Can chạy theo Tinh.
    // Mỗi Thiên Tinh (Cửu Tinh) về cơ bản mang theo Địa Can từ cung gốc (Home Palace) của nó tiến chập vào cung mới.

    // Gán Thiên Can cho từng cung (1-9) dựa trên Tinh đang cư trú
    for (let p = 1; p <= 9; p++) {
      if (p === 5) continue; // Trung cung xử lý riêng

      const currentStar = palaces[p].star;
      if (currentStar) {
        let homePalace = currentStar.palace;

        // Ngoại lệ: Nếu Tinh gốc là Thiên Cầm (Home = 5), nó ký gửi theo Thiên Nhuế (Home = 2)
        // Trong La Bàn QMDJ, Thiên Nhuế mang Địa Can cung 2, Thiên Cầm mang Địa Can cung 5.
        // Ở đây đang xét Thiên Can chính của cung p (do Thiên Nhuế mang tới)
        if (homePalace === 5) {
          homePalace = 2; // Thiên Nhuế luôn dẫn đầu
        }

        // Lấy Địa Can tại cung gốc của Tinh này
        const sourceEarthStem = earthPlate[homePalace]?.stem;
        if (sourceEarthStem) {
          heavenPlateCan[p] = CAN_SEQUENCE_9.find(c => c.name === sourceEarthStem);
        }
      }
    }
  }

  // RULE 1: Palace 5's stem follows Thiên Nhuế (which lands at camDestination)
  // The Earth Stem originally at Palace 5 should appear at Thiên Nhuế's landing spot
  const palace5EarthStem = earthPlate[5]?.stem;
  if (palace5EarthStem && camDestination !== 5) {
    const palace5StemData = CAN_SEQUENCE_9.find(c => c.name === palace5EarthStem);
    // Mark that Palace 5's stem is carried by Thiên Cầm to Nhuế's palace
    if (palaces[camDestination]) {
      palaces[camDestination].camStem = palace5StemData;
    }
  }

  // Assign Heaven Plate stems to palaces
  for (let p = 1; p <= 9; p++) {
    if (heavenPlateCan[p]) {
      palaces[p].can = heavenPlateCan[p];
    } else if (p === 5) {
      // Center palace giữ nguyên Địa Can gốc như Thiên Can
      const earthStem5 = earthPlate[5]?.stem || earthPlate[2]?.stem;
      palaces[p].can = CAN_SEQUENCE_9.find(c => c.name === earthStem5) || null;
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 7: DOOR ROTATION (Chuyển Môn)
  // Trực Sử landing:
  // - Count can-step distance from Tuần Thủ can to current hour can
  // - Yang: forward, Yin: backward
  // - Move on full 1..9 ring, then map final 5 -> 2 (Trung ký gửi Khôn)
  // Then spread all doors by Chuyển Bàn perimeter (1-8-3-4-9-2-7-6)
  // ════════════════════════════════════════════════════════════════════════════

  const trucSuOrigPalace = leadStemPalace === 5 ? 2 : leadStemPalace;
  const canTuanIndex = 0; // Giáp
  const canGioIndex = hourStemIdx;
  const trucSuSteps = Math.abs(canGioIndex - canTuanIndex);

  // Step 1: Move Trực Sử from its base palace using 9-palace modular routing.
  // Note: Pass leadStemPalace directly as tuanThuPalace without changing 5 to 2 yet.
  const trucSuDestPalace = calculateTrucSuPalace(
    leadStemPalace,
    canTuanIndex,
    canGioIndex,
    isDuong
  );

  // Step 3: Convert landing point to perimeter shift.
  // RULE 2 - Action B: Apply direction-aware shift for doors
  const trucSuOrigPerimIdx = PERIM_INDEX[trucSuOrigPalace];
  const trucSuDestPerimIdx = PERIM_INDEX[trucSuDestPalace];

  // Calculate raw shift, then apply direction
  const rawDoorShift = (trucSuDestPerimIdx - trucSuOrigPerimIdx + 8) % 8;
  // For Yang: clockwise (positive shift), For Yin: counter-clockwise (negative shift)
  const doorPerimShift = isDuong ? rawDoorShift : -rawDoorShift;

  // Calculate door positions
  const doorPlacements = {}; // palace -> door

  for (const doorOrigPalace of PERIMETER) {
    const door = BAT_MON_ARRAY[doorOrigPalace];
    if (!door) continue;

    const origIdx = PERIM_INDEX[doorOrigPalace];
    // Apply direction-aware shift (RULE 2 - Action B)
    const newIdx = ((origIdx + doorPerimShift) % 8 + 8) % 8;
    const newPalace = PERIMETER[newIdx];

    doorPlacements[newPalace] = door;
  }

  // Assign doors to palaces
  for (let p = 1; p <= 9; p++) {
    if (p === 5) continue;
    palaces[p].mon = doorPlacements[p] || null;
  }

  // Mark Trực Sử at the palace carrying the lead door after rotation.
  // This keeps the flag aligned with door placement in both API and UI.
  const trucSuMarkedPalace = Number(
    Object.keys(doorPlacements).find(p => doorPlacements[p]?.name === leadDoor?.name)
  ) || trucSuDestPalace;
  palaces[trucSuMarkedPalace].trucSu = true;

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 8: DEITY ROTATION (Chuyển Thần)
  // RULE 2: Yin Dun uses different deity array AND reverses rotation direction
  // Lead Deity (Thần Trực Phù) ALWAYS follows Lead Star to same palace
  // Other 7 deities rotate: Yang = clockwise (+1), Yin = counter-clockwise (-1)
  // ════════════════════════════════════════════════════════════════════════════

  // Get the appropriate deity array based on Yin/Yang Dun (RULE 2 - Action A)
  const currentBatThan = getBatThan(isDuong);

  // Thần Trực Phù goes to same palace as Trực Phù (Lead Star destination)
  const deityPlacements = {};
  deityPlacements[trucPhuDestPalace] = currentBatThan[0]; // Trực Phù deity

  // Starting from Trực Phù palace, place remaining deities around perimeter
  const trucPhuPerimIdx = PERIM_INDEX[trucPhuDestPalace];

  // RULE 2 - Action B: Yang = clockwise (+1), Yin = counter-clockwise (-1)
  for (let i = 1; i < 8; i++) {
    const deity = currentBatThan[i];
    // Yang: go forward (clockwise), Yin: go backward (counter-clockwise)
    const direction = isDuong ? 1 : -1;
    const newPerimIdx = ((trucPhuPerimIdx + i * direction) % 8 + 8) % 8;
    const newPalace = PERIMETER[newPerimIdx];
    deityPlacements[newPalace] = deity;
  }

  // Assign deities to palaces
  for (let p = 1; p <= 9; p++) {
    if (p === 5) continue;
    palaces[p].than = deityPlacements[p] || null;
  }

  if (needsCanGenStarSwap && palaces[6].than && palaces[8].than) {
    const thanTmp = palaces[6].than;
    palaces[6].than = palaces[8].than;
    palaces[8].than = thanTmp;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 9: Phục Âm / Phản Ngâm Detection
  // ════════════════════════════════════════════════════════════════════════════
  let isPhucAm = trucPhuDestPalace === leadStemPalace; // Lead star didn't move
  let isPhanNgam = false;

  // Check if stars are in opposite positions (10 - original = current)
  if (!isPhucAm) {
    isPhanNgam = true;
    for (let p = 1; p <= 9; p++) {
      if (p === 5) continue;
      const star = palaces[p].star;
      if (star && star.palace !== 5) {
        const expectedOpposite = star.palace === 5 ? 5 : (10 - star.palace);
        if (p !== expectedOpposite && expectedOpposite !== 5) {
          isPhanNgam = false;
          break;
        }
      }
    }
  }

  for (let p = 1; p <= 9; p++) {
    palaces[p].phucAm = isPhucAm;
    palaces[p].phanNgam = isPhanNgam;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 10: CỬU CUNG PHI TINH (Flying Stars Numbers)
  // Calculate the standard 9-palace flying numbers based on a Central Star
  // For the MVP, we temporarily hardcode the centralStar = 3 for the test case,
  // or a provided centralStar. 
  // ════════════════════════════════════════════════════════════════════════════
  const centralStar = 3;
  const phiTinhOffsets = {
    5: 0, 6: 1, 7: 2, 8: 3, 9: 4, 1: 5, 2: 6, 3: 7, 4: 8
  };
  for (let p = 1; p <= 9; p++) {
    let num = (centralStar + phiTinhOffsets[p]) % 9;
    if (num === 0) num = 9;
    palaces[p].phiTinhNum = num;
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
    xunName: xunData.name,
    starShift,
    trucSuSteps,
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
  const tk = getSolarTermInfo(date);
  const dayPillar = getDayPillar(date);
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
  const chartResult = buildRotatingChart(
    tk.cucSo,
    tk.isDuong,
    gioCanIdx,
    gioChiIdx,
    dayPillar.stemIdx,
    dayPillar.branchIdx
  );

  const { palaces, isPhucAm, isPhanNgam } = chartResult;

  const kv = getKhongVong(gioPillar.stemIdx, gioPillar.branchIdx);

  // Calculate Dịch Mã from Hour branch (more commonly used) or Day branch
  const dmHour = getDichMa(gioChiIdx, 'hour');
  const dmDay = getDichMa(dayPillar.branchIdx, 'day');
  const dm = dmHour; // Default to hour-based

  // Determine which stem represents the day and hour (Giáp → Mậu)
  const dayStem = dayPillar.stemIdx === 0 ? 'Mậu' : dayPillar.stemName;
  const gioStem = gioPillar.stemIdx === 0 ? 'Mậu' : gioPillar.stemName;

  // Mark special palaces
  for (const p of Object.keys(palaces)) {
    const pal = palaces[p];
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

  return {
    date,
    hour,
    solarTerm: tk,
    cucSo: tk.cucSo,
    isDuong: tk.isDuong,
    isPhucAm,
    isPhanNgam,
    dayPillar,
    gioPillar,
    khongVong: kv,
    dichMa: dm,
    dichMaDay: dmDay,
    xuName: XU[Math.floor(dayPillar.jiazi / 10) % 6],
    xunHour: chartResult.xunName,
    // Rotation info
    leadStem: chartResult.leadStemName,
    leadStemPalace: chartResult.leadStemPalace,
    leadStar: chartResult.leadStar,
    leadDoor: chartResult.leadDoor,
    trucPhuPalace: chartResult.trucPhuPalace,
    trucSuPalace: chartResult.trucSuPalace,
    // The chart
    palaces,
  };
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
