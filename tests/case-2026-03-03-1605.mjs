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
  SE: { star: 'Nhuế', deity: 'Thái Âm' },
  S: { star: 'Trụ', deity: 'Lục Hợp' },
  SW: { star: 'Tâm', deity: 'Câu Trận' },
  E: { star: 'Anh', deity: 'Đằng Xà' },
  W: { star: 'Bồng', deity: 'Chu Tước' },
  NE: { star: 'Phụ', deity: 'Trực Phù' },
  N: { star: 'Xung', deity: 'Cửu Thiên' },
  NW: { star: 'Nhâm', deity: 'Cửu Địa' },
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

const ne = chart.palaces[SLOT_TO_PALACE.NE];
assert.equal(Boolean(ne.trucPhu), true, 'Trực Phù must be at NE for 2026-03-03 16:05');

console.log('ASSERTIONS: OK');
