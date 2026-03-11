import assert from 'node:assert/strict';
import { buildFullChart } from '../src/core/flying.js';
import { ORDER, SLOT_TO_PALACE } from '../src/core/palaceLayout.js';

const DATE = new Date('2026-03-07T09:24:00');
const HOUR = '9';

// Golden fixture frozen after the linear Self-plus Earth Plate + star-carried Heaven Plate migration.
// Visual order: Đông Nam → Nam → Tây Nam → Đông → Trung Cung → Tây → Đông Bắc → Bắc → Tây Bắc
const LUOSHU_REFERENCE = {
  SE: { palace: 4, star: 'Nhuế', sentStar: 'Cầm', door: 'Cảnh', deity: 'Trực Phù', heaven: 'Kỷ', earth: 'Tân', phi: 9, trucPhu: true, trucSu: false },
  S: { palace: 9, star: 'Trụ', sentStar: null, door: 'Tử', deity: 'Đằng Xà', heaven: 'Đinh', earth: 'Ất', phi: 5, trucPhu: false, trucSu: true },
  SW: { palace: 2, star: 'Tâm', sentStar: null, door: 'Kinh', deity: 'Thái Âm', heaven: 'Quý', earth: 'Kỷ', phi: 7, trucPhu: false, trucSu: false },
  E: { palace: 3, star: 'Anh', sentStar: null, door: 'Đỗ', deity: 'Cửu Thiên', heaven: 'Ất', earth: 'Canh', phi: 8, trucPhu: false, trucSu: false },
  C: { palace: 5, star: null, sentStar: null, door: null, deity: null, heaven: null, earth: 'Nhâm', phi: 1, trucPhu: false, trucSu: false },
  W: { palace: 7, star: 'Bồng', sentStar: null, door: 'Khai', deity: 'Lục Hợp', heaven: 'Mậu', earth: 'Đinh', phi: 3, trucPhu: false, trucSu: false },
  NE: { palace: 8, star: 'Phụ', sentStar: null, door: 'Thương', deity: 'Cửu Địa', heaven: 'Tân', earth: 'Bính', phi: 4, trucPhu: false, trucSu: false },
  N: { palace: 1, star: 'Xung', sentStar: null, door: 'Sinh', deity: 'Chu Tước', heaven: 'Canh', earth: 'Mậu', phi: 6, trucPhu: false, trucSu: false },
  NW: { palace: 6, star: 'Nhâm', sentStar: null, door: 'Hưu', deity: 'Câu Trận', heaven: 'Bính', earth: 'Quý', phi: 2, trucPhu: false, trucSu: false },
};

const chart = buildFullChart(DATE, HOUR);
const mismatches = [];
const normalizeValue = value => value === 'Nhâm' ? 'Nhậm' : value;

for (const slot of ORDER) {
  const palaceNum = SLOT_TO_PALACE[slot];
  const palace = chart.palaces[palaceNum];
  const expected = LUOSHU_REFERENCE[slot];

  const actual = {
    palace: palaceNum,
    star: palace?.star?.short ?? null,
    sentStar: palace?.sentStar?.short ?? null,
    door: palace?.mon?.short ?? null,
    deity: palace?.than?.name ?? null,
    heaven: palace?.can?.name ?? null,
    earth: palace?.earthStem ?? null,
    phi: palace?.phiTinhNum ?? null,
    trucPhu: Boolean(palace?.trucPhu),
    trucSu: Boolean(palace?.trucSu),
  };

  const fieldMismatches = Object.keys(expected).filter(key => normalizeValue(actual[key]) !== normalizeValue(expected[key]));
  if (fieldMismatches.length) {
    mismatches.push({
      slot,
      palace: palaceNum,
      fields: fieldMismatches.map(key => `${key}: got=${actual[key] ?? 'null'} expected=${expected[key] ?? 'null'}`),
    });
  }
}

console.log('=== WEB1 GOLDEN DIFF ===');
for (const slot of ORDER) {
  const palaceNum = SLOT_TO_PALACE[slot];
  const hit = mismatches.find(item => item.slot === slot);
  if (!hit) {
    console.log(`${slot}|P${palaceNum}|OK`);
    continue;
  }
  console.log(`${slot}|P${palaceNum}|${hit.fields.join(' ; ')}`);
}

assert.equal(chart.yearPillar.stemName, 'Bính');
assert.equal(chart.yearPillar.branchName, 'Ngọ');
assert.equal(chart.monthPillar.stemName, 'Tân');
assert.equal(chart.monthPillar.branchName, 'Mão');
assert.equal(chart.dayPillar.stemName, 'Canh');
assert.equal(chart.dayPillar.branchName, 'Thìn');
assert.equal(chart.gioPillar.stemName, 'Tân');
assert.equal(chart.gioPillar.branchName, 'Tỵ');
assert.equal(chart.trucPhuPalace, 4, 'Trực Phù phải ở Đông Nam / P4 theo golden mới');
assert.equal(chart.trucSuPalace, 9, 'Trực Sử phải ở Nam / P9 theo golden mới');
assert.equal(mismatches.length, 0, 'Chart vẫn còn mismatch so với Luo Shu golden fixture');

console.log('LUOSHU GOLDEN: OK');
