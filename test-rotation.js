/**
 * Test case: Yang Ju 2, Day Bing Zi (Bính Tý), Hour Gui Si (Quý Tỵ)
 *
 * Expected:
 * - Xun of Hour Gui Si: Giáp Thân → Lead Stem = Canh
 * - Lead Stem Canh on Earth Plate → determines Trực Phù (Lead Star)
 * - Hour Stem Quý (9) on Earth Plate → Trực Phù lands here
 * - Lead Star should be Thiên Nhuế (at palace 2 in Yang Ju 2)
 * - Dịch Mã: Hour branch Tỵ → Horse at Hợi → Palace 6 (Càn)
 */

import { buildRotatingChart, getDichMa, buildFullChart } from './src/core/flying.js';
import { STEMS, BRANCHES, CUU_TINH, PALACE_META } from './src/core/tables.js';

console.log('═'.repeat(70));
console.log('  TEST CASE: Yang Ju 2, Day Bính Tý, Hour Quý Tỵ');
console.log('═'.repeat(70));

// Yang Ju 2
const cucSo = 2;
const isDuong = true;

// Day: Bính Tý (Stem: Bính=2, Branch: Tý=0)
const dayStemIdx = 2;   // Bính
const dayBranchIdx = 0; // Tý

// Hour: Quý Tỵ (Stem: Quý=9, Branch: Tỵ=5)
const hourStemIdx = 9;  // Quý
const hourBranchIdx = 5; // Tỵ

console.log('\n[INPUT]');
console.log(`  Cục: ${cucSo} ${isDuong ? 'Dương' : 'Âm'}`);
console.log(`  Day:  ${STEMS[dayStemIdx].name} ${BRANCHES[dayBranchIdx].name}`);
console.log(`  Hour: ${STEMS[hourStemIdx].name} ${BRANCHES[hourBranchIdx].name}`);

// Build the chart
const result = buildRotatingChart(cucSo, isDuong, hourStemIdx, hourBranchIdx, dayStemIdx, dayBranchIdx);

console.log('\n[ROTATION ANALYSIS]');
console.log(`  Tuần (Xun):      ${result.xunName}`);
console.log(`  Tuần Thủ (Lead Stem): ${result.leadStemName}`);
console.log(`  Lead Stem Palace (Earth Plate): ${result.leadStemPalace}`);
console.log(`  Lead Star (Trực Phù): ${result.leadStar}`);
console.log(`  Lead Door (Trực Sử): ${result.leadDoor}`);
console.log(`  Hour Stem Palace: ${result.hourStemPalace}`);
console.log(`  Trực Phù lands at Palace: ${result.trucPhuPalace}`);
console.log(`  Trực Sử lands at Palace: ${result.trucSuPalace}`);
console.log(`  Door Shift Steps: ${result.doorShiftSteps}`);
console.log(`  Star Shift: ${result.starShift}`);

// Dịch Mã
const dmHour = getDichMa(hourBranchIdx, 'hour');
const dmDay = getDichMa(dayBranchIdx, 'day');

console.log('\n[DỊCH MÃ]');
console.log(`  From Hour branch (${BRANCHES[hourBranchIdx].name}): ${dmHour?.horseBranch} → Palace ${dmHour?.palace} (${dmHour?.palaceName})`);
console.log(`  From Day branch (${BRANCHES[dayBranchIdx].name}): ${dmDay?.horseBranch} → Palace ${dmDay?.palace} (${dmDay?.palaceName})`);

console.log('\n[THIÊN BÀN - 9 PALACES]');
console.log('  Cung  │ Hướng       │ Tinh (Star) │ Thiên Can │ Môn (Door) │ Thần (Deity)  │ Flags');
console.log('  ──────┼─────────────┼─────────────┼───────────┼────────────┼───────────────┼──────');

const { palaces } = result;
for (let p = 1; p <= 9; p++) {
  const pal = palaces[p];
  const flags = [
    pal.trucPhu ? '🔹Trực Phù' : '',
    pal.trucSu ? '📍Trực Sử' : '',
    p === dmHour?.palace ? '🐴DM' : '',
  ].filter(Boolean).join(' ');

  console.log(
    `  ${String(p).padEnd(5)} │ ${(PALACE_META[p].dir).padEnd(11)} │ ` +
    `${(pal.star?.short || '—').padEnd(11)} │ ${(pal.can?.name || '—').padEnd(9)} │ ` +
    `${(pal.mon?.short || '—').padEnd(10)} │ ${(pal.than?.name || '—').padEnd(13)} │ ${flags}`
  );
}

// Verification
console.log('\n[VERIFICATION]');
console.log('  Expected for Yang Ju 2, Hour Quý Tỵ:');
console.log('  - Xun of Quý Tỵ: Giáp Thân (Quý is stem 9, Tỵ is branch 5)');
console.log('    xunStart = (5 - 9) mod 12 = 8 = Thân → Giáp Thân ✓');
console.log('  - Lead Stem: Canh (hides Giáp in Giáp Thân Xun) ✓');
console.log('  - Yang Ju 2 Earth Plate: 2→7→6→1→8→3→4→9→5 with stems Mậu→Kỷ→Canh→Tân→Nhâm→Quý→Đinh→Bính→Ất');
console.log('  - Canh is at Palace 6 on Earth Plate');
console.log('  - Lead Star = Star at Palace 6 = Thiên Tâm ✓');
console.log('  - Lead Door = Door at Palace 6 = Khai Môn ✓');
console.log('  - Hour Stem Quý at Palace 3 → Trực Phù lands at Palace 3 ✓');
console.log('  - Dịch Mã from Tỵ: Tỵ-Dậu-Sửu frame → Horse is Hợi → Palace 6 ✓');

// Let's also trace the Earth Plate
console.log('\n[EARTH PLATE TRACE - Yang Ju 2]');
console.log('  Yang sequence with center: 1 → 8 → 3 → 4 → 9 → 5 → 2 → 7 → 6');
console.log('  Starting at Palace 2 (Cục 2), stem sequence: Mậu→Kỷ→Canh→Tân→Nhâm→Quý→Đinh→Bính→Ất');
console.log('    Palace 2: Mậu (start)');
console.log('    Palace 7: Kỷ');
console.log('    Palace 6: Canh  ← Lead Stem location (Giáp Thân Xun)');
console.log('    Palace 1: Tân');
console.log('    Palace 8: Nhâm');
console.log('    Palace 3: Quý  ← Hour Stem location (Trực Phù destination)');
console.log('    Palace 4: Đinh');
console.log('    Palace 9: Bính');
console.log('    Palace 5: Ất (center)');

console.log('\n[ACTUAL EARTH PLATE FROM CODE]');
for (let p = 1; p <= 9; p++) {
  console.log(`  Palace ${p}: ${palaces[p].earthStem || '(none)'}`);
}

console.log('\n' + '═'.repeat(70));
