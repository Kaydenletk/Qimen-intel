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

assert.match(systemInstruction, /Bạn là Kymon — một người đồng hành chiến lược sắc sảo, thực tế, nói chuyện tự nhiên như người thật/);
assert.match(systemInstruction, /Truth > vibes, nhưng phải giữ cảm giác người thật đang nói chuyện với người thật/);
assert.match(systemInstruction, /\[CÁCH TRẢ LỜI THEO NGỮ CẢNH\]/);
assert.match(systemInstruction, /Nếu user hỏi quyết định: chốt rõ trước, rồi giải thích sâu vì sao/);
assert.match(systemInstruction, /Nếu user hỏi tâm sự, rối, cảm xúc: đi vào tâm lý, nút thắt, điều user chưa nhìn ra/);
assert.match(systemInstruction, /Không dùng cùng một công thức nói chuyện cho nhiều câu trả lời liên tiếp/);
assert.match(systemInstruction, /\[CHIỀU SÂU BẮT BUỘC\]/);
assert.match(systemInstruction, /biểu hiện bề mặt -> bản chất -> lời khuyên/);
assert.match(systemInstruction, /"mode": "companion \| decision \| interpretation"/, 'Prompt mới phải có mode');
assert.match(systemInstruction, /"lead": "Câu dẫn vào tự nhiên, không khô cứng, không gắn nhãn máy móc\."/, 'Prompt mới phải có lead');
assert.match(systemInstruction, /"timeHint": "Nếu câu hỏi liên quan thời gian thì trả mốc thời gian cụ thể hoặc khoảng an toàn; nếu không thì chuỗi rỗng\."/, 'Prompt mới phải có timeHint');
assert.match(systemInstruction, /"message": "Phần trả lời chính, 2-5 đoạn ngắn khi cần, rõ, sâu, đời, thực tế, usable\."/, 'Prompt mới phải có message');
assert.match(systemInstruction, /"closingLine": "Một câu chốt ngắn, sắc, đọng lại, usable\."/, 'Prompt mới phải có closingLine');

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
assert.match(prompt, /Ưu tiên trả lời trực tiếp nhu cầu thật của người dùng trước, rồi mới giải thích lớp sâu phía sau/);
assert.match(prompt, /Nếu câu hỏi mơ hồ hoặc cảm xúc, hãy đi vào tâm lý và nút thắt/);
assert.match(prompt, /Nếu câu hỏi mang tính quyết định, hãy chốt rõ rồi mới đào sâu lý do/);
assert.match(autoPrompt, /Ưu tiên bám Cung Giờ trước/);
assert.match(autoPrompt, /Nếu thấy nên chờ hoặc nghỉ, hãy nói rõ khoảng thời gian gợi ý/);
assert.match(autoPrompt, /Nếu có điểm mù hoặc lực cản đáng ngại, hãy nói thẳng nhưng theo ngôn ngữ đời thường/);

console.log('ASSERTIONS: OK');
