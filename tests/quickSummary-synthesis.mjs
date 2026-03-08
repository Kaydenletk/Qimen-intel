import assert from 'node:assert/strict';
import { generateQuickSummary } from '../src/logic/dungThan/quickSummary.js';

const career = generateQuickSummary({
  mon: 'Khai Môn',
  tinh: 'Thiên Bồng',
  than: 'Trực Phù',
  topic: 'su-nghiep',
  direction: 'Nam',
  palaceName: 'Ly',
});

assert.match(career.muuKe, /đề xuất một bản kế hoạch mới/i, 'Sự nghiệp + Khai phải có mưu kế cụ thể');
assert.match(career.counter, /Hưu Môn|tĩnh lặng/i, 'Thiên Bồng phải có counter-measure');
assert.match(career.logicRaw, /su-nghiep/i, 'logicRaw phải chứa topic');
assert.match(career.logicRaw, /Thiên Bồng/i, 'logicRaw phải chứa tinh');

const study = generateQuickSummary({
  mon: 'Cảnh Môn',
  tinh: 'Thiên Phụ',
  than: 'Cửu Thiên',
  topic: 'hoc-tap',
  direction: 'Đông',
  palaceName: 'Chấn',
});

assert.match(study.summary, /học tập/i, 'Hoc-tap summary should be generated');
assert.match(study.muuKe, /đề cương|trọng điểm/i, 'Hoc-tap + Cảnh phải có mưu kế ôn tập');
assert.equal(typeof study.logicRaw, 'string');

console.log('quickSummary-synthesis.mjs: OK');
