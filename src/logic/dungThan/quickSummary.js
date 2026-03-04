/**
 * quickSummary.js — "Người Thông Dịch" (The Interpreter)
 * Biến thuật ngữ Kỳ Môn khô khan thành câu kết luận dễ hiểu.
 *
 * Mô hình 3 lớp:
 *   Môn (Bát Môn)  → Hành động / Trạng thái
 *   Tinh (Cửu Tinh) → Thiên thời / Môi trường
 *   Thần (Bát Thần) → Năng lượng vô hình / Cảm xúc
 */

import { PALACE_META } from '../../core/tables.js';

// Helper: Viết hoa chữ cái đầu câu
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ══════════════════════════════════════════════════════════════════════════════
// PHẦN 1: TỪ ĐIỂN ẨN DỤ TỔNG QUÁT (dùng chung cho mọi chủ đề)
// ══════════════════════════════════════════════════════════════════════════════

export const ELEMENT_MEANINGS = {
  // ── Bát Môn: Hành động / Trạng thái ──────────────────────────────────────────
  mon: {
    'Khai': {
      analogy: 'Sự khởi đầu',
      shortDesc: 'Cánh cửa mở ra cơ hội mới',
      nature: 'cat'
    },
    'Hưu': {
      analogy: 'Sự nghỉ ngơi',
      shortDesc: 'Thời điểm tĩnh lặng, tích lũy năng lượng',
      nature: 'cat'
    },
    'Sinh': {
      analogy: 'Sự sinh sôi',
      shortDesc: 'Năng lượng tăng trưởng và phát triển',
      nature: 'cat'
    },
    'Thương': {
      analogy: 'Sự tổn thương',
      shortDesc: 'Có va chạm, cạnh tranh hoặc mất mát',
      nature: 'binh'
    },
    'Đỗ': {
      analogy: 'Sự ngăn trở',
      shortDesc: 'Đường đi bị cản, cần chờ đợi',
      nature: 'binh'
    },
    'Cảnh': {
      analogy: 'Sự phô bày',
      shortDesc: 'Mọi thứ hiện ra rõ ràng, công khai',
      nature: 'binh'
    },
    'Tử': {
      analogy: 'Sự kết thúc',
      shortDesc: 'Năng lượng đi xuống, cần dừng lại',
      nature: 'hung'
    },
    'Kinh': {
      analogy: 'Sự bất ngờ',
      shortDesc: 'Có biến động, lo lắng ngoài dự kiến',
      nature: 'hung'
    },
  },

  // ── Cửu Tinh: Thiên thời / Môi trường ────────────────────────────────────────
  tinh: {
    'Thiên Tâm': {
      analogy: 'Sự tính toán',
      shortDesc: 'Môi trường cần lý trí và chiến lược',
      nature: 'cat'
    },
    'Thiên Nhậm': {
      analogy: 'Sự kiên trì',
      shortDesc: 'Cần sự bền bỉ và từng bước',
      nature: 'cat'
    },
    'Thiên Phụ': {
      analogy: 'Sự hỗ trợ',
      shortDesc: 'Có người phụ giúp, hậu thuẫn',
      nature: 'cat'
    },
    'Thiên Xung': {
      analogy: 'Sự đột phá',
      shortDesc: 'Thời điểm để hành động mạnh mẽ',
      nature: 'cat'
    },
    'Thiên Bồng': {
      analogy: 'Sự biến động',
      shortDesc: 'Môi trường đầy rủi ro và bất ổn',
      nature: 'hung'
    },
    'Thiên Nhuế': {
      analogy: 'Sự trì trệ',
      shortDesc: 'Năng lượng bế tắc, chậm chạp',
      nature: 'hung'
    },
    'Thiên Trụ': {
      analogy: 'Sự cô đơn',
      shortDesc: 'Thiếu sự hỗ trợ từ bên ngoài',
      nature: 'hung'
    },
    'Thiên Anh': {
      analogy: 'Sự rực rỡ',
      shortDesc: 'Năng lượng mạnh nhưng dễ cháy',
      nature: 'binh'
    },
    'Thiên Cầm': {
      analogy: 'Sự cân bằng',
      shortDesc: 'Trung tâm, ổn định nhưng thụ động',
      nature: 'binh'
    },
  },

  // ── Bát Thần: Năng lượng vô hình / Cảm xúc ───────────────────────────────────
  than: {
    'Trực Phù': {
      analogy: 'Quý nhân',
      shortDesc: 'Có người quyền lực hỗ trợ',
      nature: 'cat'
    },
    'Thái Âm': {
      analogy: 'Sự ẩn giấu',
      shortDesc: 'Nên hành động kín đáo, khéo léo',
      nature: 'cat'
    },
    'Lục Hợp': {
      analogy: 'Sự hợp tác',
      shortDesc: 'Thuận lợi cho việc kết nối, đối tác',
      nature: 'cat'
    },
    'Cửu Thiên': {
      analogy: 'Sự bay cao',
      shortDesc: 'Năng lượng vươn lên, đột phá',
      nature: 'cat'
    },
    'Cửu Địa': {
      analogy: 'Sự ẩn nhẫn',
      shortDesc: 'Cần kiên nhẫn chờ đợi, giữ vững',
      nature: 'cat'
    },
    'Đằng Xà': {
      analogy: 'Sự lừa dối',
      shortDesc: 'Cẩn thận thông tin sai lệch, mơ hồ',
      nature: 'hung'
    },
    'Câu Trận': {
      analogy: 'Sự ràng buộc',
      shortDesc: 'Bị kéo vào rắc rối, tranh chấp',
      nature: 'hung'
    },
    'Chu Tước': {
      analogy: 'Thị phi',
      shortDesc: 'Có tranh cãi, tin đồn, lời qua tiếng lại',
      nature: 'hung'
    },
    'Bạch Hổ': {
      analogy: 'Sự sát phạt',
      shortDesc: 'Nguy hiểm, mất mát hoặc bệnh tật',
      nature: 'hung'
    },
    'Huyền Vũ': {
      analogy: 'Sự mờ ám',
      shortDesc: 'Có điều che giấu, trộm cắp, gian dối',
      nature: 'hung'
    },
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// PHẦN 2: TỪ ĐIỂN THEO CHỦ ĐỀ (context-specific)
// ══════════════════════════════════════════════════════════════════════════════

export const TOPIC_DICTIONARIES = {
  'tai-van': {
    label: 'Tài Lộc / Đầu Tư',
    mon: {
      'Sinh': 'có cơ hội sinh lời tốt',
      'Khai': 'chuẩn bị mở ra hướng đầu tư mới',
      'Hưu': 'nên giữ vốn, chờ thời điểm tốt hơn',
      'Thương': 'dễ bị tổn thất hoặc cạnh tranh gay gắt',
      'Đỗ': 'dòng tiền bị tắc nghẽn',
      'Cảnh': 'cơ hội rõ ràng nhưng nhiều người cùng thấy',
      'Tử': 'không nên xuống tiền, rủi ro mất vốn cao',
      'Kinh': 'thị trường biến động ngoài dự kiến',
    },
    tinh: {
      'Thiên Tâm': 'cần tính toán kỹ lưỡng trước khi ra quyết định',
      'Thiên Nhậm': 'nên đầu tư dài hạn, kiên trì chờ đợi',
      'Thiên Phụ': 'có thể nhờ cậy chuyên gia tư vấn',
      'Thiên Xung': 'cơ hội đột phá nhanh, cần hành động',
      'Thiên Bồng': 'thị trường đầy rủi ro và biến động',
      'Thiên Nhuế': 'năng lượng tiền tệ đang trì trệ',
      'Thiên Trụ': 'đơn độc trong quyết định, thiếu hỗ trợ',
      'Thiên Anh': 'cơ hội sáng nhưng dễ "cháy tài khoản"',
    },
    than: {
      'Trực Phù': 'sẽ có quý nhân hỗ trợ tài chính',
      'Lục Hợp': 'thuận lợi cho việc hợp tác đầu tư',
      'Thái Âm': 'nên giữ kín chiến lược đầu tư',
      'Cửu Thiên': 'thời điểm tốt để mở rộng quy mô',
      'Cửu Địa': 'nên giữ vững vị thế, không nên thoát vội',
      'Đằng Xà': 'cẩn thận thông tin lừa đảo, scam',
      'Câu Trận': 'có thể bị cuốn vào tranh chấp tài sản',
      'Chu Tước': 'tin đồn thị trường làm nhiễu quyết định',
      'Bạch Hổ': 'rủi ro mất trắng rất cao',
      'Huyền Vũ': 'có dấu hiệu gian lận hoặc ăn cắp',
    },
    template: (monText, tinhText, thanText) =>
      `Về tài lộc, bạn ${monText}. Hiện tại ${tinhText}${thanText ? `, ${thanText}` : ''}.`,
  },

  'suc-khoe': {
    label: 'Sức Khỏe / Điều Trị',
    mon: {
      'Sinh': 'cơ thể đang có năng lượng phục hồi tốt',
      'Khai': 'nên bắt đầu một phương pháp điều trị mới',
      'Hưu': 'cần nghỉ ngơi, không nên gắng sức',
      'Thương': 'cẩn thận chấn thương hoặc phẫu thuật',
      'Đỗ': 'quá trình hồi phục bị chậm lại',
      'Cảnh': 'triệu chứng bệnh đang bộc lộ rõ ràng',
      'Tử': 'tình trạng sức khỏe cần được cảnh báo nghiêm túc',
      'Kinh': 'có thể có kết quả xét nghiệm bất ngờ',
    },
    tinh: {
      'Thiên Tâm': 'gặp được thầy thuốc giỏi, phương pháp đúng',
      'Thiên Nhậm': 'cần kiên trì với liệu trình dài hạn',
      'Thiên Phụ': 'có người chăm sóc, hỗ trợ tinh thần',
      'Thiên Bồng': 'bệnh tình biến chuyển phức tạp',
      'Thiên Nhuế': 'quá trình hồi phục chậm chạp',
    },
    than: {
      'Trực Phù': 'gặp được quý nhân trong y học',
      'Lục Hợp': 'gia đình hỗ trợ tinh thần rất tốt',
      'Đằng Xà': 'cẩn thận chẩn đoán sai hoặc thuốc giả',
      'Bạch Hổ': 'có nguy cơ phẫu thuật hoặc tai nạn',
    },
    template: (monText, tinhText, thanText) =>
      `Về sức khỏe, ${monText}. ${capitalize(tinhText)}${thanText ? `. ${capitalize(thanText)}` : ''}.`,
  },

  'tinh-duyen': {
    label: 'Tình Duyên / Hôn Nhân',
    mon: {
      'Sinh': 'mối quan hệ đang phát triển tích cực',
      'Khai': 'sẵn sàng mở lòng đón nhận tình yêu mới',
      'Hưu': 'cần thời gian để hai bên nghỉ ngơi, suy nghĩ',
      'Thương': 'có xung đột, tranh cãi trong mối quan hệ',
      'Đỗ': 'cảm xúc bị kìm nén, khó bày tỏ',
      'Cảnh': 'tình cảm được bày tỏ công khai',
      'Tử': 'mối quan hệ đang đi vào ngõ cụt',
      'Kinh': 'có chuyện bất ngờ trong tình cảm',
    },
    tinh: {
      'Thiên Phụ': 'có người mai mối hoặc giúp đỡ',
      'Thiên Nhậm': 'tình cảm cần thời gian để vun đắp',
      'Thiên Tâm': 'nên suy nghĩ kỹ về mối quan hệ này',
    },
    than: {
      'Lục Hợp': 'nhân duyên tốt, dễ kết nối',
      'Thái Âm': 'tình cảm phát triển kín đáo, sâu lắng',
      'Đằng Xà': 'cẩn thận bị lừa tình hoặc hiểu lầm',
      'Chu Tước': 'có thị phi, người thứ ba can thiệp',
    },
    template: (monText, tinhText, thanText) =>
      `Về tình duyên, ${monText}. ${capitalize(tinhText)}${thanText ? `. ${capitalize(thanText)}` : ''}.`,
  },

  'su-nghiep': {
    label: 'Sự Nghiệp / Thăng Tiến',
    mon: {
      'Sinh': 'cơ hội phát triển sự nghiệp đang mở ra',
      'Khai': 'thời điểm tốt để bắt đầu dự án mới',
      'Hưu': 'nên giữ nguyên vị trí, chờ thời',
      'Thương': 'có cạnh tranh gay gắt trong công việc',
      'Đỗ': 'con đường thăng tiến bị tắc nghẽn',
      'Tử': 'dự án hoặc công việc có nguy cơ thất bại',
      'Kinh': 'có biến động nhân sự bất ngờ',
    },
    tinh: {
      'Thiên Tâm': 'cần chiến lược rõ ràng cho sự nghiệp',
      'Thiên Xung': 'thời điểm để hành động đột phá',
      'Thiên Phụ': 'có cấp trên hoặc mentor hỗ trợ',
    },
    than: {
      'Trực Phù': 'được lãnh đạo ủng hộ',
      'Cửu Thiên': 'cơ hội thăng tiến cao',
      'Câu Trận': 'bị cuốn vào chính trị công sở',
      'Chu Tước': 'có tin đồn hoặc thị phi nơi làm việc',
    },
    template: (monText, tinhText, thanText) =>
      `Về sự nghiệp, ${monText}. ${capitalize(tinhText)}${thanText ? `. ${capitalize(thanText)}` : ''}.`,
  },

  'kinh-doanh': {
    label: 'Kinh Doanh / Khai Trương',
    mon: {
      'Sinh': 'thời điểm tốt để mở rộng kinh doanh',
      'Khai': 'khai trương hoặc ra mắt sản phẩm thuận lợi',
      'Hưu': 'nên tạm dừng mở rộng, củng cố nội bộ',
      'Thương': 'đối thủ cạnh tranh mạnh mẽ',
      'Tử': 'dự án kinh doanh có nguy cơ thất bại',
    },
    tinh: {
      'Thiên Tâm': 'cần kế hoạch kinh doanh chi tiết',
      'Thiên Xung': 'thời điểm tung sản phẩm ra thị trường',
      'Thiên Nhậm': 'cần kiên trì với mô hình dài hạn',
    },
    than: {
      'Lục Hợp': 'thuận lợi tìm đối tác kinh doanh',
      'Cửu Thiên': 'có thể mở rộng quy mô lớn',
      'Cửu Địa': 'nên giữ vững mô hình hiện tại',
      'Đằng Xà': 'cẩn thận hợp đồng lừa đảo',
    },
    template: (monText, tinhText, thanText) =>
      `Về kinh doanh, ${monText}. ${capitalize(tinhText)}${thanText ? `. ${capitalize(thanText)}` : ''}.`,
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// PHẦN 3: HÀM "NGƯỜI THÔNG DỊCH"
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Lấy tên ngắn của Môn (loại bỏ chữ "Môn")
 */
function getMonShort(monName) {
  if (!monName) return null;
  return monName.replace(' Môn', '').replace('Môn', '');
}

/**
 * Đánh giá tổng thể dựa trên nature của 3 yếu tố
 */
function evaluateCombination(mon, tinh, than) {
  const monInfo = ELEMENT_MEANINGS.mon[mon];
  const tinhInfo = ELEMENT_MEANINGS.tinh[tinh];
  const thanInfo = ELEMENT_MEANINGS.than[than];

  let catCount = 0;
  let hungCount = 0;

  if (monInfo?.nature === 'cat') catCount++;
  if (monInfo?.nature === 'hung') hungCount++;
  if (tinhInfo?.nature === 'cat') catCount++;
  if (tinhInfo?.nature === 'hung') hungCount++;
  if (thanInfo?.nature === 'cat') catCount++;
  if (thanInfo?.nature === 'hung') hungCount++;

  if (catCount >= 2 && hungCount === 0) return { verdict: 'Tốt', emoji: '✅', color: 'green' };
  if (catCount >= 2) return { verdict: 'Khá tốt', emoji: '👍', color: 'blue' };
  if (hungCount >= 2) return { verdict: 'Cẩn trọng', emoji: '⚠️', color: 'orange' };
  if (hungCount >= 3) return { verdict: 'Không tốt', emoji: '❌', color: 'red' };
  return { verdict: 'Bình thường', emoji: '➡️', color: 'gray' };
}

/**
 * generateQuickSummary - Hàm "Người thông dịch" chính
 *
 * @param {Object} params
 * @param {string} params.mon - Tên Bát Môn (ví dụ: "Sinh Môn", "Khai Môn")
 * @param {string} params.tinh - Tên Cửu Tinh (ví dụ: "Thiên Tâm", "Thiên Bồng")
 * @param {string} params.than - Tên Bát Thần (ví dụ: "Trực Phù", "Đằng Xà")
 * @param {string} params.topic - Mã chủ đề (ví dụ: "tai-van", "suc-khoe")
 * @param {string} [params.direction] - Hướng cung (tùy chọn)
 * @param {string} [params.palaceName] - Tên cung (tùy chọn)
 * @returns {Object} Kết quả tóm tắt
 */
export function generateQuickSummary({ mon, tinh, than, topic, direction, palaceName }) {
  const monShort = getMonShort(mon);
  const topicDict = TOPIC_DICTIONARIES[topic];

  // Fallback về từ điển chung nếu không có topic cụ thể
  const monText = topicDict?.mon?.[monShort]
    || ELEMENT_MEANINGS.mon[monShort]?.shortDesc
    || 'đang ở trạng thái chờ';

  const tinhText = topicDict?.tinh?.[tinh]
    || ELEMENT_MEANINGS.tinh[tinh]?.shortDesc
    || 'môi trường chưa rõ ràng';

  const thanText = topicDict?.than?.[than]
    || ELEMENT_MEANINGS.than[than]?.shortDesc
    || '';

  // Đánh giá tổng thể
  const evaluation = evaluateCombination(monShort, tinh, than);

  // Tạo câu tóm tắt
  const template = topicDict?.template || ((m, t, th) => `${m}. ${t}${th ? `. ${th}` : ''}.`);
  const summary = template(monText, tinhText, thanText);

  // Location info
  const locationText = direction && palaceName
    ? `Cung ${palaceName} (${direction})`
    : direction || palaceName || '';

  // Tạo shortSummary - chỉ giữ ý chính của Môn (hành động)
  const shortSummary = capitalize(monText);

  return {
    // Câu tóm tắt chính (đầy đủ)
    summary,

    // Câu tóm tắt ngắn (chỉ Môn - hành động chính)
    shortSummary,

    // Đánh giá tổng thể
    verdict: evaluation.verdict,
    emoji: evaluation.emoji,
    color: evaluation.color,

    // Thông tin vị trí
    location: locationText,

    // Chi tiết từng yếu tố (để hiển thị tooltip)
    breakdown: {
      mon: {
        name: mon,
        analogy: ELEMENT_MEANINGS.mon[monShort]?.analogy || '—',
        meaning: monText,
      },
      tinh: {
        name: tinh,
        analogy: ELEMENT_MEANINGS.tinh[tinh]?.analogy || '—',
        meaning: tinhText,
      },
      than: {
        name: than,
        analogy: ELEMENT_MEANINGS.than[than]?.analogy || '—',
        meaning: thanText,
      },
    },

    // Dòng kết luận ngắn cho UI
    oneLiner: `${evaluation.emoji} ${locationText ? `${locationText}: ` : ''}${evaluation.verdict}. ${summary}`,
  };
}

/**
 * generatePalaceSummaries - Tạo tóm tắt cho tất cả 9 cung
 *
 * @param {Object} chart - Chart object từ engine
 * @param {string} topic - Mã chủ đề
 * @returns {Object} Map từ palace number → summary
 */
export function generatePalaceSummaries(chart, topic) {
  const summaries = {};

  for (let p = 1; p <= 9; p++) {
    if (p === 5) continue; // Bỏ qua cung Trung

    const palace = chart.palaces[p];
    if (!palace) continue;

    const meta = PALACE_META[p];

    summaries[p] = generateQuickSummary({
      mon: palace.mon?.name,
      tinh: palace.star?.name,
      than: palace.than?.name,
      topic,
      direction: meta?.dir,
      palaceName: meta?.name,
    });
  }

  return summaries;
}

// ══════════════════════════════════════════════════════════════════════════════
// PHẦN 4: HELPER FUNCTIONS CHO UI (Tooltip content)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * getElementTooltip - Lấy nội dung tooltip cho một yếu tố
 *
 * @param {string} type - 'mon' | 'tinh' | 'than'
 * @param {string} name - Tên yếu tố
 * @returns {Object} { title, analogy, description }
 */
export function getElementTooltip(type, name) {
  const cleanName = type === 'mon' ? getMonShort(name) : name;
  const info = ELEMENT_MEANINGS[type]?.[cleanName];

  if (!info) {
    return {
      title: name,
      analogy: '—',
      description: 'Chưa có thông tin'
    };
  }

  const typeLabel = {
    mon: 'Hành động',
    tinh: 'Thiên thời',
    than: 'Năng lượng',
  }[type];

  return {
    title: name,
    analogy: `${typeLabel}: ${info.analogy}`,
    description: info.shortDesc,
    nature: info.nature,
  };
}
