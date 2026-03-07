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
assert.equal(chart.trucSuPalace, 1, 'Trực Sử must land at Bắc / Khảm for this case');
assert.equal(chart.trucPhuPalace, 4, 'Trực Phù must land at SE/Tốn for this case');

// Reference chart assertions (Tuần Thủ anchored Chuyển Bàn)
const se = slotSnapshot(chart, 'SE');
assert.equal(se.door, 'Tử');
assert.equal(se.star, 'Xung');
assert.equal(se.deity, 'Trực Phù');
assert.equal(se.trucPhu, true);

const s = slotSnapshot(chart, 'S');
assert.equal(s.door, 'Kinh');
assert.equal(s.star, 'Phụ');
assert.equal(s.deity, 'Đằng Xà');

const sw = slotSnapshot(chart, 'SW');
assert.equal(sw.door, 'Khai');
assert.equal(sw.star, 'Anh');
assert.equal(sw.deity, 'Thái Âm');

const e = slotSnapshot(chart, 'E');
assert.equal(e.door, 'Cảnh');
assert.equal(e.star, 'Nhâm');
assert.equal(e.deity, 'Cửu Thiên');

const w = slotSnapshot(chart, 'W');
assert.equal(w.door, 'Hưu');
assert.equal(w.star, 'Cầm');
assert.equal(w.deity, 'Lục Hợp');

const ne = slotSnapshot(chart, 'NE');
assert.equal(ne.door, 'Đỗ');
assert.equal(ne.star, 'Bồng');
assert.equal(ne.deity, 'Cửu Địa');
assert.equal(ne.trucSu, false);

const n = slotSnapshot(chart, 'N');
assert.equal(n.door, 'Thương');
assert.equal(n.star, 'Tâm');
assert.equal(n.deity, 'Chu Tước');
assert.equal(n.trucSu, true);

const nw = slotSnapshot(chart, 'NW');
assert.equal(nw.door, 'Sinh');
assert.equal(nw.star, 'Trụ');
assert.equal(nw.deity, 'Câu Trận');

console.log('\nASSERTIONS: OK');
