/**
 * dungthan.js — Layer 5: Dụng Thần / Topic Analysis Engine
 * Maps life topics → best palace + directional advice.
 */

import { PALACE_META } from './tables.js';
import { getElementState } from './states.js';

function normalizeTopicKey(topicKey) {
  if (topicKey === 'tinh-yeu') return 'tinh-duyen';
  if (topicKey === 'dien-trach') return 'bat-dong-san';
  if (topicKey === 'hoc-tap') return 'thi-cu';
  return topicKey;
}

const LOVE_TOPIC = { label: 'Tình Duyên / Hôn Nhân', primaryDoors: ['Hưu Môn', 'Sinh Môn'], primaryDeities: ['Lục Hợp', 'Thái Âm', 'Cửu Thiên'], avoidDoors: ['Tử Môn', 'Kinh Môn'], avoidDeities: ['Câu Trận', 'Chu Tước'], usefulStars: ['Thiên Phụ', 'Thiên Nhậm'] };
const PROPERTY_TOPIC = { label: 'Bất Động Sản / Mua Bán Nhà Đất', primaryDoors: ['Sinh Môn', 'Khai Môn'], primaryDeities: ['Cửu Địa', 'Lục Hợp'], avoidDoors: ['Tử Môn'], avoidDeities: ['Câu Trận', 'Chu Tước'], usefulStars: ['Thiên Phụ', 'Thiên Tâm'] };

// ── Topic definitions (compact 4-line format) ─────────────────────────────────
export const TOPICS = {
  'tai-van': { label: 'Tài Vận / Đầu Tư', primaryDoors: ['Sinh Môn', 'Khai Môn'], primaryDeities: ['Lục Hợp', 'Thái Âm', 'Cửu Thiên'], avoidDoors: ['Tử Môn', 'Kinh Môn'], avoidDeities: ['Câu Trận', 'Đằng Xà', 'Chu Tước'], usefulStars: ['Thiên Tâm', 'Thiên Nhậm', 'Thiên Phụ'] },
  'suc-khoe': { label: 'Sức Khỏe / Khám Bệnh', primaryDoors: ['Sinh Môn'], primaryDeities: ['Lục Hợp', 'Cửu Thiên'], avoidDoors: ['Tử Môn', 'Kinh Môn'], avoidDeities: ['Câu Trận', 'Đằng Xà'], usefulStars: ['Thiên Tâm'] },
  'tinh-duyen': LOVE_TOPIC,
  'tinh-yeu': LOVE_TOPIC,
  'su-nghiep': { label: 'Sự Nghiệp / Thăng Tiến', primaryDoors: ['Khai Môn', 'Sinh Môn'], primaryDeities: ['Cửu Thiên', 'Trực Phù'], avoidDoors: ['Tử Môn'], avoidDeities: ['Câu Trận', 'Chu Tước'], usefulStars: ['Thiên Tâm', 'Thiên Xung'] },
  'kinh-doanh': { label: 'Kinh Doanh / Khai Trương', primaryDoors: ['Sinh Môn', 'Khai Môn'], primaryDeities: ['Lục Hợp', 'Cửu Thiên'], avoidDoors: ['Tử Môn', 'Kinh Môn'], avoidDeities: ['Câu Trận', 'Đằng Xà', 'Chu Tước', 'Cửu Địa'], usefulStars: ['Thiên Tâm', 'Thiên Nhậm', 'Thiên Xung'] },
  'thi-cu': { label: 'Thi Cử / Phỏng Vấn', primaryDoors: ['Khai Môn', 'Hưu Môn'], primaryDeities: ['Thái Âm', 'Cửu Thiên', 'Lục Hợp'], avoidDoors: ['Tử Môn', 'Kinh Môn'], avoidDeities: ['Câu Trận', 'Đằng Xà'], usefulStars: ['Thiên Phụ', 'Thiên Nhậm', 'Thiên Anh'] },
  'ky-hop-dong': { label: 'Ký Hợp Đồng', primaryDoors: ['Khai Môn', 'Sinh Môn'], primaryDeities: ['Lục Hợp', 'Cửu Thiên'], avoidDoors: ['Tử Môn'], avoidDeities: ['Câu Trận', 'Đằng Xà', 'Cửu Địa'], usefulStars: ['Thiên Tâm', 'Thiên Phụ'] },
  'dam-phan': { label: 'Đàm Phán / Thương Lượng', primaryDoors: ['Khai Môn', 'Sinh Môn'], primaryDeities: ['Lục Hợp', 'Thái Âm'], avoidDoors: ['Kinh Môn', 'Tử Môn'], avoidDeities: ['Cửu Địa', 'Câu Trận'], usefulStars: ['Thiên Phụ'] },
  'doi-no': { label: 'Đòi Nợ / Thu Hồi', primaryDoors: ['Khai Môn', 'Thương Môn'], primaryDeities: ['Câu Trận', 'Cửu Thiên'], avoidDoors: ['Hưu Môn'], avoidDeities: ['Chu Tước'], usefulStars: ['Thiên Xung', 'Thiên Bồng'] },
  'kien-tung': { label: 'Kiện Tụng / Pháp Lý', primaryDoors: ['Khai Môn'], primaryDeities: ['Câu Trận', 'Cửu Thiên'], avoidDoors: ['Tử Môn', 'Hưu Môn'], avoidDeities: ['Chu Tước', 'Đằng Xà'], usefulStars: ['Thiên Xung'] },
  'xuat-hanh': { label: 'Xuất Hành / Du Lịch', primaryDoors: ['Sinh Môn', 'Khai Môn', 'Hưu Môn'], primaryDeities: ['Lục Hợp', 'Cửu Thiên'], avoidDoors: ['Tử Môn', 'Kinh Môn'], avoidDeities: ['Câu Trận', 'Đằng Xà'], usefulStars: ['Thiên Nhậm', 'Thiên Tâm'] },
  'xin-viec': { label: 'Xin Việc / Phỏng Vấn', primaryDoors: ['Khai Môn'], primaryDeities: ['Cửu Thiên', 'Lục Hợp'], avoidDoors: ['Tử Môn'], avoidDeities: ['Câu Trận'], usefulStars: ['Thiên Nhậm', 'Thiên Phụ'] },
  'bat-dong-san': PROPERTY_TOPIC,
  'dien-trach': PROPERTY_TOPIC,
  'muu-luoc': { label: 'Mưu Lược / Chiến Lược', primaryDoors: ['Khai Môn', 'Sinh Môn'], primaryDeities: ['Thái Âm', 'Cửu Thiên'], avoidDoors: ['Tử Môn'], avoidDeities: ['Đằng Xà', 'Cửu Địa'], usefulStars: ['Thiên Phụ', 'Thiên Tâm', 'Thiên Nhậm'] },
};

/**
 * findUsefulGod(topicKey, chart)
 * Scores each perimeter palace against topic criteria.
 * Returns best palace with directional advice.
 */
export function findUsefulGod(topicKey, chart) {
  const normalizedTopicKey = normalizeTopicKey(topicKey);
  const topic = TOPICS[normalizedTopicKey];
  if (!topic) return { error: `Topic không tồn tại: "${topicKey}"` };
  const tkName = chart.solarTerm.name;
  const candidates = [];

  for (let p = 1; p <= 9; p++) {
    if (p === 5) continue;
    const pal = chart.palaces[p];
    let score = 0; const reasons = [];

    if (pal.mon && topic.primaryDoors.includes(pal.mon.name)) { score += 5; reasons.push(`✅ ${pal.mon.name} (cổng cát)`); }
    if (pal.mon && topic.avoidDoors.includes(pal.mon.name)) { score -= 6; reasons.push(`❌ ${pal.mon.name} (cổng hung)`); }
    if (pal.than && topic.primaryDeities.includes(pal.than.name)) { score += 4; reasons.push(`✅ ${pal.than.name} (thần cát)`); }
    if (pal.than && topic.avoidDeities.includes(pal.than.name)) { score -= 4; reasons.push(`❌ ${pal.than.name} (thần hung)`); }
    if (pal.star && topic.usefulStars.includes(pal.star.name)) { score += 3; reasons.push(`✅ ${pal.star.name} (sao hỗ trợ)`); }

    const es = getElementState(PALACE_META[p].element, tkName);
    if (es.isStrong) { score += 2; reasons.push(`✅ ${es.state}`); }
    if (es.isWeak) { score -= 1; reasons.push(`⚠️ ${es.state}`); }
    if (pal.khongVong) { score -= 5; reasons.push('⚠️ Không Vong'); }
    if (pal.trucPhu) { score += 2; reasons.push('✅ Trực Phù'); }
    if (['Ất', 'Bính', 'Đinh'].includes(pal.can?.name)) { score += 3; reasons.push(`✅ Tam Kỳ ${pal.can.name}`); }

    candidates.push({ palace: p, score, reasons });
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const verdict = best.score >= 10 ? { label: 'Đại Cát', color: 'cat' } : best.score >= 5 ? { label: 'Cát', color: 'cat' } : best.score >= 0 ? { label: 'Bình', color: 'binh' } : best.score >= -5 ? { label: 'Hung', color: 'hung' } : { label: 'Đại Hung', color: 'hung' };

  return {
    topic: topic.label,
    usefulGodPalace: best.palace, usefulGodDir: PALACE_META[best.palace].dir,
    usefulGodPalaceName: PALACE_META[best.palace].name,
    score: best.score, verdict, reasons: best.reasons,
    allCandidates: candidates,
    actionAdvice: generateAdvice(normalizedTopicKey, best, chart),
  };
}

/** generateAdvice — human-readable directional action sentence */
export function generateAdvice(topicKey, best, chart) {
  const normalizedTopicKey = normalizeTopicKey(topicKey);
  const p = best.palace, pal = chart.palaces[p];
  const dir = PALACE_META[p].dir, pNm = PALACE_META[p].name;
  const mon = pal?.mon?.name || '—', than = pal?.than?.name || '—';
  const star = pal?.star?.name || '—', can = pal?.can?.name || '—';
  const ok = best.score >= 5 ? '✅' : '⚠️', cat = best.score >= 5;

  const map = {
    'tai-van': `${ok} Hướng tài lộc: ${dir} (Cung ${pNm}). ${mon} × ${than} — ${cat
      ? `Dòng chảy tiền tệ đang tìm về đúng mạch. Đây là thời điểm vàng để "kéo lưới", các khoản đầu tư bắt đầu sinh sôi mạnh mẽ. Đừng chần chừ, hãy để dòng vốn của bạn vận động.`
      : `Mạch tiền hiện đang gặp vật cản hoặc chảy vào vùng trũng. Hãy kiểm soát chặt chẽ chi tiêu, tránh các quyết định xuống tiền cảm tính. Lúc này, "thủ" chính là "công".`}`,

    'suc-khoe': `${ok} Khám bệnh hướng ${dir}. ${star} × ${mon} — ${star === 'Thiên Tâm' && mon === 'Sinh Môn'
      ? `🌟 Thiên thời đang bảo hộ sinh mệnh bạn. Bạn sẽ gặp được chuyên gia đầu ngành (quý nhân) và phương pháp điều trị "trúng đích". Cơ thể đang tự chữa lành rất mạnh mẽ.`
      : cat
        ? `Năng lượng tích cực đang hội tụ. Việc điều trị hoặc thay đổi thói quen sinh hoạt lúc này sẽ mang lại kết quả phục hồi rõ rệt. Tiểu vũ trụ trong bạn đang dần cân bằng.`
        : `Hệ thống năng lượng đang báo động đỏ. Đừng chủ quan với các dấu hiệu nhỏ, hãy tìm kiếm sự tư vấn chuyên sâu thay vì tự phán đoán.`}`,

    'tinh-duyen': `${ok} Hẹn hò hướng ${dir} (${pNm}). ${than} hỗ trợ — ${['Lục Hợp', 'Thái Âm', 'Thanh Long'].includes(than)
      ? `Tần số rung động đang trùng khớp. Đây là lúc "nhân duyên tiền định" xuất hiện. Hãy mở lòng và chủ động, bởi sợi dây liên kết đang rất bền chặt và chân thành.`
      : cat
        ? `Bầu không khí đang trở nên ấm áp hơn. Một cuộc trò chuyện sâu sắc hoặc một buổi hẹn nhẹ nhàng sẽ là khởi đầu tốt để thấu hiểu đối phương.`
        : `Sóng năng lượng đang bị nhiễu. Có thể có sự hiểu lầm hoặc kỳ vọng quá cao. Hãy lùi lại một bước, cho nhau không gian để tự soi chiếu lại cảm xúc.`}`,

    'su-nghiep': `${ok} Hành động hướng ${dir}. ${can} × ${mon} — ${cat
      ? `Cánh cửa quan lộc đang rộng mở. Vị thế của bạn được khẳng định, hồ sơ hoặc đề xuất của bạn có sức nặng rất lớn. Hãy tự tin bước lên sân khấu chính.`
      : `Gió ngược đang thổi. Môi trường công sở có thể đang có những biến số ngầm. Hãy chuẩn bị kỹ năng chuyên môn thật sắc bén và giữ thái độ trung lập để quan sát thế trận.`}`,

    'kinh-doanh': `${ok} Khai trương/Kinh doanh hướng ${dir}. ${mon} × ${than} — ${cat
      ? `Thị trường đang đón nhận bạn với "thảm đỏ". Mọi chiến dịch tung ra đều dễ dàng tạo hiệu ứng lan tỏa và thu hút tệp khách hàng tiềm năng. Thiên thời, địa lợi đã sẵn sàng.`
      : `Tín hiệu thị trường đang không rõ ràng. Việc bung sức lúc này có thể dẫn đến lãng phí nguồn lực. Hãy điều chỉnh mô hình kinh doanh nhỏ gọn và thực tế hơn.`}`,

    'thi-cu': `${ok} Nhập thi hướng ${dir}. ${can} hỗ trợ — ${cat
      ? `Trí tuệ đang ở trạng thái minh mẫn nhất. Khả năng ứng biến và tư duy logic của bạn sẽ giúp bạn "vượt vũ môn" một cách thuyết phục. Hãy tin vào sự chuẩn bị của mình.`
      : `Tâm lý có chút xao nhãng hoặc áp lực quá tải. Hãy dành thời gian để hệ thống lại kiến thức cốt lõi thay vì học dàn trải. Sự điềm tĩnh sẽ là vũ khí lớn nhất của bạn.`}`,

    'ky-hop-dong': `${ok} Ký kết hướng ${dir}. ${than} × ${mon} — ${cat
      ? `Một liên minh bền vững đang được thiết lập. Các điều khoản đang nghiêng về phía có lợi cho đôi bên, tạo tiền đề cho sự phát triển dài hạn. Hãy đặt bút với sự tin tưởng.`
      : `Ẩn đằng sau những con số là các biến số rủi ro. Hãy rà soát lại các điều khoản nhỏ nhất hoặc tham vấn pháp lý trước khi cam kết. Đừng vội vã vì một lợi ích ngắn hạn.`}`,

    'dam-phan': `${ok} Đàm phán hướng ${dir}. ${than} × ${mon} — ${cat
      ? `Bạn đang nắm giữ "quân át chủ bài". Sức thuyết phục và vị thế của bạn khiến đối phương khó lòng từ chối. Đây là lúc để chốt các điều kiện quan trọng nhất.`
      : `Thế trận đàm phán đang ở thế giằng co. Đối phương có thể đang che giấu ý định thực sự. Hãy chuẩn bị sẵn phương án B (BATNA) và không nên lộ hết bài quá sớm.`}`,

    'doi-no': `${ok} Đòi nợ hướng ${dir}. ${star} × ${mon} — ${cat
      ? `Năng lượng của sự công bằng đang trỗi dậy. Khả năng thu hồi được tài sản là rất cao nếu bạn tiếp cận bằng thái độ kiên quyết nhưng chuyên nghiệp.`
      : `Đối phương đang rơi vào thế bế tắc hoặc cố tình trì hoãn. Việc đòi nợ lúc này cần sự hỗ trợ của chứng từ pháp lý chặt chẽ và sự kiên trì bền bỉ thay vì nóng nảy.`}`,

    'kien-tung': `${ok} Ra tòa hướng ${dir}. ${than} × ${mon} — ${cat
      ? `Công lý đang đứng về phía bạn. Các bằng chứng và lý lẽ bạn đưa ra có sức nặng tuyệt đối trước pháp luật. Thiên thời đang hỗ trợ bạn lấy lại sự công bằng.`
      : `Thế trận pháp lý đang rất phức tạp và tiêu tốn tài lực. Hãy cân nhắc phương án hòa giải nếu có thể, hoặc chuẩn bị một đội ngũ luật sư cực kỳ am tường để đối phó.`}`,

    'xuat-hanh': `${ok} Xuất hành hướng ${dir}. ${mon} × ${than} — ${cat
      ? `Đường đi không chỉ bình an mà còn mang về những cơ hội bất ngờ (quý nhân dọc đường). Một chuyến đi "đổi vận" và tái tạo năng lượng tuyệt vời.`
      : `Dọc đường có thể phát sinh những sự cố ngoài ý muốn về lịch trình hoặc phương tiện. Hãy kiểm tra kỹ giấy tờ và hành lý, đồng thời luôn có kế hoạch dự phòng cho sự thay đổi.`}`,

    'xin-viec': `${ok} Phỏng vấn hướng ${dir}. ${mon} × ${can} — ${cat
      ? `Bạn chính là mảnh ghép mà doanh nghiệp đang tìm kiếm. Hãy tự tin tỏa sáng bằng kinh nghiệm thực tế, cơ hội để bạn đạt được thỏa thuận lương thưởng như ý rất gần.`
      : `Tỉ lệ cạnh tranh đang rất cao hoặc yêu cầu công việc chưa thực sự khớp với bạn. Hãy làm nổi bật những giá trị khác biệt (USP) của bản thân để gây ấn tượng mạnh.`}`,

    'bat-dong-san': `${ok} Giao dịch nhà đất hướng ${dir}. ${than} × ${mon} — ${cat
      ? `Đây là một "bất động sản vàng" với pháp lý minh bạch và tiềm năng tăng giá lớn. Năng lượng của đất đang tương sinh với bạn, giao dịch sẽ diễn ra nhanh chóng.`
      : `Cần đặc biệt lưu ý về quy hoạch hoặc tranh chấp ngầm. Đừng để vẻ ngoài hào nhoáng đánh lừa, hãy kiểm tra thực địa và hồ sơ pháp lý thật kỹ trước khi đặt cọc.`}`,

    'muu-luoc': `${ok} Lập chiến lược hướng ${dir}. ${can} × ${than} — ${cat
      ? `Tầm nhìn của bạn đang đi trước thời đại. Một kế hoạch sắc bén, khả thi và có tính đột phá cao. Hãy bắt tay vào hiện thực hóa, thành công chỉ là vấn đề thời gian.`
      : `Bản kế hoạch hiện tại vẫn còn những điểm mù (blind spots). Hãy tìm kiếm thêm dữ liệu thực tế và phản biện từ những người có kinh nghiệm để hoàn thiện nó.`}`,
  };
  return map[normalizedTopicKey] || `${ok} Hướng Dụng Thần: ${dir} (Cung ${p}·${pNm}). ${mon} × ${than} × ${star} — điểm ${best.score >= 0 ? '+' : ''}${best.score}.`;
}
