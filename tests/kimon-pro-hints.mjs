import assert from 'node:assert/strict';
import { buildKimonPrompt, KYMON_TOPIC_SYSTEM_PROMPT } from '../src/logic/kimon/promptBuilder.js';
import { buildStrategyPrompt, KYMON_PRO_SYSTEM_PROMPT } from '../src/logic/kimon/strategyPrompt.js';
import { buildPromptByTier, selectModel } from '../src/logic/kimon/modelRouter.js';

const qmdjData = {
  selectedTopicKey: 'hoc-tap',
  selectedTopicResult: 'Headline: Trục học tập đang dịch chuyển.',
  selectedTopicFlags: ['Dịch Mã', 'Không Vong'],
  formations: 'Thanh Long bị thương, Chu Tước khẩu thiệt ảo',
  topFormations: '- Thanh Long bị thương: Mở mà hao.\n- Chu Tước khẩu thiệt ảo: Nhiễu lời nói, sợ hãi rỗng.',
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
  hourMarkerPalace: 6,
  dayMarkerPalace: 1,
  directEnvoyPalace: 4,
  dayPillar: { stemName: 'Nhâm' },
  displayPalaces: {
    6: {
      palaceName: 'Càn',
      directionLabel: { displayShort: 'Tây Bắc' },
      mon: { name: 'Khai Môn' },
      star: { name: 'Thiên Xung' },
      than: { name: 'Trực Phù' },
      can: { name: 'Canh' },
      earthStem: 'Mậu',
      khongVong: false,
    },
    8: {
      palaceName: 'Cấn',
      directionLabel: { displayShort: 'Đông Bắc' },
      mon: { name: 'Cảnh Môn' },
      star: { name: 'Thiên Phụ' },
      than: { name: 'Đằng Xà' },
      can: { name: 'Đinh' },
      earthStem: 'Kỷ',
      khongVong: true,
    },
    4: {
      palaceName: 'Tốn',
      directionLabel: { displayShort: 'Đông Nam' },
      mon: { name: 'Sinh Môn' },
      star: { name: 'Thiên Tâm' },
      than: { name: 'Cửu Địa' },
      can: { name: 'Giáp' },
      earthStem: 'Ất',
      khongVong: false,
    },
    1: {
      palaceName: 'Khảm',
      directionLabel: { displayShort: 'Bắc' },
      mon: { name: 'Tử Môn' },
      star: { name: 'Thiên Bồng' },
      than: { name: 'Câu Trận' },
      can: { name: 'Canh' },
      earthStem: 'Canh',
      khongVong: true,
    },
  },
};

const wealthQmdjData = {
  ...qmdjData,
  selectedTopicKey: 'tai-van',
  selectedTopicResult: 'Headline: Đánh Nhanh, Chốt Gọn.\nCore: Đây là cuộc chiến tốc độ.',
  selectedTopicFlags: ['Dịch Mã'],
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
assert.match(strategyPrompt.systemPrompt, /chiến lược gia lão luyện/i);
assert.match(strategyPrompt.systemPrompt, /sói già lý số/i);
assert.match(strategyPrompt.systemPrompt, /CƯƠNG: Gặp Hung\/Đại Hung/i);
assert.match(strategyPrompt.systemPrompt, /NHU: Gặp Cát hoặc Ảo/i);
assert.match(strategyPrompt.systemPrompt, /\[THE OLD WOLF STRATEGIST PROTOCOL\]/);
assert.match(strategyPrompt.systemPrompt, /Remove all soft\/hedging language/i);
assert.match(strategyPrompt.systemPrompt, /\[CORE METAPHORS - TỪ ĐIỂN ẨN DỤ BẮT BUỘC\]/);
assert.match(strategyPrompt.systemPrompt, /\[STRICT CONSTRAINTS - RÀNG BUỘC NGHIÊM NGẶT\]/);
assert.match(strategyPrompt.systemPrompt, /\[DEEP DIVE & CHAIN OF THOUGHT - CHUỖI TƯ DUY SÂU SẮC\]/);
assert.match(strategyPrompt.systemPrompt, /\[THE 3-STEP STRIKE - BÓC TRẦN, SÁT MUỐI, RA LỆNH\]/);
assert.match(strategyPrompt.systemPrompt, /\[SHADOW ANALYSIS - GÓC KHUẤT BẮT BUỘC\]/);
assert.match(strategyPrompt.systemPrompt, /\[COLD WATER RULES - QUY TẮC TẠT NƯỚC LẠNH\]/);
assert.match(strategyPrompt.systemPrompt, /\[TABOOS - CẤM KỴ\]/);
assert.match(strategyPrompt.systemPrompt, /\[VERDICT FIRST - PHÁN QUYẾT MỞ ĐẦU\]/);
assert.match(strategyPrompt.systemPrompt, /\[OUTPUT FORMAT - STRATEGY JSON BẮT BUỘC\]/);
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
assert.match(strategyPrompt.systemPrompt, /Chu Tước khẩu thiệt ảo = Súng không đạn/i);
assert.match(strategyPrompt.systemPrompt, /Thiên La = Lưới bủa vây/i);
assert.match(strategyPrompt.systemPrompt, /Địa Võng = Mẻ lưới quấn dưới chân/i);
assert.match(strategyPrompt.systemPrompt, /Nhập Mộ = Tự đào hố chôn mình/i);
assert.match(strategyPrompt.systemPrompt, /Thanh Long bị thương = Rồng gãy cánh, mất tiền mua bài học đau/i);
assert.match(strategyPrompt.systemPrompt, /Thanh Long Đào Tẩu = Chủ đầu tư cầm tiền của bạn chạy marathon/i);
assert.match(strategyPrompt.systemPrompt, /KHÔNG VUỐT VE/i);
assert.match(strategyPrompt.systemPrompt, /Không nước đôi/i);
assert.match(strategyPrompt.systemPrompt, /Cấm dùng kiểu mở đường lui như "có thể", "dường như", "có lẽ", "nên cân nhắc"/i);
assert.match(strategyPrompt.systemPrompt, /CẤM nhắc điểm số cụ thể/i);
assert.match(strategyPrompt.systemPrompt, /score < -10: kích hoạt persona Luật sư nghiêm khắc/i);
assert.match(strategyPrompt.systemPrompt, /score > \+10: kích hoạt persona Thương nhân quyết đoán/i);
assert.match(strategyPrompt.systemPrompt, /Nếu dính Không Vong: kích hoạt persona Sói già hóm hỉnh/i);
assert.match(strategyPrompt.systemPrompt, /tactics/i);
assert.match(strategyPrompt.systemPrompt, /field "closingLine" riêng/);
assert.match(strategyPrompt.systemPrompt, /ƯU TIÊN TUYỆT ĐỐI: Bạn phải tìm nhãn \[DỤNG THẦN CHÍNH\]/);
assert.match(strategyPrompt.systemPrompt, /VỊ THẾ HAI BÊN là bắt buộc/i);
assert.match(strategyPrompt.systemPrompt, /VOID PRESSURE ON USEFUL GOD/i);
assert.match(strategyPrompt.systemPrompt, /Môn khắc Cung là Môn Bức/i);
assert.match(strategyPrompt.systemPrompt, /tactics\.direction/i);
assert.match(strategyPrompt.systemPrompt, /\[ENERGY STATE\]/i);
assert.match(strategyPrompt.systemPrompt, /vitality \/ structure \/ transparency \/ tension/i);
assert.match(strategyPrompt.systemPrompt, /transparency = Không Vong/i);
assert.match(strategyPrompt.systemPrompt, /markdown bold/i);
assert.match(strategyPrompt.systemPrompt, /PATTERN ĐỘNG LÀ HỆ THẦN KINH/i);
assert.match(strategyPrompt.systemPrompt, /Thanh Long bị thương/i);
assert.match(strategyPrompt.systemPrompt, /Chu Tước khẩu thiệt ảo/i);
assert.match(strategyPrompt.systemPrompt, /Thiên La/i);
assert.match(strategyPrompt.systemPrompt, /Nhật kỳ nhập mộ/i);
assert.match(strategyPrompt.systemPrompt, /Hook in đậm, tối đa khoảng 20 chữ/i);
assert.match(strategyPrompt.systemPrompt, /Đừng mua vé xem kịch khi vở diễn nằm trên một cái hố không đáy/i);
assert.match(strategyPrompt.systemPrompt, /Tuyệt đối không chào hỏi, không dẫn nhập, không nhắc "trận đồ cho thấy"/i);
assert.match(strategyPrompt.systemPrompt, /Hook không được mở bằng các cụm giải thích như "Gốc rễ của\.\.\.", "Trận này cho thấy\.\.\.", "Tổng quan là\.\.\."/i);
assert.match(strategyPrompt.systemPrompt, /\[Trạng thái\] \+ \[Nguyên nhân\] \+ \[Mệnh lệnh\]/i);
assert.match(strategyPrompt.systemPrompt, /ưu tiên động từ mệnh lệnh/i);
assert.match(strategyPrompt.systemPrompt, /Template nội bộ bắt buộc phải mang khung xương mệnh lệnh: LỜI PHÁN -> BÓC TRẦN -> MỆNH LỆNH/i);
assert.match(strategyPrompt.systemPrompt, /KHÔNG phải nhãn được in ra bài trả lời/i);
assert.match(strategyPrompt.systemPrompt, /Tuyệt đối không in literal labels như "\[Bóc Trần\]", "\[Sát Muối\]", "\[Mệnh Lệnh\]"/i);
assert.match(strategyPrompt.systemPrompt, /Nếu dính Thanh Long Đào Tẩu tại cung Lợi nhuận, phải đọc là tiền vừa tới tay đã chạy mất/i);
assert.match(strategyPrompt.systemPrompt, /Nếu Nhật kỳ nhập mộ rơi vào cung Vốn, phải ví vốn như đang nằm trong quan tài chờ ngày hạ huyệt/i);
assert.match(strategyPrompt.systemPrompt, /Nếu Thiên La\/Địa Võng xuất hiện, phải đọc là lưới rách nhưng vẫn đủ làm người hỏi ngạt thở vì thủ tục/i);
assert.match(strategyPrompt.systemPrompt, /Nếu input có block \[PIVOT POINT\]/i);
assert.match(strategyPrompt.systemPrompt, /Trực Phù, phải đọc là lệnh bài miễn tử/i);
assert.match(strategyPrompt.systemPrompt, /Thiên Xung, phải đọc là cú hích điện từ/i);
assert.match(strategyPrompt.systemPrompt, /Câu Trận níu.*buông bỏ để được/i);

assert.match(strategyPrompt.userPrompt, /\[PHÂN TÍCH CHỦ ĐỀ: hoc-tap\]/);
assert.match(strategyPrompt.userPrompt, /\[TONE CONTROLLER\]/);
assert.match(strategyPrompt.userPrompt, /Remove all soft\/hedging language/i);
assert.match(strategyPrompt.userPrompt, /\[ENERGY STATE\]/);
assert.match(strategyPrompt.userPrompt, /\[PIVOT POINT\]/);
assert.match(strategyPrompt.userPrompt, /Trực Phù giáng lâm/i);
assert.match(strategyPrompt.userPrompt, /Thiên Xung thông mạch/i);
assert.match(strategyPrompt.userPrompt, /Buông bỏ để được/i);
assert.match(strategyPrompt.userPrompt, /lệnh bài miễn tử/i);
assert.match(strategyPrompt.userPrompt, /cú hích điện từ/i);
assert.match(strategyPrompt.userPrompt, /Dụng Thần: cung 8 \(Cấn\) · Đông Bắc/i);
assert.match(strategyPrompt.userPrompt, /vitality:/i);
assert.match(strategyPrompt.userPrompt, /structure:/i);
assert.match(strategyPrompt.userPrompt, /transparency:/i);
assert.match(strategyPrompt.userPrompt, /tension:/i);
assert.match(strategyPrompt.userPrompt, /Nhật Can: cung 1 \(Khảm\) · Bắc/i);
assert.match(strategyPrompt.userPrompt, /\[DỤNG THẦN CHUẨN SÁCH\]/);
assert.match(strategyPrompt.userPrompt, /\[CÁCH CỤC & PATTERN ĐỘNG\]/);
assert.match(strategyPrompt.userPrompt, /\[VỊ THẾ HAI BÊN\]/);
assert.match(strategyPrompt.userPrompt, /Phía bạn|Phía sự việc/i);
assert.match(strategyPrompt.userPrompt, /\[MÔN - TINH - CUNG\]/);
assert.match(strategyPrompt.userPrompt, /\[DIRECTIONAL RECOMMENDATION\]/);
assert.match(strategyPrompt.userPrompt, /\[KHO TRI THỨC QMDJ\]/);
assert.match(strategyPrompt.userPrompt, /Thanh Long bị thương/i);
assert.match(strategyPrompt.userPrompt, /Chu Tước khẩu thiệt ảo/i);
assert.match(strategyPrompt.userPrompt, /cung 8 \(Cấn\) · Đông Bắc/i);
assert.match(strategyPrompt.userPrompt, /===> \[DỤNG THẦN CHÍNH - BẮT BUỘC PHÂN TÍCH TRỌNG TÂM TẠI ĐÂY\] <===/);
assert.match(strategyPrompt.userPrompt, /CỬU CUNG THEO TOPIC/i);
assert.match(strategyPrompt.userPrompt, /\[FLAGS ENGINE TẠI DỤNG THẦN tại cung 6 · Tây Bắc\]/);
assert.match(strategyPrompt.userPrompt, /Cờ trọng yếu: Dịch Mã \| Không Vong/);
assert.match(strategyPrompt.userPrompt, /Dịch Mã:/);
assert.match(strategyPrompt.userPrompt, /Không Vong:/);
assert.match(strategyPrompt.userPrompt, /Combo cờ Ngựa chạy vào hố:/);
assert.match(strategyPrompt.userPrompt, /\[INSIGHT ENGINE\]/);
assert.match(strategyPrompt.userPrompt, /\[GỢI Ý NGỮ CẢNH HỌC TẬP\]/);
assert.match(strategyPrompt.userPrompt, /\[YÊU CẦU TRIỂN KHAI\]/);
assert.match(strategyPrompt.userPrompt, /Hook markdown bold, ngắn, tạt thẳng/i);
assert.match(strategyPrompt.userPrompt, /Không được mở analysis bằng các câu thuyết minh như "Gốc rễ của thương vụ này\.\.\.", "Trước tiên\.\.\.", "Đầu tiên chúng ta cần\.\.\."/i);
assert.match(strategyPrompt.userPrompt, /Không in tag \[LỜI PHÁN\]/i);
assert.match(strategyPrompt.userPrompt, /Không in tag \[BÓC TRẦN\]/i);
assert.match(strategyPrompt.userPrompt, /Không in tag \[MỆNH LỆNH\]/i);
assert.match(strategyPrompt.userPrompt, /markdown bold/i);
assert.match(strategyPrompt.userPrompt, /tactics\.direction/i);
assert.match(strategyPrompt.userPrompt, /có qua không/i);
assert.match(strategyPrompt.userPrompt, /bẫy phút chót/i);
assert.match(strategyPrompt.userPrompt, /3-step strike/i);
assert.match(strategyPrompt.userPrompt, /không in các literal labels đó ra bài/i);
assert.match(strategyPrompt.userPrompt, /động từ mệnh lệnh/i);
assert.match(strategyPrompt.userPrompt, /"Đóng ví", "Cắt liên lạc", "Đi ngủ", "Múc", "Chốt", "Biến", "Khóa", "Cắt"/i);
assert.match(strategyPrompt.userPrompt, /Remove all soft\/hedging language/i);
assert.match(strategyPrompt.userPrompt, /Không dùng kiểu nước đôi/i);
assert.match(strategyPrompt.userPrompt, /Xuất đúng JSON 5 key chiến lược/i);
assert.match(strategyPrompt.userPrompt, /verdict, analysis, adversary, tactics, closingLine/i);
assert.match(strategyPrompt.userPrompt, /Trong tactics object phải có đủ 4 key: do, avoid, timing, direction/i);
assert.match(strategyPrompt.userPrompt, /field "closingLine" như một câu chốt riêng/i);
assert.match(strategyPrompt.userPrompt, /Không được trả lời cụt hoặc quá ngắn/i);
assert.match(strategyPrompt.userPrompt, /góc khuất|điểm người hỏi dễ hiểu sai/i);
assert.match(strategyPrompt.userPrompt, /cái giá phải trả/i);
assert.match(strategyPrompt.userPrompt, /giới hạn của cái xấu/i);
assert.match(strategyPrompt.userPrompt, /follow-up question thật trúng/i);
assert.match(strategyPrompt.userPrompt, /chiêm nghiệm kiểu triết gia/i);
assert.match(strategyPrompt.userPrompt, /Trong analysis, phải giải thích rõ ít nhất 2 tín hiệu/i);
assert.match(strategyPrompt.userPrompt, /không được tự rút ngắn phần thân|Giữ nguyên độ dày của bài phân tích/i);
assert.match(strategyPrompt.userPrompt, /các đoạn ngắn có white space rõ/i);
assert.doesNotMatch(strategyPrompt.userPrompt, /^\[LỜI PHÁN\]/im);
assert.doesNotMatch(strategyPrompt.userPrompt, /^\[BÓC TRẦN\]/im);
assert.doesNotMatch(strategyPrompt.userPrompt, /^\[MỆNH LỆNH\]/im);
assert.doesNotMatch(strategyPrompt.userPrompt, /\[ĐIỂM TỔNG\]/);

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
assert.match(wealthStrategyPrompt.userPrompt, /Nhà đầu tư/i);
assert.match(wealthStrategyPrompt.userPrompt, /Dự án/i);

const careerStrategyPrompt = buildStrategyPrompt({
  qmdjData: {
    ...qmdjData,
    selectedTopicKey: 'su-nghiep',
    selectedTopicResult: 'Headline: Công việc đang bị kéo giữa kỳ vọng và áp lực thực thi.',
  },
  userContext: 'Công việc này nên xử lý tiếp thế nào?',
  topicKey: 'su-nghiep',
});
assert.match(careerStrategyPrompt.userPrompt, /\[VỊ THẾ HAI BÊN\]/);
assert.match(careerStrategyPrompt.userPrompt, /Người làm/i);
assert.match(careerStrategyPrompt.userPrompt, /Nhiệm vụ/i);

const voidStrategyPrompt = buildStrategyPrompt({
  qmdjData: {
    ...qmdjData,
    selectedTopicKey: 'tai-van',
    selectedTopicUsefulPalace: 8,
    selectedTopicUsefulPalaceName: 'Đông Bắc',
    selectedTopicCanonicalDungThan: {
      palaceNum: 8,
      palaceName: 'Cấn',
      direction: 'Đông Bắc',
      matchedByText: 'Can Mậu + Môn Sinh',
      targetSummary: 'Can Mậu + Môn Sinh',
      boardText: 'Cung Đông Bắc (P8):\n===> [DỤNG THẦN CHÍNH - BẮT BUỘC PHÂN TÍCH TRỌNG TÂM TẠI ĐÂY] <===\n- Môn: Sinh\n- Tinh: Phụ\n- Thần: Lục Hợp\n- Cờ: Không Vong',
    },
    displayPalaces: {
      8: {
        palaceName: 'Cấn',
        mon: { name: 'Sinh Môn' },
        star: { name: 'Thiên Phụ' },
        than: { name: 'Lục Hợp' },
        khongVong: true,
      },
    },
  },
  userContext: 'Có nên xuống tiền lúc này không?',
  topicKey: 'tai-van',
});
assert.match(voidStrategyPrompt.userPrompt, /\[VOID PRESSURE ON USEFUL GOD\]/);
assert.match(voidStrategyPrompt.userPrompt, /hưng phấn ảo|vỏ bọc|khí chưa thành hình/i);

const topicPrompt = buildKimonPrompt({
  qmdjData,
  userContext: 'Khi nào có đề cương?',
  isAutoLoad: false,
});

assert.match(topicPrompt, /\[FLAGS ENGINE TẠI DỤNG THẦN tại cung 6 · Tây Bắc\]/);
assert.match(topicPrompt, /\[KHO TRI THỨC QMDJ\]/);
assert.match(topicPrompt, /Cờ trọng yếu: Dịch Mã \| Không Vong/);
assert.doesNotMatch(topicPrompt, /\[NGUYÊN TẮC ĐỌC FLAGS\]/);
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
assert.doesNotMatch(topicPrompt, /\[GỢI Ý ẨN DỤ CHO AI\]/);
assert.doesNotMatch(strategyPrompt.userPrompt, /\[GỢI Ý ẨN DỤ CHO AI\]/);

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
