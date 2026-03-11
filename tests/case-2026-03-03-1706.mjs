import assert from 'node:assert/strict';
import { analyze } from '../src/index.js';
import { ORDER, SLOT_TO_PALACE } from '../src/core/palaceLayout.js';

const DATE = new Date(2026, 2, 3, 17, 6, 0, 0);
const HOUR = 17;

const { chart } = analyze(DATE, HOUR);
const hourCanChi = `${chart.gioPillar.stemName} ${chart.gioPillar.branchName}`;

const doorsBySlot = {};
for (const slot of ORDER) {
  if (slot === 'C') continue;
  const palaceNum = SLOT_TO_PALACE[slot];
  doorsBySlot[slot] = chart.palaces[palaceNum]?.mon?.short || '—';
}

console.log(
  'DEBUG',
  JSON.stringify({
    hourCanChi,
    isYangDun: chart.isDuong,
    directEnvoyDoor: chart.leadDoor,
    directEnvoyPalace: chart.trucSuPalace,
    doorsBySlot,
  })
);

assert.equal(hourCanChi, 'Đinh Dậu', 'Hour Can-Chi must be Đinh Dậu');
assert.equal(chart.isDuong, true, 'Case must be Yang Ju');
assert.deepEqual(doorsBySlot, {
  SE: 'Kinh',
  S: 'Khai',
  SW: 'Hưu',
  E: 'Tử',
  W: 'Sinh',
  NE: 'Cảnh',
  N: 'Đỗ',
  NW: 'Thương',
}, 'Door ring must follow the linear Self-plus Earth Plate engine');

const lyPalace = chart.palaces[SLOT_TO_PALACE.S];
assert.equal(lyPalace?.star?.short || '—', 'Tâm', 'Ly must carry Thiên Tâm');
assert.equal(chart.trucPhuPalace, 9, 'Trực Phù must land at Nam / P9');
assert.equal(chart.trucSuPalace, 9, 'Trực Sử must land at Nam / P9');

console.log('ASSERTIONS: OK');
