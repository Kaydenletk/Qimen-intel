import assert from 'node:assert/strict';
import { findUsefulGod } from '../src/core/dungthan.js';

function makePalace(overrides = {}) {
  return {
    mon: { name: 'Đỗ Môn', short: 'Đỗ' },
    star: { name: 'Thiên Trụ', short: 'Trụ' },
    than: { name: 'Câu Trận' },
    can: { name: 'Quý' },
    khongVong: false,
    dichMa: false,
    trucPhu: false,
    trucSu: false,
    ...overrides,
  };
}

const chart = {
  solarTerm: { name: 'Kinh Trập' },
  palaces: {
    1: makePalace(),
    2: makePalace({ mon: { name: 'Sinh Môn', short: 'Sinh' }, can: { name: 'Mậu' }, than: { name: 'Lục Hợp' }, star: { name: 'Thiên Tâm', short: 'Tâm' } }),
    3: makePalace({ mon: { name: 'Khai Môn', short: 'Khai' }, can: { name: 'Kỷ' } }),
    4: makePalace(),
    5: {},
    6: makePalace(),
    7: makePalace(),
    8: makePalace(),
    9: makePalace(),
  },
};

const result = findUsefulGod('tai-van', chart);

assert.equal(result.usefulGodPalace, 2, 'tai-van phải ưu tiên cung có Mậu + Sinh Môn');
assert.ok(result.reasons.some(reason => /Mậu/.test(reason)), 'reasons phải ghi nhận Mậu là trục vốn');
assert.ok(result.reasons.some(reason => /Sinh Môn/.test(reason)), 'reasons phải ghi nhận Sinh Môn là trục lợi nhuận');

console.log('dungthan-wealth-standard.mjs: OK');
