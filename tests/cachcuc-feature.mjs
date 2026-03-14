import assert from 'node:assert/strict';
import { evaluateCachCuc } from '../src/core/cachcuc.js';
import { evaluateSpecialPatterns } from '../src/core/specialPatterns.js';
import { buildRotatingChart } from '../src/core/flying.js';
import { KYMON_PRO_SYSTEM_PROMPT } from '../src/logic/kimon/strategyPrompt.js';
import { buildDisplayChart } from '../src/ui/displayMappings.js';

const thanhLong = evaluateCachCuc('Mậu', 'Bính');
assert.equal(thanhLong.length, 1);
assert.equal(thanhLong[0].name, 'Thanh Long Phản Thủ');
assert.equal(thanhLong[0].type, 'Đại Cát');

const phiDieu = evaluateCachCuc('Bính', 'Mậu');
assert.equal(phiDieu.length, 1);
assert.equal(phiDieu[0].name, 'Phi Điểu Điệt Huyệt');

const thanhLongBiThuong = evaluateCachCuc('Mậu', 'Canh');
assert.equal(thanhLongBiThuong.length, 1);
assert.equal(thanhLongBiThuong[0].name, 'Thanh Long bị thương');
assert.equal(thanhLongBiThuong[0].scoreDelta, -3);

const bachHo = evaluateCachCuc('Tân', 'Ất');
assert.equal(bachHo.length, 1);
assert.equal(bachHo[0].name, 'Bạch Hổ Xương Cuồng');
assert.equal(bachHo[0].type, 'Đại Hung');

assert.deepEqual(evaluateCachCuc('Nhâm', 'Quý'), []);
assert.deepEqual(evaluateCachCuc(null, 'Quý'), []);

const chart = buildRotatingChart(4, true, 8, 8, 5, 3, 'Nhâm Thân');
assert.ok(Array.isArray(chart.palaces[2].cachCuc), 'P2 phải có mảng cachCuc');
assert.ok(Array.isArray(chart.palaces[4].cachCuc), 'P4 phải có mảng cachCuc');
assert.equal(chart.palaces[2].cachCuc[0]?.name, 'Thái Bạch Nhập Huỳnh Hoặc');
assert.equal(chart.palaces[4].cachCuc[0]?.name, 'Phi Điểu Điệt Huyệt');
assert.deepEqual(chart.palaces[5].cachCuc, []);

const displayChart = buildDisplayChart(chart);
assert.equal(displayChart.palaces[2].cachCucLabels[0]?.internalName, 'Thái Bạch Nhập Huỳnh Hoặc');
assert.match(displayChart.palaces[2].cachCucLabels[0]?.displayShort || '', /🔥/);
assert.ok(Array.isArray(displayChart.palaces[2].patternLabels), 'Display palace phải có patternLabels');

const specialPatternChart = {
  dayPillar: { stemName: 'Bính' },
  palaces: {
    1: {},
    2: {},
    3: {},
    4: {
      can: { name: 'Nhâm' },
      mon: { short: 'Kinh', name: 'Kinh Môn' },
      than: { name: 'Chu Tước' },
      khongVong: true,
      cachCuc: [],
    },
    5: {},
    6: {},
    7: {},
    8: {},
    9: {
      can: { name: 'Mậu' },
      earthStem: 'Canh',
      mon: { short: 'Khai', name: 'Khai Môn' },
      than: { name: 'Cửu Địa' },
      cachCuc: [],
    },
  },
};
const specialPatternSummary = evaluateSpecialPatterns(specialPatternChart);
assert.equal(specialPatternSummary.byPalace[9][0]?.name, 'Thanh Long bị thương');
assert.ok(specialPatternSummary.byPalace[4].some(item => item.name === 'Thiên La'));
assert.ok(specialPatternSummary.byPalace[4].some(item => item.name === 'Chu Tước khẩu thiệt ảo'));
assert.ok(specialPatternSummary.byPalace[6].some(item => item.name === 'Nhật kỳ nhập mộ'));

assert.match(KYMON_PRO_SYSTEM_PROMPT, /OVERRIDE RULE/i);
assert.match(KYMON_PRO_SYSTEM_PROMPT, /cachCuc/);
assert.match(KYMON_PRO_SYSTEM_PROMPT, /Thanh Long Phản Thủ/);
assert.match(KYMON_PRO_SYSTEM_PROMPT, /Không Vong thì Cách cục bị triệt lực trước/i);
assert.match(KYMON_PRO_SYSTEM_PROMPT, /PATTERN ĐỘNG LÀ HỆ THẦN KINH/i);
assert.match(KYMON_PRO_SYSTEM_PROMPT, /Chu Tước khẩu thiệt ảo/i);
assert.match(KYMON_PRO_SYSTEM_PROMPT, /Nhật kỳ nhập mộ/i);

console.log('✅ cachcuc-feature.mjs — all tests passed');
