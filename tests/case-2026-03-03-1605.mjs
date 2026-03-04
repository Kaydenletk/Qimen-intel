import assert from 'node:assert/strict';
import { analyze } from '../src/index.js';

const DATE = new Date(2026, 2, 3, 16, 5, 0);
const HOUR = 16;

const SLOT_TO_PALACE = { SE: 4, S: 9, SW: 2, E: 3, C: 5, W: 7, NE: 8, N: 1, NW: 6 };
const SELFPLUS_DEITY_ALIAS = {
  'Bạch Hổ': 'Câu Trần',
  'Huyền Vũ': 'Chu Tước',
};

const EXPECTED = {
  SE: { door: 'Sinh', star: 'Xung', deity: 'Lục Hợp' },
  S: { door: 'Thương', star: 'Phụ', deity: 'Câu Trần' },
  SW: { door: 'Đỗ', star: 'Anh', deity: 'Chu Tước' },
  E: { door: 'Hưu', star: 'Nhâm', deity: 'Thái Âm' },
  W: { door: 'Cảnh', star: 'Nhuế', deity: 'Cửu Địa' },
  NE: { door: 'Khai', star: 'Trụ', deity: 'Cửu Thiên' },
  N: { door: 'Kinh', star: 'Tâm', deity: 'Trực Phù' },
  NW: { door: 'Tử', star: 'Bồng', deity: 'Đằng Xà' },
};

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

console.log('\nTABLE_BY_DIRECTION');
console.log('slot|p|door|star|deity|trucSu');
for (const slot of ['SE', 'S', 'SW', 'E', 'W', 'NE', 'N', 'NW']) {
  const palace = SLOT_TO_PALACE[slot];
  const pal = chart.palaces[palace];
  const got = {
    door: pal?.mon?.short || '—',
    star: pal?.star?.short || '—',
    deity: SELFPLUS_DEITY_ALIAS[pal?.than?.name] || pal?.than?.name || '—',
  };
  const exp = EXPECTED[slot];

  console.log(`${slot}|P${palace}|${got.door}|${got.star}|${got.deity}|trucSu=${pal?.trucSu ? 'Y' : ''}`);
  assert.equal(got.door, exp.door, `${slot} door mismatch`);
  assert.equal(got.star, exp.star, `${slot} star mismatch`);
  assert.equal(got.deity, exp.deity, `${slot} deity mismatch`);
}

console.log('\nTABLE_BY_PALACE');
console.log('p|dir|door|star|deity|trucSu|trucPhu');
for (let p = 1; p <= 9; p++) {
  const pal = chart.palaces[p];
  const door = pal?.mon?.short || '—';
  const star = pal?.star?.short || '—';
  const deity = SELFPLUS_DEITY_ALIAS[pal?.than?.name] || pal?.than?.name || '—';
  console.log(`${p}|${pal?.dir || '—'}|${door}|${star}|${deity}|${pal?.trucSu ? 'Y' : ''}|${pal?.trucPhu ? 'Y' : ''}`);
}

const center = chart.palaces[SLOT_TO_PALACE.C];
assert.ok(center, 'Center palace missing');
assert.equal(center.palaceName || 'Trung Cung', 'Trung', 'Center must be Trung Cung/Trung');
assert.ok(!center.mon, 'Center must not have door');
assert.ok(!center.than, 'Center must not have deity');

const nw = chart.palaces[SLOT_TO_PALACE.NW];
assert.equal(Boolean(nw.trucSu), false, 'Trực Sử must not be at NW for 2026-03-03 16:05');
const ne = chart.palaces[SLOT_TO_PALACE.NE];
assert.equal(Boolean(ne.trucSu), true, 'Trực Sử must be at NE for 2026-03-03 16:05');

console.log('ASSERTIONS: OK');
