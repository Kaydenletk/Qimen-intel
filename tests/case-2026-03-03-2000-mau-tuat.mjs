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

assert.equal(chart.leadDoor, 'Khai Môn', 'Lead door must follow the Tuần Thủ palace after linear Earth Plate distribution');
assert.equal(chart.trucPhuPalace, 3, 'Trực Phù must land at Đông / P3');
assert.equal(chart.trucSuPalace, 1, 'Trực Sử must land at Bắc / P1');
assert.equal(chart.palaces[3]?.star?.short, 'Tâm', 'Đông / P3 must carry Thiên Tâm');
assert.equal(chart.palaces[1]?.sentStar?.short, 'Cầm', 'Bắc / P1 must also carry Thiên Cầm');
assert.equal(Boolean(chart.palaces[3]?.trucPhu), true, 'Đông / P3 must be marked Trực Phù');

console.log('ASSERTIONS: OK');
