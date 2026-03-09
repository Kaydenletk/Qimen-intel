import assert from 'node:assert/strict';
import { buildKimonPrompt } from '../src/logic/kimon/promptBuilder.js';
import { buildStrategyPrompt } from '../src/logic/kimon/strategyPrompt.js';

// 1. Mô phỏng payload qmdjData đã được server.js enrich và chuẩn bị gửi cho AI
const mockQmdjData = {
  overallScore: 8,
  selectedTopicKey: 'tai-van',
  selectedTopicMarkersForAI: {
    rootCausePalace: 6,
    rootCausePalaceName: 'Càn',
    userPalace: 9,
    userPalaceName: 'Ly',
    actionPalace: 1,
    actionPalaceName: 'Khảm',
    blockerFlags: ['Đỗ Môn', 'Không Vong']
  },
  selectedTopicNguHanh: {
    relationship: 'user_controls_target',
    promptBlock: '[TƯƠNG QUAN LỰC LƯỢNG] Nhật Can Bính tại Hỏa (cung 9) khắc Dụng Thần tại Kim (cung 6). Người hỏi đang cố gắng kiểm soát hoàn cảnh một cách mệt mỏi.'
  }
};

try {
  // 2. Test hàm buildKimonPrompt (dùng cho Companion mode hoặc luồng cơ bản)
  const normalPrompt = buildKimonPrompt({ qmdjData: mockQmdjData, userContext: 'Dự án sao rồi?' });
  
  assert.ok(normalPrompt.includes('[BẢN ĐỒ 4 BƯỚC CHO AI]'), 'Lỗi: Thiếu tiêu đề Bản đồ 4 bước');
  assert.ok(normalPrompt.includes('Bước 1 (Gốc rễ): Đọc cung 6'), 'Lỗi: Map sai tọa độ rootCausePalace');
  assert.ok(normalPrompt.includes('Bước 3 (Tâm lý): Đọc cung 9'), 'Lỗi: Map sai tọa độ userPalace');
  assert.ok(normalPrompt.includes('[TƯƠNG QUAN LỰC LƯỢNG]'), 'Lỗi: Thiếu block tương quan ngũ hành');
  assert.ok(normalPrompt.includes('khắc Dụng Thần'), 'Lỗi: Thiếu keyword ngũ hành sinh/khắc');
  assert.ok(normalPrompt.includes('Đỗ Môn'), 'Lỗi: Thiếu Blocker flags');

  // 3. Test hàm buildStrategyPrompt (dùng cho luồng Kymon Pro)
  const strategyResult = buildStrategyPrompt({ qmdjData: mockQmdjData, userContext: 'Chiến lược đàm phán', topicKey: 'tai-van' });
  
  assert.ok(strategyResult.systemPrompt.includes('[SYNTHESIS RULES - QUY TẮC TỔNG HỢP NÂNG CAO]'), 'Lỗi: System prompt chưa update luật Synthesis');
  assert.ok(strategyResult.userPrompt.includes('[BẢN ĐỒ 4 BƯỚC CHO AI]'), 'Lỗi: Strategy user prompt thiếu Bản đồ 4 bước');
  assert.ok(strategyResult.userPrompt.includes('khắc Dụng Thần'), 'Lỗi: Strategy user prompt thiếu Tương quan ngũ hành');

  console.log('✅ prompt-synthesis-integration.mjs — ALL TESTS PASSED! Data pipeline nối LLM hoàn hảo.');
} catch (error) {
  console.error('❌ TEST FAILED:', error.message);
  process.exit(1);
}
