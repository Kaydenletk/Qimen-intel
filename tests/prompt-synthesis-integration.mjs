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
  
  assert.ok(normalPrompt.includes('[NEO NỘI BỘ CHO AI]'), 'Lỗi: Thiếu block Neo nội bộ');
  assert.ok(normalPrompt.includes('Neo Dụng Thần: cung 6'), 'Lỗi: Map sai tọa độ rootCausePalace');
  assert.ok(normalPrompt.includes('Neo Người Hỏi: cung 9'), 'Lỗi: Map sai tọa độ userPalace');
  assert.ok(!normalPrompt.includes('[BẢN ĐỒ 4 BƯỚC CHO AI]'), 'Lỗi: Không được còn nhãn Bản đồ 4 bước cũ');
  assert.ok(!/Bước 1 \\(Gốc rễ\\)|Bước 2 \\(Tình trạng\\)|Bước 3 \\(Tâm lý\\)|Bước 4 \\(Mưu lược\\)/.test(normalPrompt), 'Lỗi: Không được còn lộ nhịp Bước 1/2/3/4 kiểu cũ');
  assert.ok(normalPrompt.includes('[TƯƠNG QUAN LỰC LƯỢNG]'), 'Lỗi: Thiếu block tương quan ngũ hành');
  assert.ok(normalPrompt.includes('khắc Dụng Thần'), 'Lỗi: Thiếu keyword ngũ hành sinh/khắc');
  assert.ok(normalPrompt.includes('Đỗ Môn'), 'Lỗi: Thiếu Blocker flags');

  // 3. Test hàm buildStrategyPrompt (dùng cho luồng Kymon Pro)
  const strategyResult = buildStrategyPrompt({ qmdjData: mockQmdjData, userContext: 'Chiến lược đàm phán', topicKey: 'tai-van' });
  
  assert.ok(strategyResult.systemPrompt.includes('[SYNTHESIS RULES - QUY TẮC TỔNG HỢP NÂNG CAO]'), 'Lỗi: System prompt chưa update luật Synthesis');
  assert.ok(strategyResult.userPrompt.includes('[NEO NỘI BỘ CHO AI]'), 'Lỗi: Strategy user prompt thiếu block neo nội bộ');
  assert.ok(strategyResult.userPrompt.includes('Đây là sơ đồ nội bộ để khóa trục suy luận'), 'Lỗi: Strategy user prompt phải dặn rõ đây là neo nội bộ');
  assert.ok(strategyResult.userPrompt.includes('Neo Dụng Thần:'), 'Lỗi: Strategy user prompt phải có neo Dụng Thần');
  assert.ok(strategyResult.userPrompt.includes('Neo Tình Trạng:'), 'Lỗi: Strategy user prompt phải có neo Tình Trạng');
  assert.ok(strategyResult.userPrompt.includes('Neo Người Hỏi:'), 'Lỗi: Strategy user prompt phải có neo Người Hỏi');
  assert.ok(strategyResult.userPrompt.includes('Neo Hành Động:'), 'Lỗi: Strategy user prompt phải có neo Hành Động');
  assert.ok(!strategyResult.userPrompt.includes('[BẢN ĐỒ 4 BƯỚC CHO AI]'), 'Lỗi: Strategy user prompt không được còn dùng nhãn Bản đồ 4 bước cũ');
  assert.ok(!/Bước 1 \\(Gốc rễ\\)|Bước 2 \\(Tình trạng\\)|Bước 3 \\(Tâm lý\\)|Bước 4 \\(Mưu lược\\)/.test(strategyResult.userPrompt), 'Lỗi: Strategy user prompt không được còn lộ nhịp Bước 1/2/3/4 kiểu cũ');
  assert.ok(strategyResult.userPrompt.includes('khắc Dụng Thần'), 'Lỗi: Strategy user prompt thiếu Tương quan ngũ hành');

  console.log('✅ prompt-synthesis-integration.mjs — ALL TESTS PASSED! Data pipeline nối LLM hoàn hảo.');
} catch (error) {
  console.error('❌ TEST FAILED:', error.message);
  process.exit(1);
}
