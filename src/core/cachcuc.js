/**
 * cachcuc.js — Layer 4: Cách Cục Scoring Engine
 * 50+ named QMDJ formation rules → chart score + verdict.
 */

import { PALACE_META } from './tables.js';
import QMDJ_DICTIONARY from '../lib/qmdj_dictionary.json' with { type: 'json' };

function normalizeCanName(can) {
  if (!can) return '';
  if (typeof can === 'string') return can;
  if (typeof can === 'object') return can.name || can.displayShort || can.displayName || '';
  return '';
}

export function evaluateCachCuc(heavenCan, earthCan) {
  const heavenCanName = normalizeCanName(heavenCan);
  const earthCanName = normalizeCanName(earthCan);
  if (!heavenCanName || !earthCanName) return [];

  const matched = QMDJ_DICTIONARY?.stemStemPatterns?.[heavenCanName]?.[earthCanName];
  if (!matched) return [];

  return [{
    id: matched.id || `${heavenCanName}_${earthCanName}`,
    name: matched.name || `${heavenCanName}/${earthCanName}`,
    type: matched.type || '',
    priority: Number(matched.priority || 0),
    desc: matched.desc || '',
    scoreDelta: Number(matched.scoreDelta || 0),
    source: matched.source || 'stem-stem',
    scope: matched.scope || 'formation',
    aliases: Array.isArray(matched.aliases) ? matched.aliases : [],
    tags: Array.isArray(matched.tags) ? matched.tags : [],
  }];
}

// Each rule: { id, name, type:'cat'|'hung'|'binh', priority:1-10, desc, condition(palace, palaceNum, chart) }
export const CACH_CUC_DEFS = [

  // Tam Kỳ (Lợi thế chiến lược)
  { id: 'TK001', name: 'Ất Kỳ đắc sử', type: 'cat', priority: 10, desc: 'Quyền lực mềm (Soft power) — Đàm phán ngầm thuận lợi, tiến lùi linh hoạt.', condition: p => p.can?.name === 'Ất' && p.mon?.type === 'cat' },
  { id: 'TK002', name: 'Bính Kỳ đắc sử', type: 'cat', priority: 10, desc: 'Lợi thế dẫn đầu — Dòng vốn lưu thông, mở rộng quy mô (Scale-up) đại cát.', condition: p => p.can?.name === 'Bính' && ['Sinh Môn', 'Khai Môn'].includes(p.mon?.name) },
  { id: 'TK003', name: 'Đinh Kỳ đắc sử', type: 'cat', priority: 10, desc: 'Đột phá R&D — Trí tuệ thâm sâu, xử lý hồ sơ pháp lý/học thuật hoàn hảo.', condition: p => p.can?.name === 'Đinh' && p.mon?.name === 'Hưu Môn' },
  { id: 'TK004', name: 'Tam Kỳ nhập trung', type: 'cat', priority: 9, desc: 'Lợi thế lõi (Core Competence) — Nguồn lực được tích lũy, chờ thời điểm bùng nổ.', condition: (p, n) => ['Ất', 'Bính', 'Đinh'].includes(p.can?.name) && n === 5 },

  // Trực Phù × Môn (Xu hướng vĩ mô & Lãnh đạo)
  { id: 'TP001', name: 'Trực Phù × Sinh Môn', type: 'cat', priority: 9, desc: 'Vĩ mô ủng hộ — Dự án nhận trợ lực lớn, dòng tiền tăng trưởng bền vững.', condition: p => p.trucPhu && p.mon?.name === 'Sinh Môn' },
  { id: 'TP002', name: 'Trực Phù × Khai Môn', type: 'cat', priority: 9, desc: 'Lợi thế tiên phong (First-mover) — Thâm nhập thị trường thành công, được cấp phép nhanh.', condition: p => p.trucPhu && p.mon?.name === 'Khai Môn' },
  { id: 'TP003', name: 'Trực Phù × Tử Môn', type: 'hung', priority: 8, desc: 'Khủng hoảng thượng tầng — Ban lãnh đạo sai lầm, dự án đi vào ngõ cụt.', condition: p => p.trucPhu && p.mon?.name === 'Tử Môn' },

  // Ngũ Bất Ngộ Thời (Điểm nghẽn & Rủi ro hệ thống)
  { id: 'NB001', name: 'Nhâm kỵ Thương Môn', type: 'hung', priority: 8, desc: 'Đứt gãy quan hệ — Khủng hoảng nhân sự, truyền thông nội bộ độc hại.', condition: p => p.can?.name === 'Nhâm' && p.mon?.name === 'Thương Môn' },
  { id: 'NB002', name: 'Canh kỵ Kinh Môn', type: 'hung', priority: 8, desc: 'Đối đầu trực diện — Cạnh tranh khốc liệt, va chạm pháp lý hoặc bạo lực.', condition: p => p.can?.name === 'Canh' && p.mon?.name === 'Kinh Môn' },
  { id: 'NB003', name: 'Tân kỵ Tử Môn', type: 'hung', priority: 9, desc: 'Thanh khoản đóng băng — Nợ xấu ập đến, bế tắc toàn diện không lối thoát.', condition: p => p.can?.name === 'Tân' && p.mon?.name === 'Tử Môn' },
  { id: 'NB004', name: 'Đinh kỵ Kinh Môn', type: 'hung', priority: 7, desc: 'Rò rỉ thông tin — Rắc rối hợp đồng, tranh cãi pháp lý hao tổn tài lực.', condition: p => p.can?.name === 'Đinh' && p.mon?.name === 'Kinh Môn' },
  { id: 'NB005', name: 'Mậu kỵ Tử Môn', type: 'hung', priority: 9, desc: 'Sập hầm tài chính — Mất vốn diện rộng. Lời khuyên: Cắt lỗ khẩn cấp.', condition: p => p.can?.name === 'Mậu' && p.mon?.name === 'Tử Môn' },

  // Thanh Long (Chu kỳ phục hồi)
  { id: 'TL001', name: 'Thanh Long hồi đầu', type: 'cat', priority: 8, desc: 'Phục hồi chữ V (V-shape) — Tín hiệu đảo chiều tốt, cơ hội chốt lời/mở rộng.', condition: p => p.than?.name === 'Thanh Long' && ['Sinh Môn', 'Khai Môn'].includes(p.mon?.name) },
  { id: 'TL002', name: 'Thanh Long × Hưu Môn', type: 'cat', priority: 7, desc: 'Tích lũy an toàn — Dòng tiền thụ động ổn định, bảo toàn vốn chờ chu kỳ mới.', condition: p => p.than?.name === 'Thanh Long' && p.mon?.name === 'Hưu Môn' },
  { id: 'TL003', name: 'Thanh Long × Tử Môn', type: 'hung', priority: 7, desc: 'Bẫy tăng giá (Bull trap) — Bề ngoài có vẻ ngon ăn nhưng thực chất là chôn vốn.', condition: p => p.than?.name === 'Thanh Long' && p.mon?.name === 'Tử Môn' },

  // Thiên Tâm (Quản trị & Tái cấu trúc)
  { id: 'TM001', name: 'Thiên Tâm × Sinh Môn', type: 'cat', priority: 9, desc: 'Tái cấu trúc thành công — Khắc phục lỗ hổng, vá lỗi hệ thống hiệu quả.', condition: p => p.star?.name === 'Thiên Tâm' && p.mon?.name === 'Sinh Môn' },
  { id: 'TM002', name: 'Thiên Tâm × Khai Môn', type: 'cat', priority: 9, desc: 'Chiến lược sắc bén — Mở khóa dự án, ký kết đối tác chiến lược dài hạn.', condition: p => p.star?.name === 'Thiên Tâm' && p.mon?.name === 'Khai Môn' },

  // Bạch Hổ / Câu Trận (Áp lực & Rủi ro cao)
  { id: 'BH001', name: 'Bạch Hổ / Câu Trận × Kinh Môn', type: 'hung', priority: 8, desc: 'Thanh tra diện rộng — Rủi ro pháp lý/kiện tụng mang tính hủy diệt.', condition: p => ['Bạch Hổ', 'Câu Trận'].includes(p.than?.name) && p.mon?.name === 'Kinh Môn' },
  { id: 'BH002', name: 'Bạch Hổ / Câu Trận × Tử Môn', type: 'hung', priority: 10, desc: 'Thiên nga đen (Black swan) — Biến cố bất ngờ tàn phá hệ thống/sức khỏe.', condition: p => ['Bạch Hổ', 'Câu Trận'].includes(p.than?.name) && p.mon?.name === 'Tử Môn' },
  { id: 'BH003', name: 'Bạch Hổ / Câu Trận × Sinh Môn', type: 'binh', priority: 5, desc: 'Chiến thuật dồn ép — Dùng vị thế "cửa trên" để ép giá hoặc thâu tóm (M&A).', condition: p => ['Bạch Hổ', 'Câu Trận'].includes(p.than?.name) && p.mon?.name === 'Sinh Môn' },

  // Đằng Xà (Biến động nhiễu)
  { id: 'DX001', name: 'Đằng Xà × Tử Môn', type: 'hung', priority: 9, desc: 'Lỗ hổng chết người — Bẫy lừa đảo tinh vi, rủi ro ngầm đang chờ kích nổ.', condition: p => p.than?.name === 'Đằng Xà' && p.mon?.name === 'Tử Môn' },
  { id: 'DX002', name: 'Đằng Xà × Kinh Môn', type: 'hung', priority: 8, desc: 'Biến động nhiễu (Noise) — Tin đồn thất thiệt, biến động thị trường gây hoang mang.', condition: p => p.than?.name === 'Đằng Xà' && p.mon?.name === 'Kinh Môn' },

  // Huyền Vũ / Chu Tước (Thông tin bất xứng)
  { id: 'HV001', name: 'Huyền Vũ / Chu Tước × Tử Môn', type: 'hung', priority: 8, desc: 'Hố đen số liệu — Bị che giấu thông tin, gian lận nội bộ hoặc mất mát tài sản.', condition: p => ['Huyền Vũ', 'Chu Tước'].includes(p.than?.name) && p.mon?.name === 'Tử Môn' },
  { id: 'HV002', name: 'Huyền Vũ / Chu Tước × Thương Môn', type: 'hung', priority: 7, desc: 'Cạnh tranh bẩn — Đối thủ chơi xấu ngầm, rò rỉ chất xám hoặc công nghệ lõi.', condition: p => ['Huyền Vũ', 'Chu Tước'].includes(p.than?.name) && p.mon?.name === 'Thương Môn' },

  // Thiên Bồng (Rủi ro hung hãn)
  { id: 'TB001', name: 'Thiên Bồng × Tử Môn', type: 'hung', priority: 10, desc: 'Đầu cơ vỡ nợ — Cược đòn bẩy tài chính quá lớn dẫn đến phá sản diện rộng.', condition: p => p.star?.name === 'Thiên Bồng' && p.mon?.name === 'Tử Môn' },
  { id: 'TB002', name: 'Thiên Bồng × Kinh Môn', type: 'hung', priority: 8, desc: 'Cú sốc thị trường — Thiệt hại nặng nề do tác động tiêu cực ngoài tầm kiểm soát.', condition: p => p.star?.name === 'Thiên Bồng' && p.mon?.name === 'Kinh Môn' },

  // Thiên Xung / Nhậm (Xung lực & Bền vững)
  { id: 'TX001', name: 'Thiên Xung × Khai Môn', type: 'cat', priority: 8, desc: 'Ra mắt thần tốc — Đột phá chớp nhoáng để chiếm thị phần trước đối thủ.', condition: p => p.star?.name === 'Thiên Xung' && p.mon?.name === 'Khai Môn' },
  { id: 'TX002', name: 'Thiên Xung × Sinh Môn', type: 'cat', priority: 8, desc: 'Bơm vốn mạnh — Tạo xung lực lớn để đẩy dự án qua điểm nghẽn.', condition: p => p.star?.name === 'Thiên Xung' && p.mon?.name === 'Sinh Môn' },
  { id: 'TN001', name: 'Thiên Nhậm × Khai Môn', type: 'cat', priority: 8, desc: 'Đầu tư giá trị (Value investing) — Tăng trưởng chậm nhưng cực kỳ chắc chắn.', condition: p => p.star?.name === 'Thiên Nhậm' && p.mon?.name === 'Khai Môn' },

  // Lục Hợp / Thái Âm (Mạng lưới & Nội bộ)
  { id: 'LH001', name: 'Lục Hợp × Sinh Môn', type: 'cat', priority: 9, desc: 'Liên doanh Win-Win — Hợp tác/Sáp nhập thành công, mở rộng hệ sinh thái.', condition: p => p.than?.name === 'Lục Hợp' && p.mon?.name === 'Sinh Môn' },
  { id: 'LH002', name: 'Lục Hợp × Khai Môn', type: 'cat', priority: 8, desc: 'Khai thác Network — Nhờ quan hệ đối tác (quý nhân) mà mở khóa được bế tắc.', condition: p => p.than?.name === 'Lục Hợp' && p.mon?.name === 'Khai Môn' },
  { id: 'TA001', name: 'Thái Âm × Sinh Môn', type: 'cat', priority: 8, desc: 'Lợi thế mảng tối — Chiến lược bảo mật thông tin nội bộ đem lại quả ngọt.', condition: p => p.than?.name === 'Thái Âm' && p.mon?.name === 'Sinh Môn' },
  { id: 'TA002', name: 'Thái Âm × Hưu Môn', type: 'cat', priority: 7, desc: 'Rút lui chiến thuật — Lùi về hậu trường để tối ưu hóa vận hành, ủ mưu.', condition: p => p.than?.name === 'Thái Âm' && p.mon?.name === 'Hưu Môn' },

  // Cửu Thiên / Cửu Địa (Bành trướng & Cốt lõi)
  { id: 'CT001', name: 'Cửu Thiên × Khai Môn', type: 'cat', priority: 8, desc: 'Marketing bùng nổ — Phủ sóng thương hiệu, chiến dịch PR thành công rực rỡ.', condition: p => p.than?.name === 'Cửu Thiên' && p.mon?.name === 'Khai Môn' },
  { id: 'CT002', name: 'Cửu Thiên × Sinh Môn', type: 'cat', priority: 8, desc: 'Vươn tầm vĩ mô — Doanh thu thăng hoa, đủ lực tấn công thị trường quốc tế/lớn.', condition: p => p.than?.name === 'Cửu Thiên' && p.mon?.name === 'Sinh Môn' },
  { id: 'CD001', name: 'Cửu Địa × Sinh Môn', type: 'cat', priority: 8, desc: 'Tài sản lõi vững mạnh — Góp vốn BĐS, xây dựng hạ tầng, giá trị nền tảng cực tốt.', condition: p => p.than?.name === 'Cửu Địa' && p.mon?.name === 'Sinh Môn' },
  { id: 'CD002', name: 'Cửu Địa × Tử Môn', type: 'hung', priority: 7, desc: 'Chôn vốn cố định — Tài sản sa lầy ở Bất động sản, không thể thanh khoản.', condition: p => p.than?.name === 'Cửu Địa' && p.mon?.name === 'Tử Môn' },

  // Không Vong (Ảo ảnh)
  { id: 'KV001', name: 'Khai Môn Không Vong', type: 'hung', priority: 8, desc: 'Bánh vẽ dự án — Bề ngoài hoành tráng nhưng thiếu tính thực thi, hụt tay.', condition: p => p.mon?.name === 'Khai Môn' && p.khongVong },
  { id: 'KV002', name: 'Sinh Môn Không Vong', type: 'hung', priority: 8, desc: 'Lợi nhuận ảo — Tiền chỉ có trên giấy (sổ sách), thực tế dòng tiền đã cạn.', condition: p => p.mon?.name === 'Sinh Môn' && p.khongVong },
  { id: 'KV003', name: 'Trực Phù Không Vong', type: 'hung', priority: 9, desc: 'Mất lọng che — Đối tác lớn/Chính sách hứa hẹn nhưng cuối cùng không giải ngân.', condition: p => p.trucPhu && p.khongVong },

  // Dịch Mã (Dịch chuyển)
  { id: 'DM001', name: 'Dịch Mã × Khai Môn', type: 'cat', priority: 8, desc: 'Mở rộng địa bàn — Di dời văn phòng, xuất ngoại hoặc chuỗi cung ứng thông suốt.', condition: p => p.dichMa && p.mon?.name === 'Khai Môn' },
  { id: 'DM002', name: 'Dịch Mã × Tử Môn', type: 'hung', priority: 7, desc: 'Đứt gãy logistics — Di chuyển gặp rủi ro, chuỗi cung ứng bị gián đoạn nặng nề.', condition: p => p.dichMa && p.mon?.name === 'Tử Môn' },

  // Phục Âm / Phản Ngâm (Trạng thái hệ thống)
  { id: 'FA001', name: 'Phục Âm (toàn cục)', type: 'hung', priority: 10, desc: 'Đóng băng hệ thống (Status Quo) — Tuyệt đối không giải ngân, án binh bất động.', condition: (_, n, ch) => ch?.isPhucAm && n === 1 },
  { id: 'PN001', name: 'Phản Ngâm (toàn cục)', type: 'hung', priority: 9, desc: 'Biến động 180 độ (Pivot) — Luật chơi lật ngược liên tục, cần quản trị rủi ro linh hoạt.', condition: (_, n, ch) => ch?.isPhanNgam && n === 1 },

  // Thiên Trụ / Nhuế (Lỗi hệ thống)
  { id: 'ST001', name: 'Thiên Trụ × Tử Môn', type: 'hung', priority: 9, desc: 'Sập cấu trúc — Mô hình kinh doanh lỗi từ nền tảng, sụp đổ không thể cứu vãn.', condition: p => p.star?.name === 'Thiên Trụ' && p.mon?.name === 'Tử Môn' },
  { id: 'ST002', name: 'Thiên Trụ × Kinh Môn', type: 'hung', priority: 8, desc: 'Khủng hoảng truyền thông — Bị dư luận hoặc đối thủ vùi dập danh tiếng.', condition: p => p.star?.name === 'Thiên Trụ' && p.mon?.name === 'Kinh Môn' },
  { id: 'TNh01', name: 'Thiên Nhuế × Tử Môn', type: 'hung', priority: 9, desc: 'Nợ độc hại / Virus — Dự án bị nhiễm "khối u" tài chính, cạn kiệt nguồn sống.', condition: p => p.star?.name === 'Thiên Nhuế' && p.mon?.name === 'Tử Môn' },
];
/**
 * evaluateChart(chart) → { byPalace, topFormations, allFormations, overallScore, verdict }
 */
export function evaluateChart(chart) {
  const byPalace = {}, all = [];
  for (let p = 1; p <= 9; p++) {
    const pal = chart.palaces[p];
    byPalace[p] = [];
    if (!pal) continue;
    for (const def of CACH_CUC_DEFS) {
      try {
        if (def.condition(pal, p, chart)) {
          const hit = { ...def, palace: p, dir: PALACE_META[p].dir };
          byPalace[p].push(hit); all.push(hit);
        }
      } catch (_) { /* skip malformed */ }
    }
  }
  const dynamicPatterns = Array.isArray(chart?.allSpecialPatterns) ? chart.allSpecialPatterns : [];
  for (const hit of dynamicPatterns) {
    const palaceNum = Number(hit?.palace);
    if (Number.isFinite(palaceNum) && byPalace[palaceNum]) {
      byPalace[palaceNum].push(hit);
    }
    all.push(hit);
  }
  all.sort((a, b) => b.priority - a.priority);

  const score = all.reduce((sum, hit) => {
    if (Number.isFinite(hit?.formationScore)) return sum + Number(hit.formationScore);
    if (hit?.type === 'cat') return sum + Number(hit?.priority || 0);
    if (hit?.type === 'hung') return sum - Number(hit?.priority || 0);
    return sum;
  }, 0);

  return {
    byPalace, allFormations: all, topFormations: all.slice(0, 8),
    overallScore: score,
    verdict: score >= 15 ? 'Đại Cát — Tiến Hành' : score >= 5 ? 'Cát — Thận Trọng' : score >= -5 ? 'Bình — Xem Xét' : score >= -15 ? 'Hung — Hoãn' : 'Đại Hung — Dừng',
  };
}
