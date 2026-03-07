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

assert.match(systemInstruction, /Bạn là Kymon — một người đồng hành chiến lược am hiểu sâu sắc Kỳ Môn Độn Giáp \(hệ Chuyển Bàn Joey Yap\)/);
assert.match(systemInstruction, /Truth > vibes, nhưng vẫn phải giữ cảm giác con người/);
assert.match(systemInstruction, /\[NGUYÊN TẮC MỞ TRẬN & PHẢN HỒI\]/);
assert.match(systemInstruction, /Nếu user cần quyết định \(decision\): chốt rõ trong 1-2 câu đầu/);
assert.match(systemInstruction, /Nếu user đang rối bời, tâm sự \(companion\): mở đầu bằng sự đồng cảm/);
assert.match(systemInstruction, /Mỗi luận điểm phải gắn với ít nhất 1 yếu tố cụ thể từ trận đồ/);
assert.match(systemInstruction, /\[NGUYÊN TẮC ƯU TIÊN BẰNG CHỨNG\]/);
assert.match(systemInstruction, /Nếu câu hỏi thuộc một chủ đề cụ thể .* phải lấy bằng chứng của chủ đề đó làm trục chính/);
assert.match(systemInstruction, /Không được tự ý kết luận ngược với chủ đề chính/);
assert.match(systemInstruction, /\[BẢNG TRA NHANH KỲ MÔN - CHUẨN JOEY YAP\]/);
assert.match(systemInstruction, /Khai = Cửa mở, khởi đầu, thăng tiến -> HÃY BẮT ĐẦU\./);
assert.match(systemInstruction, /Trực Phù = Tổng quản, quý nhân bảo hộ -> Được che chở, có người đỡ lưng\./);
assert.match(systemInstruction, /Không Vong = Hư không, offline -> Vùng năng lượng trống, rỗng tuếch, bộ nhớ đình công\./);
assert.match(systemInstruction, /\[CHUỖI LUẬN BẮT BUỘC\]/);
assert.match(systemInstruction, /Luôn quét ít nhất 2-3 yếu tố: MÔN .* \+ TINH .* \+ THẦN/);
assert.match(systemInstruction, /Biểu hiện bề mặt -> Bản chất .* -> Lời khuyên hành động thực tế/);
assert.match(systemInstruction, /"mode": "companion \| decision \| interpretation"/, 'Prompt mới phải có mode');
assert.match(systemInstruction, /"lead": "Câu dẫn vào điềm tĩnh, sắc sảo\. Tùy biến theo yêu cầu\."/, 'Prompt mới phải có lead');
assert.match(systemInstruction, /"timeHint": "Mốc thời gian an toàn\/cảnh báo \(nếu có\), nếu không có thì để rỗng\."/, 'Prompt mới phải có timeHint');
assert.match(systemInstruction, /"message": "Phân tích chính\. 2-4 đoạn ngắn\. Mạch lạc, giải phẫu vấn đề sâu sắc bằng trận đồ\."/, 'Prompt mới phải có message');
assert.match(systemInstruction, /"closingLine": "1 câu chốt, tối đa 15 từ\. Thấm thía\. Khuyên, hoặc cảnh báo, kiểu hài nhưng chất\."/, 'Prompt mới phải có closingLine');

assert.match(enriched, /\[TÍN HIỆU ĐÈN\]/);
assert.match(enriched, /Khí giờ đang nghịch, nhưng hành động đúng cách vẫn có cửa/);
assert.match(enriched, /Ngày và Giờ cùng một cung/);
assert.match(enriched, /Dấu giờ đang ký gửi/);
assert.match(enriched, /Cung Giờ: P3 · Đông · Thần Chu Tước · Môn Kinh · Tinh Nhuế · tone dark/);
assert.match(enriched, /Cung Trực Sử: P9 · Nam · Thần Cửu Địa · Môn Hưu · Tinh Trụ · tone very-bright/);

assert.match(prompt, /\[CHỈ DẤU CHO AI\]/);
assert.match(prompt, /tone=dark; verdict=nghịch/);
assert.match(prompt, /tone=very-bright; verdict=thuận/);
assert.match(prompt, /\[TRỤC ƯU TIÊN\]/);
assert.match(prompt, /Chủ đề user đang hỏi gần nhất: Gọi điện\./);
assert.match(prompt, /Có nên gọi lúc này không\?/);
assert.match(prompt, /Nếu câu hỏi mang tính quyết định, hãy chốt rõ trong 1-2 câu đầu rồi mới đào sâu lý do/);
assert.match(prompt, /Nếu câu hỏi mơ hồ hoặc cảm xúc, hãy đi vào tâm lý, nút thắt và điều user đang chưa nhìn ra/);
assert.match(prompt, /Nếu câu hỏi thuộc một chủ đề cụ thể, hãy dùng bằng chứng đúng chủ đề đó làm trục chính/);
assert.match(prompt, /Luôn nối ít nhất 2-3 yếu tố Kỳ Môn lại với nhau, không được chỉ liệt kê rời rạc/);
assert.match(autoPrompt, /Ưu tiên bám Cung Giờ trước/);
assert.match(autoPrompt, /Nếu thấy nên chờ hoặc nghỉ, hãy nói rõ khoảng thời gian gợi ý/);
assert.match(autoPrompt, /Nếu có điểm mù hoặc lực cản đáng ngại, hãy nói thẳng nhưng theo ngôn ngữ đời thường/);
assert.match(autoPrompt, /Mỗi ý chính phải gắn với tổ hợp Môn \+ Tinh \+ Thần đủ rõ/);

console.log('ASSERTIONS: OK');
