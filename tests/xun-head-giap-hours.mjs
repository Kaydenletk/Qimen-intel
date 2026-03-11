import assert from 'node:assert/strict';
import { analyze, buildDisplayChart } from '../src/index.js';
import { getTuanThu, getXunInfo } from '../src/core/flying.js';
import { resolveHiddenStemForHourStem } from '../src/core/jiaHiddenStem.js';
import { resolveHourPalace, buildHourDiagnosticRecord } from '../src/core/temporalMarkers.js';

const giapTuat = getXunInfo('Giáp Tuất');
assert.equal(giapTuat.tuanName, 'Giáp Tuất');
assert.equal(giapTuat.leadStemName, 'Kỷ');
assert.equal(giapTuat.tuanBranchIdx, 10);

const giapTuatCompact = getXunInfo('GiápTuất');
assert.equal(giapTuatCompact.tuanName, 'Giáp Tuất');
assert.equal(giapTuatCompact.leadStemName, 'Kỷ');
assert.equal(giapTuatCompact.tuanBranchIdx, 10);

const giapThan = getXunInfo('Giáp Thân');
assert.equal(giapThan.tuanName, 'Giáp Thân');
assert.equal(giapThan.leadStemName, 'Canh');
assert.equal(giapThan.tuanBranchIdx, 8);

const tanTyTuanThu = getTuanThu(7, 5); // Tân Tỵ with 0-based indices
assert.equal(tanTyTuanThu.offset, 2);
assert.equal(tanTyTuanThu.tuanName, 'Giáp Tuất');
assert.equal(tanTyTuanThu.leadStemName, 'Kỷ');
assert.equal(tanTyTuanThu.tuanBranchIdx, 10);

const tanTyStringTuanThu = getTuanThu('Tân', 'Tỵ');
assert.equal(tanTyStringTuanThu.offset, 2);
assert.equal(tanTyStringTuanThu.tuanName, 'Giáp Tuất');
assert.equal(tanTyStringTuanThu.leadStemName, 'Kỷ');
assert.equal(tanTyStringTuanThu.tuanBranchIdx, 10);

const tanTiAliasTuanThu = getTuanThu('Tân', 'Tị');
assert.equal(tanTiAliasTuanThu.offset, 2);
assert.equal(tanTiAliasTuanThu.tuanName, 'Giáp Tuất');
assert.equal(tanTiAliasTuanThu.leadStemName, 'Kỷ');
assert.equal(tanTiAliasTuanThu.tuanBranchIdx, 10);

const tanTyNumericString = getTuanThu('7', '5');
assert.equal(tanTyNumericString.offset, 2);
assert.equal(tanTyNumericString.tuanName, 'Giáp Tuất');
assert.equal(tanTyNumericString.leadStemName, 'Kỷ');
assert.equal(tanTyNumericString.tuanBranchIdx, 10);

const invalidTuanThu = getTuanThu('abc', '???');
assert.equal(invalidTuanThu.leadStemName, 'Mậu');
assert.equal(invalidTuanThu.invalidInput, true);

const tanTiAlias = getXunInfo('Tân Tị');
assert.equal(tanTiAlias.tuanName, 'Giáp Tuất');
assert.equal(tanTiAlias.leadStemName, 'Kỷ');
assert.equal(tanTiAlias.tuanBranchIdx, 10);

const tanTiCompactAlias = getXunInfo('TânTị');
assert.equal(tanTiCompactAlias.tuanName, 'Giáp Tuất');
assert.equal(tanTiCompactAlias.leadStemName, 'Kỷ');
assert.equal(tanTiCompactAlias.tuanBranchIdx, 10);

const expectedHiddenStems = {
  Tý: 'Mậu',
  Tuất: 'Kỷ',
  Thân: 'Canh',
  Ngọ: 'Tân',
  Thìn: 'Nhâm',
  Dần: 'Quý',
};

for (const [branch, expectedStem] of Object.entries(expectedHiddenStems)) {
  assert.equal(
    resolveHiddenStemForHourStem('Giáp', branch),
    expectedStem,
    `Giáp ${branch} phải ẩn dưới ${expectedStem}`
  );
}

const DATE = new Date('2026-03-06T19:20:00');
const HOUR = 19;
const { chart } = analyze(DATE, HOUR);
const displayChart = buildDisplayChart(chart);
const hourDiagnostic = buildHourDiagnosticRecord(chart, HOUR);

assert.equal(chart.gioPillar.stemName, 'Giáp', 'Case phải là giờ Giáp');
assert.equal(chart.gioPillar.branchName, 'Tuất', 'Case phải là giờ Giáp Tuất');
assert.equal(chart.xunHour, 'Giáp Tuất', 'Xun giờ phải là Giáp Tuất');
assert.equal(chart.leadStem, 'Kỷ', 'Tuần Thủ của Giáp Tuất phải ẩn dưới Kỷ');
assert.equal(chart.leadStar, 'Thiên Nhuế', 'Giáp Tuất phải dẫn Trực Phù từ Thiên Nhuế khi Kỷ nằm ở P2 theo Self-plus');
assert.equal(chart.trucPhuPalace, 2, 'Trực Phù của case Giáp Tuất phải ở P2');
assert.equal(chart.trucSuPalace, 2, 'Trực Sử của case Giáp Tuất phải ở P2');
assert.equal(chart.isPhucAm, true, 'Giáp Tuất offset=0 phải rơi vào Phục Âm');
assert.equal(chart.leadDoor, 'Tử Môn', 'Giáp Tuất phải lấy cửa gốc tại cung Kỷ / P2 sau khi Địa Bàn xoay');
assert.equal(resolveHourPalace(chart), 2, 'resolveHourPalace(...) phải trả P2 cho giờ Giáp Tuất khi Kỷ nằm ở P2');
assert.equal(chart.hourMarkerPalace, 2, 'Cung Giờ phải ở P2');
assert.equal(chart.hourMarkerResolutionSource, 'heaven-stem', 'Cung Giờ phải resolve từ Heaven Plate');
assert.equal(hourDiagnostic.currentState, 'P2 Tây Nam', 'Summary chẩn đoán phải báo đúng Cung Giờ P2 Tây Nam');
assert.equal(chart.palaces[2]?.star?.short, 'Nhuế', 'P2 phải giữ nguyên Thiên Nhuế khi Phục Âm');
assert.equal(chart.palaces[2]?.mon?.short, 'Tử', 'P2 phải giữ nguyên Tử Môn khi Phục Âm');
assert.equal(Boolean(chart.palaces[2]?.trucPhu), true, 'P2 phải được đánh dấu Trực Phù');
assert.equal(Boolean(chart.palaces[2]?.trucSu), true, 'P2 phải được đánh dấu Trực Sử');
assert.equal(Boolean(chart.palaces[2]?.hourMarker), true, 'Badge Giờ phải xuất hiện ở P2');
assert.deepEqual(
  displayChart.palaces[2]?.temporalBadgeLabels?.map(label => label.displayShort),
  ['Ngày', 'Giờ'],
  'Display layer phải gắn đủ badge Ngày/Giờ vào đúng P2'
);

const expectedStars = {
  1: 'Bồng',
  2: 'Nhuế',
  3: 'Xung',
  4: 'Phụ',
  6: 'Tâm',
  7: 'Trụ',
  8: 'Nhâm',
  9: 'Anh',
};

const expectedDoors = {
  1: 'Hưu',
  2: 'Tử',
  3: 'Thương',
  4: 'Đỗ',
  6: 'Khai',
  7: 'Kinh',
  8: 'Sinh',
  9: 'Cảnh',
};

for (const palace of [1, 2, 3, 4, 6, 7, 8, 9]) {
  assert.equal(chart.palaces[palace]?.star?.short, expectedStars[palace], `P${palace} phải giữ nguyên sao gốc`);
  assert.equal(chart.palaces[palace]?.mon?.short, expectedDoors[palace], `P${palace} phải giữ nguyên môn gốc`);
  const sourcePalace = chart.palaces[palace]?.star?.palace;
  assert.equal(
    chart.palaces[palace]?.can?.name,
    chart.palaces[sourcePalace]?.earthStem,
    `P${palace} phải mang Thiên Can từ quê gốc của sao`
  );
}

assert.equal(chart.palaces[2]?.sentCan?.name, 'Nhâm', 'Thiên Can của Trung Cung phải ký gửi theo Thiên Cầm');

console.log('ASSERTIONS: OK');
