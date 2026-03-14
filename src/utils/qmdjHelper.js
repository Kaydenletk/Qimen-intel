/**
 * enrichData() - Biến dữ liệu thô thành ngữ cảnh hành vi cho Kimon.
 *
 * Mục tiêu:
 * - Ưu tiên tín hiệu quick-read đã được engine tính sẵn
 * - Giảm ngôn ngữ kỹ thuật/ngũ hành khô
 * - Đưa AI vào thế "đọc bàn để tư vấn", không phải "giải bài tập"
 */

import { buildEnergyStateBundle, buildEnergyStateContext } from '../logic/kimon/energyState.js';

// ═══════════════════════════════════════════════════════════════════════════
// TỪ ĐIỂN NGŨ HÀNH (Thiên Can)
// ═══════════════════════════════════════════════════════════════════════════
const CAN_HANH = {
  'Giáp': 'Mộc', 'Ất': 'Mộc',
  'Bính': 'Hỏa', 'Đinh': 'Hỏa',
  'Mậu': 'Thổ', 'Kỷ': 'Thổ',
  'Canh': 'Kim', 'Tân': 'Kim',
  'Nhâm': 'Thủy', 'Quý': 'Thủy',
};

const CUNG_HANH = {
  'Khảm': 'Thủy', 'Khôn': 'Thổ', 'Chấn': 'Mộc', 'Tốn': 'Mộc',
  'Trung': 'Thổ', 'Càn': 'Kim', 'Đoài': 'Kim', 'Cấn': 'Thổ', 'Ly': 'Hỏa',
  '1': 'Thủy', '2': 'Thổ', '3': 'Mộc', '4': 'Mộc',
  '5': 'Thổ', '6': 'Kim', '7': 'Kim', '8': 'Thổ', '9': 'Hỏa',
};

const MON_HANH = {
  'Hưu': 'Thủy', 'Sinh': 'Thổ', 'Thương': 'Mộc', 'Đỗ': 'Mộc',
  'Cảnh': 'Hỏa', 'Tử': 'Thổ', 'Kinh': 'Kim', 'Khai': 'Kim',
};

// ═══════════════════════════════════════════════════════════════════════════
// Ý NGHĨA (Dùng ngôn ngữ đời thường, không thuật ngữ)
// ═══════════════════════════════════════════════════════════════════════════
const MON_MEANING = {
  'Hưu': 'đang cần nghỉ ngơi, nạp năng lượng',
  'Sinh': 'có cơ hội tăng trưởng, sinh lời',
  'Thương': 'gặp cạnh tranh, có thể bị tổn thương',
  'Đỗ': 'bị bế tắc, nên ẩn mình chờ thời',
  'Cảnh': 'thiên về hình ảnh, hợp đồng, bề nổi',
  'Tử': 'gặp bế tắc, khó tiến, nên dừng lại',
  'Kinh': 'có lo âu, cần cẩn trọng',
  'Khai': 'thuận lợi mở rộng, hành động mới',
};

const THAN_MEANING = {
  'Trực Phù': 'có quý nhân hỗ trợ mạnh',
  'Đằng Xà': 'tình hình biến động, khó lường',
  'Thái Âm': 'có phúc ngầm, người giúp kín',
  'Lục Hợp': 'thuận lợi hợp tác, kết nối',
  'Câu Trận': 'dễ bị vướng mắc, trì trệ',
  'Bạch Hổ': 'áp lực mạnh, cần bứt phá',
  'Chu Tước': 'liên quan tin tức, giấy tờ, lời nói',
  'Huyền Vũ': 'cẩn thận lừa dối, mất mát',
  'Cửu Địa': 'nền tảng vững, chậm mà chắc',
  'Cửu Thiên': 'cơ hội bùng nổ, tầm nhìn xa',
};

// ═══════════════════════════════════════════════════════════════════════════
// LOGIC SINH KHẮC (Trả về câu dễ hiểu)
// ═══════════════════════════════════════════════════════════════════════════
const SINH_ORDER = ['Mộc', 'Hỏa', 'Thổ', 'Kim', 'Thủy'];

function moTaQuanHe(hanh1, hanh2, ten1 = 'Bạn', ten2 = 'Sự việc') {
  if (!hanh1 || !hanh2) return '';
  if (hanh1 === hanh2) return `${ten1} và ${ten2} đang giằng co, chưa bên nào thật sự áp đảo.`;

  const i1 = SINH_ORDER.indexOf(hanh1);
  const i2 = SINH_ORDER.indexOf(hanh2);
  if (i1 < 0 || i2 < 0) return '';

  // Sinh
  if ((i1 + 1) % 5 === i2) {
    return `${ten1} đang dồn lực cho ${ten2}, dễ hao sức nếu cố ôm hết phần nặng.`;
  }
  if ((i2 + 1) % 5 === i1) {
    return `${ten2} đang tiếp sức cho ${ten1}, nhịp này có lực đẩy từ bên ngoài.`;
  }

  // Khắc
  if ((i1 + 2) % 5 === i2) {
    return `${ten1} đang cố cầm nhịp ${ten2}, chủ động nhưng sẽ tốn sức.`;
  }
  if ((i2 + 2) % 5 === i1) {
    return `${ten2} đang ép ${ten1} phải phản ứng, nhịp này dễ rơi vào thế bị động.`;
  }

  return '';
}

// ═══════════════════════════════════════════════════════════════════════════
// HÀM CHÍNH: enrichData()
// ═══════════════════════════════════════════════════════════════════════════
export const enrichData = (raw) => {
  if (!raw || Object.keys(raw).length === 0) {
    return '[Chưa có dữ liệu]';
  }

  const energyBundle = raw?.energyStates && raw?.usefulGodState
    ? {
      energyStates: raw.energyStates,
      usefulGodState: raw.usefulGodState,
      hourState: raw.hourState,
      directEnvoyState: raw.directEnvoyState,
      topicStateSummary: raw.topicStateSummary || '',
    }
    : buildEnergyStateBundle({ qmdjData: raw });

  const parts = [];
  const push = (label, lines = []) => {
    const cleaned = lines.filter(Boolean);
    if (cleaned.length > 0) parts.push(`[${label}] ${cleaned.join(' ')}`);
  };

  const hourMarkerPalace = raw.hourMarkerPalace || '';
  const dayMarkerPalace = raw.dayMarkerPalace || '';
  const hourDirection = raw.hourPalaceDirection || raw.hourMarkerDirection || '';
  const routeDirection = raw.directEnvoyDirection || '';
  const hourTone = raw.hourEnergyTone || '';
  const routeTone = raw.directEnvoyActionTone || '';
  const sameMarkerPalace = Boolean(raw.markersSamePalace);

  push('TÍN HIỆU ĐÈN', [
    raw.quickReadSummary || '',
    (hourMarkerPalace || raw.hourDoor || raw.hourStar || raw.hourDeity)
      ? `Cung Giờ: P${hourMarkerPalace || '—'}${hourDirection ? ` · ${hourDirection}` : ''} · Thần ${raw.hourDeity || '—'} · Môn ${raw.hourDoor || '—'} · Tinh ${raw.hourStar || '—'} · tone ${hourTone || 'neutral'} · verdict ${raw.hourEnergyVerdict || 'trung'}.`
      : '',
    (raw.directEnvoyPalace || raw.directEnvoyDoor)
      ? `Cung Trực Sử: P${raw.directEnvoyPalace || '—'}${routeDirection ? ` · ${routeDirection}` : ''} · Thần ${raw.directEnvoyDeity || '—'} · Môn ${raw.directEnvoyDoor || '—'} · Tinh ${raw.directEnvoyStar || '—'} · tone ${routeTone || 'neutral'} · verdict ${raw.directEnvoyActionVerdict || 'trung'}.`
      : '',
  ]);

  const energyStateContext = buildEnergyStateContext(energyBundle);
  if (energyStateContext) {
    parts.push(energyStateContext);
  }
  if (energyBundle?.topicStateSummary) {
    push('KẾT LUẬN LỰC THỰC', [energyBundle.topicStateSummary]);
  }

  push('MARKER THỜI GIAN', [
    dayMarkerPalace ? `Ngày ở P${dayMarkerPalace}${raw.dayMarkerDirection ? ` ${raw.dayMarkerDirection}` : ''}.` : '',
    hourMarkerPalace ? `Giờ ở P${hourMarkerPalace}${hourDirection ? ` ${hourDirection}` : ''}.` : '',
    sameMarkerPalace ? 'Ngày và Giờ cùng một cung: sự việc đang quấn sát vào người hỏi, khó tách mình khỏi tình huống.' : '',
    raw.hourMarkerResolutionSource === 'sent-stem'
      ? 'Dấu giờ đang ký gửi, nên đọc đây là kết quả chịu tác động ngoại lực hoặc phụ thuộc người khác.'
      : '',
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // 1. BẠN (NHẬT CAN) - Người đang hỏi
  // ─────────────────────────────────────────────────────────────────────────
  const dayStem = raw.dayStem || '';
  const dayStemHanh = CAN_HANH[dayStem] || '';
  const cung = raw.cung || raw.dayPalace || '';
  const cungHanh = CUNG_HANH[cung] || '';
  const mon = raw.mon || '';
  const than = raw.than || '';
  const tinh = raw.tinh || '';

  push('NGƯỜI HỎI', [
    dayStem ? `Nhật Can: ${dayStem}.` : '',
    cung ? `Bạn đang đứng ở cung ${cung}.` : '',
    mon ? `Cửa đang cầm tay: ${mon} - ${MON_MEANING[mon] || mon}.` : '',
    than ? `Nền hỗ trợ: ${than} - ${THAN_MEANING[than] || than}.` : '',
    tinh ? `Sao đi cùng: ${tinh}.` : '',
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // 2. SỰ VIỆC (THỜI CAN) - Cái đang diễn ra
  // ─────────────────────────────────────────────────────────────────────────
  const hourStem = raw.hourStem || '';
  const hourStemHanh = CAN_HANH[hourStem] || '';

  push('SỰ VIỆC', [
    hourStem ? `Thời Can: ${hourStem}.` : '',
    raw.hourMarkerResolutionSource === 'sent-stem'
      ? 'Kết quả không đứng độc lập, nó đang bám vào một vật mang hoặc yếu tố trung gian.'
      : hourStem ? 'Sự việc đang lộ mặt trực tiếp hơn, ít vòng vo hơn.' : '',
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // 3. QUAN HỆ BẠN ↔ SỰ VIỆC (Cái quan trọng nhất!)
  // ─────────────────────────────────────────────────────────────────────────
  if (dayStemHanh && hourStemHanh) {
    const relation = moTaQuanHe(dayStemHanh, hourStemHanh, 'Bạn', 'Sự việc');
    if (relation) push('TƯƠNG TÁC', [relation]);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. TRẠNG THÁI ĐẶC BIỆT
  // ─────────────────────────────────────────────────────────────────────────
  const specials = [];
  if (raw.isPhucAm) specials.push('Nhịp đang trì, đẩy mạnh quá dễ bị ì.');
  if (raw.isPhanNgam) specials.push('Tình thế dễ dội ngược, cần chừa đường lùi.');
  if (raw.formations) specials.push(`Các tín hiệu nổi bật: ${raw.formations}.`);
  push('CẢNH BÁO', specials);

  // ─────────────────────────────────────────────────────────────────────────
  // 5. PHÂN TÍCH TÂM LÝ CÓ SẴN (Đã được tính toán trước)
  // ─────────────────────────────────────────────────────────────────────────
  const insights = [];
  if (raw.mentalState) insights.push(`Tâm trạng: ${raw.mentalState}`);
  if (raw.conflict) insights.push(`Xung đột: ${raw.conflict}`);
  if (raw.blindSpot) insights.push(`Điểm mù: ${raw.blindSpot}`);
  if (raw.energyAdvice) insights.push(`Năng lượng: ${raw.energyAdvice}`);
  push('TÂM LÝ', insights);

  // ─────────────────────────────────────────────────────────────────────────
  // 6. THỜI ĐIỂM HIỆN TẠI (Linear Time Awareness)
  // ─────────────────────────────────────────────────────────────────────────
  if (raw.currentHour !== undefined) {
    push('THỜI ĐIỂM', [
      `Giờ hiện tại: ${raw.currentHour}:${String(raw.currentMinute || 0).padStart(2, '0')}. Mọi gợi ý khung giờ phải > mốc này.`
    ]);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. ĐIỂM SỐ & METADATA
  // ─────────────────────────────────────────────────────────────────────────
  const meta = [];
  if (raw.cucSo) meta.push(`Cục ${raw.cucSo} ${raw.isDuong ? 'Dương' : 'Âm'}`);
  if (raw.solarTerm) meta.push(raw.solarTerm);
  if (raw.selectedTopic) meta.push(`Chủ đề: ${raw.selectedTopic}`);
  push('BỐI CẢNH', meta);

  return parts.join('\n');
};

export default enrichData;
