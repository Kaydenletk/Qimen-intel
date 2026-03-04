import assert from 'node:assert/strict';
import { analyze } from '../src/index.js';
import { ORDER, SLOT_TO_PALACE } from '../src/core/palaceLayout.js';

const DATE = new Date(2026, 2, 3, 17, 0, 0, 0);
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
console.log(
  'DEBUG',
  JSON.stringify({
    hourCanChi,
    isYangDun: chart.isDuong,
    directEnvoyDoor: chart.leadDoor,
    directEnvoyPalace: chart.trucSuPalace,
    directChiefPalace: chart.trucPhuPalace,
  })
);

const doorsBySlot = {};
for (const slot of ORDER) {
  if (slot === 'C') continue;
  const palaceNum = SLOT_TO_PALACE[slot];
  const pal = chart.palaces[palaceNum];
  doorsBySlot[slot] = pal?.mon?.short || '—';
}
console.log('doorsBySlot', JSON.stringify(doorsBySlot));

assert.equal(hourCanChi, 'Đinh Dậu', 'Hour Can-Chi must be Đinh Dậu at 2026-03-03 17:00');

for (const [slot, expectedDoor] of Object.entries(EXPECTED_DOORS)) {
  const palaceNum = SLOT_TO_PALACE[slot];
  const pal = chart.palaces[palaceNum];
  const gotDoor = pal?.mon?.short || '—';
  assert.equal(gotDoor, expectedDoor, `${slot} door mismatch`);
}

const ly = chart.palaces[SLOT_TO_PALACE.S];
assert.equal(ly?.star?.short || '—', 'Tâm', 'Ly star must be Tâm');
assert.equal(ly?.than?.name || '—', 'Trực Phù', 'Ly deity must be Trực Phù');
assert.equal(ly?.mon?.short || '—', 'Khai', 'Ly door must be Khai');
assert.equal(Boolean(ly?.trucSu), true, 'Ly must be marked Trực Sử');

const center = chart.palaces[SLOT_TO_PALACE.C];
assert.ok(center, 'Center palace missing');
assert.equal(center.palaceName || 'Trung Cung', 'Trung', 'Center label should be Trung/Trung Cung');
assert.ok(!center.mon, 'Center must not have door');
assert.ok(!center.than, 'Center must not have deity');

console.log('ASSERTIONS: OK');
