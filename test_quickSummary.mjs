/**
 * Test file cho quickSummary.js
 * Chạy: node test_quickSummary.mjs
 */

import {
  generateQuickSummary,
  getElementTooltip,
  ELEMENT_MEANINGS,
  TOPIC_DICTIONARIES,
} from './src/logic/dungThan/quickSummary.js';

console.log('══════════════════════════════════════════════════════════════');
console.log('TEST 1: Quẻ Tốt - Tài Lộc (Cửa Sinh + Sao Tâm + Thần Trực Phù)');
console.log('══════════════════════════════════════════════════════════════');

const result1 = generateQuickSummary({
  mon: 'Sinh Môn',
  tinh: 'Thiên Tâm',
  than: 'Trực Phù',
  topic: 'tai-van',
  direction: 'Tây Bắc',
  palaceName: 'Càn',
});

console.log('Summary:', result1.summary);
console.log('Verdict:', result1.emoji, result1.verdict);
console.log('OneLiner:', result1.oneLiner);
console.log('\nBreakdown:');
console.log('  Môn:', result1.breakdown.mon.analogy, '-', result1.breakdown.mon.meaning);
console.log('  Tinh:', result1.breakdown.tinh.analogy, '-', result1.breakdown.tinh.meaning);
console.log('  Thần:', result1.breakdown.than.analogy, '-', result1.breakdown.than.meaning);

console.log('\n══════════════════════════════════════════════════════════════');
console.log('TEST 2: Quẻ Cẩn Trọng - Tài Lộc (Cửa Thương + Sao Bồng + Thần Đằng Xà)');
console.log('══════════════════════════════════════════════════════════════');

const result2 = generateQuickSummary({
  mon: 'Thương Môn',
  tinh: 'Thiên Bồng',
  than: 'Đằng Xà',
  topic: 'tai-van',
  direction: 'Đông',
  palaceName: 'Chấn',
});

console.log('Summary:', result2.summary);
console.log('Verdict:', result2.emoji, result2.verdict);
console.log('OneLiner:', result2.oneLiner);

console.log('\n══════════════════════════════════════════════════════════════');
console.log('TEST 3: Quẻ Tình Duyên (Cửa Hưu + Sao Phụ + Thần Lục Hợp)');
console.log('══════════════════════════════════════════════════════════════');

const result3 = generateQuickSummary({
  mon: 'Hưu Môn',
  tinh: 'Thiên Phụ',
  than: 'Lục Hợp',
  topic: 'tinh-duyen',
  direction: 'Bắc',
  palaceName: 'Khảm',
});

console.log('Summary:', result3.summary);
console.log('Verdict:', result3.emoji, result3.verdict);
console.log('OneLiner:', result3.oneLiner);

console.log('\n══════════════════════════════════════════════════════════════');
console.log('TEST 4: Tooltip cho Đằng Xà');
console.log('══════════════════════════════════════════════════════════════');

const tooltip = getElementTooltip('than', 'Đằng Xà');
console.log('Title:', tooltip.title);
console.log('Analogy:', tooltip.analogy);
console.log('Description:', tooltip.description);
console.log('Nature:', tooltip.nature);

console.log('\n══════════════════════════════════════════════════════════════');
console.log('TEST 5: Chủ đề không có trong dictionary (fallback)');
console.log('══════════════════════════════════════════════════════════════');

const result5 = generateQuickSummary({
  mon: 'Khai Môn',
  tinh: 'Thiên Xung',
  than: 'Cửu Thiên',
  topic: 'xuat-hanh', // Chưa có dictionary riêng
});

console.log('Summary:', result5.summary);
console.log('Verdict:', result5.emoji, result5.verdict);

console.log('\n══════════════════════════════════════════════════════════════');
console.log('✅ All tests completed!');
console.log('══════════════════════════════════════════════════════════════');
