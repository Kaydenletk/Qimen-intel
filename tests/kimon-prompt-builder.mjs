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
  formations: 'Thiên Nhuế gặp Kinh Môn',
  allTopics: JSON.stringify([{ topic: 'Gọi điện', verdict: 'Bình', score: -2, action: 'Nhắn ngắn trước, đừng gọi dồn' }]),
  currentHour: 15,
  currentMinute: 30,
};

const systemInstruction = buildKimonSystemInstruction();
const strategyInstruction = buildStrategySystemInstruction();
const prompt = buildKimonPrompt({ qmdjData, userContext: 'Có nên gọi lúc này không?', isAutoLoad: false });
const autoPrompt = buildKimonPrompt({ qmdjData, userContext: '__AUTO_LOAD__', isAutoLoad: true });
const companionPrompt = buildCompanionPrompt({ qmdjData, userContext: 'Nay có nên nhắn không?' });
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

assert.match(enriched, /\[TÍN HIỆU ĐÈN\]/);
assert.match(enriched, /Khí giờ đang nghịch, nhưng hành động đúng cách vẫn có cửa/);
assert.match(enriched, /Cung Giờ: P3 · Đông · Thần Chu Tước · Môn Kinh · Tinh Nhuế · tone dark/);
assert.match(enriched, /Cung Trực Sử: P9 · Nam · Thần Cửu Địa · Môn Hưu · Tinh Trụ · tone very-bright/);
assert.match(enriched, /Giờ hiện tại: 15:30/);

assert.match(prompt, /\[CHỈ DẤU CHO AI\]/);
assert.match(prompt, /\[TRỤC Kymon Pro\]/);
assert.match(prompt, /\[CÂU HỎI NGƯỜI DÙNG\]/);
assert.match(prompt, /\[ĐIỂM CẦN BÁM\]/);
assert.match(prompt, /tone=dark; verdict=nghịch/);
assert.match(prompt, /tone=very-bright; verdict=thuận/);
assert.match(prompt, /THỜI GIAN HIỆN TẠI.*15:30/);
assert.match(prompt, /Có nên gọi lúc này không\?/);
assert.match(prompt, /phán quyết đủ rõ/i);
assert.match(prompt, /hook\/thesis 1-2 câu/i);
assert.match(prompt, /2-4 lớp để người đọc thấy được toàn cảnh/i);
assert.match(prompt, /ít nhất 2 tín hiệu đang tương tác/i);
assert.match(prompt, /field "closingLine" riêng/);
assert.match(prompt, /dùng đúng 3 key: lead, message, closingLine/i);
assert.doesNotMatch(prompt, /\[SYSTEM ROLE & PERSONA\]/);
assert.doesNotMatch(prompt, /\[OUTPUT FORMAT - QUY TRÌNH 4 BƯỚC BẮT BUỘC\]/);
assert.doesNotMatch(prompt, /\[YÊU CẦU TRIỂN KHAI\]/);

assert.match(autoPrompt, /\[BỐI CẢNH TỰ ĐỘNG\]/);
assert.match(autoPrompt, /\[ĐIỂM CẦN BÁM\]/);
assert.match(autoPrompt, /Câu mở đầu phải chốt rõ nhịp chính/i);
assert.match(autoPrompt, /lead = mở bài ngắn; message = thân bài chính đủ dày/i);
assert.match(autoPrompt, /được phép viết dài hơn để diễn tả đủ bức tranh/i);
assert.match(autoPrompt, /2-4 tầng nghĩa/i);
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
