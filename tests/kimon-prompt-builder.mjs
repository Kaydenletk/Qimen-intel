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
  currentHour: 15,
  currentMinute: 30,
};

const systemInstruction = buildKimonSystemInstruction();
const prompt = buildKimonPrompt({ qmdjData, userContext: 'Có nên gọi lúc này không?', isAutoLoad: false });
const autoPrompt = buildKimonPrompt({ qmdjData, userContext: '__AUTO_LOAD__', isAutoLoad: true });
const enriched = enrichData(qmdjData);

// ── System Instruction: Deep Dive schema ──
assert.match(systemInstruction, /Bạn là Kimon/);
assert.match(systemInstruction, /Deep Dive/);
assert.match(systemInstruction, /\[QUY TẮC DEEP DIVE - BẮT BUỘC\]/);
assert.match(systemInstruction, /Định vị Bản thân/);
assert.match(systemInstruction, /Định vị Dụng Thần/);
assert.match(systemInstruction, /"tongQuan"/);
assert.match(systemInstruction, /"tamLy"/);
assert.match(systemInstruction, /"chienLuoc"/);
assert.match(systemInstruction, /"hanhDong"/);
assert.match(systemInstruction, /"kimonQuote"/);

// ── System Instruction: Time awareness ──
assert.match(systemInstruction, /THỜI GIAN TUYẾN TÍNH/);
assert.match(systemInstruction, /CHỈ gợi ý khung giờ TƯƠNG LAI/);
assert.match(systemInstruction, /KHUNG GIỜ TỐT TRONG TƯƠNG LAI/);

// ── System Instruction: Casual routing ──
assert.match(systemInstruction, /câu hỏi đời thường/);
assert.match(systemInstruction, /KHÔNG bẻ lái vào chủ đề lớn/);
assert.match(systemInstruction, /KHÔNG suy diễn ngữ nghĩa cưỡng ép/);

// ── enrichData ──
assert.match(enriched, /\[TÍN HIỆU ĐÈN\]/);
assert.match(enriched, /Khí giờ đang nghịch, nhưng hành động đúng cách vẫn có cửa/);
assert.match(enriched, /Ngày và Giờ cùng một cung/);
assert.match(enriched, /Dấu giờ đang ký gửi/);
assert.match(enriched, /Cung Giờ: P3 · Đông · Thần Chu Tước · Môn Kinh · Tinh Nhuế · tone dark/);
assert.match(enriched, /Cung Trực Sử: P9 · Nam · Thần Cửu Địa · Môn Hưu · Tinh Trụ · tone very-bright/);
assert.match(enriched, /Giờ hiện tại: 15:30/);

// ── Prompt: contains chart data and time ──
assert.match(prompt, /\[CHỈ DẤU CHO AI\]/);
assert.match(prompt, /tone=dark; verdict=nghịch/);
assert.match(prompt, /tone=very-bright; verdict=thuận/);
assert.match(prompt, /THỜI GIAN HIỆN TẠI.*15:30/);
assert.match(prompt, /Có nên gọi lúc này không\?/);

// ── AutoLoad prompt ──
assert.match(autoPrompt, /Ưu tiên bám Cung Giờ trước/);

console.log('ASSERTIONS: OK');
