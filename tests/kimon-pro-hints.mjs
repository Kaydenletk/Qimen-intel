import assert from 'node:assert/strict';
import { buildKimonPrompt, KYMON_TOPIC_SYSTEM_PROMPT } from '../src/logic/kimon/promptBuilder.js';
import { buildStrategyPrompt, KYMON_PRO_SYSTEM_PROMPT } from '../src/logic/kimon/strategyPrompt.js';
import { buildPromptByTier, selectModel } from '../src/logic/kimon/modelRouter.js';

const qmdjData = {
  selectedTopicKey: 'hoc-tap',
  selectedTopicResult: 'Headline: Trục học tập đang dịch chuyển.',
  aiHints: '[GỢI Ý ẨN DỤ CHO AI]\n[QUAN TRỌNG - FLAGS]\n- Đối với [Dịch Mã]: Hãy ẩn dụ nó là "tài liệu đang phi tới rất nhanh".\n- Đối với [Không Vong]: Hãy ẩn dụ nó là "có thể còn rỗng hoặc bị delay".\n- Đối với [Cảnh Môn]: Hãy ẩn dụ nó là "đề cương, tài liệu, thông báo thi".',
  selectedTopicFlags: ['Dịch Mã', 'Không Vong'],
  selectedTopicUsefulPalace: 6,
  selectedTopicUsefulPalaceName: 'Tây Bắc',
  insight: 'Dụng thần đang sáng lên ở cung cần đọc.',
  currentHour: 12,
  currentMinute: 3,
};

const wealthQmdjData = {
  ...qmdjData,
  selectedTopicKey: 'tai-van',
  selectedTopicResult: 'Headline: Đánh Nhanh, Chốt Gọn.\nCore: Đây là cuộc chiến tốc độ.',
  selectedTopicFlags: ['Dịch Mã'],
  aiHints: '[GỢI Ý ẨN DỤ CHO AI]\n[QUAN TRỌNG - FLAGS]\n- Đối với [Dịch Mã]: Hãy ẩn dụ nó là "thanh khoản chạy rất nhanh".',
};

const strategyPrompt = buildStrategyPrompt({
  qmdjData,
  userContext: 'Khi nào có đề cương?',
  topicKey: 'hoc-tap',
});

assert.equal(strategyPrompt.systemPrompt, KYMON_PRO_SYSTEM_PROMPT);
assert.match(strategyPrompt.systemPrompt, /\[SYSTEM ROLE & PERSONA\]/);
assert.match(strategyPrompt.systemPrompt, /\[CORE METAPHORS - TỪ ĐIỂN ẨN DỤ BẮT BUỘC\]/);
assert.match(strategyPrompt.systemPrompt, /\[STRICT CONSTRAINTS - RÀNG BUỘC NGHIÊM NGẶT\]/);
assert.match(strategyPrompt.systemPrompt, /\[DEEP DIVE & CHAIN OF THOUGHT - CHUỖI TƯ DUY SÂU SẮC\]/);
assert.match(strategyPrompt.systemPrompt, /\[VERDICT FIRST - PHÁN QUYẾT MỞ ĐẦU\]/);
assert.match(strategyPrompt.systemPrompt, /\[OUTPUT FORMAT - QUY TRÌNH 4 BƯỚC BẮT BUỘC\]/);
assert.match(strategyPrompt.systemPrompt, /\[CLOSING LINE - CÂU CHỐT BẮT BUỘC\]/);
assert.match(strategyPrompt.systemPrompt, /2-4 tầng nghĩa/i);
assert.match(strategyPrompt.systemPrompt, /Giữ nguyên độ dài cần thiết của bài phân tích/i);
assert.match(strategyPrompt.systemPrompt, /các đoạn ngắn có white space rõ ràng/i);
assert.match(strategyPrompt.systemPrompt, /Đằng Xà = Sự rắc rối/);
assert.match(strategyPrompt.systemPrompt, /Trực Phù = Quý nhân bảo trợ/);
assert.match(strategyPrompt.systemPrompt, /Mưu Lược Hành Động/);
assert.match(strategyPrompt.systemPrompt, /field "closingLine" riêng/);

assert.match(strategyPrompt.userPrompt, /\[PHÂN TÍCH CHỦ ĐỀ: hoc-tap\]/);
assert.match(strategyPrompt.userPrompt, /\[FLAGS DỤNG THẦN tại cung 6 · Tây Bắc\]/);
assert.match(strategyPrompt.userPrompt, /\[ƯU TIÊN FLAGS\]/);
assert.match(strategyPrompt.userPrompt, /\[GỢI Ý ẨN DỤ CHO AI\]/);
assert.match(strategyPrompt.userPrompt, /\[INSIGHT ENGINE\]/);
assert.match(strategyPrompt.userPrompt, /\[GỢI Ý NGỮ CẢNH HỌC TẬP\]/);
assert.match(strategyPrompt.userPrompt, /\[YÊU CẦU TRIỂN KHAI\]/);
assert.match(strategyPrompt.userPrompt, /phán quyết rõ/i);
assert.match(strategyPrompt.userPrompt, /Xuất đúng JSON 5 key của Kymon Pro/i);
assert.match(strategyPrompt.userPrompt, /field "closingLine" như một câu chốt riêng/i);
assert.match(strategyPrompt.userPrompt, /Không được trả lời cụt hoặc quá ngắn/i);
assert.match(strategyPrompt.userPrompt, /Mỗi bước nên giải thích rõ ít nhất 2 tín hiệu/i);
assert.match(strategyPrompt.userPrompt, /không được tự rút ngắn phần thân|Giữ nguyên độ dày của bài phân tích/i);
assert.match(strategyPrompt.userPrompt, /các đoạn ngắn có white space rõ/i);

const wealthStrategyPrompt = buildStrategyPrompt({
  qmdjData: wealthQmdjData,
  userContext: 'Có nên vào lệnh lúc này không?',
  topicKey: 'tai-van',
});
assert.equal(wealthStrategyPrompt.systemPrompt, KYMON_PRO_SYSTEM_PROMPT);
assert.match(wealthStrategyPrompt.userPrompt, /\[ƯU TIÊN TÀI VẬN\]/);
assert.match(wealthStrategyPrompt.userPrompt, /Can Mậu \(vốn\/ thanh khoản\) \+ Sinh Môn \(lợi nhuận\) \+ Nhật Can/i);

const topicPrompt = buildKimonPrompt({
  qmdjData,
  userContext: 'Khi nào có đề cương?',
  isAutoLoad: false,
});

assert.match(topicPrompt, /\[NGUYÊN TẮC ĐỌC FLAGS\]/);
assert.match(topicPrompt, /\[FLAGS DỤNG THẦN tại cung 6 · Tây Bắc\]/);
assert.match(topicPrompt, /\[GỢI Ý ẨN DỤ CHO AI\]/);
assert.match(topicPrompt, /Logic, Data, Memory, Processing/i);
assert.match(topicPrompt, /\[ĐIỂM CẦN BÁM\]/);
assert.match(topicPrompt, /phán quyết đủ rõ/i);
assert.match(topicPrompt, /hook\/thesis 1-2 câu/i);
assert.match(topicPrompt, /2-4 lớp để người đọc thấy được toàn cảnh/i);
assert.match(topicPrompt, /ít nhất 2 tín hiệu đang tương tác/i);
assert.match(topicPrompt, /Không được rút ngắn phần thân chỉ vì đã có phán quyết/i);
assert.match(topicPrompt, /các đoạn ngắn có white space rõ ràng/i);
assert.match(topicPrompt, /field "closingLine" riêng/);
assert.match(topicPrompt, /dùng đúng 3 key: lead, message, closingLine/i);
assert.doesNotMatch(topicPrompt, /\[SYSTEM ROLE & PERSONA\]/);

const wealthTopicPrompt = buildKimonPrompt({
  qmdjData: wealthQmdjData,
  userContext: 'Có nên vào lệnh lúc này không?',
  isAutoLoad: false,
});
assert.match(wealthTopicPrompt, /\[ƯU TIÊN TÀI VẬN\]/);
assert.match(wealthTopicPrompt, /cuộc chiến tốc độ|bài toán kiên nhẫn/i);

const topicBuild = buildPromptByTier({
  tier: 'topic',
  topic: 'hoc-tap',
  qmdjData,
  userContext: 'Khi nào có đề cương?',
});
assert.equal(topicBuild.responseFormat, 'json');
assert.equal(topicBuild.systemPrompt, KYMON_TOPIC_SYSTEM_PROMPT);

const generalTopicBuild = buildPromptByTier({
  tier: 'topic',
  topic: 'chung',
  qmdjData: {},
  userContext: 'Khanh bạn tôi đang làm gì?',
});
assert.equal(generalTopicBuild.responseFormat, 'json');
assert.equal(generalTopicBuild.systemPrompt, KYMON_TOPIC_SYSTEM_PROMPT);

assert.equal(selectModel('topic').model, 'gemini-2.5-flash');
assert.equal(selectModel('strategy').model, 'gemini-2.5-pro');
assert.equal(selectModel('companion').maxTokens, 1800);
assert.equal(selectModel('topic').maxTokens, 4096);
assert.equal(selectModel('strategy').maxTokens, 5120);

console.log('kimon-pro-hints.mjs: OK');
