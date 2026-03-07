import assert from 'node:assert/strict';
import { buildKimonPrompt, buildKimonSystemInstruction } from '../src/logic/kimon/promptBuilder.js';
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
  mentalState: 'Đầu óc đang dễ bật chế độ phòng vệ.',
  conflict: 'Tình huống đang ép bạn phản ứng nhanh hơn mức cần thiết.',
  blindSpot: 'Rủi ro nằm ở chỗ nói quá sớm.',
  energyAdvice: 'Nên thử nhỏ trước khi chốt.',
  formations: 'Thiên Nhuế gặp Kinh Môn',
  allTopics: JSON.stringify([{ topic: 'Gọi điện', verdict: 'Bình', score: -2, action: 'Nhắn ngắn trước, đừng gọi dồn' }]),
};

const systemInstruction = buildKimonSystemInstruction();
const prompt = buildKimonPrompt({ qmdjData, userContext: 'Có nên gọi lúc này không?', isAutoLoad: false });
const autoPrompt = buildKimonPrompt({ qmdjData, userContext: '__AUTO_LOAD__', isAutoLoad: true });
const enriched = enrichData(qmdjData);

assert.match(systemInstruction, /Bạn là Kymon — Trợ lý chiến lược chuyên sâu/);
assert.match(systemInstruction, /Strict but Fair/);
assert.match(systemInstruction, /\[CẤU TRÚC PHẢN HỒI BẮT BUỘC\]/);
assert.match(systemInstruction, /TRỰC DIỆN \(The Hook\)/);
assert.match(systemInstruction, /PHÂN TÍCH \(The Core\)/);
assert.match(systemInstruction, /HÀNH ĐỘNG \(The Action\)/);
assert.match(systemInstruction, /Tuyệt đối không dùng từ đệm lặp lại/);
assert.match(systemInstruction, /"Chà", "Mách nhỏ", "Nói thật nhé", "À", "Ừm"/);
assert.match(systemInstruction, /Ngôn ngữ phải sạch/);
assert.match(systemInstruction, /Tự động ngắt đoạn bằng dấu xuống dòng thực tế/);
assert.match(systemInstruction, /"summary": "Câu trả lời trực tiếp và sắc bén nhất\."/, 'Prompt mới phải có summary');
assert.match(systemInstruction, /"analysis": "Nội dung luận giải có chiều sâu, chia đoạn rõ ràng\."/, 'Prompt mới phải có analysis');
assert.match(systemInstruction, /"action": "Lời khuyên hành động cụ thể\."/, 'Prompt mới phải có action');

assert.match(enriched, /\[TÍN HIỆU ĐÈN\]/);
assert.match(enriched, /Khí giờ đang nghịch, nhưng hành động đúng cách vẫn có cửa/);
assert.match(enriched, /Ngày và Giờ cùng một cung/);
assert.match(enriched, /Dấu giờ đang ký gửi/);
assert.match(enriched, /Cung Giờ: P3 · Đông · Thần Chu Tước · Môn Kinh · Tinh Nhuế · tone dark/);
assert.match(enriched, /Cung Trực Sử: P9 · Nam · Thần Cửu Địa · Môn Hưu · Tinh Trụ · tone very-bright/);

assert.match(prompt, /\[CHỈ DẤU CHO AI\]/);
assert.match(prompt, /tone=dark; verdict=nghịch/);
assert.match(prompt, /tone=very-bright; verdict=thuận/);
assert.match(prompt, /Có nên gọi lúc này không\?/);
assert.match(prompt, /ưu tiên trả lời trực tiếp nhu cầu thật của người dùng trước/);
assert.match(autoPrompt, /Ưu tiên bám Cung Giờ trước/);
assert.match(autoPrompt, /Nếu thấy nên chờ hoặc nghỉ, hãy nói rõ khoảng thời gian gợi ý/);

console.log('ASSERTIONS: OK');
