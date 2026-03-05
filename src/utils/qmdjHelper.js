/**
 * enrichData() - Biến dữ liệu thô thành "câu chuyện" cho AI hiểu
 *
 * Logic: Thay vì đưa thuật ngữ khô khan, ta đưa ngữ cảnh có nghĩa
 */

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
  if (hanh1 === hanh2) return `${ten1} và ${ten2} cùng hành, ngang sức ngang tài.`;

  const i1 = SINH_ORDER.indexOf(hanh1);
  const i2 = SINH_ORDER.indexOf(hanh2);
  if (i1 < 0 || i2 < 0) return '';

  // Sinh
  if ((i1 + 1) % 5 === i2) {
    return `${ten1} đang "nuôi dưỡng" ${ten2} (${hanh1} sinh ${hanh2}) - bạn bỏ công sức, có thể hao tán nếu không cẩn thận.`;
  }
  if ((i2 + 1) % 5 === i1) {
    return `${ten2} đang "hỗ trợ" ${ten1} (${hanh2} sinh ${hanh1}) - thuận lợi, được tiếp sức.`;
  }

  // Khắc
  if ((i1 + 2) % 5 === i2) {
    return `${ten1} đang "kiểm soát" ${ten2} (${hanh1} khắc ${hanh2}) - bạn chủ động nhưng tốn sức.`;
  }
  if ((i2 + 2) % 5 === i1) {
    return `${ten2} đang "gây áp lực" lên ${ten1} (${hanh2} khắc ${hanh1}) - bạn bị kìm hãm, cần cẩn trọng.`;
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

  const parts = [];

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

  if (dayStem) {
    let selfDesc = `[BẠN] Nhật Can ${dayStem} (${dayStemHanh})`;
    if (cung) selfDesc += ` tại cung ${cung}`;
    if (mon) selfDesc += `. Công cụ hành động: ${mon} - ${MON_MEANING[mon] || mon}`;
    if (than) selfDesc += `. Năng lượng hỗ trợ: ${than} - ${THAN_MEANING[than] || than}`;
    if (tinh) selfDesc += `. Sao chiếu: ${tinh}`;
    parts.push(selfDesc);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. SỰ VIỆC (THỜI CAN) - Cái đang diễn ra
  // ─────────────────────────────────────────────────────────────────────────
  const hourStem = raw.hourStem || '';
  const hourStemHanh = CAN_HANH[hourStem] || '';

  if (hourStem) {
    let eventDesc = `[SỰ VIỆC] Thời Can ${hourStem} (${hourStemHanh})`;
    parts.push(eventDesc);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. QUAN HỆ BẠN ↔ SỰ VIỆC (Cái quan trọng nhất!)
  // ─────────────────────────────────────────────────────────────────────────
  if (dayStemHanh && hourStemHanh) {
    const relation = moTaQuanHe(dayStemHanh, hourStemHanh, 'Bạn', 'Sự việc');
    if (relation) parts.push(`[TƯƠNG TÁC] ${relation}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. TRẠNG THÁI ĐẶC BIỆT
  // ─────────────────────────────────────────────────────────────────────────
  const specials = [];
  if (raw.isPhucAm) specials.push('PHỤC ÂM - Mọi thứ trì trệ, nên giữ nguyên, không hành động lớn');
  if (raw.isPhanNgam) specials.push('PHẢN NGÂM - Xung đột, đảo lộn, cần linh hoạt thay đổi kế hoạch');
  if (raw.formations) specials.push(`Cách cục: ${raw.formations}`);
  if (specials.length > 0) {
    parts.push(`[CẢNH BÁO] ${specials.join('. ')}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. PHÂN TÍCH TÂM LÝ CÓ SẴN (Đã được tính toán trước)
  // ─────────────────────────────────────────────────────────────────────────
  const insights = [];
  if (raw.mentalState) insights.push(`Tâm trạng: ${raw.mentalState}`);
  if (raw.conflict) insights.push(`Xung đột: ${raw.conflict}`);
  if (raw.blindSpot) insights.push(`Điểm mù: ${raw.blindSpot}`);
  if (raw.energyAdvice) insights.push(`Năng lượng: ${raw.energyAdvice}`);
  if (insights.length > 0) {
    parts.push(`[TÂM LÝ] ${insights.join(' | ')}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. ĐIỂM SỐ & METADATA
  // ─────────────────────────────────────────────────────────────────────────
  const score = raw.score ?? raw.overallScore ?? '';
  const meta = [];
  if (score) meta.push(`Điểm: ${score}/10`);
  if (raw.cucSo) meta.push(`Cục ${raw.cucSo} ${raw.isDuong ? 'Dương' : 'Âm'}`);
  if (raw.solarTerm) meta.push(raw.solarTerm);
  if (meta.length > 0) {
    parts.push(`[METADATA] ${meta.join(' | ')}`);
  }

  return parts.join('\n');
};

export default enrichData;
