import assert from 'node:assert/strict';
import { buildFullChart } from '../src/core/flying.js';
import { ORDER, SLOT_TO_PALACE } from '../src/core/palaceLayout.js';

const DATE = new Date('2026-03-03T12:00:00');
const HOUR = '5';

// Golden fixture frozen from the current Web1 reference board.
// Visual order: Đông Nam → Nam → Tây Nam → Đông → Trung Cung → Tây → Đông Bắc → Bắc → Tây Bắc
const WEB1_REFERENCE = {
  SE: { palace: 4, star: 'Bồng', sentStar: null, door: 'Thương', deity: 'Trực Phù', heaven: 'Mậu', earth: 'Tân', phi: 9, trucPhu: true, trucSu: false },
  S: { palace: 9, star: 'Nhậm', sentStar: null, door: 'Đỗ', deity: 'Đằng Xà', heaven: 'Bính', earth: 'Ất', phi: 5, trucPhu: false, trucSu: false },
  SW: { palace: 2, star: 'Xung', sentStar: null, door: 'Cảnh', deity: 'Thái Âm', heaven: 'Canh', earth: 'Kỷ', phi: 7, trucPhu: false, trucSu: false },
  E: { palace: 3, star: 'Tâm', sentStar: null, door: 'Sinh', deity: 'Cửu Thiên', heaven: 'Quý', earth: 'Canh', phi: 8, trucPhu: false, trucSu: false },
  C: { palace: 5, star: null, sentStar: null, door: null, deity: null, heaven: null, earth: 'Nhâm', phi: 1, trucPhu: false, trucSu: false },
  W: { palace: 7, star: 'Phụ', sentStar: null, door: 'Tử', deity: 'Lục Hợp', heaven: 'Tân', earth: 'Đinh', phi: 3, trucPhu: false, trucSu: false },
  NE: { palace: 8, star: 'Trụ', sentStar: null, door: 'Hưu', deity: 'Cửu Địa', heaven: 'Đinh', earth: 'Bính', phi: 4, trucPhu: false, trucSu: true },
  N: { palace: 1, star: 'Nhuế', sentStar: 'Cầm', door: 'Khai', deity: 'Chu Tước', heaven: 'Kỷ', earth: 'Mậu', phi: 6, trucPhu: false, trucSu: false },
  NW: { palace: 6, star: 'Anh', sentStar: null, door: 'Kinh', deity: 'Câu Trận', heaven: 'Ất', earth: 'Quý', phi: 2, trucPhu: false, trucSu: false },
};

const chart = buildFullChart(DATE, HOUR);
const mismatches = [];
const normalizeValue = value => value === 'Nhâm' ? 'Nhậm' : value;

for (const slot of ORDER) {
  const palaceNum = SLOT_TO_PALACE[slot];
  const palace = chart.palaces[palaceNum];
  const expected = WEB1_REFERENCE[slot];

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

assert.equal(chart.trucPhuPalace, 4, 'Trực Phù phải ở Đông Nam / P4 theo web1');
assert.equal(chart.trucSuPalace, 8, 'Trực Sử phải ở Đông Bắc / P8 theo web1');
assert.equal(mismatches.length, 0, 'Chart vẫn còn mismatch so với web1 golden fixture');

console.log('WEB1 GOLDEN: OK');
