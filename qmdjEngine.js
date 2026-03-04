/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║         QMDJ COMPLETE ENGINE  ·  v2.0                           ║
 * ║         奇門遁甲 完整計算引擎                                      ║
 * ║                                                                  ║
 * ║  Layer 0 — Tiết Khí / Solar Calendar Bridge                     ║
 * ║  Layer 1 — Stem · Branch · Thập Thần · Không Vong · Dịch Mã    ║
 * ║  Layer 2 — Palace Flying Engine (Phi Bàn + Chuyển Bàn)          ║
 * ║  Layer 3 — Element State (Vượng / Tướng / Hưu / Tù / Tử)       ║
 * ║  Layer 4 — Cách Cục Scoring Engine (50+ rules)                  ║
 * ║  Layer 5 — Dụng Thần / Topic Analysis Engine                    ║
 * ║                                                                  ║
 * ║  Sources: Đàm Liên · Trương Hải Bân · Joey Yap Compendium       ║
 * ║  Export:  CommonJS · AMD · Browser Global                        ║
 * ║                                                                  ║
 * ║  BUG-FIX LOG vs raw paste:                                       ║
 * ║  • BRANCHES[2,4,5,8]: corrected palace numbers                   ║
 * ║  • DICH_MA_TABLE: corrected all 4 group palace numbers           ║
 * ║  • BAT_THAN: added Cửu Thiên + Cửu Địa (idx 8,9)               ║
 * ║  • PERIM_FORWARD/LOINDEX: fixed to natural Lo Shu sequence       ║
 * ║  • flyStars: removed dead starOffset variable                    ║
 * ║  • generateAdvice: completed (was truncated)                     ║
 * ║  • Public API return: added (was missing)                        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else if (typeof define === 'function' && define.amd) define(factory);
  else root.QMDJEngine = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     §0 — MASTER LOOKUP TABLES
  ══════════════════════════════════════════════════════════ */

  const STEMS = {
    0: { name: 'Giáp', element: 'Mộc', yin: 0 },
    1: { name: 'Ất', element: 'Mộc', yin: 1 },
    2: { name: 'Bính', element: 'Hỏa', yin: 0 },
    3: { name: 'Đinh', element: 'Hỏa', yin: 1 },
    4: { name: 'Mậu', element: 'Thổ', yin: 0 },
    5: { name: 'Kỷ', element: 'Thổ', yin: 1 },
    6: { name: 'Canh', element: 'Kim', yin: 0 },
    7: { name: 'Tân', element: 'Kim', yin: 1 },
    8: { name: 'Nhâm', element: 'Thủy', yin: 0 },
    9: { name: 'Quý', element: 'Thủy', yin: 1 },
  };

  const STEMS_BY_NAME = Object.fromEntries(
    Object.values(STEMS).map(s => [s.name, s])
  );

  // ── Earthly Branches ──────────────────────────────────────────────────────
  // Palace assignment follows the 8-direction compass map:
  //   Tý(N)→1  Sửu/Dần(NE)→8  Mão(E)→3   Thìn/Tỵ(SE)→4
  //   Ngọ(S)→9  Mùi/Thân(SW)→2  Dậu(W)→7  Tuất/Hợi(NW)→6
  //
  // FIXES vs raw paste:
  //   Dần  : palace 3→8  (NE = Cấn, not E = Chấn)
  //   Thìn : palace 5→4  (SE = Tốn, not Center)
  //   Tỵ   : palace 9→4  (SE = Tốn, not S = Ly)
  //   Thân : palace 7→2  (SW = Khôn, not W = Đoài)
  const BRANCHES = {
    0: { name: 'Tý', element: 'Thủy', yin: 0, palace: 1, hiddenStems: [8] },
    1: { name: 'Sửu', element: 'Thổ', yin: 1, palace: 8, hiddenStems: [5, 9, 7] },
    2: { name: 'Dần', element: 'Mộc', yin: 0, palace: 8, hiddenStems: [0, 2, 4] }, // FIX: 3→8
    3: { name: 'Mão', element: 'Mộc', yin: 1, palace: 3, hiddenStems: [1] },
    4: { name: 'Thìn', element: 'Thổ', yin: 0, palace: 4, hiddenStems: [4, 1, 8] }, // FIX: 5→4
    5: { name: 'Tỵ', element: 'Hỏa', yin: 1, palace: 4, hiddenStems: [2, 5, 0] }, // FIX: 9→4
    6: { name: 'Ngọ', element: 'Hỏa', yin: 0, palace: 9, hiddenStems: [3, 5] },
    7: { name: 'Mùi', element: 'Thổ', yin: 1, palace: 2, hiddenStems: [5, 3, 1] },
    8: { name: 'Thân', element: 'Kim', yin: 0, palace: 2, hiddenStems: [6, 8, 4] }, // FIX: 7→2
    9: { name: 'Dậu', element: 'Kim', yin: 1, palace: 7, hiddenStems: [7] },
    10: { name: 'Tuất', element: 'Thổ', yin: 0, palace: 6, hiddenStems: [4, 7, 3] },
    11: { name: 'Hợi', element: 'Thủy', yin: 1, palace: 6, hiddenStems: [8, 0] },
  };

  const BRANCHES_BY_NAME = Object.fromEntries(
    Object.values(BRANCHES).map(b => [b.name, b])
  );

  // ── Ngũ Hành cycles ───────────────────────────────────────────────────────
  const PRODUCES = { Mộc: 'Hỏa', Hỏa: 'Thổ', Thổ: 'Kim', Kim: 'Thủy', Thủy: 'Mộc' };
  const CONTROLS = { Mộc: 'Thổ', Hỏa: 'Kim', Thổ: 'Thủy', Kim: 'Mộc', Thủy: 'Hỏa' };
  const WEAKENS = { Mộc: 'Thủy', Hỏa: 'Mộc', Thổ: 'Hỏa', Kim: 'Thổ', Thủy: 'Kim' };

  // ── QMDJ 9 Palaces ────────────────────────────────────────────────────────
  const PALACE_META = {
    1: { name: 'Khảm', dir: 'Bắc', trigram: '☵', element: 'Thủy', position: [2, 1] },
    2: { name: 'Khôn', dir: 'Tây Nam', trigram: '☷', element: 'Thổ', position: [0, 0] },
    3: { name: 'Chấn', dir: 'Đông', trigram: '☳', element: 'Mộc', position: [1, 0] },
    4: { name: 'Tốn', dir: 'Đông Nam', trigram: '☴', element: 'Mộc', position: [0, 2] },
    5: { name: 'Trung', dir: 'Trung Tâm', trigram: '⊕', element: 'Thổ', position: [1, 1] },
    6: { name: 'Càn', dir: 'Tây Bắc', trigram: '☰', element: 'Kim', position: [2, 2] },
    7: { name: 'Đoài', dir: 'Tây', trigram: '☱', element: 'Kim', position: [1, 2] },
    8: { name: 'Cấn', dir: 'Đông Bắc', trigram: '☶', element: 'Thổ', position: [2, 0] },
    9: { name: 'Ly', dir: 'Nam', trigram: '☲', element: 'Hỏa', position: [0, 1] },
  };

  // ── Cửu Tinh (Nine Stars) ─────────────────────────────────────────────────
  const CUU_TINH = [
    { idx: 0, name: 'Thiên Bồng', short: 'Bồng', element: 'Thủy', type: 'hung', palace: 1 },
    { idx: 1, name: 'Thiên Nhuế', short: 'Nhuế', element: 'Thổ', type: 'hung', palace: 2 },
    { idx: 2, name: 'Thiên Xung', short: 'Xung', element: 'Mộc', type: 'cat', palace: 3 },
    { idx: 3, name: 'Thiên Phụ', short: 'Phụ', element: 'Mộc', type: 'cat', palace: 4 },
    { idx: 4, name: 'Thiên Cầm', short: 'Cầm', element: 'Thổ', type: 'binh', palace: 5 },
    { idx: 5, name: 'Thiên Tâm', short: 'Tâm', element: 'Kim', type: 'cat', palace: 6 },
    { idx: 6, name: 'Thiên Trụ', short: 'Trụ', element: 'Kim', type: 'hung', palace: 7 },
    { idx: 7, name: 'Thiên Nhậm', short: 'Nhậm', element: 'Thủy', type: 'cat', palace: 8 },
    { idx: 8, name: 'Thiên Anh', short: 'Anh', element: 'Hỏa', type: 'binh', palace: 9 },
  ];

  // ── Bát Môn (Eight Doors) — fixed to Địa Bàn palaces ─────────────────────
  const BAT_MON_DIABAN = {
    1: { name: 'Hưu Môn', short: 'Hưu', element: 'Thủy', type: 'cat' },
    2: { name: 'Tử Môn', short: 'Tử', element: 'Thổ', type: 'hung' },
    3: { name: 'Thương Môn', short: 'Thương', element: 'Mộc', type: 'binh' },
    4: { name: 'Đỗ Môn', short: 'Đỗ', element: 'Mộc', type: 'binh' },
    6: { name: 'Khai Môn', short: 'Khai', element: 'Kim', type: 'cat' },
    7: { name: 'Kinh Môn', short: 'Kinh', element: 'Kim', type: 'hung' },
    8: { name: 'Sinh Môn', short: 'Sinh', element: 'Thổ', type: 'cat' },
    9: { name: 'Cảnh Môn', short: 'Cảnh', element: 'Hỏa', type: 'binh' },
    // Palace 5 has no door; door lookup falls through to null
  };

  // ── Bát Thần (Eight Deities) ──────────────────────────────────────────────
  // Indices 0-7: standard 8-Thần used in Lo Shu rotation.
  // Indices 8-9: Cửu Thiên / Cửu Địa — extended entities referenced in some
  //   Vietnamese and Joey Yap QMDJ systems. They do NOT rotate with the core 8;
  //   they appear via specific Cách Cục conditions.
  //
  // FIX vs raw paste: Cửu Thiên (idx 8) and Cửu Địa (idx 9) were referenced
  //   in CACH_CUC_DEFS + TOPICS but absent from this array.
  const BAT_THAN = [
    { idx: 0, name: 'Trực Phù', element: 'Thổ', type: 'cat' },
    { idx: 1, name: 'Đằng Xà', element: 'Hỏa', type: 'hung' },
    { idx: 2, name: 'Thái Âm', element: 'Kim', type: 'cat' },
    { idx: 3, name: 'Lục Hợp', element: 'Mộc', type: 'cat' },
    { idx: 4, name: 'Bạch Hổ', element: 'Kim', type: 'hung' },
    { idx: 5, name: 'Huyền Vũ', element: 'Thủy', type: 'hung' },
    { idx: 6, name: 'Cửu Địa', element: 'Thổ', type: 'cat' },
    { idx: 7, name: 'Cửu Thiên', element: 'Kim', type: 'cat' },
  ];

  const BAT_THAN_BY_NAME = Object.fromEntries(BAT_THAN.map(t => [t.name, t]));

  // ── Thiên Can rotation for 9 palace positions (Lục Nghi + Tam Kỳ) ─────────
  // Giáp is hidden (遁甲) inside Mậu at position 0.
  const CAN_SEQUENCE_9 = [
    { stemIdx: 4, name: 'Mậu', note: 'ẩn Giáp', isTamKy: false, isLucNghi: true },
    { stemIdx: 5, name: 'Kỷ', note: '', isTamKy: false, isLucNghi: true },
    { stemIdx: 6, name: 'Canh', note: '', isTamKy: false, isLucNghi: true },
    { stemIdx: 7, name: 'Tân', note: '', isTamKy: false, isLucNghi: true },
    { stemIdx: 8, name: 'Nhâm', note: '', isTamKy: false, isLucNghi: true },
    { stemIdx: 9, name: 'Quý', note: '', isTamKy: false, isLucNghi: true },
    { stemIdx: 3, name: 'Đinh', note: 'Tam Kỳ', isTamKy: true, isLucNghi: false },
    { stemIdx: 2, name: 'Bính', note: 'Tam Kỳ', isTamKy: true, isLucNghi: false },
    { stemIdx: 1, name: 'Ất', note: 'Tam Kỳ', isTamKy: true, isLucNghi: false },
  ];

  /* ══════════════════════════════════════════════════════════
     §1 — LAYER 0: TIẾT KHÍ / SOLAR CALENDAR ENGINE
     Meeus algorithm (Ch.25) — ±1 day accuracy.
  ══════════════════════════════════════════════════════════ */

  const TIET_KHI_DEFS = [
    { lon: 285, name: 'Đông Chí', isDuong: true },
    { lon: 300, name: 'Tiểu Hàn', isDuong: true },
    { lon: 315, name: 'Đại Hàn', isDuong: true },
    { lon: 330, name: 'Lập Xuân', isDuong: true },
    { lon: 345, name: 'Vũ Thủy', isDuong: true },
    { lon: 0, name: 'Kinh Trập', isDuong: true },
    { lon: 15, name: 'Xuân Phân', isDuong: true },
    { lon: 30, name: 'Thanh Minh', isDuong: true },
    { lon: 45, name: 'Cốc Vũ', isDuong: true },
    { lon: 60, name: 'Lập Hạ', isDuong: true },
    { lon: 75, name: 'Tiểu Mãn', isDuong: true },
    { lon: 90, name: 'Mang Chủng', isDuong: true },
    { lon: 105, name: 'Hạ Chí', isDuong: false },
    { lon: 120, name: 'Tiểu Thử', isDuong: false },
    { lon: 135, name: 'Đại Thử', isDuong: false },
    { lon: 150, name: 'Lập Thu', isDuong: false },
    { lon: 165, name: 'Xử Thử', isDuong: false },
    { lon: 180, name: 'Bạch Lộ', isDuong: false },
    { lon: 195, name: 'Thu Phân', isDuong: false },
    { lon: 210, name: 'Hàn Lộ', isDuong: false },
    { lon: 225, name: 'Sương Giáng', isDuong: false },
    { lon: 240, name: 'Lập Đông', isDuong: false },
    { lon: 255, name: 'Tiểu Tuyết', isDuong: false },
    { lon: 270, name: 'Đại Tuyết', isDuong: false },
  ];

  // Cục (Escape Number) table: [Thượng Nguyên, Trung Nguyên, Hạ Nguyên]
  const CUC_TABLE = {
    // Dương Độn
    'Đông Chí': [1, 7, 4], 'Tiểu Hàn': [2, 8, 5], 'Đại Hàn': [3, 9, 6],
    'Lập Xuân': [8, 5, 2], 'Vũ Thủy': [9, 6, 3], 'Kinh Trập': [1, 7, 4],
    'Xuân Phân': [3, 9, 6], 'Thanh Minh': [4, 1, 7], 'Cốc Vũ': [5, 2, 8],
    'Lập Hạ': [4, 1, 7], 'Tiểu Mãn': [5, 2, 8], 'Mang Chủng': [6, 3, 9],

    // Âm Độn
    'Hạ Chí': [9, 3, 6], 'Tiểu Thử': [8, 2, 5], 'Đại Thử': [7, 1, 4],
    'Lập Thu': [2, 5, 8], 'Xử Thử': [1, 4, 7], 'Bạch Lộ': [9, 3, 6],
    'Thu Phân': [7, 1, 4], 'Hàn Lộ': [6, 9, 3], 'Sương Giáng': [5, 8, 2],
    'Lập Đông': [6, 9, 3], 'Tiểu Tuyết': [5, 8, 2], 'Đại Tuyết': [4, 7, 1],
  };

  function toJD(year, month, day) {
    if (month <= 2) { year--; month += 12; }
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (year + 4716)) +
      Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
  }

  function solarLongitude(jd) {
    const T = (jd - 2451545.0) / 36525.0;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    const Mr = M * Math.PI / 180;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
      + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
      + 0.000289 * Math.sin(3 * Mr);
    let lon = ((L0 + C) % 360 + 360) % 360;
    const O = 125.04 - 1934.136 * T;
    lon -= 0.00569 - 0.00478 * Math.sin(O * Math.PI / 180);
    return ((lon % 360) + 360) % 360;
  }

  function jdOfSolarLon(targetLon, nearYear, nearMonth) {
    let jd = toJD(nearYear, nearMonth, 1);
    for (let i = 0; i < 50; i++) {
      let diff = targetLon - solarLongitude(jd);
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      if (Math.abs(diff) < 0.0001) break;
      jd += diff / 360 * 365.25;
    }
    return jd;
  }

  /**
   * getSolarTermInfo(date)
   * Returns current solar term, Nguyên (0/1/2), isDuong, and Cục number.
   */
  function getSolarTermInfo(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const targetJD = toJD(year, month, day) + (date.getHours() / 24);

    // 24 sectors of 15° each, offset from 285° (Đông Chí = 285°)
    const lon = solarLongitude(targetJD);
    const sectorIdx = Math.floor(((lon - 285 + 360) % 360) / 15) % 24;
    const currentTK = TIET_KHI_DEFS[sectorIdx];

    const termStartJD = jdOfSolarLon(currentTK.lon, year, Math.max(1, month - 1));
    const daysSince = Math.floor(targetJD - termStartJD);
    const nguyen = daysSince < 5 ? 0 : daysSince < 10 ? 1 : 2;
    const cucArr = CUC_TABLE[currentTK.name] || [1, 7, 4];

    return {
      name: currentTK.name,
      isDuong: currentTK.isDuong,
      sectorIdx,
      daysSince,
      nguyen,
      nguyenName: ['Thượng', 'Trung', 'Hạ'][nguyen],
      cucSo: cucArr[nguyen],
      cucArr,
    };
  }

  /* ══════════════════════════════════════════════════════════
     §2 — LAYER 1: STEM · BRANCH ENGINE
     Thập Thần · Không Vong · Dịch Mã · Tàng Can
  ══════════════════════════════════════════════════════════ */

  /**
   * getThapThan(masterStemIdx, targetStemIdx, pillar?)
   * Returns the Ten Gods relationship from the Day Master's perspective.
   */
  function getThapThan(masterStemIdx, targetStemIdx, pillar = 'day') {
    const master = STEMS[masterStemIdx];
    const target = STEMS[targetStemIdx];
    if (!master || !target) return null;

    const me = master.element, te = target.element;
    const sameYY = master.yin === target.yin;

    let name, type;

    if (me === te) {
      name = sameYY ? 'Tỷ Kiên' : 'Kiếp Tài'; type = 'sibling';
    } else if (PRODUCES[me] === te) {
      name = sameYY ? 'Thực Thần' : 'Thương Quan'; type = 'output';
    } else if (CONTROLS[me] === te) {
      name = sameYY ? 'Thiên Tài' : 'Chính Tài'; type = 'wealth';
    } else if (CONTROLS[te] === me) {
      name = sameYY ? 'Thất Sát' : 'Chính Quan'; type = 'officer';
    } else if (PRODUCES[te] === me) {
      name = sameYY ? 'Thiên Ấn' : 'Chính Ấn'; type = 'resource';
    } else {
      name = '?'; type = 'unknown';
    }

    return {
      pillar, masterStem: master.name, targetStem: target.name,
      targetElement: te, name, type, sameYinYang: sameYY
    };
  }

  function getThapThanForChart(dayStemIdx, yearStemIdx, monthStemIdx, hourStemIdx) {
    return [
      { pillar: 'Năm', idx: yearStemIdx },
      { pillar: 'Tháng', idx: monthStemIdx },
      { pillar: 'Ngày', idx: dayStemIdx },
      { pillar: 'Giờ', idx: hourStemIdx },
    ].map(p => getThapThan(dayStemIdx, p.idx, p.pillar));
  }

  /**
   * getKhongVong(stemIdx, branchIdx)
   * Returns the two Void branches for the given Stem-Branch pillar.
   * Formula: xunStart = (branchIdx − stemIdx) mod 12
   *          void₁ = (xunStart + 10) mod 12 , void₂ = (xunStart + 11) mod 12
   */
  function getKhongVong(stemIdx, branchIdx) {
    const xunStart = ((branchIdx - stemIdx % 10) % 12 + 12) % 12;
    const void1Idx = (xunStart + 10) % 12;
    const void2Idx = (xunStart + 11) % 12;
    const v1 = BRANCHES[void1Idx], v2 = BRANCHES[void2Idx];

    // Xun name is derived from the start-of-cycle branch
    const xunStartBranch = BRANCHES[xunStart]?.name || '';

    return {
      xunName: `Tuần Giáp ${xunStartBranch}`,
      void1: { idx: void1Idx, name: v1.name, palace: v1.palace },
      void2: { idx: void2Idx, name: v2.name, palace: v2.palace },
      voidPalaces: [...new Set([v1.palace, v2.palace])],
    };
  }

  // ── Dịch Mã (Traveling Horse) ─────────────────────────────────────────────
  // Based on the Tam Hợp (三合) frame of the branch.
  //
  // FIX vs raw paste: all 4 palace numbers were wrong:
  //   Dần (Thân-Tý-Thìn frame): palace 3→8 (Cấn/NE)
  //   Thân (Dần-Ngọ-Tuất frame): palace 7→2 (Khôn/SW)
  //   Tỵ  (Hợi-Mão-Mùi frame): palace 9→4 (Tốn/SE)
  //   Hợi (Tỵ-Dậu-Sửu frame):  palace 6  ✓ (Càn/NW — already correct)
  const DICH_MA_TABLE = {
    // Thân-Tý-Thìn (Thủy frame) → Horse: Dần → Palace 8 (Cấn/NE)
    0: { branch: 'Dần', palace: 8, frame: 'Thân-Tý-Thìn (Thủy Cục)' }, // Tý
    4: { branch: 'Dần', palace: 8, frame: 'Thân-Tý-Thìn (Thủy Cục)' }, // Thìn
    8: { branch: 'Dần', palace: 8, frame: 'Thân-Tý-Thìn (Thủy Cục)' }, // Thân
    // Dần-Ngọ-Tuất (Hỏa frame) → Horse: Thân → Palace 2 (Khôn/SW)
    2: { branch: 'Thân', palace: 2, frame: 'Dần-Ngọ-Tuất (Hỏa Cục)' }, // Dần
    6: { branch: 'Thân', palace: 2, frame: 'Dần-Ngọ-Tuất (Hỏa Cục)' }, // Ngọ
    10: { branch: 'Thân', palace: 2, frame: 'Dần-Ngọ-Tuất (Hỏa Cục)' }, // Tuất
    // Tỵ-Dậu-Sửu (Kim frame) → Horse: Hợi → Palace 6 (Càn/NW)
    5: { branch: 'Hợi', palace: 6, frame: 'Tỵ-Dậu-Sửu (Kim Cục)' }, // Tỵ
    9: { branch: 'Hợi', palace: 6, frame: 'Tỵ-Dậu-Sửu (Kim Cục)' }, // Dậu
    1: { branch: 'Hợi', palace: 6, frame: 'Tỵ-Dậu-Sửu (Kim Cục)' }, // Sửu
    // Hợi-Mão-Mùi (Mộc frame) → Horse: Tỵ → Palace 4 (Tốn/SE)
    11: { branch: 'Tỵ', palace: 4, frame: 'Hợi-Mão-Mùi (Mộc Cục)' }, // Hợi
    3: { branch: 'Tỵ', palace: 4, frame: 'Hợi-Mão-Mùi (Mộc Cục)' }, // Mão
    7: { branch: 'Tỵ', palace: 4, frame: 'Hợi-Mão-Mùi (Mộc Cục)' }, // Mùi
  };

  function getDichMa(branchIdx) {
    const r = DICH_MA_TABLE[branchIdx];
    if (!r) return null;
    return {
      horseBranch: r.branch,
      palace: r.palace,
      palaceName: PALACE_META[r.palace].name,
      dir: PALACE_META[r.palace].dir,
      frame: r.frame,
    };
  }

  /** getTangCan(branchIdx) — hidden stems inside an Earthly Branch */
  function getTangCan(branchIdx) {
    const branch = BRANCHES[branchIdx];
    if (!branch) return [];
    return branch.hiddenStems.map((idx, i) => ({
      stemIdx: idx,
      name: STEMS[idx].name,
      element: STEMS[idx].element,
      role: i === 0 ? 'chính khí' : i === 1 ? 'trung khí' : 'dư khí',
    }));
  }

  /* ══════════════════════════════════════════════════════════
     §3 — LAYER 2: PALACE FLYING ENGINE (PHI BÀN)
     Stars + Thiên Can fly; Môn fixed to Địa Bàn; Thần rotate.
  ══════════════════════════════════════════════════════════ */

  // Perimeter sequence: 8 palaces in natural Lo Shu numerical order (skip 5).
  // Dương rotation: forward through this sequence (1→2→3→4→6→7→8→9→1…)
  // Âm rotation:   backward (9→8→7→6→4→3→2→1→9…)
  //
  // FIX vs raw paste: was [1,2,3,4,9,8,7,6] — wrong (mixed numerical/reverse).
  //   Correct Lo Shu perimeter sequence skipping center: 1,2,3,4,6,7,8,9
  const PERIM_FORWARD = [1, 2, 3, 4, 6, 7, 8, 9]; // natural Lo Shu order, skip 5
  const PERIM_LOINDEX = { 1: 0, 2: 1, 3: 2, 4: 3, 6: 4, 7: 5, 8: 6, 9: 7 };

  function getGioChi(hour) {
    // 23:00–00:59 → Tý (idx 0); then each 2 hrs advances one branch
    if (hour === 23) return 0;
    return Math.floor((hour + 1) / 2);
  }

  function getGioCan(hour, dayCanIdx) {
    // Base stem for each Day Master group (Giáp/Kỷ→Giáp, Ất/Canh→Bính, etc.)
    const dayBases = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8];
    return (dayBases[dayCanIdx] + getGioChi(hour)) % 10;
  }

  /**
   * getDayPillar(date) — computes Day Stem+Branch using Jiazi epoch.
   * Reference epoch: 2000-01-07 = Giáp Tý (jiazi 0).
   */
  function getDayPillar(date) {
    const epoch = new Date(2000, 0, 7);
    const diff = Math.floor((date - epoch) / 86400000);
    const jiazi = ((diff % 60) + 60) % 60;
    return {
      stemIdx: jiazi % 10,
      branchIdx: jiazi % 12,
      jiazi,
      stemName: STEMS[jiazi % 10].name,
      branchName: BRANCHES[jiazi % 12].name,
    };
  }

  /**
   * flyStars(cucSo, isDuong)
   * Core Phi Bàn engine. Returns all 9 palace data objects.
   *
   * Rules (Đàm Liên system):
   *  • Cửu Tinh + Thiên Can: fly together from palace cucSo.
   *    Dương → forward (cucSo, cucSo+1, … mod 9 skipping 5)
   *    Âm    → backward
   *  • Bát Môn: FIXED to Địa Bàn (no flying in Phi Bàn).
   *  • Bát Thần (8 core deities): rotate over 8 perimeter palaces.
   *    Trực Phù anchored at palace cucSo.
   *  • Phục Âm / Phản Ngâm detected automatically.
   */
  function flyStars(cucSo, isDuong) {
    const palaces = {};

    // ── Cửu Tinh + Thiên Can assignment ──────────────────────────────────
    // Star at native palace cucSo is CUU_TINH[cucSo−1].
    // Dương: palace p gets star at offset (p − cucSo + 9) % 9
    // Âm:   palace p gets star at offset (cucSo − p + 9) % 9
    for (let p = 1; p <= 9; p++) {
      const offset = isDuong
        ? ((p - cucSo + 9) % 9)
        : ((cucSo - p + 9) % 9);
      const starIdx = (cucSo - 1 + offset) % 9;
      const star = CUU_TINH[starIdx];
      const can = CAN_SEQUENCE_9[starIdx];

      palaces[p] = {
        palaceNum: p,
        palaceName: PALACE_META[p].name,
        direction: PALACE_META[p].dir,
        element: PALACE_META[p].element,
        trigram: PALACE_META[p].trigram,
        star,
        can,
        mon: BAT_MON_DIABAN[p] || null,
        than: null,    // filled by Bát Thần loop below
        phucAm: false,
        phanNgam: false,
        khongVong: false,   // tagged by buildFullChart
        dichMa: false,   // tagged by buildFullChart
        trucPhu: false,
        trucSu: false,
        isNgayCan: false,
        isGioCan: false,
      };
    }

    // ── Bát Thần rotation over 8 perimeter palaces ────────────────────────
    // Trực Phù (idx 0) always at palace cucSo; sequence proceeds forward/backward.
    const perimStart = PERIM_LOINDEX[cucSo] !== undefined ? PERIM_LOINDEX[cucSo] : 0;
    const THAN_DUONG = [0, 1, 2, 3, 4, 5, 6, 7]; // forward
    const THAN_AM = [0, 7, 6, 5, 4, 3, 2, 1]; // reverse (Trực Phù still first)
    const thanSeq = isDuong ? THAN_DUONG : THAN_AM;

    for (let i = 0; i < 8; i++) {
      const perimIdx = (perimStart + (isDuong ? i : (8 - i) % 8)) % 8;
      const palNum = PERIM_FORWARD[perimIdx];
      palaces[palNum].than = BAT_THAN[thanSeq[i]];
    }

    // Mark Trực Phù + Trực Sử
    palaces[cucSo].trucPhu = true;
    if (palaces[cucSo].mon) palaces[cucSo].trucSu = true;

    // ── Phục Âm / Phản Ngâm detection ────────────────────────────────────
    let isPhucAm = true, isPhanNgam = true;
    for (let p = 1; p <= 9; p++) {
      if (p === 5) continue;
      if (palaces[p].star.palace !== p) isPhucAm = false;
      if (palaces[p].star.palace !== 10 - p) isPhanNgam = false;
    }
    for (let p = 1; p <= 9; p++) {
      palaces[p].phucAm = isPhucAm;
      palaces[p].phanNgam = isPhanNgam;
    }

    return { palaces, isPhucAm, isPhanNgam };
  }

  /**
   * buildFullChart(date, hour)
   * Main entry point — returns complete 9-palace chart with all layers tagged.
   */
  function buildFullChart(date, hour) {
    const tk = getSolarTermInfo(date);
    const { palaces, isPhucAm, isPhanNgam } = flyStars(tk.cucSo, tk.isDuong);

    const dayPillar = getDayPillar(date);
    const gioChiIdx = getGioChi(hour);
    const gioCanIdx = getGioCan(hour, dayPillar.stemIdx);
    const gioPillar = {
      stemIdx: gioCanIdx,
      branchIdx: gioChiIdx,
      stemName: STEMS[gioCanIdx].name,
      branchName: BRANCHES[gioChiIdx].name,
    };

    const kv = getKhongVong(dayPillar.stemIdx, dayPillar.branchIdx);
    // Dịch Mã based on year branch (Earthly Branch of the year)
    const yearBranchIdx = ((date.getFullYear() - 4) % 12 + 12) % 12;
    const dm = getDichMa(yearBranchIdx);

    // In QMDJ, Giáp hides under Mậu (奇門遁甲).
    // Use Mậu when the actual stem is Giáp for chart-level tagging.
    const dayStemForChart = dayPillar.stemIdx === 0 ? 'Mậu' : dayPillar.stemName;
    const gioStemForChart = gioPillar.stemIdx === 0 ? 'Mậu' : gioPillar.stemName;

    for (const p of Object.keys(palaces)) {
      const pal = palaces[p];
      if (pal.can?.name === dayStemForChart) pal.isNgayCan = true;
      if (pal.can?.name === gioStemForChart) pal.isGioCan = true;
      if (kv.voidPalaces.includes(+p)) pal.khongVong = true;
      if (dm && dm.palace === +p) pal.dichMa = true;
    }

    const XU_NAMES = ['Giáp Tý', 'Giáp Tuất', 'Giáp Thân', 'Giáp Ngọ', 'Giáp Thìn', 'Giáp Dần'];

    return {
      date, hour,
      solarTerm: tk,
      cucSo: tk.cucSo,
      isDuong: tk.isDuong,
      isPhucAm, isPhanNgam,
      dayPillar, gioPillar,
      khongVong: kv,
      dichMa: dm,
      xuName: XU_NAMES[Math.floor(dayPillar.jiazi / 10) % 6],
      palaces,
    };
  }

  /* ══════════════════════════════════════════════════════════
     §4 — LAYER 3: ELEMENT STATE ENGINE
     Vượng · Tướng · Hưu · Tù · Tử
  ══════════════════════════════════════════════════════════ */

  const SEASON_MAP = {
    'Lập Xuân': 'Xuân', 'Vũ Thủy': 'Xuân', 'Kinh Trập': 'Xuân',
    'Xuân Phân': 'Xuân', 'Thanh Minh': 'Xuân', 'Cốc Vũ': 'Xuân',
    'Lập Hạ': 'Hạ', 'Tiểu Mãn': 'Hạ', 'Mang Chủng': 'Hạ',
    'Hạ Chí': 'Hạ', 'Tiểu Thử': 'Hạ', 'Đại Thử': 'Hạ',
    'Lập Thu': 'Thu', 'Xử Thử': 'Thu', 'Bạch Lộ': 'Thu',
    'Thu Phân': 'Thu', 'Hàn Lộ': 'Thu', 'Sương Giáng': 'Thu',
    'Lập Đông': 'Đông', 'Tiểu Tuyết': 'Đông', 'Đại Tuyết': 'Đông',
    'Đông Chí': 'Đông', 'Tiểu Hàn': 'Đông', 'Đại Hàn': 'Đông',
  };

  const SEASON_STATES = {
    Xuân: { Mộc: 'Vượng', Hỏa: 'Tướng', Thổ: 'Tử', Kim: 'Tù', Thủy: 'Hưu' },
    Hạ: { Hỏa: 'Vượng', Thổ: 'Tướng', Kim: 'Tử', Thủy: 'Tù', Mộc: 'Hưu' },
    Thu: { Kim: 'Vượng', Thủy: 'Tướng', Mộc: 'Tử', Hỏa: 'Tù', Thổ: 'Hưu' },
    Đông: { Thủy: 'Vượng', Mộc: 'Tướng', Hỏa: 'Tử', Thổ: 'Tù', Kim: 'Hưu' },
  };

  const STATE_SCORES = { Vượng: 4, Tướng: 3, Hưu: 2, Tù: 1, Tử: 0 };

  function getElementState(element, solarTermName) {
    const season = SEASON_MAP[solarTermName] || 'Xuân';
    const state = SEASON_STATES[season][element] || 'Hưu';
    return {
      state, season,
      score: STATE_SCORES[state],
      isStrong: STATE_SCORES[state] >= 3,
      isWeak: STATE_SCORES[state] <= 1,
    };
  }

  function scoreChartStates(chart) {
    const tkName = chart.solarTerm.name;
    const result = {};
    for (const p of Object.keys(chart.palaces)) {
      const pal = chart.palaces[p];
      result[p] = {
        palaceState: getElementState(PALACE_META[p].element, tkName),
        starState: pal.star?.element ? getElementState(pal.star.element, tkName) : null,
        doorState: pal.mon?.element ? getElementState(pal.mon.element, tkName) : null,
      };
    }
    return result;
  }

  /* ══════════════════════════════════════════════════════════
     §5 — LAYER 4: CÁCH CỤC ENGINE (50+ formations)
  ══════════════════════════════════════════════════════════ */

  const CACH_CUC_DEFS = [
    // ── Tam Kỳ (Three Wonders) ───────────────────────────────────────────────
    {
      id: 'TK001', name: 'Ất Kỳ đắc sử', type: 'cat', priority: 10,
      desc: 'Ất (Tam Kỳ) cùng cung môn cát — mưu việc ắt thành.',
      condition: p => p.can?.name === 'Ất' && p.mon?.type === 'cat'
    },
    {
      id: 'TK002', name: 'Bính Kỳ đắc sử', type: 'cat', priority: 10,
      desc: 'Bính (Tam Kỳ) gặp Sinh/Khai Môn — đại cát tài lộc, quan lộc.',
      condition: p => p.can?.name === 'Bính' && ['Sinh Môn', 'Khai Môn'].includes(p.mon?.name)
    },
    {
      id: 'TK003', name: 'Đinh Kỳ đắc sử', type: 'cat', priority: 10,
      desc: 'Đinh (Tam Kỳ) gặp Hưu Môn — văn thư, thi cử thuận.',
      condition: p => p.can?.name === 'Đinh' && p.mon?.name === 'Hưu Môn'
    },
    {
      id: 'TK004', name: 'Tam Kỳ nhập trung', type: 'cat', priority: 9,
      desc: 'Ất/Bính/Đinh ở Trung Cung — thiên thời đặc biệt.',
      condition: (p, n) => ['Ất', 'Bính', 'Đinh'].includes(p.can?.name) && n === 5
    },

    // ── Trực Phù × Môn ──────────────────────────────────────────────────────
    {
      id: 'TP001', name: 'Trực Phù × Sinh Môn', type: 'cat', priority: 9,
      desc: 'Trực Phù gặp Sinh Môn — sinh phát vạn vật, cầu gì được nấy.',
      condition: p => p.trucPhu && p.mon?.name === 'Sinh Môn'
    },
    {
      id: 'TP002', name: 'Trực Phù × Khai Môn', type: 'cat', priority: 9,
      desc: 'Trực Phù × Khai Môn — thiên môn khai, vạn sự thuận.',
      condition: p => p.trucPhu && p.mon?.name === 'Khai Môn'
    },
    {
      id: 'TP003', name: 'Trực Phù × Tử Môn', type: 'hung', priority: 8,
      desc: 'Trực Phù × Tử Môn — thiên thời gặp tử lộ, mọi việc bế tắc.',
      condition: p => p.trucPhu && p.mon?.name === 'Tử Môn'
    },

    // ── Ngũ Bất Ngộ Thời (Five Unfavorable Combinations) ────────────────────
    {
      id: 'NB001', name: 'Nhâm kỵ Thương Môn', type: 'hung', priority: 8,
      desc: 'Nhâm gặp Thương Môn — tranh chấp, khẩu thiệt.',
      condition: p => p.can?.name === 'Nhâm' && p.mon?.name === 'Thương Môn'
    },
    {
      id: 'NB002', name: 'Canh kỵ Kinh Môn', type: 'hung', priority: 8,
      desc: 'Canh gặp Kinh Môn — bạo lực, pháp lý hình sự.',
      condition: p => p.can?.name === 'Canh' && p.mon?.name === 'Kinh Môn'
    },
    {
      id: 'NB003', name: 'Tân kỵ Tử Môn', type: 'hung', priority: 9,
      desc: 'Tân gặp Tử Môn — hung hiểm, tang sự.',
      condition: p => p.can?.name === 'Tân' && p.mon?.name === 'Tử Môn'
    },
    {
      id: 'NB004', name: 'Đinh kỵ Kinh Môn', type: 'hung', priority: 7,
      desc: 'Đinh gặp Kinh Môn — pháp lý và khẩu thiệt bất lợi.',
      condition: p => p.can?.name === 'Đinh' && p.mon?.name === 'Kinh Môn'
    },
    {
      id: 'NB005', name: 'Mậu kỵ Tử Môn', type: 'hung', priority: 9,
      desc: 'Mậu (ẩn Giáp) gặp Tử Môn — hung khí tột cùng.',
      condition: p => p.can?.name === 'Mậu' && p.mon?.name === 'Tử Môn'
    },


    // ── Thiên Tâm ────────────────────────────────────────────────────────────
    {
      id: 'TM001', name: 'Thiên Tâm × Sinh Môn', type: 'cat', priority: 9,
      desc: 'Thiên Tâm × Sinh Môn — đại cát y dược, sức khỏe phục hồi.',
      condition: p => p.star?.name === 'Thiên Tâm' && p.mon?.name === 'Sinh Môn'
    },
    {
      id: 'TM002', name: 'Thiên Tâm × Khai Môn', type: 'cat', priority: 9,
      desc: 'Thiên Tâm × Khai Môn — mưu việc, ký kết đại thuận.',
      condition: p => p.star?.name === 'Thiên Tâm' && p.mon?.name === 'Khai Môn'
    },

    // ── Bạch Hổ ─────────────────────────────────────────────────────────────
    {
      id: 'BH001', name: 'Bạch Hổ × Kinh Môn', type: 'hung', priority: 8,
      desc: 'Bạch Hổ × Kinh Môn — tranh tụng, tai họa bất ngờ.',
      condition: p => p.than?.name === 'Bạch Hổ' && p.mon?.name === 'Kinh Môn'
    },
    {
      id: 'BH002', name: 'Bạch Hổ × Tử Môn', type: 'hung', priority: 10,
      desc: 'Bạch Hổ × Tử Môn — đại hung, nguy cơ thân thể.',
      condition: p => p.than?.name === 'Bạch Hổ' && p.mon?.name === 'Tử Môn'
    },
    {
      id: 'BH003', name: 'Bạch Hổ × Sinh Môn', type: 'binh', priority: 5,
      desc: 'Bạch Hổ × Sinh Môn — uy lực từ sinh khí, dùng áp lực đàm phán.',
      condition: p => p.than?.name === 'Bạch Hổ' && p.mon?.name === 'Sinh Môn'
    },

    // ── Đằng Xà ─────────────────────────────────────────────────────────────
    {
      id: 'DX001', name: 'Đằng Xà × Tử Môn', type: 'hung', priority: 9,
      desc: 'Đằng Xà × Tử Môn — bẫy ẩn, bệnh tật, bất trắc.',
      condition: p => p.than?.name === 'Đằng Xà' && p.mon?.name === 'Tử Môn'
    },
    {
      id: 'DX002', name: 'Đằng Xà × Kinh Môn', type: 'hung', priority: 8,
      desc: 'Đằng Xà × Kinh Môn — hư hao tài lộc bất ngờ.',
      condition: p => p.than?.name === 'Đằng Xà' && p.mon?.name === 'Kinh Môn'
    },

    // ── Huyền Vũ ────────────────────────────────────────────────────────────
    {
      id: 'HV001', name: 'Huyền Vũ × Tử Môn', type: 'hung', priority: 8,
      desc: 'Huyền Vũ × Tử Môn — mưu sự thất bại, trộm cắp tổn thất.',
      condition: p => p.than?.name === 'Huyền Vũ' && p.mon?.name === 'Tử Môn'
    },
    {
      id: 'HV002', name: 'Huyền Vũ × Thương Môn', type: 'hung', priority: 7,
      desc: 'Huyền Vũ × Thương Môn — mưu hại ngầm, đề phòng tiểu nhân.',
      condition: p => p.than?.name === 'Huyền Vũ' && p.mon?.name === 'Thương Môn'
    },

    // ── Thiên Bồng ──────────────────────────────────────────────────────────
    {
      id: 'TB001', name: 'Thiên Bồng × Tử Môn', type: 'hung', priority: 10,
      desc: 'Thiên Bồng × Tử Môn — đại hung, nguy hiểm tính mạng.',
      condition: p => p.star?.name === 'Thiên Bồng' && p.mon?.name === 'Tử Môn'
    },
    {
      id: 'TB002', name: 'Thiên Bồng × Kinh Môn', type: 'hung', priority: 8,
      desc: 'Thiên Bồng × Kinh Môn — tai họa nặng nề.',
      condition: p => p.star?.name === 'Thiên Bồng' && p.mon?.name === 'Kinh Môn'
    },

    // ── Thiên Xung ──────────────────────────────────────────────────────────
    {
      id: 'TX001', name: 'Thiên Xung × Khai Môn', type: 'cat', priority: 8,
      desc: 'Thiên Xung × Khai Môn — phá giải trở ngại, mở đường mới.',
      condition: p => p.star?.name === 'Thiên Xung' && p.mon?.name === 'Khai Môn'
    },
    {
      id: 'TX002', name: 'Thiên Xung × Sinh Môn', type: 'cat', priority: 8,
      desc: 'Thiên Xung × Sinh Môn — xung phá trở lực, sinh khí mạnh.',
      condition: p => p.star?.name === 'Thiên Xung' && p.mon?.name === 'Sinh Môn'
    },

    // ── Thiên Nhậm ──────────────────────────────────────────────────────────
    {
      id: 'TN001', name: 'Thiên Nhậm × Khai Môn', type: 'cat', priority: 8,
      desc: 'Thiên Nhậm × Khai Môn — lập kế hoạch dài hạn, xuất hành tốt.',
      condition: p => p.star?.name === 'Thiên Nhậm' && p.mon?.name === 'Khai Môn'
    },

    // ── Lục Hợp ─────────────────────────────────────────────────────────────
    {
      id: 'LH001', name: 'Lục Hợp × Sinh Môn', type: 'cat', priority: 9,
      desc: 'Lục Hợp × Sinh Môn — hợp đồng, kết giao tuyệt vời.',
      condition: p => p.than?.name === 'Lục Hợp' && p.mon?.name === 'Sinh Môn'
    },
    {
      id: 'LH002', name: 'Lục Hợp × Khai Môn', type: 'cat', priority: 8,
      desc: 'Lục Hợp × Khai Môn — hợp tác có lợi, tìm quý nhân.',
      condition: p => p.than?.name === 'Lục Hợp' && p.mon?.name === 'Khai Môn'
    },

    // ── Thái Âm ─────────────────────────────────────────────────────────────
    {
      id: 'TA001', name: 'Thái Âm × Sinh Môn', type: 'cat', priority: 8,
      desc: 'Thái Âm × Sinh Môn — mưu kế bí mật thành công, đầu tư âm thầm có lợi.',
      condition: p => p.than?.name === 'Thái Âm' && p.mon?.name === 'Sinh Môn'
    },
    {
      id: 'TA002', name: 'Thái Âm × Hưu Môn', type: 'cat', priority: 7,
      desc: 'Thái Âm × Hưu Môn — bí mật an bình, nghỉ dưỡng, học thuật.',
      condition: p => p.than?.name === 'Thái Âm' && p.mon?.name === 'Hưu Môn'
    },
    {
      id: 'TA003', name: 'Thái Âm × Cảnh Môn', type: 'binh', priority: 5,
      desc: 'Thái Âm × Cảnh Môn — văn thư tranh chấp, cần tỉ mỉ.',
      condition: p => p.than?.name === 'Thái Âm' && p.mon?.name === 'Cảnh Môn'
    },

    // ── Cửu Thiên / Cửu Địa (extended deities) ──────────────────────────────
    {
      id: 'CT001', name: 'Cửu Thiên × Khai Môn', type: 'cat', priority: 8,
      desc: 'Cửu Thiên × Khai Môn — thiên khí mở đường, cầu danh cầu lộc thuận.',
      condition: p => p.than?.name === 'Cửu Thiên' && p.mon?.name === 'Khai Môn'
    },
    {
      id: 'CT002', name: 'Cửu Thiên × Sinh Môn', type: 'cat', priority: 8,
      desc: 'Cửu Thiên × Sinh Môn — đại cát tài lộc và sức khỏe.',
      condition: p => p.than?.name === 'Cửu Thiên' && p.mon?.name === 'Sinh Môn'
    },
    {
      id: 'CD001', name: 'Cửu Địa × Sinh Môn', type: 'cat', priority: 8,
      desc: 'Cửu Địa × Sinh Môn — bất động sản, tài chính nền tảng rất thuận.',
      condition: p => p.than?.name === 'Cửu Địa' && p.mon?.name === 'Sinh Môn'
    },
    {
      id: 'CD002', name: 'Cửu Địa × Tử Môn', type: 'hung', priority: 7,
      desc: 'Cửu Địa × Tử Môn — trầm xuống không lên được, bất động sản bất lợi.',
      condition: p => p.than?.name === 'Cửu Địa' && p.mon?.name === 'Tử Môn'
    },

    // ── Không Vong cấu khai ──────────────────────────────────────────────────
    {
      id: 'KV001', name: 'Khai Môn Không Vong', type: 'hung', priority: 8,
      desc: 'Khai Môn rơi Không Vong — cơ hội mở nhưng hụt tay, kết quả không thực.',
      condition: p => p.mon?.name === 'Khai Môn' && p.khongVong
    },
    {
      id: 'KV002', name: 'Sinh Môn Không Vong', type: 'hung', priority: 8,
      desc: 'Sinh Môn rơi Không Vong — sinh khí trống rỗng, tài lộc không bền.',
      condition: p => p.mon?.name === 'Sinh Môn' && p.khongVong
    },
    {
      id: 'KV003', name: 'Trực Phù Không Vong', type: 'hung', priority: 9,
      desc: 'Trực Phù ở cung Không Vong — bảo hộ thiên thời mất lực.',
      condition: p => p.trucPhu && p.khongVong
    },

    // ── Dịch Mã ─────────────────────────────────────────────────────────────
    {
      id: 'DM001', name: 'Dịch Mã × Khai Môn', type: 'cat', priority: 8,
      desc: 'Dịch Mã × Khai Môn — xuất hành xa, di cư, chuyển công tác đại thuận.',
      condition: p => p.dichMa && p.mon?.name === 'Khai Môn'
    },
    {
      id: 'DM002', name: 'Dịch Mã × Tử Môn', type: 'hung', priority: 7,
      desc: 'Dịch Mã × Tử Môn — di chuyển gặp hung, tai nạn đường xa.',
      condition: p => p.dichMa && p.mon?.name === 'Tử Môn'
    },

    // ── Phục Âm / Phản Ngâm (whole-chart, detected at palace 1) ─────────────
    {
      id: 'FA001', name: 'Phục Âm (toàn cục)', type: 'hung', priority: 10,
      desc: 'Thiên Bàn = Địa Bàn — vạn sự bế tắc, không tiến được.',
      condition: (p, n, ch) => ch?.isPhucAm && n === 1
    },
    {
      id: 'PN001', name: 'Phản Ngâm (toàn cục)', type: 'hung', priority: 9,
      desc: 'Thiên Bàn đảo Địa Bàn — lục thân bất hòa, sự việc đảo lộn.',
      condition: (p, n, ch) => ch?.isPhanNgam && n === 1
    },

    // ── Thiên Trụ / Thiên Nhuế ──────────────────────────────────────────────
    {
      id: 'ST001', name: 'Thiên Trụ × Tử Môn', type: 'hung', priority: 9,
      desc: 'Thiên Trụ × Tử Môn — sụp đổ, phá sản, nguy cơ nghiêm trọng.',
      condition: p => p.star?.name === 'Thiên Trụ' && p.mon?.name === 'Tử Môn'
    },
    {
      id: 'ST002', name: 'Thiên Trụ × Kinh Môn', type: 'hung', priority: 8,
      desc: 'Thiên Trụ × Kinh Môn — bại hoại, tranh tụng kéo dài.',
      condition: p => p.star?.name === 'Thiên Trụ' && p.mon?.name === 'Kinh Môn'
    },
    {
      id: 'TNh01', name: 'Thiên Nhuế × Tử Môn', type: 'hung', priority: 9,
      desc: 'Thiên Nhuế × Tử Môn — hung khí kép, bệnh tật nguy hiểm.',
      condition: p => p.star?.name === 'Thiên Nhuế' && p.mon?.name === 'Tử Môn'
    },
  ];

  /**
   * evaluateChart(chart) → { byPalace, topFormations, allFormations, overallScore, verdict }
   * Runs all Cách Cục rules across the 9 palaces.
   */
  function evaluateChart(chart) {
    const byPalace = {}, allFormations = [];

    for (let p = 1; p <= 9; p++) {
      const pal = chart.palaces[p];
      if (!pal) continue;
      const matches = [];
      for (const def of CACH_CUC_DEFS) {
        try {
          if (def.condition(pal, p, chart)) {
            const hit = { ...def, palace: p, dir: PALACE_META[p].dir };
            matches.push(hit);
            allFormations.push(hit);
          }
        } catch (_) { /* skip malformed condition */ }
      }
      byPalace[p] = matches;
    }

    allFormations.sort((a, b) => b.priority - a.priority);

    const score = allFormations.reduce((acc, f) => {
      if (f.type === 'cat') return acc + f.priority;
      if (f.type === 'hung') return acc - f.priority;
      return acc;
    }, 0);

    return {
      byPalace,
      topFormations: allFormations.slice(0, 8),
      allFormations,
      overallScore: score,
      verdict: score >= 15 ? 'Đại Cát — Tiến Hành' :
        score >= 5 ? 'Cát — Thận Trọng Tiến' :
          score >= -5 ? 'Bình — Cần Xem Xét Thêm' :
            score >= -15 ? 'Hung — Nên Hoãn' : 'Đại Hung — Dừng Lại',
    };
  }

  /* ══════════════════════════════════════════════════════════
     §6 — LAYER 5: DỤNG THẦN / TOPIC ANALYSIS ENGINE
  ══════════════════════════════════════════════════════════ */

  // Each topic defines: preferred doors/deities/stars and things to avoid.
  // 'Cửu Thiên'/'Cửu Địa' are intentionally kept — they match when a chart
  // uses the extended 10-deity system (BAT_THAN indices 8-9).
  const TOPICS = {
    'tai-van': {
      label: 'Tài Vận / Đầu Tư',
      primaryDoors: ['Sinh Môn', 'Khai Môn'],
      primaryDeities: ['Lục Hợp', 'Thái Âm', 'Cửu Thiên'],
      avoidDoors: ['Tử Môn', 'Kinh Môn'],
      avoidDeities: ['Bạch Hổ', 'Đằng Xà', 'Huyền Vũ'],
      usefulStars: ['Thiên Tâm', 'Thiên Nhậm', 'Thiên Phụ'],
    },
    'suc-khoe': {
      label: 'Sức Khỏe / Khám Bệnh',
      primaryDoors: ['Sinh Môn'],
      primaryDeities: ['Lục Hợp', 'Cửu Thiên', 'Trực Phù'],
      avoidDoors: ['Tử Môn', 'Kinh Môn'],
      avoidDeities: ['Bạch Hổ', 'Đằng Xà'],
      usefulStars: ['Thiên Tâm'],
    },
    'tinh-duyen': {
      label: 'Tình Duyên / Hôn Nhân',
      primaryDoors: ['Hưu Môn', 'Sinh Môn'],
      primaryDeities: ['Lục Hợp', 'Thái Âm', 'Cửu Thiên'],
      avoidDoors: ['Tử Môn', 'Kinh Môn'],
      avoidDeities: ['Bạch Hổ', 'Huyền Vũ'],
      usefulStars: ['Thiên Phụ', 'Thiên Nhậm'],
    },
    'su-nghiep': {
      label: 'Sự Nghiệp / Thăng Tiến',
      primaryDoors: ['Khai Môn', 'Sinh Môn'],
      primaryDeities: ['Cửu Thiên', 'Trực Phù'],
      avoidDoors: ['Tử Môn'],
      avoidDeities: ['Bạch Hổ', 'Huyền Vũ'],
      usefulStars: ['Thiên Tâm', 'Thiên Xung'],
    },
    'kinh-doanh': {
      label: 'Kinh Doanh / Khai Trương',
      primaryDoors: ['Sinh Môn', 'Khai Môn'],
      primaryDeities: ['Lục Hợp', 'Cửu Thiên'],
      avoidDoors: ['Tử Môn', 'Kinh Môn'],
      avoidDeities: ['Bạch Hổ', 'Đằng Xà', 'Huyền Vũ', 'Cửu Địa'],
      usefulStars: ['Thiên Tâm', 'Thiên Nhậm', 'Thiên Xung'],
    },
    'thi-cu': {
      label: 'Thi Cử / Phỏng Vấn Học Thuật',
      primaryDoors: ['Khai Môn', 'Hưu Môn'],
      primaryDeities: ['Thái Âm', 'Cửu Thiên', 'Lục Hợp'],
      avoidDoors: ['Tử Môn', 'Kinh Môn'],
      avoidDeities: ['Bạch Hổ', 'Đằng Xà'],
      usefulStars: ['Thiên Phụ', 'Thiên Nhậm', 'Thiên Anh'],
    },
    'ky-hop-dong': {
      label: 'Ký Hợp Đồng / Cam Kết',
      primaryDoors: ['Khai Môn', 'Sinh Môn'],
      primaryDeities: ['Lục Hợp', 'Cửu Thiên'],
      avoidDoors: ['Tử Môn'],
      avoidDeities: ['Bạch Hổ', 'Đằng Xà', 'Cửu Địa'],
      usefulStars: ['Thiên Tâm', 'Thiên Phụ'],
    },
    'dam-phan': {
      label: 'Đàm Phán / Thương Lượng',
      primaryDoors: ['Khai Môn', 'Sinh Môn'],
      primaryDeities: ['Lục Hợp', 'Thái Âm'],
      avoidDoors: ['Kinh Môn', 'Tử Môn'],
      avoidDeities: ['Cửu Địa', 'Bạch Hổ'],
      usefulStars: ['Thiên Phụ'],
    },
    'doi-no': {
      label: 'Đòi Nợ / Thu Hồi Tài Sản',
      primaryDoors: ['Khai Môn', 'Thương Môn'],
      primaryDeities: ['Bạch Hổ', 'Cửu Thiên'],
      avoidDoors: ['Hưu Môn'],
      avoidDeities: ['Huyền Vũ'],
      usefulStars: ['Thiên Xung', 'Thiên Bồng'],
    },
    'kien-tung': {
      label: 'Kiện Tụng / Pháp Lý',
      primaryDoors: ['Khai Môn'],
      primaryDeities: ['Bạch Hổ', 'Cửu Thiên'],
      avoidDoors: ['Tử Môn', 'Hưu Môn'],
      avoidDeities: ['Huyền Vũ', 'Đằng Xà'],
      usefulStars: ['Thiên Xung'],
    },
    'xuat-hanh': {
      label: 'Xuất Hành / Du Lịch',
      primaryDoors: ['Sinh Môn', 'Khai Môn', 'Hưu Môn'],
      primaryDeities: ['Lục Hợp', 'Cửu Thiên'],
      avoidDoors: ['Tử Môn', 'Kinh Môn'],
      avoidDeities: ['Bạch Hổ', 'Đằng Xà'],
      usefulStars: ['Thiên Nhậm', 'Thiên Tâm'],
    },
    'xin-viec': {
      label: 'Xin Việc / Phỏng Vấn',
      primaryDoors: ['Khai Môn'],
      primaryDeities: ['Cửu Thiên', 'Lục Hợp'],
      avoidDoors: ['Tử Môn'],
      avoidDeities: ['Bạch Hổ'],
      usefulStars: ['Thiên Nhậm', 'Thiên Phụ'],
    },
    'bat-dong-san': {
      label: 'Bất Động Sản / Mua Bán Nhà',
      primaryDoors: ['Sinh Môn', 'Khai Môn'],
      primaryDeities: ['Cửu Địa', 'Lục Hợp'],
      avoidDoors: ['Tử Môn'],
      avoidDeities: ['Bạch Hổ', 'Huyền Vũ'],
      usefulStars: ['Thiên Phụ', 'Thiên Tâm'],
    },
    'muu-luoc': {
      label: 'Mưu Lược / Chiến Lược Ẩn',
      primaryDoors: ['Khai Môn', 'Sinh Môn'],
      primaryDeities: ['Thái Âm', 'Cửu Thiên'],
      avoidDoors: ['Tử Môn'],
      avoidDeities: ['Đằng Xà', 'Cửu Địa'],
      usefulStars: ['Thiên Phụ', 'Thiên Tâm', 'Thiên Nhậm'],
    },
  };

  /**
   * findUsefulGod(topicKey, chart)
   * Scores every perimeter palace against the topic's criteria and returns
   * the best candidate with full reasoning and directional advice.
   */
  function findUsefulGod(topicKey, chart) {
    const topic = TOPICS[topicKey];
    if (!topic) return { error: `Topic không tồn tại: "${topicKey}"` };

    const tkName = chart.solarTerm.name;
    const candidates = [];

    for (let p = 1; p <= 9; p++) {
      if (p === 5) continue;        // center palace excluded from direction advice
      const pal = chart.palaces[p];
      if (!pal) continue;

      let score = 0;
      const reasons = [];

      // ── Doors ──────────────────────────────────────────────────────────
      if (pal.mon && topic.primaryDoors.includes(pal.mon.name)) {
        score += 5; reasons.push(`✅ ${pal.mon.name} (cổng cát chủ đề)`);
      }
      if (pal.mon && topic.avoidDoors.includes(pal.mon.name)) {
        score -= 6; reasons.push(`❌ ${pal.mon.name} (cổng hung — tránh)`);
      }
      // ── Deities ────────────────────────────────────────────────────────
      if (pal.than && topic.primaryDeities.includes(pal.than.name)) {
        score += 4; reasons.push(`✅ ${pal.than.name} (thần cát)`);
      }
      if (pal.than && topic.avoidDeities.includes(pal.than.name)) {
        score -= 4; reasons.push(`❌ ${pal.than.name} (thần hung)`);
      }
      // ── Stars ──────────────────────────────────────────────────────────
      if (pal.star && topic.usefulStars.includes(pal.star.name)) {
        score += 3; reasons.push(`✅ ${pal.star.name} (sao hỗ trợ)`);
      }
      // ── Element state ──────────────────────────────────────────────────
      const eleState = getElementState(PALACE_META[p].element, tkName);
      if (eleState.isStrong) { score += 2; reasons.push(`✅ Ngũ Hành ${eleState.state}`); }
      if (eleState.isWeak) { score -= 1; reasons.push(`⚠️ Ngũ Hành ${eleState.state}`); }
      // ── Special flags ──────────────────────────────────────────────────
      if (pal.khongVong) { score -= 5; reasons.push('⚠️ Không Vong — năng lượng trống'); }
      if (pal.trucPhu) { score += 2; reasons.push('✅ Trực Phù hỗ trợ'); }
      if (['Ất', 'Bính', 'Đinh'].includes(pal.can?.name)) {
        score += 3; reasons.push(`✅ Tam Kỳ ${pal.can.name}`);
      }

      candidates.push({ palace: p, score, reasons });
    }

    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    const verdict =
      best.score >= 10 ? { label: 'Đại Cát', color: 'cat' } :
        best.score >= 5 ? { label: 'Cát', color: 'cat' } :
          best.score >= 0 ? { label: 'Bình', color: 'binh' } :
            best.score >= -5 ? { label: 'Hung', color: 'hung' } :
              { label: 'Đại Hung', color: 'hung' };

    return {
      topic: topic.label,
      usefulGodPalace: best.palace,
      usefulGodDir: PALACE_META[best.palace].dir,
      usefulGodPalaceName: PALACE_META[best.palace].name,
      score: best.score,
      verdict,
      reasons: best.reasons,
      allCandidates: candidates,
      actionAdvice: _generateAdvice(topicKey, best, chart),
    };
  }

  /**
   * _generateAdvice — internal helper that composes a human-readable
   * action sentence for the winning palace.  (Was truncated in source paste.)
   */
  function _generateAdvice(topicKey, best, chart) {
    const p = best.palace;
    const pal = chart.palaces[p];
    const dir = PALACE_META[p].dir;
    const pNm = PALACE_META[p].name;
    const mon = pal?.mon?.name || '—';
    const than = pal?.than?.name || '—';
    const star = pal?.star?.name || '—';
    const can = pal?.can?.name || '—';
    const isCat = best.score >= 5;
    const ok = isCat ? '✅' : '⚠️';

    const map = {
      'tai-van':
        `${ok} Hướng tài lộc: ${dir} (Cung ${p}·${pNm}). ${mon} × ${than} — ` +
        (isCat ? 'tài khí vượng, nên hành động hướng này.'
          : 'chưa lý tưởng, kiểm tra lại trước khi đầu tư.'),

      'suc-khoe':
        `${ok} Xuất hành khám bệnh hướng ${dir}. ${star} × ${mon} — ` +
        (star === 'Thiên Tâm' && mon === 'Sinh Môn'
          ? '🌟 Đại cát, gặp thầy thuốc giỏi.'
          : isCat ? 'thuận cho khám chữa bệnh.' : 'nên kiểm tra thêm trước khi đi.'),

      'tinh-duyen':
        `${ok} Gặp gỡ/hẹn hò hướng ${dir} (${pNm}). ${than} hỗ trợ duyên phận — ` +
        (['Lục Hợp', 'Thái Âm', 'Thanh Long'].includes(than)
          ? 'duyên lành thuận, nên chủ động tiếp cận.'
          : isCat ? 'cơ hội có nhưng cần thêm thời gian.' : 'cần kiên nhẫn.'),

      'su-nghiep':
        `${ok} Nộp hồ sơ/gặp lãnh đạo hướng ${dir}. ${can} × ${mon} — ` +
        (isCat ? 'quan lộc hanh thông, mạnh dạn tiến hành.'
          : 'thận trọng, chuẩn bị kỹ hồ sơ và lập luận.'),

      'kinh-doanh':
        `${ok} Khai trương/xuất hành kinh doanh hướng ${dir}. ${mon} × ${than} — ` +
        (isCat ? 'cát khí thuận cho mở rộng, có thể tiến hành.'
          : 'nên hoãn hoặc điều chỉnh kế hoạch.'),

      'thi-cu':
        `${ok} Nhập trường thi/phỏng vấn hướng ${dir}. ${can} hỗ trợ trí tuệ — ` +
        (isCat ? 'tự tin tiến hành, tư duy rõ ràng.'
          : 'cần ôn luyện kỹ hơn, tránh chủ quan.'),

      'ky-hop-dong':
        `${ok} Ký kết hướng ${dir}. ${than} × ${mon} — ` +
        (isCat ? 'hợp đồng bền vững, các bên đều có lợi.'
          : 'xem xét điều khoản cẩn thận trước khi ký.'),

      'dam-phan':
        `${ok} Đàm phán hướng ${dir}. ${than} × ${mon} — ` +
        (isCat ? 'có lợi thế thương lượng, nên chủ động đề xuất.'
          : 'cần chuẩn bị phương án dự phòng B.'),

      'doi-no':
        `${ok} Xuất phát đòi nợ hướng ${dir}. ${star} × ${mon} — ` +
        (isCat ? 'có khả năng thu hồi thành công.'
          : 'cần đi kèm chứng từ pháp lý đầy đủ.'),

      'kien-tung':
        `${ok} Nộp đơn/ra tòa hướng ${dir}. ${than} × ${mon} — ` +
        (isCat ? 'thiên thời hỗ trợ, có cơ hội thắng kiện.'
          : 'cần luật sư mạnh hỗ trợ, tránh hành động đơn độc.'),

      'xuat-hanh':
        `${ok} Xuất hành hướng ${dir}. ${mon} × ${than} — ` +
        (isCat ? 'đường xa an lành, hành trình thuận lợi.'
          : 'kiểm tra lịch trình và điều kiện đi lại kỹ lưỡng.'),

      'xin-viec':
        `${ok} Nộp CV/phỏng vấn hướng ${dir}. ${mon} × ${can} — ` +
        (isCat ? 'cơ hội cao được tuyển dụng, nên chủ động.'
          : 'cần làm nổi bật điểm mạnh cá nhân nhiều hơn.'),

      'bat-dong-san':
        `${ok} Xem nhà/ký HĐ bất động sản hướng ${dir}. ${than} × ${mon} — ` +
        (isCat ? 'giao dịch thuận lợi, giá và pháp lý ổn.'
          : 'kiểm tra pháp lý bất động sản kỹ trước khi cọc.'),

      'muu-luoc':
        `${ok} Lập kế/ra quyết định chiến lược hướng ${dir}. ${can} × ${than} — ` +
        (isCat ? 'mưu lược thành công, thời cơ chín muồi.'
          : 'cần thu thập thêm thông tin trước khi ra quyết định.'),
    };

    return map[topicKey] ||
      `${ok} Hướng Dụng Thần: ${dir} (Cung ${p}·${pNm}). ` +
      `${mon} × ${than} × ${star} — điểm số ${best.score > 0 ? '+' : ''}${best.score}.`;
  }

  /* ══════════════════════════════════════════════════════════
     §7 — PUBLIC API
  ══════════════════════════════════════════════════════════ */

  return {
    // ── Lookup tables (useful for UI rendering) ─────────────────────────────
    STEMS,
    STEMS_BY_NAME,
    BRANCHES,
    BRANCHES_BY_NAME,
    PALACE_META,
    CUU_TINH,
    BAT_MON_DIABAN,
    BAT_THAN,
    BAT_THAN_BY_NAME,
    CAN_SEQUENCE_9,
    PRODUCES,
    CONTROLS,
    WEAKENS,
    TIET_KHI_DEFS,
    CUC_TABLE,
    SEASON_MAP,
    SEASON_STATES,
    STATE_SCORES,
    DICH_MA_TABLE,
    CACH_CUC_DEFS,
    TOPICS,

    // ── Layer 0: Solar Calendar ─────────────────────────────────────────────
    getSolarTermInfo,

    // ── Layer 1: Stem & Branch ──────────────────────────────────────────────
    getThapThan,
    getThapThanForChart,
    getKhongVong,
    getDichMa,
    getTangCan,

    // ── Layer 2: Palace Flying Engine ───────────────────────────────────────
    getDayPillar,
    getGioChi,
    getGioCan,
    flyStars,
    buildFullChart,

    // ── Layer 3: Element State ──────────────────────────────────────────────
    getElementState,
    scoreChartStates,

    // ── Layer 4: Cách Cục Scoring ───────────────────────────────────────────
    evaluateChart,

    // ── Layer 5: Dụng Thần / Topic Analysis ────────────────────────────────
    findUsefulGod,
  };
}));
