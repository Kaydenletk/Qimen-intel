import assert from 'node:assert/strict';
import { analyze } from '../src/index.js';

const DATE = new Date('2026-03-06T15:26:00');
const HOUR = 15;

const { chart } = analyze(DATE, HOUR);

console.log(
  'CASE',
  DATE.toISOString(),
  'hour',
  HOUR,
  `${chart.gioPillar.stemName}${chart.gioPillar.branchName}`,
  'cuc',
  chart.cucSo,
  chart.isDuong ? 'Dương' : 'Âm'
);

console.log('DEBUG', JSON.stringify({
  xunHour: chart.xunHour,
  leadStem: chart.leadStem,
  leadStemPalace: chart.leadStemPalace,
  trucPhuPalace: chart.trucPhuPalace,
  trucSuPalace: chart.trucSuPalace,
  p9: {
    door: chart.palaces[9]?.mon?.short,
    trucSu: Boolean(chart.palaces[9]?.trucSu),
    trucPhu: Boolean(chart.palaces[9]?.trucPhu),
  },
  p2: {
    door: chart.palaces[2]?.mon?.short,
    trucSu: Boolean(chart.palaces[2]?.trucSu),
    trucPhu: Boolean(chart.palaces[2]?.trucPhu),
  },
}));

assert.equal(chart.gioPillar.stemName, 'Nhâm');
assert.equal(chart.gioPillar.branchName, 'Thân');
assert.equal(chart.dayPillar.stemName, 'Kỷ');
assert.equal(chart.dayPillar.branchName, 'Mão');
assert.equal(chart.cucSo, 1);
assert.equal(chart.isDuong, true);
assert.equal(chart.xunHour, 'Giáp Tý');
assert.equal(chart.leadStem, 'Mậu');
assert.equal(chart.leadStemPalace, 1);

assert.equal(chart.trucPhuPalace, 2, 'Trực Phù phải ở Khôn / P2');
assert.equal(chart.trucSuPalace, 9, 'Trực Sử phải ở Ly / P9');

assert.equal(chart.palaces[9]?.mon?.short, 'Hưu', 'P9 phải là Hưu Môn');
assert.equal(Boolean(chart.palaces[9]?.trucSu), true, 'P9 phải được đánh dấu Trực Sử');
assert.equal(Boolean(chart.palaces[9]?.trucPhu), false, 'P9 không được mang Trực Phù');

assert.equal(chart.palaces[2]?.mon?.short, 'Sinh', 'P2 phải là Sinh Môn');
assert.equal(Boolean(chart.palaces[2]?.trucPhu), true, 'P2 phải được đánh dấu Trực Phù');
assert.equal(Boolean(chart.palaces[2]?.trucSu), false, 'P2 không được mang Trực Sử');

console.log('ASSERTIONS: OK');
