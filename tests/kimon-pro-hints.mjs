import assert from 'node:assert/strict';
import { buildKimonPrompt } from '../src/logic/kimon/promptBuilder.js';
import { buildStrategyPrompt } from '../src/logic/kimon/strategyPrompt.js';
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

assert.match(strategyPrompt.userPrompt, /\[PHÂN TÍCH CHỦ ĐỀ: hoc-tap\]/);
assert.match(strategyPrompt.userPrompt, /\[FLAGS DỤNG THẦN tại cung 6 · Tây Bắc\]/);
assert.match(strategyPrompt.userPrompt, /- Dịch Mã/);
assert.match(strategyPrompt.userPrompt, /- Không Vong/);
assert.match(strategyPrompt.userPrompt, /\[ƯU TIÊN FLAGS\]/);
assert.match(strategyPrompt.userPrompt, /\[QUAN TRỌNG - FLAGS\]/);
assert.match(strategyPrompt.userPrompt, /Ưu tiên đọc block \[QUAN TRỌNG - FLAGS\]/);
assert.match(strategyPrompt.userPrompt, /\[GỢI Ý ẨN DỤ CHO AI\]/);
assert.match(strategyPrompt.userPrompt, /\[INSIGHT ENGINE\]/);
assert.match(strategyPrompt.systemPrompt, /\[BẮT BUỘC QUÉT FLAGS - ƯU TIÊN HÀNG ĐẦU\]/);
assert.match(strategyPrompt.systemPrompt, /Dịch Mã/);
assert.match(strategyPrompt.systemPrompt, /Không Vong/);
assert.match(strategyPrompt.systemPrompt, /Phục Ngâm/);
assert.match(strategyPrompt.systemPrompt, /Phản Ngâm/);
assert.match(strategyPrompt.systemPrompt, /Root Cause/);
assert.match(strategyPrompt.systemPrompt, /Target Status & Speed/);
assert.match(strategyPrompt.systemPrompt, /User's Psychology/);
assert.match(strategyPrompt.systemPrompt, /Tactical Strategy/);
assert.match(strategyPrompt.systemPrompt, /bước 2 và bước 4/i);
assert.match(strategyPrompt.systemPrompt, /kiên nhẫn chờ|từ từ/i);
assert.match(strategyPrompt.systemPrompt, /xác minh|không dồn toàn lực/i);
assert.match(strategyPrompt.systemPrompt, /đề cương CDA/i);
assert.match(strategyPrompt.systemPrompt, /tốc độ|bất ngờ|sắp ập đến/i);
assert.match(strategyPrompt.systemPrompt, /Ngựa chạy vào hố/i);
assert.match(strategyPrompt.systemPrompt, /Phanh gấp/i);
assert.match(strategyPrompt.systemPrompt, /QUY TẮC RIÊNG CHO HỌC TẬP \/ THI CỬ/);
assert.match(strategyPrompt.systemPrompt, /Logic, Data, Memory, Processing/i);
assert.match(strategyPrompt.systemPrompt, /thay vì các ẩn dụ về Sức khỏe, Tiêu hóa hoặc Hồi phục/i);
assert.match(strategyPrompt.systemPrompt, /cung có Thiên Phụ hoặc Cảnh Môn/i);

const wealthStrategyPrompt = buildStrategyPrompt({
  qmdjData: wealthQmdjData,
  userContext: 'Có nên vào lệnh lúc này không?',
  topicKey: 'tai-van',
});
assert.match(wealthStrategyPrompt.systemPrompt, /QUY TẮC RIÊNG CHO TÀI VẬN/);
assert.match(wealthStrategyPrompt.systemPrompt, /cuộc chiến tốc độ|bài toán kiên nhẫn/i);
assert.match(wealthStrategyPrompt.systemPrompt, /Can Mậu = vốn/i);
assert.match(wealthStrategyPrompt.systemPrompt, /TUYỆT ĐỐI không lẫn chủ đề nhà đất/i);
assert.match(wealthStrategyPrompt.userPrompt, /\[ƯU TIÊN TÀI VẬN\]/);
assert.match(wealthStrategyPrompt.userPrompt, /Can Mậu \(vốn\/ thanh khoản\) \+ Sinh Môn \(lợi nhuận\) \+ Nhật Can/i);

const topicPrompt = buildKimonPrompt({
  qmdjData,
  userContext: 'Khi nào có đề cương?',
  isAutoLoad: false,
});

assert.match(topicPrompt, /\[ƯU TIÊN FLAGS\]/, 'Topic/Flash prompt phải nhắc rule flags-first khi có aiHints');
assert.match(topicPrompt, /\[FLAGS DỤNG THẦN tại cung 6 · Tây Bắc\]/, 'Topic/Flash prompt phải có block flags riêng');
assert.match(topicPrompt, /\[QUAN TRỌNG - FLAGS\]/, 'Topic/Flash prompt phải carry block flags-first');
assert.match(topicPrompt, /\[GỢI Ý ẨN DỤ CHO AI\]/, 'Topic/Flash prompt phải carry aiHints để model đọc flags');
assert.match(topicPrompt, /nhịp sự việc và đòn hành động trước tiên/i, 'Topic/Flash prompt phải nhắc cách dùng flags');
assert.match(topicPrompt, /tránh khuyên chờ chậm hoặc từ từ/i, 'Topic/Flash prompt phải chặn wording chậm khi có Dịch Mã');
assert.match(topicPrompt, /delay, ảo tưởng hoặc kết quả rỗng/i, 'Topic/Flash prompt phải nhắc rule Không Vong');
assert.match(topicPrompt, /Ngựa chạy vào hố/i, 'Topic/Flash prompt phải có rule combo Dịch Mã \+ Không Vong');
assert.match(topicPrompt, /Logic, Data, Memory, Processing/i, 'Topic/Flash prompt phải ép dùng ngôn ngữ học tập kiểu kỹ thuật');
assert.match(topicPrompt, /tránh kéo ẩn dụ sang sức khỏe, tiêu hóa hoặc hồi phục cơ thể/i, 'Topic/Flash prompt phải cấm ẩn dụ sức khỏe cho học tập');
assert.match(topicPrompt, /lỗ hổng kiến thức, bug nền tảng hoặc điểm rò dữ liệu/i, 'Thiên Nhuế trong học tập phải được dịch về lỗi nền tảng');

const wealthTopicPrompt = buildKimonPrompt({
  qmdjData: wealthQmdjData,
  userContext: 'Có nên vào lệnh lúc này không?',
  isAutoLoad: false,
});
assert.match(wealthTopicPrompt, /\[ƯU TIÊN TÀI VẬN\]/);
assert.match(wealthTopicPrompt, /cuộc chiến tốc độ|bài toán kiên nhẫn/i);
assert.match(wealthTopicPrompt, /TUYỆT ĐỐI không lẫn sang nhà đất/i);

const topicBuild = buildPromptByTier({
  tier: 'topic',
  topic: 'hoc-tap',
  qmdjData,
  userContext: 'Khi nào có đề cương?',
});
assert.equal(topicBuild.responseFormat, 'json');
assert.equal(selectModel('topic').model, 'gemini-2.5-flash');
assert.equal(selectModel('strategy').model, 'gemini-2.5-pro');

console.log('kimon-pro-hints.mjs: OK');
