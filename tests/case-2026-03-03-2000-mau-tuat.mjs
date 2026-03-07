import assert from 'node:assert/strict';
import { analyze } from '../src/index.js';

const DATE = new Date(2026, 2, 3, 20, 0, 0);
const HOUR = 20;

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
  leadDoor: chart.leadDoor,
  leadStemPalace: chart.leadStemPalace,
  trucSuPalace: chart.trucSuPalace,
  doorAt1: chart.palaces[1]?.mon?.short,
  doorAt2: chart.palaces[2]?.mon?.short,
  doorAt4: chart.palaces[4]?.mon?.short,
}));

assert.equal(chart.gioPillar.stemName, 'Mậu', 'Hour stem must be Mậu');
assert.equal(chart.gioPillar.branchName, 'Tuất', 'Hour branch must be Tuất');
assert.equal(chart.isDuong, true, 'Case must be Yang Dun');
assert.equal(chart.cucSo, 3, 'Case must be Dương 3 Cục');

assert.equal(chart.leadDoor, 'Đỗ Môn', 'Lead door must follow the Tuần Thủ palace');
assert.equal(chart.trucPhuPalace, 1, 'Trực Phù must remain at Khảm 1');
assert.equal(chart.trucSuPalace, 8, 'Trực Sử must land at Cấn 8');
assert.equal(chart.palaces[1]?.star?.short, 'Phụ', 'Khảm 1 must carry Thiên Phụ');
assert.equal(Boolean(chart.palaces[1]?.trucPhu), true, 'Khảm 1 must be marked Trực Phù');

console.log('ASSERTIONS: OK');
