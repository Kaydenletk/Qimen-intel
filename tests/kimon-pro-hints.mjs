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
assert.match(strategyPrompt.userPrompt, /\[GỢI Ý NGỮ CẢNH HỌC TẬP\]/);
assert.match(strategyPrompt.userPrompt, /Thiên Phụ\/Cảnh Môn là tín hiệu mạnh/i);
assert.match(strategyPrompt.userPrompt, /ưu tiên nỗi lo thật sự ở Nhật Can, Flags và Dụng Thần/i);
assert.doesNotMatch(strategyPrompt.userPrompt, /Logic, Data, Memory, Processing/i);
assert.match(strategyPrompt.systemPrompt, /Chiến lược gia Đa tầng/);
assert.match(strategyPrompt.systemPrompt, /\[TRỌNG TÂM LUẬN GIẢI\]/);
assert.match(strategyPrompt.systemPrompt, /Dụng Thần là thực tế/i);
assert.match(strategyPrompt.systemPrompt, /Nhật Can là tâm thế/i);
assert.match(strategyPrompt.systemPrompt, /Dịch Mã/);
assert.match(strategyPrompt.systemPrompt, /Không Vong/);
assert.match(strategyPrompt.systemPrompt, /Phản Ngâm/);
assert.match(strategyPrompt.systemPrompt, /Đằng Xà\/Không Vong/);
assert.match(strategyPrompt.systemPrompt, /Thương Môn\/Bạch Hổ/);
assert.match(strategyPrompt.systemPrompt, /The Root \(Gốc\)/i);
assert.match(strategyPrompt.systemPrompt, /The Rhythm \(Nhịp\)/i);
assert.match(strategyPrompt.systemPrompt, /The Persona \(Người\)/i);
assert.match(strategyPrompt.systemPrompt, /The Tactical \(Mưu\)/i);
assert.match(strategyPrompt.systemPrompt, /Ngựa chạy vào hố/i);
assert.match(strategyPrompt.systemPrompt, /Phanh gấp/i);
assert.match(strategyPrompt.systemPrompt, /Ảo ảnh dội ngược/i);
assert.match(strategyPrompt.systemPrompt, /Quay xe trong gió/i);
assert.match(strategyPrompt.systemPrompt, /Nếu nỗi lo nằm ở đây -> Lo cho một bóng ma/i);
assert.match(strategyPrompt.systemPrompt, /Không được trả lời cụt/i);
assert.match(strategyPrompt.systemPrompt, /JSON CHUẨN/i);
assert.match(strategyPrompt.systemPrompt, /"adversary":/);
assert.match(strategyPrompt.systemPrompt, /Thiên Phụ\/Cảnh Môn/i);
assert.match(strategyPrompt.systemPrompt, /Lỗ hổng gốc rễ/i);
assert.match(strategyPrompt.systemPrompt, /điểm tựa|bám rễ|cánh cửa hẹp/i);
assert.match(strategyPrompt.systemPrompt, /không được để chúng lấn át Flags, Nhật Can hay Dụng Thần thực tế/i);

const wealthStrategyPrompt = buildStrategyPrompt({
  qmdjData: wealthQmdjData,
  userContext: 'Có nên vào lệnh lúc này không?',
  topicKey: 'tai-van',
});
assert.match(wealthStrategyPrompt.systemPrompt, /CHIẾN THUẬT CHO CÁC MIỀN LO LẮNG/);
assert.match(wealthStrategyPrompt.systemPrompt, /Tiền bạc \(Tài vận\)/i);
assert.match(wealthStrategyPrompt.systemPrompt, /Mậu.*túi tiền.*Sinh Môn.*độ nảy mầm/i);
assert.match(wealthStrategyPrompt.systemPrompt, /Săn bắn.*Canh tác/i);
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
