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
  selectedTopicCanonicalDungThan: {
    palaceNum: 8,
    palaceName: 'Cấn',
    direction: 'Đông Bắc',
    matchedByText: 'Môn Cảnh + Tinh Phụ',
    targetSummary: 'Môn Cảnh + Tinh Phụ',
    boardText: 'Cung Đông Bắc (P8):\n===> [DỤNG THẦN CHÍNH - BẮT BUỘC PHÂN TÍCH TRỌNG TÂM TẠI ĐÂY] <===\n- Môn: Cảnh\n- Tinh: Phụ\n- Thần: Đằng Xà\n- Can: Đinh\n- Cờ: Đằng Xà',
  },
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

const familyQmdjData = {
  ...qmdjData,
  selectedTopicKey: 'gia-dao',
  selectedTopicResult: 'Headline: Nhà còn khung, nhưng lòng người đang hẫng.',
  selectedTopicCanonicalDungThan: {
    palaceNum: 8,
    palaceName: 'Cấn',
    direction: 'Đông Bắc',
    matchedByText: 'Môn Sinh + Thần Lục Hợp',
    targetSummary: 'Môn Sinh + Thần Lục Hợp',
    boardText: 'Cung Đông Bắc (P8):\n===> [DỤNG THẦN CHÍNH - BẮT BUỘC PHÂN TÍCH TRỌNG TÂM TẠI ĐÂY] <===\n[ĐÂY LÀ CUNG DỤNG THẦN CHÍNH]\n- Môn: Sinh\n- Tinh: Trụ\n- Thần: Lục Hợp\n- Can: Đinh\n- Cờ: Không Vong',
  },
};

const propertyPricingQmdjData = {
  ...qmdjData,
  selectedTopicKey: 'bat-dong-san',
  selectedTopicResult: 'Headline: Có giá để nói, nhưng chưa chắc có giá để chốt.',
  selectedTopicCanonicalDungThan: {
    palaceNum: 3,
    palaceName: 'Chấn',
    direction: 'Đông',
    matchedByText: 'Can Mậu + Môn Sinh',
    targetSummary: 'Can Mậu + Môn Sinh',
    boardText: 'Cung Đông (P3):\n===> [DỤNG THẦN CHÍNH - BẮT BUỘC PHÂN TÍCH TRỌNG TÂM TẠI ĐÂY] <===\n[ĐÂY LÀ CUNG DỤNG THẦN CHÍNH]\n- Môn: Sinh\n- Tinh: Xung\n- Thần: Chu Tước\n- Can: Canh\n- Cờ: Không Vong',
  },
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
assert.match(strategyPrompt.systemPrompt, /\[SHADOW ANALYSIS - GÓC KHUẤT BẮT BUỘC\]/);
assert.match(strategyPrompt.systemPrompt, /\[VERDICT FIRST - PHÁN QUYẾT MỞ ĐẦU\]/);
assert.match(strategyPrompt.systemPrompt, /\[OUTPUT FORMAT - QUY TRÌNH 4 BƯỚC BẮT BUỘC\]/);
assert.match(strategyPrompt.systemPrompt, /\[CLOSING LINE - CÂU CHỐT BẮT BUỘC\]/);
assert.match(strategyPrompt.systemPrompt, /2-4 tầng nghĩa/i);
assert.match(strategyPrompt.systemPrompt, /Giữ nguyên độ dài cần thiết của bài phân tích/i);
assert.match(strategyPrompt.systemPrompt, /các đoạn ngắn có white space rõ ràng/i);
assert.match(strategyPrompt.systemPrompt, /góc khuất nào chưa lộ/i);
assert.match(strategyPrompt.systemPrompt, /dễ tự huyễn hoặc/i);
assert.match(strategyPrompt.systemPrompt, /cái giá phải trả/i);
assert.match(strategyPrompt.systemPrompt, /follow-up question thật trúng/i);
assert.match(strategyPrompt.systemPrompt, /lăng kính triết gia/i);
assert.match(strategyPrompt.systemPrompt, /Đằng Xà = Sự rắc rối/);
assert.match(strategyPrompt.systemPrompt, /Trực Phù = Quý nhân bảo trợ/);
assert.match(strategyPrompt.systemPrompt, /Mưu Lược Hành Động/);
assert.match(strategyPrompt.systemPrompt, /field "closingLine" riêng/);
assert.match(strategyPrompt.systemPrompt, /ƯU TIÊN TUYỆT ĐỐI: Bạn phải tìm nhãn \[DỤNG THẦN CHÍNH\]/);

assert.match(strategyPrompt.userPrompt, /\[PHÂN TÍCH CHỦ ĐỀ: hoc-tap\]/);
assert.match(strategyPrompt.userPrompt, /\[DỤNG THẦN CHUẨN SÁCH\]/);
assert.match(strategyPrompt.userPrompt, /cung 8 \(Cấn\) · Đông Bắc/i);
assert.match(strategyPrompt.userPrompt, /===> \[DỤNG THẦN CHÍNH - BẮT BUỘC PHÂN TÍCH TRỌNG TÂM TẠI ĐÂY\] <===/);
assert.match(strategyPrompt.userPrompt, /CỬU CUNG THEO TOPIC/i);
assert.match(strategyPrompt.userPrompt, /\[FLAGS ENGINE TẠI DỤNG THẦN tại cung 6 · Tây Bắc\]/);
assert.match(strategyPrompt.userPrompt, /\[ƯU TIÊN FLAGS\]/);
assert.match(strategyPrompt.userPrompt, /\[GỢI Ý ẨN DỤ CHO AI\]/);
assert.match(strategyPrompt.userPrompt, /\[INSIGHT ENGINE\]/);
assert.match(strategyPrompt.userPrompt, /\[GỢI Ý NGỮ CẢNH HỌC TẬP\]/);
assert.match(strategyPrompt.userPrompt, /\[YÊU CẦU TRIỂN KHAI\]/);
assert.match(strategyPrompt.userPrompt, /phán quyết rõ/i);
assert.match(strategyPrompt.userPrompt, /Xuất đúng JSON 5 key của Kymon Pro/i);
assert.match(strategyPrompt.userPrompt, /field "closingLine" như một câu chốt riêng/i);
assert.match(strategyPrompt.userPrompt, /Không được trả lời cụt hoặc quá ngắn/i);
assert.match(strategyPrompt.userPrompt, /góc khuất|điểm người hỏi dễ hiểu sai/i);
assert.match(strategyPrompt.userPrompt, /cái giá phải trả/i);
assert.match(strategyPrompt.userPrompt, /giới hạn của cái xấu/i);
assert.match(strategyPrompt.userPrompt, /follow-up question thật trúng/i);
assert.match(strategyPrompt.userPrompt, /chiêm nghiệm kiểu triết gia/i);
assert.match(strategyPrompt.userPrompt, /Mỗi bước nên giải thích rõ ít nhất 2 tín hiệu/i);
assert.match(strategyPrompt.userPrompt, /không được tự rút ngắn phần thân|Giữ nguyên độ dày của bài phân tích/i);
assert.match(strategyPrompt.userPrompt, /các đoạn ngắn có white space rõ/i);

const familyStrategyPrompt = buildStrategyPrompt({
  qmdjData: familyQmdjData,
  userContext: 'Nhà Khanh hiện tại ra sao?',
  topicKey: 'gia-dao',
});

assert.match(familyStrategyPrompt.userPrompt, /\[LENS THEO CHỦ ĐỀ\]/);
assert.match(familyStrategyPrompt.userPrompt, /hòa khí|nếp nhà|sự kết nối/i);
assert.match(familyStrategyPrompt.userPrompt, /Chỉ nói về tài sản, giao dịch, giấy tờ khi câu hỏi thật sự hỏi về căn nhà như một tài sản/i);

const propertyPricingStrategyPrompt = buildStrategyPrompt({
  qmdjData: propertyPricingQmdjData,
  userContext: 'Nhà Khanh giá bao nhiêu?',
  topicKey: 'bat-dong-san',
});

assert.match(propertyPricingStrategyPrompt.userPrompt, /\[TRỤC CÂU HỎI\]/);
assert.match(propertyPricingStrategyPrompt.userPrompt, /Định giá \/ Giá tiền/);
assert.match(propertyPricingStrategyPrompt.systemPrompt, /Hỏi giá thì chốt vào giá\/chốt giá/i);
assert.match(propertyPricingStrategyPrompt.userPrompt, /Hỏi giá thì phải chốt về giá treo, giá chạm, giá chốt/i);

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
assert.match(topicPrompt, /\[FLAGS ENGINE TẠI DỤNG THẦN tại cung 6 · Tây Bắc\]/);
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
