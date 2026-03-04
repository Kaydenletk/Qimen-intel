/**
 * stems.js — Layer 1: Stem & Branch Engine
 * Thập Thần · Không Vong · Dịch Mã · Tàng Can · Day/Hour pillars
 */

import { STEMS, BRANCHES, PRODUCES, CONTROLS, PALACE_META } from './tables.js';

// ── Thập Thần (Ten Gods) ──────────────────────────────────────────────────────
/**
 * getThapThan(masterIdx, targetIdx, pillar?)
 * Determines the Ten Gods relationship from Day Master's perspective.
 */
export function getThapThan(masterStemIdx, targetStemIdx, pillar = 'day') {
  const m = STEMS[masterStemIdx], t = STEMS[targetStemIdx];
  if (!m || !t) return null;
  const sameYY = m.yin === t.yin;
  let name, type;
  if (m.element === t.element) { name = sameYY ? 'Tỷ Kiên' : 'Kiếp Tài'; type = 'sibling'; }
  else if (PRODUCES[m.element] === t.element) { name = sameYY ? 'Thực Thần' : 'Thương Quan'; type = 'output'; }
  else if (CONTROLS[m.element] === t.element) { name = sameYY ? 'Thiên Tài' : 'Chính Tài'; type = 'wealth'; }
  else if (CONTROLS[t.element] === m.element) { name = sameYY ? 'Thất Sát' : 'Chính Quan'; type = 'officer'; }
  else if (PRODUCES[t.element] === m.element) { name = sameYY ? 'Thiên Ấn' : 'Chính Ấn'; type = 'resource'; }
  else { name = '?'; type = 'unknown'; }
  return {
    pillar, masterStem: m.name, targetStem: t.name,
    targetElement: t.element, name, type, sameYinYang: sameYY
  };
}

/** getThapThanForChart — compute all 4 pillars at once */
export function getThapThanForChart(dayStemIdx, yearStemIdx, monthStemIdx, hourStemIdx) {
  return [
    { pillar: 'Năm', idx: yearStemIdx },
    { pillar: 'Tháng', idx: monthStemIdx },
    { pillar: 'Ngày', idx: dayStemIdx },
    { pillar: 'Giờ', idx: hourStemIdx },
  ].map(p => getThapThan(dayStemIdx, p.idx, p.pillar));
}

// ── Không Vong (Void Branches) ────────────────────────────────────────────────
/**
 * getKhongVong(stemIdx, branchIdx)
 * Formula: xunStart = (branchIdx − stemIdx) mod 12
 *          void₁/₂ = (xunStart + 10/11) mod 12
 */
export function getKhongVong(stemIdx, branchIdx) {
  const xunStart = ((branchIdx - stemIdx) % 12 + 12) % 12;
  const v1 = BRANCHES[(xunStart + 10) % 12];
  const v2 = BRANCHES[(xunStart + 11) % 12];
  return {
    xunName: `Tuần Giáp ${BRANCHES[xunStart]?.name || ''}`,
    void1: { idx: (xunStart + 10) % 12, name: v1.name, palace: v1.palace },
    void2: { idx: (xunStart + 11) % 12, name: v2.name, palace: v2.palace },
    voidPalaces: [...new Set([v1.palace, v2.palace])],
  };
}

// ── Dịch Mã (Traveling Horse Star) ───────────────────────────────────────────
// FIX: correct palace numbers for all 4 Tam Hợp frames.
const DICH_MA_RAW = {
  0: ['Dần', 8, 'Thân-Tý-Thìn'], 4: ['Dần', 8, 'Thân-Tý-Thìn'], 8: ['Dần', 8, 'Thân-Tý-Thìn'],
  2: ['Thân', 2, 'Dần-Ngọ-Tuất'], 6: ['Thân', 2, 'Dần-Ngọ-Tuất'], 10: ['Thân', 2, 'Dần-Ngọ-Tuất'],
  5: ['Hợi', 6, 'Tỵ-Dậu-Sửu'], 9: ['Hợi', 6, 'Tỵ-Dậu-Sửu'], 1: ['Hợi', 6, 'Tỵ-Dậu-Sửu'],
  11: ['Tỵ', 4, 'Hợi-Mão-Mùi'], 3: ['Tỵ', 4, 'Hợi-Mão-Mùi'], 7: ['Tỵ', 4, 'Hợi-Mão-Mùi'],
};

export const DICH_MA_TABLE = Object.fromEntries(
  Object.entries(DICH_MA_RAW).map(([k, [branch, palace, frame]]) =>
    [k, {
      branch, palace, palaceName: PALACE_META[palace].name,
      dir: PALACE_META[palace].dir, frame
    }])
);

export function getDichMa(branchIdx) {
  const r = DICH_MA_TABLE[branchIdx];
  return r ? { ...r, horseBranch: r.branch } : null;
}

// ── Tàng Can (Hidden Stems) ───────────────────────────────────────────────────
export function getTangCan(branchIdx) {
  const b = BRANCHES[branchIdx];
  if (!b) return [];
  return b.hiddenStems.map((idx, i) => ({
    stemIdx: idx, name: STEMS[idx].name, element: STEMS[idx].element,
    role: ['chính khí', 'trung khí', 'dư khí'][i] || 'dư khí',
  }));
}

// ── Day & Hour Pillars ────────────────────────────────────────────────────────
/** Reference epoch: 2000-01-07 = Giáp Tý (jiazi index 0) */
export function getDayPillar(date) {
  const epoch = new Date(2000, 0, 7);
  const jiazi = (((Math.floor((date - epoch) / 86400000)) % 60) + 60) % 60;
  return {
    stemIdx: jiazi % 10, branchIdx: jiazi % 12, jiazi,
    stemName: STEMS[jiazi % 10].name, branchName: BRANCHES[jiazi % 12].name
  };
}

/** getGioChi(hour 0-23) → branch index 0-11
 * Dạ Tý (23:00 - 23:59) belongs to branch Tý (0).
 */
export function getGioChi(hour) { return hour === 23 ? 0 : Math.floor((hour + 1) / 2); }

/** getGioCan(hour, dayCanIdx) → stem index 0-9
 * Ngũ Thử Độn (Rules of the 5 Rats) determines Hour Stem.
 */
export function getGioCan(hour, dayCanIdx) {
  const bases = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8];
  return (bases[dayCanIdx] + getGioChi(hour)) % 10;
}
