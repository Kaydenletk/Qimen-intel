import assert from 'node:assert/strict';
import { buildFullChart, buildRotatingChart } from '../src/core/flying.js';

function earthStemMap(chartResult) {
  return Object.fromEntries(
    Array.from({ length: 9 }, (_, index) => {
      const palace = index + 1;
      return [palace, chartResult.palaces[palace]?.earthStem ?? null];
    })
  );
}

const yangChart = buildRotatingChart(4, true, 8, 8, 5, 3, 'Nhâm Thân');
assert.deepEqual(
  earthStemMap(yangChart),
  {
    1: 'Đinh',
    2: 'Bính',
    3: 'Ất',
    4: 'Mậu',
    5: 'Kỷ',
    6: 'Canh',
    7: 'Tân',
    8: 'Nhâm',
    9: 'Quý',
  },
  'Địa Bàn Dương phải bay tiến tuyến tính theo số cung và khởi Mậu tại đúng Cục số'
);

const yinChart = buildRotatingChart(1, false, 7, 11, 0, 0, 'Tân Hợi');
assert.deepEqual(
  earthStemMap(yinChart),
  {
    1: 'Mậu',
    2: 'Ất',
    3: 'Bính',
    4: 'Đinh',
    5: 'Quý',
    6: 'Nhâm',
    7: 'Tân',
    8: 'Canh',
    9: 'Kỷ',
  },
  'Địa Bàn Âm phải bay lùi tuyến tính theo số cung'
);

const luoshuGolden = buildFullChart(new Date('2026-03-07T09:24:00'), '9');
for (const palace of [1, 2, 3, 4, 6, 7, 8, 9]) {
  const currentPalace = luoshuGolden.palaces[palace];
  const sourcePalace = currentPalace?.star?.palace;
  assert.ok(sourcePalace, `P${palace} phải có sao để kiểm chứng Thiên Bàn`);
  assert.equal(
    currentPalace?.can?.name,
    luoshuGolden.palaces[sourcePalace]?.earthStem,
    `P${palace} phải mang Thiên Can từ quê gốc của sao`
  );
}

assert.equal(
  luoshuGolden.palaces[4]?.sentCan?.name,
  luoshuGolden.palaces[5]?.earthStem,
  'Thiên Cầm phải mang Địa Can Trung Cung sang cung đáp của Thiên Nhuế'
);
assert.equal(luoshuGolden.palaces[5]?.can, null, 'Trung Cung phải rỗng trên Thiên Bàn');
assert.notEqual(
  luoshuGolden.palaces[1]?.can?.name,
  luoshuGolden.palaces[1]?.earthStem,
  'Thiên Bàn mới không được vô tình co lại thành Thiên Can trùng Địa Can ở mọi cung'
);

const selfPlusCase = buildFullChart(new Date('2026-03-11T13:34:00'), '13');
assert.deepEqual(
  earthStemMap(selfPlusCase),
  {
    1: 'Tân',
    2: 'Nhâm',
    3: 'Quý',
    4: 'Đinh',
    5: 'Bính',
    6: 'Ất',
    7: 'Mậu',
    8: 'Kỷ',
    9: 'Canh',
  },
  'Case Self-plus 2026-03-11 13:34 phải có Địa Bàn đúng thứ tự tuyến tính từ Dương 7 Cục'
);
assert.equal(selfPlusCase.trucPhuPalace, 1, 'Case Self-plus 13:34 phải có Trực Phù ở P1');
assert.equal(selfPlusCase.trucSuPalace, 2, 'Case Self-plus 13:34 phải có Trực Sử ở P2');
assert.equal(selfPlusCase.palaces[1]?.star?.short, 'Trụ', 'P1 phải là Thiên Trụ theo bàn Self-plus');
assert.equal(selfPlusCase.palaces[1]?.mon?.short, 'Sinh', 'P1 phải là Sinh Môn theo bàn Self-plus');
assert.equal(selfPlusCase.palaces[1]?.can?.name, 'Mậu', 'P1 phải mang Thiên Can Mậu theo bàn Self-plus');
assert.equal(selfPlusCase.palaces[2]?.star?.short, 'Phụ', 'P2 phải là Thiên Phụ theo bàn Self-plus');
assert.equal(selfPlusCase.palaces[2]?.mon?.short, 'Kinh', 'P2 phải là Kinh Môn theo bàn Self-plus');
assert.equal(selfPlusCase.palaces[2]?.can?.name, 'Đinh', 'P2 phải mang Thiên Can Đinh theo bàn Self-plus');

console.log('ASSERTIONS: OK');
