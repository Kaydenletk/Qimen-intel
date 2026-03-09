/**
 * ============================================================================
 *  qmdjCoreEngine.js
 *  QMDJ (Qi Men Dun Jia) & BaZi — Core Algorithm Engine
 * ============================================================================
 *  Handles three Pro-Tier metaphysics calculations:
 *    1. Thập Thần  (十神)  — Ten Gods relationship engine
 *    2. Không Vong (空亡)  — Void / Empty Branch engine
 *    3. Dịch Mã   (驛馬)  — Traveling Horse Star engine
 *
 *  Pure Vanilla JS — zero dependencies, no DOM required.
 *  All inputs/outputs use Vietnamese terminology.
 * ============================================================================
 */

'use strict';

// ============================================================================
//  SECTION 1 — MASTER LOOKUP TABLES
// ============================================================================

/**
 * STEMS — Thập Thiên Can (十天干 / 10 Heavenly Stems)
 *
 *  Stem order in the 60 Jia-Zi cycle:
 *  Giáp(0) Ất(1) Bính(2) Đinh(3) Mậu(4) Kỷ(5) Canh(6) Tân(7) Nhâm(8) Quý(9)
 *
 *  Each stem carries:
 *    index    — 0-based position in the 10-stem cycle (used in Không Vong)
 *    element  — Ngũ Hành (Wood/Fire/Earth/Metal/Water)
 *    yinYang  — Âm / Dương polarity
 */
const STEMS = {
  'Giáp': { index: 0, element: 'Wood',  yinYang: 'Dương' },
  'Ất':   { index: 1, element: 'Wood',  yinYang: 'Âm'    },
  'Bính': { index: 2, element: 'Fire',  yinYang: 'Dương' },
  'Đinh': { index: 3, element: 'Fire',  yinYang: 'Âm'    },
  'Mậu':  { index: 4, element: 'Earth', yinYang: 'Dương' },
  'Kỷ':   { index: 5, element: 'Earth', yinYang: 'Âm'    },
  'Canh': { index: 6, element: 'Metal', yinYang: 'Dương' },
  'Tân':  { index: 7, element: 'Metal', yinYang: 'Âm'    },
  'Nhâm': { index: 8, element: 'Water', yinYang: 'Dương' },
  'Quý':  { index: 9, element: 'Water', yinYang: 'Âm'    },
};

/** Stems in index order — used for reverse index→name lookups */
const STEMS_BY_INDEX = [
  'Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý',
];

// ----------------------------------------------------------------------------

/**
 * BRANCHES — Thập Nhị Địa Chi (十二地支 / 12 Earthly Branches)
 *
 *  Branch order in the 60 Jia-Zi cycle (0 = Tý … 11 = Hợi)
 *
 *  palace — the QMDJ 8-palace number this branch belongs to.
 *  Compass layout (Lo Shu grid):
 *
 *      4·Tốn(SE)  │ 9·Ly(S)   │ 2·Khôn(SW)
 *     ────────────┼───────────┼────────────
 *      3·Chấn(E)  │  5·Center │ 7·Đoài(W)
 *     ────────────┼───────────┼────────────
 *      8·Cấn(NE)  │ 1·Khảm(N) │ 6·Càn(NW)
 *
 *  Branch → Direction → Palace:
 *    Tý(N)→1   Sửu/Dần(NE)→8   Mão(E)→3   Thìn/Tị(SE)→4
 *    Ngọ(S)→9  Mùi/Thân(SW)→2  Dậu(W)→7   Tuất/Hợi(NW)→6
 */
const BRANCHES = {
  'Tý':   { index: 0,  element: 'Water', yinYang: 'Dương', palace: 1 },  // Khảm · N
  'Sửu':  { index: 1,  element: 'Earth', yinYang: 'Âm',    palace: 8 },  // Cấn  · NE
  'Dần':  { index: 2,  element: 'Wood',  yinYang: 'Dương', palace: 8 },  // Cấn  · NE
  'Mão':  { index: 3,  element: 'Wood',  yinYang: 'Âm',    palace: 3 },  // Chấn · E
  'Thìn': { index: 4,  element: 'Earth', yinYang: 'Dương', palace: 4 },  // Tốn  · SE
  'Tị':   { index: 5,  element: 'Fire',  yinYang: 'Âm',    palace: 4 },  // Tốn  · SE
  'Ngọ':  { index: 6,  element: 'Fire',  yinYang: 'Dương', palace: 9 },  // Ly   · S
  'Mùi':  { index: 7,  element: 'Earth', yinYang: 'Âm',    palace: 2 },  // Khôn · SW
  'Thân': { index: 8,  element: 'Metal', yinYang: 'Dương', palace: 2 },  // Khôn · SW
  'Dậu':  { index: 9,  element: 'Metal', yinYang: 'Âm',    palace: 7 },  // Đoài · W
  'Tuất': { index: 10, element: 'Earth', yinYang: 'Dương', palace: 6 },  // Càn  · NW
  'Hợi':  { index: 11, element: 'Water', yinYang: 'Âm',    palace: 6 },  // Càn  · NW
};

/** Branches in index order — used for reverse index→name lookups */
const BRANCHES_BY_INDEX = [
  'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tị', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi',
];

// ----------------------------------------------------------------------------

/**
 * NGŨ HÀNH TƯƠNG SINH — Five Elements Production cycle
 *   Wood → Fire → Earth → Metal → Water → Wood
 */
const PRODUCES = {
  Wood:  'Fire',
  Fire:  'Earth',
  Earth: 'Metal',
  Metal: 'Water',
  Water: 'Wood',
};

/**
 * NGŨ HÀNH TƯƠNG KHẮC — Five Elements Control/Overcome cycle
 *   Wood → Earth → Water → Fire → Metal → Wood
 */
const CONTROLS = {
  Wood:  'Earth',
  Earth: 'Water',
  Water: 'Fire',
  Fire:  'Metal',
  Metal: 'Wood',
};

// ----------------------------------------------------------------------------

/** PALACE_NAMES — Full descriptive labels for the 8 QMDJ perimeter palaces */
const PALACE_NAMES = {
  1: 'Cung 1 · Khảm (Bắc)',
  2: 'Cung 2 · Khôn (Tây Nam)',
  3: 'Cung 3 · Chấn (Đông)',
  4: 'Cung 4 · Tốn (Đông Nam)',
  6: 'Cung 6 · Càn (Tây Bắc)',
  7: 'Cung 7 · Đoài (Tây)',
  8: 'Cung 8 · Cấn (Đông Bắc)',
  9: 'Cung 9 · Ly (Nam)',
};

// ============================================================================
//  SECTION 2 — THẬP THẦN CALCULATOR (十神 Ten Gods Engine)
// ============================================================================

/**
 * getThapThan(dayStem, targetStem)
 * ─────────────────────────────────────────────────────────────────────────────
 * Calculates the Thập Thần (Ten Gods) relationship between the BaZi
 * Day Master (Nhật Nguyên) and any other Heavenly Stem.
 *
 * Decision tree (all checks are from the Day Master's perspective):
 *
 *  ┌─ Same element ────────────────────────────────────────────────────────────
 *  │   Same  polarity → Tỷ Kiên   (比肩) — Peer / Rob Wealth parallel
 *  │   Diff  polarity → Kiếp Tài  (劫財) — Robbing Wealth
 *  │
 *  ├─ Day Master PRODUCES target ──────────────────────────────────────────────
 *  │   Same  polarity → Thực Thần  (食神)  — Eating God
 *  │   Diff  polarity → Thương Quan (傷官) — Hurting Officer
 *  │
 *  ├─ Day Master CONTROLS target ──────────────────────────────────────────────
 *  │   Same  polarity → Thiên Tài  (偏財) — Indirect Wealth
 *  │   Diff  polarity → Chính Tài  (正財) — Direct Wealth
 *  │
 *  ├─ Target CONTROLS Day Master ──────────────────────────────────────────────
 *  │   Same  polarity → Thất Sát   (七殺) — Seven Killings (Thiên Quan)
 *  │   Diff  polarity → Chính Quan (正官) — Direct Officer
 *  │
 *  └─ Target PRODUCES Day Master ──────────────────────────────────────────────
 *      Same  polarity → Thiên Ấn  (偏印) — Indirect Seal
 *      Diff  polarity → Chính Ấn  (正印) — Direct Seal
 *
 * @param {string} dayStem    Heavenly Stem of the Day Master (e.g. 'Giáp')
 * @param {string} targetStem Any Heavenly Stem to evaluate (e.g. 'Canh')
 * @returns {{ name: string, code: string, description: string }}
 */
function getThapThan(dayStem, targetStem) {
  const master = STEMS[dayStem];
  const target = STEMS[targetStem];

  if (!master) throw new Error(`[getThapThan] Thiên Can không hợp lệ: "${dayStem}"`);
  if (!target) throw new Error(`[getThapThan] Thiên Can không hợp lệ: "${targetStem}"`);

  const mEl = master.element;
  const tEl = target.element;
  const samePolarity = (master.yinYang === target.yinYang);

  // ── 1. Same element ────────────────────────────────────────────────────────
  if (mEl === tEl) {
    return samePolarity
      ? { name: 'Tỷ Kiên',    code: 'TK',   description: 'Cùng hành + cùng âm dương. Vai kề vai, đồng khí tương cầu.' }
      : { name: 'Kiếp Tài',   code: 'KiT',  description: 'Cùng hành + khác âm dương. Cạnh tranh, cướp tài lộc.' };
  }

  // ── 2. Day Master PRODUCES target ─────────────────────────────────────────
  if (PRODUCES[mEl] === tEl) {
    return samePolarity
      ? { name: 'Thực Thần',  code: 'ThTh', description: 'Ngã sinh + cùng âm dương. Tài năng, hưởng thụ, biểu đạt.' }
      : { name: 'Thương Quan', code: 'TgQ', description: 'Ngã sinh + khác âm dương. Thông minh, phá cách, bất quy.' };
  }

  // ── 3. Day Master CONTROLS target ─────────────────────────────────────────
  if (CONTROLS[mEl] === tEl) {
    return samePolarity
      ? { name: 'Thiên Tài',  code: 'ThTa', description: 'Ngã khắc + cùng âm dương. Tiền bạc lưu động, phụ thân.' }
      : { name: 'Chính Tài',  code: 'ChTa', description: 'Ngã khắc + khác âm dương. Chính tài, thê tinh, thực thực.' };
  }

  // ── 4. Target CONTROLS Day Master ─────────────────────────────────────────
  if (CONTROLS[tEl] === mEl) {
    return samePolarity
      ? { name: 'Thất Sát',   code: 'ThS',  description: 'Bị khắc + cùng âm dương. Thiên Quan, áp lực, phá hoại.' }
      : { name: 'Chính Quan', code: 'ChQ',  description: 'Bị khắc + khác âm dương. Quan lộc, kỷ luật, quyền lực.' };
  }

  // ── 5. Target PRODUCES Day Master ─────────────────────────────────────────
  if (PRODUCES[tEl] === mEl) {
    return samePolarity
      ? { name: 'Thiên Ấn',  code: 'ThA',  description: 'Được sinh + cùng âm dương. Thiên Ấn, trực giác, học thuật.' }
      : { name: 'Chính Ấn',  code: 'ChA',  description: 'Được sinh + khác âm dương. Ấn Thụ, văn bằng, bảo hộ.' };
  }

  // Should never be reached with valid 5-element inputs
  throw new Error(`[getThapThan] Tổ hợp ngũ hành không hợp lệ: ${mEl} / ${tEl}`);
}

// ============================================================================
//  SECTION 3 — KHÔNG VONG CALCULATOR (空亡 Void/Empty Engine)
// ============================================================================

/**
 * mapBranchToPalace(branch)
 * ─────────────────────────────────────────────────────────────────────────────
 * Maps any of the 12 Earthly Branches to its QMDJ 8-palace number.
 *
 * Used standalone to resolve which palace a Không Vong branch falls into,
 * allowing the practitioner to identify the "emptied" sector on the chart.
 *
 * @param {string} branch Earthly Branch name (e.g. 'Tuất')
 * @returns {{ branch: string, palace: number, palaceName: string }}
 */
function mapBranchToPalace(branch) {
  const b = BRANCHES[branch];
  if (!b) throw new Error(`[mapBranchToPalace] Địa Chi không hợp lệ: "${branch}"`);
  return {
    branch,
    palace:     b.palace,
    palaceName: PALACE_NAMES[b.palace],
  };
}

/**
 * getKhongVong(stem, branch)
 * ─────────────────────────────────────────────────────────────────────────────
 * Calculates the Không Vong (空亡 / Void-Empty) branches for any given
 * Stem-Branch pillar (typically the Day or Hour pillar in BaZi / QMDJ).
 *
 * THEORY:
 *   The 60 Jia-Zi cycle is divided into 6 "Xun" (Tuần Giáp), each spanning
 *   exactly 10 pillars. A Xun always starts on a Giáp (甲) stem. Because
 *   there are 12 branches but only 10 stems per Xun, 2 branches have no
 *   paired stem and are therefore "empty" — the Không Vong.
 *
 * ALGORITHM:
 *   1. Find the index of the Giáp-stem branch that opens THIS Xun:
 *        xunStartIdx = (branchIndex − stemIndex + 12) % 12
 *   2. The 10 stems of the Xun pair with branches at xunStartIdx … +9.
 *      The two leftover positions are +10 and +11 (mod 12):
 *        void₁ = (xunStartIdx + 10) % 12
 *        void₂ = (xunStartIdx + 11) % 12
 *
 * VERIFICATION (all 6 Xuns):
 *   Giáp Tý  Xun → void: Tuất(10), Hợi(11)  ✓ matches classic texts
 *   Giáp Tuất Xun → void: Thân(8),  Dậu(9)   ✓
 *   Giáp Thân Xun → void: Ngọ(6),  Mùi(7)   ✓
 *   Giáp Ngọ  Xun → void: Thìn(4), Tị(5)    ✓
 *   Giáp Thìn Xun → void: Dần(2),  Mão(3)   ✓
 *   Giáp Dần  Xun → void: Tý(0),   Sửu(1)   ✓
 *
 * @param {string} stem   Heavenly Stem of the pillar (e.g. 'Giáp')
 * @param {string} branch Earthly Branch of the pillar (e.g. 'Tý')
 * @returns {{
 *   inputPillar:  string,
 *   xunName:      string,
 *   voidBranches: string[],
 *   palaces:      Array<{ branch: string, palace: number, palaceName: string }>
 * }}
 */
function getKhongVong(stem, branch) {
  if (!STEMS[stem])    throw new Error(`[getKhongVong] Thiên Can không hợp lệ: "${stem}"`);
  if (!BRANCHES[branch]) throw new Error(`[getKhongVong] Địa Chi không hợp lệ: "${branch}"`);

  const stemIdx   = STEMS[stem].index;
  const branchIdx = BRANCHES[branch].index;

  // ── Step 1: Locate the start branch of this Xun ───────────────────────────
  const xunStartIdx    = (branchIdx - stemIdx + 12) % 12;
  const xunStartBranch = BRANCHES_BY_INDEX[xunStartIdx];

  // ── Step 2: The two un-paired (void) branches ─────────────────────────────
  const voidIdx1 = (xunStartIdx + 10) % 12;
  const voidIdx2 = (xunStartIdx + 11) % 12;
  const void1    = BRANCHES_BY_INDEX[voidIdx1];
  const void2    = BRANCHES_BY_INDEX[voidIdx2];

  return {
    inputPillar:  `${stem} ${branch}`,
    xunName:      `Tuần Giáp ${xunStartBranch}`,
    voidBranches: [void1, void2],
    palaces:      [mapBranchToPalace(void1), mapBranchToPalace(void2)],
  };
}

// ============================================================================
//  SECTION 4 — DỊCH MÃ CALCULATOR (驛馬 Traveling Horse Engine)
// ============================================================================

/**
 * DICH_MA_TABLE
 * ─────────────────────────────────────────────────────────────────────────────
 * Each of the 12 branches belongs to one of four Tam Hợp (三合) water/wood/
 * fire/metal frames. The "Horse Star" (驛馬) is fixed for each frame:
 *
 *  Frame          Branches            Horse   Palace
 *  ─────────────────────────────────────────────────
 *  Thân-Tý-Thìn   (Water 申子辰)      Dần     8 · Cấn (NE)
 *  Hợi-Mão-Mùi    (Wood  亥卯未)      Tị      4 · Tốn (SE)
 *  Dần-Ngọ-Tuất   (Fire  寅午戌)      Thân    2 · Khôn (SW)
 *  Tị-Dậu-Sửu     (Metal 巳酉丑)      Hợi     6 · Càn (NW)
 *
 * Mnemonic: The Horse always lands on the branch that is "opposite" the
 * frame's lead branch in the Six-Clash (Lục Xung) relationship.
 */
const DICH_MA_TABLE = {
  // ── Tam Hợp Thủy: Thân-Tý-Thìn ──────────────────────────────────────────
  'Thân': { horse: 'Dần', palace: 8, palaceName: PALACE_NAMES[8], frame: 'Thân-Tý-Thìn (Thủy Cục)' },
  'Tý':   { horse: 'Dần', palace: 8, palaceName: PALACE_NAMES[8], frame: 'Thân-Tý-Thìn (Thủy Cục)' },
  'Thìn': { horse: 'Dần', palace: 8, palaceName: PALACE_NAMES[8], frame: 'Thân-Tý-Thìn (Thủy Cục)' },

  // ── Tam Hợp Mộc: Hợi-Mão-Mùi ────────────────────────────────────────────
  'Hợi':  { horse: 'Tị',  palace: 4, palaceName: PALACE_NAMES[4], frame: 'Hợi-Mão-Mùi (Mộc Cục)'  },
  'Mão':  { horse: 'Tị',  palace: 4, palaceName: PALACE_NAMES[4], frame: 'Hợi-Mão-Mùi (Mộc Cục)'  },
  'Mùi':  { horse: 'Tị',  palace: 4, palaceName: PALACE_NAMES[4], frame: 'Hợi-Mão-Mùi (Mộc Cục)'  },

  // ── Tam Hợp Hỏa: Dần-Ngọ-Tuất ───────────────────────────────────────────
  'Dần':  { horse: 'Thân', palace: 2, palaceName: PALACE_NAMES[2], frame: 'Dần-Ngọ-Tuất (Hỏa Cục)' },
  'Ngọ':  { horse: 'Thân', palace: 2, palaceName: PALACE_NAMES[2], frame: 'Dần-Ngọ-Tuất (Hỏa Cục)' },
  'Tuất': { horse: 'Thân', palace: 2, palaceName: PALACE_NAMES[2], frame: 'Dần-Ngọ-Tuất (Hỏa Cục)' },

  // ── Tam Hợp Kim: Tị-Dậu-Sửu ─────────────────────────────────────────────
  'Tị':   { horse: 'Hợi', palace: 6, palaceName: PALACE_NAMES[6], frame: 'Tị-Dậu-Sửu (Kim Cục)'   },
  'Dậu':  { horse: 'Hợi', palace: 6, palaceName: PALACE_NAMES[6], frame: 'Tị-Dậu-Sửu (Kim Cục)'   },
  'Sửu':  { horse: 'Hợi', palace: 6, palaceName: PALACE_NAMES[6], frame: 'Tị-Dậu-Sửu (Kim Cục)'   },
};

/**
 * getDichMa(branch)
 * ─────────────────────────────────────────────────────────────────────────────
 * Returns the Traveling Horse Star (Dịch Mã) for a given Day or Hour branch.
 *
 * The Dịch Mã star governs mobility, migration, career transitions, long-
 * distance travel, and the pace of change in a person's life or a QMDJ chart
 * sector. When it falls on an activated palace, movement and speed intensify.
 *
 * @param {string} branch Earthly Branch of the Day or Hour pillar (e.g. 'Tý')
 * @returns {{
 *   inputBranch: string,
 *   horseBranch: string,
 *   palace:      number,
 *   palaceName:  string,
 *   frame:       string
 * }}
 */
function getDichMa(branch) {
  const result = DICH_MA_TABLE[branch];
  if (!result) throw new Error(`[getDichMa] Địa Chi không hợp lệ: "${branch}". Dùng tên Việt của 12 chi.`);

  return {
    inputBranch: branch,
    horseBranch: result.horse,
    palace:      result.palace,
    palaceName:  result.palaceName,
    frame:       result.frame,
  };
}

function safeCoreCalculation(run, fallback) {
  try {
    return run();
  } catch (error) {
    return {
      ok: false,
      error: error?.message || 'Core engine error',
      message: 'Hệ thống đang quá tải năng lượng hoặc mất kết nối. Xin vui lòng thử lại sau giây lát.',
      ...(typeof fallback === 'function' ? fallback(error) : {}),
    };
  }
}

// ============================================================================
//  SECTION 5 — DEMO / SELF-TEST  (remove or guard behind a flag in production)
// ============================================================================

/**
 * runDemo()
 * Runs a quick sanity-check across all three engines and logs results.
 * Call manually: QMDJCoreEngine.runDemo()
 */
function runDemo() {
  const hr = '─'.repeat(60);

  // ── Thập Thần demos ─────────────────────────────────────────────────────
  console.log(hr);
  console.log('  THẬP THẦN (Ten Gods) — Day Master: Giáp (Dương Mộc)');
  console.log(hr);

  const dayMaster = 'Giáp';
  STEMS_BY_INDEX.forEach((s) => {
    if (s === dayMaster) return;
    const tt = getThapThan(dayMaster, s);
    console.log(`  ${dayMaster} vs ${s.padEnd(5)} → [${tt.code.padEnd(5)}] ${tt.name} — ${tt.description}`);
  });

  // ── Không Vong demos ──────────────────────────────────────────────────
  console.log('\n' + hr);
  console.log('  KHÔNG VONG (Void Branches) — All 6 Tuần Giáp');
  console.log(hr);

  const xunSamples = [
    ['Giáp', 'Tý'],   // Tuần Giáp Tý   → Tuất, Hợi
    ['Mậu',  'Dần'],  // Tuần Giáp Tuất → Thân, Dậu  (Mậu is stem 4, Dần is 2 → start = (2-4+12)%12=10=Tuất)
    ['Giáp', 'Thân'], // Tuần Giáp Thân → Ngọ, Mùi
    ['Giáp', 'Ngọ'],  // Tuần Giáp Ngọ  → Thìn, Tị
    ['Giáp', 'Thìn'], // Tuần Giáp Thìn → Dần, Mão
    ['Giáp', 'Dần'],  // Tuần Giáp Dần  → Tý, Sửu
  ];

  xunSamples.forEach(([st, br]) => {
    const kv = getKhongVong(st, br);
    const palStr = kv.palaces.map((p) => `${p.branch}→${p.palaceName}`).join(' | ');
    console.log(`  Trụ ${kv.inputPillar.padEnd(8)} | ${kv.xunName.padEnd(18)} | Không Vong: ${kv.voidBranches.join(', ').padEnd(10)} | ${palStr}`);
  });

  // ── Dịch Mã demos ─────────────────────────────────────────────────────
  console.log('\n' + hr);
  console.log('  DỊCH MÃ (Traveling Horse) — All 12 Branches');
  console.log(hr);

  BRANCHES_BY_INDEX.forEach((br) => {
    const dm = getDichMa(br);
    console.log(`  Chi ${dm.inputBranch.padEnd(6)} | Dịch Mã: ${dm.horseBranch.padEnd(6)} | ${dm.palaceName.padEnd(28)} | ${dm.frame}`);
  });

  console.log('\n' + hr);
  console.log('  Demo complete. All engines operational.');
  console.log(hr);
}

// ============================================================================
//  SECTION 6 — PUBLIC API
// ============================================================================

const QMDJCoreEngine = {
  // ── Core calculators ────────────────────────────────────────────────────
  getThapThan,
  getKhongVong,
  getDichMa,
  safeGetThapThan(dayStem, targetStem) {
    return safeCoreCalculation(
      () => ({ ok: true, value: getThapThan(dayStem, targetStem) }),
      () => ({ value: null, input: { dayStem, targetStem } })
    );
  },
  safeGetKhongVong(stem, branch) {
    return safeCoreCalculation(
      () => ({ ok: true, value: getKhongVong(stem, branch) }),
      () => ({ value: null, input: { stem, branch } })
    );
  },
  safeGetDichMa(branch) {
    return safeCoreCalculation(
      () => ({ ok: true, value: getDichMa(branch) }),
      () => ({ value: null, input: { branch } })
    );
  },

  // ── Utility helpers ─────────────────────────────────────────────────────
  mapBranchToPalace,
  runDemo,

  // ── Lookup tables (exported for UI rendering / dropdowns) ───────────────
  STEMS,
  BRANCHES,
  STEMS_BY_INDEX,
  BRANCHES_BY_INDEX,
  PALACE_NAMES,
  PRODUCES,
  CONTROLS,
};

// ── Module-system compatibility ────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  // CommonJS (Node.js)
  module.exports = QMDJCoreEngine;
} else if (typeof define === 'function' && define.amd) {
  // AMD (RequireJS)
  define([], () => QMDJCoreEngine);
}

// Always attach to globalThis so the browser console can access it directly
if (typeof globalThis !== 'undefined') {
  globalThis.QMDJCoreEngine = QMDJCoreEngine;
}
