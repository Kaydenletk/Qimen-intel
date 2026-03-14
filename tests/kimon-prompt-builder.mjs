import assert from 'node:assert/strict';
import { buildCompanionPrompt, buildKimonPrompt, buildKimonSystemInstruction, KYMON_TOPIC_SYSTEM_PROMPT } from '../src/logic/kimon/promptBuilder.js';
import { KYMON_PRO_SYSTEM_PROMPT, buildStrategySystemInstruction } from '../src/logic/kimon/strategyPrompt.js';
import { enrichData } from '../src/utils/qmdjHelper.js';

const qmdjData = {
  dayStem: 'Kỷ',
  hourStem: 'Nhâm',
  selectedTopic: 'Gọi điện',
  solarTerm: 'Kinh Trập',
  cucSo: 1,
  isDuong: true,
  dayMarkerPalace: 3,
  dayMarkerDirection: 'Đông',
  hourMarkerPalace: 3,
  hourMarkerDirection: 'Đông',
  hourMarkerResolutionSource: 'sent-stem',
  hourMarkerCarrierStar: 'Cầm',
  markersSamePalace: true,
  hourDoor: 'Kinh',
  hourStar: 'Nhuế',
  hourDeity: 'Chu Tước',
  hourEnergyTone: 'dark',
  hourEnergyVerdict: 'nghịch',
  hourEnergyScore: -17,
  directEnvoyPalace: 9,
  directEnvoyDirection: 'Nam',
  directEnvoyDoor: 'Hưu',
  directEnvoyStar: 'Trụ',
  directEnvoyDeity: 'Cửu Địa',
  directEnvoyActionTone: 'very-bright',
  directEnvoyActionVerdict: 'thuận',
  directEnvoyActionScore: 9,
  quickReadSummary: 'Khí giờ đang nghịch, nhưng hành động đúng cách vẫn có cửa',
  formations: 'Thiên Nhuế gặp Kinh Môn, Thanh Long bị thương',
  topFormations: '- Thanh Long bị thương: Mở mà hao.\n- Thiên Nhuế gặp Kinh Môn: Áp lực và bug nền.',
  allTopics: JSON.stringify([{ topic: 'Gọi điện', verdict: 'Bình', action: 'Nhắn ngắn trước, đừng gọi dồn' }]),
  selectedTopicCanonicalDungThan: {
    palaceNum: 9,
    palaceName: 'Ly',
    direction: 'Nam',
    matchedByText: 'Môn Cảnh + Tinh Phụ',
    targetSummary: 'Môn Cảnh + Tinh Phụ',
    boardText: 'Cung Nam (P9):\n===> [DỤNG THẦN CHÍNH - BẮT BUỘC PHÂN TÍCH TRỌNG TÂM TẠI ĐÂY] <===\n- Môn: Cảnh\n- Tinh: Phụ\n- Thần: Cửu Địa\n- Can: Bính',
  },
  currentHour: 15,
  currentMinute: 30,
  displayPalaces: {
    3: {
      mon: { name: 'Kinh Môn', short: 'Kinh', element: 'Kim', type: 'hung' },
      star: { name: 'Thiên Nhuế', short: 'Nhuế', element: 'Thổ', type: 'hung' },
      than: { name: 'Chu Tước', element: 'Hỏa', type: 'hung' },
      can: { name: 'Nhâm' },
      earthStem: 'Đinh',
      khongVong: false,
    },
    9: {
      mon: { name: 'Cảnh Môn', short: 'Cảnh', element: 'Hỏa', type: 'binh' },
      star: { name: 'Thiên Phụ', short: 'Phụ', element: 'Mộc', type: 'cat' },
      than: { name: 'Cửu Địa', element: 'Thổ', type: 'cat' },
      can: { name: 'Bính' },
      earthStem: 'Canh',
      khongVong: false,
      cachCuc: [{ name: 'Thanh Long bị thương', type: 'Hung' }],
      specialPatterns: [{ name: 'Thanh Long bị thương', type: 'hung' }],
    },
  },
};

const giaDaoQmdjData = {
  ...qmdjData,
  selectedTopicKey: 'gia-dao',
  selectedTopicCanonicalDungThan: {
    palaceNum: 8,
    palaceName: 'Cấn',
    direction: 'Đông Bắc',
    matchedByText: 'Môn Sinh + Thần Lục Hợp',
    targetSummary: 'Môn Sinh + Thần Lục Hợp',
    boardText: 'Cung Đông Bắc (P8):\n===> [DỤNG THẦN CHÍNH - BẮT BUỘC PHÂN TÍCH TRỌNG TÂM TẠI ĐÂY] <===\n- Môn: Sinh\n- Tinh: Trụ\n- Thần: Lục Hợp\n- Can: Đinh\n- Cờ: Không Vong',
  },
};

const propertyPricingQmdjData = {
  ...qmdjData,
  selectedTopicKey: 'bat-dong-san',
  selectedTopicCanonicalDungThan: {
    palaceNum: 3,
    palaceName: 'Chấn',
    direction: 'Đông',
    matchedByText: 'Can Mậu + Môn Sinh',
    targetSummary: 'Can Mậu + Môn Sinh',
    boardText: 'Cung Đông (P3):\n===> [DỤNG THẦN CHÍNH - BẮT BUỘC PHÂN TÍCH TRỌNG TÂM TẠI ĐÂY] <===\n- Môn: Sinh\n- Tinh: Xung\n- Thần: Chu Tước\n- Can: Canh\n- Cờ: Không Vong',
  },
};

const systemInstruction = buildKimonSystemInstruction();
const strategyInstruction = buildStrategySystemInstruction();
const prompt = buildKimonPrompt({ qmdjData, userContext: 'Có nên gọi lúc này không?', isAutoLoad: false });
const autoPrompt = buildKimonPrompt({ qmdjData, userContext: '__AUTO_LOAD__', isAutoLoad: true });
const companionPrompt = buildCompanionPrompt({ qmdjData, userContext: 'Nay có nên nhắn không?' });
const giaDaoPrompt = buildKimonPrompt({ qmdjData: giaDaoQmdjData, userContext: 'Nhà Khanh hiện tại ra sao?', isAutoLoad: false });
const propertyPricingPrompt = buildKimonPrompt({ qmdjData: propertyPricingQmdjData, userContext: 'Nhà Khanh giá bao nhiêu?', isAutoLoad: false });
const enriched = enrichData(qmdjData);

assert.equal(systemInstruction, KYMON_TOPIC_SYSTEM_PROMPT);
assert.equal(strategyInstruction, KYMON_PRO_SYSTEM_PROMPT);
assert.match(systemInstruction, /\[SYSTEM ROLE & PERSONA\]/);
assert.match(systemInstruction, /nhà phân tích Kỳ Môn Độn Giáp/i);
assert.match(systemInstruction, /\[CORE RULES\]/);
assert.match(systemInstruction, /\[VERDICT AS THESIS\]/);
assert.match(systemInstruction, /\[OUTPUT FORMAT - TOPIC JSON\]/);
assert.match(systemInstruction, /3 key: "lead", "message", "closingLine"/i);
assert.match(systemInstruction, /3-6 đoạn/i);
assert.match(systemInstruction, /Trọng lượng phân tích phải nằm ở "message"/i);
assert.match(systemInstruction, /Giữ nguyên độ dày cần thiết của nội dung/i);
assert.match(systemInstruction, /white space rõ ràng/i);
assert.match(systemInstruction, /mỗi đoạn chỉ nên ôm một ý chính/i);
assert.match(systemInstruction, /Không được vuốt ve cho người hỏi dễ chịu/i);
assert.match(systemInstruction, /markdown bold/i);

assert.match(enriched, /\[TÍN HIỆU ĐÈN\]/);
assert.match(enriched, /Khí giờ đang nghịch, nhưng hành động đúng cách vẫn có cửa/);
assert.match(enriched, /Cung Giờ: P3 · Đông · Thần Chu Tước · Môn Kinh · Tinh Nhuế · tone dark/);
assert.match(enriched, /Cung Trực Sử: P9 · Nam · Thần Cửu Địa · Môn Hưu · Tinh Trụ · tone very-bright/);
assert.match(enriched, /\[ENERGY STATE\]/);
assert.match(enriched, /vitality:/i);
assert.match(enriched, /structure:/i);
assert.match(enriched, /transparency:/i);
assert.match(enriched, /tension:/i);
assert.match(enriched, /Giờ hiện tại: 15:30/);
assert.doesNotMatch(enriched, /Điểm: /i);

assert.match(prompt, /\[CHỈ DẤU CHO AI\]/);
assert.match(prompt, /\[TRỤC Kymon Pro\]/);
assert.match(prompt, /\[ENERGY STATE\]/);
assert.match(prompt, /\[KẾT LUẬN LỰC THỰC\]/);
assert.match(prompt, /\[DỤNG THẦN CHUẨN SÁCH\]/);
assert.match(prompt, /Dụng Thần chuẩn sách: cung 9 · Ly · Môn Cảnh \+ Tinh Phụ/i);
assert.match(prompt, /===> \[DỤNG THẦN CHÍNH - BẮT BUỘC PHÂN TÍCH TRỌNG TÂM TẠI ĐÂY\] <===/);
assert.match(prompt, /\[CÂU HỎI NGƯỜI DÙNG\]/);
assert.match(prompt, /\[ĐIỂM CẦN BÁM\]/);
assert.match(prompt, /tone=dark; verdict=nghịch/);
assert.match(prompt, /tone=very-bright; verdict=thuận/);
assert.match(prompt, /THỜI GIAN HIỆN TẠI.*15:30/);
assert.match(prompt, /\[CÁCH CỤC & PATTERN ĐỘNG\]/);
assert.match(prompt, /\[TOP FORMATIONS\]/);
assert.match(prompt, /Thanh Long bị thương/i);
assert.match(prompt, /Có nên gọi lúc này không\?/);
assert.match(prompt, /phán quyết đủ rõ/i);
assert.match(prompt, /markdown bold/i);
assert.match(prompt, /hook\/thesis 1-2 câu/i);
assert.match(prompt, /2-4 lớp để người đọc thấy được toàn cảnh/i);
assert.match(prompt, /ít nhất 2 tín hiệu đang tương tác/i);
assert.match(prompt, /Không được rút ngắn phần thân chỉ vì đã có phán quyết/i);
assert.match(prompt, /Không được dỗ người hỏi cho yên lòng/i);
assert.match(prompt, /các đoạn ngắn có white space rõ ràng/i);
assert.match(prompt, /dấu hai chấm vừa phải/i);
assert.match(prompt, /field "closingLine" riêng/);
assert.match(prompt, /dùng đúng 3 key: lead, message, closingLine/i);
assert.match(prompt, /warning, lời khuyên, hoặc quote ngắn/i);
assert.doesNotMatch(prompt, /\[ĐIỂM TỔNG\]/);
assert.doesNotMatch(prompt, /\[SYSTEM ROLE & PERSONA\]/);
assert.doesNotMatch(prompt, /\[OUTPUT FORMAT - QUY TRÌNH 4 BƯỚC BẮT BUỘC\]/);
assert.doesNotMatch(prompt, /\[YÊU CẦU TRIỂN KHAI\]/);

assert.match(giaDaoPrompt, /\[PERSONA THEO CHỦ ĐỀ\]/);
assert.match(giaDaoPrompt, /\[ENERGY STATE\]/);
assert.match(giaDaoPrompt, /Quân sư tâm lý/);
assert.match(giaDaoPrompt, /tổ ấm|hòa khí|nếp nhà/i);
assert.match(giaDaoPrompt, /Sinh Môn = hơi ấm/i);
assert.match(giaDaoPrompt, /Lục Hợp = sự thấu hiểu/i);
assert.match(giaDaoPrompt, /Không Vong = sự trống vắng/i);
assert.match(giaDaoPrompt, /\[ƯU TIÊN GIA ĐẠO\]/);
assert.match(giaDaoPrompt, /nhà có người nhưng lòng cách xa/i);
assert.match(giaDaoPrompt, /Tránh dùng: giao dịch, pháp lý, đầu tư/i);

assert.match(propertyPricingPrompt, /\[TRỤC CÂU HỎI\]/);
assert.match(propertyPricingPrompt, /\[ENERGY STATE\]/);
assert.match(propertyPricingPrompt, /Định giá \/ Giá tiền/);
assert.match(propertyPricingPrompt, /giá treo, giá chạm, giá chốt/i);
assert.match(propertyPricingPrompt, /closingLine phải chốt vào giá, khả năng bán, khả năng chốt/i);

assert.match(autoPrompt, /\[BỐI CẢNH TỰ ĐỘNG\]/);
assert.match(autoPrompt, /\[ĐIỂM CẦN BÁM\]/);
assert.match(autoPrompt, /Câu mở đầu phải chốt rõ nhịp chính/i);
assert.match(autoPrompt, /markdown bold/i);
assert.match(autoPrompt, /lead = mở bài ngắn; message = thân bài chính đủ dày/i);
assert.match(autoPrompt, /được phép viết dài hơn để diễn tả đủ bức tranh/i);
assert.match(autoPrompt, /2-4 tầng nghĩa/i);
assert.match(autoPrompt, /phần thân thành nhiều đoạn ngắn/i);
assert.match(autoPrompt, /dấu hai chấm để mở ý mới/i);
assert.match(autoPrompt, /field "closingLine" riêng/);
assert.doesNotMatch(autoPrompt, /Ưu tiên bám Cung Giờ trước/);

assert.match(companionPrompt.systemPrompt, /Dòng cuối cùng BẮT BUỘC phải theo định dạng: "Chốt: \.\.\."/);
assert.match(companionPrompt.systemPrompt, /8-18 từ/);
assert.match(companionPrompt.systemPrompt, /2-4 đoạn rõ ý/i);
assert.match(companionPrompt.systemPrompt, /ít nhất 2 tín hiệu của trận/i);
assert.match(companionPrompt.systemPrompt, /2-4 tầng ý nghĩa/i);
assert.match(companionPrompt.userPrompt, /Kết thúc bằng đúng 1 dòng "Chốt: \.\.\."/);
assert.match(companionPrompt.userPrompt, /không quá ngắn/i);
assert.match(companionPrompt.userPrompt, /2-4 đoạn/i);
assert.match(companionPrompt.userPrompt, /2-4 tầng/i);

console.log('ASSERTIONS: OK');
