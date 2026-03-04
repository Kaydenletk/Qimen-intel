import assert from 'node:assert/strict';
import { analyze } from '../src/index.js';
import { ORDER, SLOT_TO_PALACE } from '../src/core/palaceLayout.js';

const DATE = new Date(2026, 2, 3, 17, 6, 0, 0);
const HOUR = 17;

const EXPECTED_DOORS = {
  SE: 'Kinh',
  S: 'Khai',
  SW: 'Hưu',
  E: 'Tử',
  W: 'Sinh',
  NE: 'Cảnh',
  N: 'Đỗ',
  NW: 'Thương',
};

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

for (const [slot, expectedDoor] of Object.entries(EXPECTED_DOORS)) {
  const palaceNum = SLOT_TO_PALACE[slot];
  const gotDoor = chart.palaces[palaceNum]?.mon?.short || '—';
  assert.equal(gotDoor, expectedDoor, `${slot} door mismatch`);
}

const lyPalace = chart.palaces[SLOT_TO_PALACE.S];
assert.equal(lyPalace?.mon?.short || '—', 'Khai', 'Ly must carry Khai Môn');
assert.equal(Boolean(lyPalace?.trucSu), true, 'Ly must be marked Trực Sử');

console.log('ASSERTIONS: OK');
