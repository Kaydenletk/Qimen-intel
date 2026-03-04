import assert from 'node:assert/strict';
import { analyze } from '../src/index.js';

const DATE = new Date('2026-03-03T12:00:00');
const HOUR = 5;

const SECTOR_ORDER = ['SE', 'S', 'SW', 'E', 'W', 'NE', 'N', 'NW'];
const DIR_ALIASES = {
  SE: ['SE', 'Dong Nam', 'Đông Nam', 'Tốn'],
  S: ['S', 'Nam', 'Ly'],
  SW: ['SW', 'Tay Nam', 'Tây Nam', 'Khôn'],
  E: ['E', 'Dong', 'Đông', 'Chấn'],
  W: ['W', 'Tay', 'Tây', 'Đoài'],
  NE: ['NE', 'Dong Bac', 'Đông Bắc', 'Cấn'],
  N: ['N', 'Bac', 'Bắc', 'Khảm'],
  NW: ['NW', 'Tay Bac', 'Tây Bắc', 'Càn'],
  C: ['C', 'Center', 'Trung Tam', 'Trung Tâm', 'Trung'],
};

const SELFPLUS_DEITY_ALIAS = {
  'Bạch Hổ': 'Câu Trần',
  'Huyền Vũ': 'Chu Tước',
};

const starShort = pal => (pal?.hasCam ? 'Cầm' : (pal?.star?.short || '—'));
const deitySelfPlus = pal => SELFPLUS_DEITY_ALIAS[pal?.than?.name] || pal?.than?.name || '—';

function buildDirToPalaceNum(chart) {
  const dirToPalaceNum = {};
  for (let p = 1; p <= 9; p++) {
    const pal = chart.palaces[p];
    if (!pal?.dir) continue;
    dirToPalaceNum[pal.dir] = p;
  }
  return dirToPalaceNum;
}

function palaceForSlot(chart, slot) {
  if (slot === 'C') return 5;
  const dirToPalaceNum = buildDirToPalaceNum(chart);
  return (DIR_ALIASES[slot] || []).map(k => dirToPalaceNum[k]).find(Boolean);
}

function printDirectionTable(chart) {
  console.log('\nTABLE_BY_DIRECTION');
  console.log('dir|p|door|star|deity|heaven|earth|trucSu|trucPhu|day|hour');
  for (const slot of SECTOR_ORDER) {
    const p = palaceForSlot(chart, slot);
    const pal = chart.palaces[p];
    console.log([
      slot,
      p,
      pal?.mon?.short || '—',
      starShort(pal),
      deitySelfPlus(pal),
      pal?.can?.name || '—',
      pal?.earthStem || '—',
      pal?.trucSu ? 'Y' : '',
      pal?.trucPhu ? 'Y' : '',
      pal?.isNgayCan ? 'Y' : '',
      pal?.isGioCan ? 'Y' : '',
    ].join('|'));
  }
  const c = chart.palaces[5];
  console.log([
    'C',
    5,
    c?.mon?.short || '—',
    starShort(c),
    deitySelfPlus(c),
    c?.can?.name || '—',
    c?.earthStem || '—',
    c?.trucSu ? 'Y' : '',
    c?.trucPhu ? 'Y' : '',
    c?.isNgayCan ? 'Y' : '',
    c?.isGioCan ? 'Y' : '',
  ].join('|'));
}

function printPalaceTable(chart) {
  console.log('\nTABLE_BY_PALACE');
  console.log('p|dir|door|star|deity|heaven|earth|trucSu|trucPhu|day|hour');
  for (let p = 1; p <= 9; p++) {
    const pal = chart.palaces[p];
    console.log([
      p,
      pal?.dir || '—',
      pal?.mon?.short || '—',
      starShort(pal),
      deitySelfPlus(pal),
      pal?.can?.name || '—',
      pal?.earthStem || '—',
      pal?.trucSu ? 'Y' : '',
      pal?.trucPhu ? 'Y' : '',
      pal?.isNgayCan ? 'Y' : '',
      pal?.isGioCan ? 'Y' : '',
    ].join('|'));
  }
}

function slotSnapshot(chart, slot) {
  const p = palaceForSlot(chart, slot);
  const pal = chart.palaces[p];
  return {
    p,
    door: pal?.mon?.short || '—',
    star: starShort(pal),
    deity: deitySelfPlus(pal),
    heavenStem: pal?.can?.name || '—',
    earthStem: pal?.earthStem || '—',
    trucSu: Boolean(pal?.trucSu),
    trucPhu: Boolean(pal?.trucPhu),
    isNgayCan: Boolean(pal?.isNgayCan),
    isGioCan: Boolean(pal?.isGioCan),
  };
}

const { chart } = analyze(DATE, HOUR);

console.log(
  'CASE',
  DATE.toISOString().slice(0, 10),
  HOUR,
  `${chart.gioPillar.stemName}${chart.gioPillar.branchName}`,
  'Ju',
  chart.cucSo,
  chart.isDuong ? 'Dương' : 'Âm'
);
console.log('Day', `${chart.dayPillar.stemName}${chart.dayPillar.branchName}`);
console.log('Void', chart.khongVong.void1.name, chart.khongVong.void2.name);
console.log('Horse', chart.dichMa?.horseBranch, chart.dichMa?.dir, chart.dichMa?.palace);

printDirectionTable(chart);
printPalaceTable(chart);

// Base-case assertions
assert.equal(chart.cucSo, 3, 'Ju must be 3');
assert.equal(chart.isDuong, true, 'Ju must be Dương');
assert.equal(chart.dayPillar.stemName, 'Bính');
assert.equal(chart.dayPillar.branchName, 'Tý');
assert.equal(chart.gioPillar.stemName, 'Tân');
assert.equal(chart.gioPillar.branchName, 'Mão');
assert.equal(chart.khongVong.void1.name, 'Ngọ');
assert.equal(chart.khongVong.void2.name, 'Mùi');
assert.equal(chart.dichMa?.horseBranch, 'Tỵ');
assert.equal(chart.dichMa?.palace, 4);
assert.equal(chart.trucSuPalace, 1, 'Trực Sử must land at N/Khảm for this case');
assert.equal(chart.trucPhuPalace, 6, 'Trực Phù must land at NW/Càn for this case');

// NEO must-match assertions (door routing with chuyển bàn outer ring)
const nw = slotSnapshot(chart, 'NW');
assert.equal(nw.deity, 'Trực Phù');
assert.equal(nw.door, 'Cảnh');
assert.equal(nw.star, 'Cầm');
assert.equal(nw.trucPhu, true);

const ne = slotSnapshot(chart, 'NE');
assert.equal(ne.heavenStem, 'Tân');
assert.equal(ne.door, 'Kinh');
assert.equal(ne.star, 'Tâm');
assert.equal(ne.deity, 'Thái Âm');

const e = slotSnapshot(chart, 'E');
assert.equal(e.heavenStem, 'Bính');
assert.equal(e.door, 'Khai');
assert.equal(e.star, 'Bồng');
assert.equal(e.deity, 'Lục Hợp');
assert.equal(e.trucSu, false);

const n = slotSnapshot(chart, 'N');
assert.equal(n.door, 'Tử');
assert.equal(n.star, 'Trụ');
assert.equal(n.deity, 'Đằng Xà');
assert.equal(n.trucSu, true);

const se = slotSnapshot(chart, 'SE');
assert.equal(se.door, 'Hưu');
assert.equal(se.star, 'Nhâm');
assert.equal(se.deity, 'Câu Trần');

const s = slotSnapshot(chart, 'S');
assert.equal(s.door, 'Sinh');
assert.equal(s.star, 'Xung');
assert.equal(s.deity, 'Chu Tước');

const sw = slotSnapshot(chart, 'SW');
assert.equal(sw.door, 'Thương');
assert.equal(sw.star, 'Phụ');
assert.equal(sw.deity, 'Cửu Địa');

const w = slotSnapshot(chart, 'W');
assert.equal(w.door, 'Đỗ');
assert.equal(w.star, 'Anh');
assert.equal(w.deity, 'Cửu Thiên');

console.log('\nASSERTIONS: OK');
