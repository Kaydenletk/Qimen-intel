import assert from 'node:assert/strict';
import { analyze } from '../src/index.js';
import { ORDER, SLOT_TO_PALACE } from '../src/core/palaceLayout.js';

const DATE = new Date(2026, 2, 3, 17, 0, 0, 0);
const HOUR = 17;

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

const ly = chart.palaces[SLOT_TO_PALACE.S];
assert.equal(ly?.star?.short || '—', 'Tâm', 'Ly star must be Thiên Tâm');
assert.equal(ly?.than?.name || '—', 'Trực Phù', 'Ly deity must be Trực Phù');
assert.equal(chart.trucPhuPalace, 9, 'Trực Phù must land at Nam / P9');
assert.equal(chart.trucSuPalace, 9, 'Trực Sử must land at Nam / P9');

const center = chart.palaces[SLOT_TO_PALACE.C];
assert.ok(center, 'Center palace missing');
assert.equal(center.palaceName || 'Trung Cung', 'Trung', 'Center label should be Trung/Trung Cung');
assert.ok(!center.mon, 'Center must not have door');
assert.ok(!center.than, 'Center must not have deity');

console.log('ASSERTIONS: OK');
