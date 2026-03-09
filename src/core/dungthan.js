/**
 * dungthan.js — Layer 5: Dụng Thần / Topic Analysis Engine
 * Maps life topics → best palace + directional advice.
 */

import { PALACE_META } from './tables.js';
import { getElementState } from './states.js';
import { getPrimaryCombo, getComboAdviceForDungThan } from '../logic/dungThan/flagCombos.js';
import { deriveFlags } from '../logic/dungThan/normalizeChart.js';

function normalizeTopicKey(topicKey) {
  if (topicKey === 'tinh-yeu') return 'tinh-duyen';
  if (topicKey === 'dien-trach') return 'bat-dong-san';
  if (topicKey === 'gia-dinh') return 'gia-dao';
  return topicKey;
}

const LOVE_TOPIC = { label: 'Tình Duyên / Hôn Nhân', primaryDoors: ['Hưu Môn', 'Sinh Môn'], primaryDeities: ['Lục Hợp', 'Thái Âm', 'Cửu Thiên'], avoidDoors: ['Tử Môn', 'Kinh Môn'], avoidDeities: ['Câu Trận', 'Chu Tước'], usefulStars: ['Thiên Phụ', 'Thiên Nhậm'] };
const PROPERTY_TOPIC = { label: 'Bất Động Sản / Mua Bán Nhà Đất', primaryDoors: ['Sinh Môn', 'Khai Môn'], primaryDeities: ['Cửu Địa', 'Lục Hợp'], avoidDoors: ['Tử Môn'], avoidDeities: ['Câu Trận', 'Chu Tước'], usefulStars: ['Thiên Phụ', 'Thiên Tâm'] };
const FAMILY_TOPIC = { label: 'Gia Đạo / Gia Đình', primaryDoors: ['Hưu Môn', 'Sinh Môn', 'Khai Môn'], primaryDeities: ['Lục Hợp', 'Trực Phù', 'Cửu Địa'], avoidDoors: ['Thương Môn', 'Đỗ Môn', 'Tử Môn'], avoidDeities: ['Đằng Xà', 'Chu Tước'], usefulStars: ['Thiên Phụ', 'Thiên Nhậm', 'Thiên Tâm'] };
const STUDY_TOPIC_BASE = {
  primaryDoors: ['Cảnh Môn', 'Khai Môn', 'Hưu Môn'],
  primaryDeities: ['Trực Phù', 'Cửu Thiên', 'Thái Âm', 'Lục Hợp'],
  avoidDoors: ['Tử Môn', 'Đỗ Môn', 'Kinh Môn'],
  avoidDeities: ['Đằng Xà', 'Câu Trận'],
  usefulStars: ['Thiên Phụ', 'Thiên Tâm', 'Thiên Nhậm', 'Thiên Anh'],
};

// ── Topic definitions (compact 4-line format) ─────────────────────────────────
export const TOPICS = {
  'tai-van': { label: 'Tài Vận / Đầu Tư', primaryDoors: ['Sinh Môn', 'Khai Môn'], primaryDeities: ['Lục Hợp', 'Thái Âm', 'Cửu Thiên'], avoidDoors: ['Tử Môn', 'Kinh Môn'], avoidDeities: ['Câu Trận', 'Đằng Xà', 'Chu Tước'], usefulStars: ['Thiên Tâm', 'Thiên Nhậm', 'Thiên Phụ'] },
  'suc-khoe': { label: 'Sức Khỏe / Khám Bệnh', primaryDoors: ['Sinh Môn'], primaryDeities: ['Lục Hợp', 'Cửu Thiên'], avoidDoors: ['Tử Môn', 'Kinh Môn'], avoidDeities: ['Câu Trận', 'Đằng Xà'], usefulStars: ['Thiên Tâm'] },
  'tinh-duyen': LOVE_TOPIC,
  'tinh-yeu': LOVE_TOPIC,
  'gia-dao': FAMILY_TOPIC,
  'su-nghiep': { label: 'Sự Nghiệp / Thăng Tiến', primaryDoors: ['Khai Môn', 'Sinh Môn'], primaryDeities: ['Cửu Thiên', 'Trực Phù'], avoidDoors: ['Tử Môn'], avoidDeities: ['Câu Trận', 'Chu Tước'], usefulStars: ['Thiên Tâm', 'Thiên Xung'] },
  'kinh-doanh': { label: 'Kinh Doanh / Khai Trương', primaryDoors: ['Sinh Môn', 'Khai Môn'], primaryDeities: ['Lục Hợp', 'Cửu Thiên'], avoidDoors: ['Tử Môn', 'Kinh Môn'], avoidDeities: ['Câu Trận', 'Đằng Xà', 'Chu Tước', 'Cửu Địa'], usefulStars: ['Thiên Tâm', 'Thiên Nhậm', 'Thiên Xung'] },
  'hoc-tap': { label: 'Học Tập / Tài Liệu', ...STUDY_TOPIC_BASE },
  'thi-cu': { label: 'Thi Cử / Phỏng Vấn', ...STUDY_TOPIC_BASE },
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

function scoreStudyPalace(topicKey, palaceNum, palace, tkName) {
  let score = 0;
  const reasons = [];
  const doorName = palace?.mon?.name || '';
  const starName = palace?.star?.name || '';
  const deityName = palace?.than?.name || '';
  const stemName = palace?.can?.name || '';
  const isExam = topicKey === 'thi-cu';

  // Shared study scorer: "học tập" và "thi cử" phải neo cùng một trục tài liệu / đề cương,
  // chỉ khác ở lớp diễn giải phía sau chứ không được chọn lệch cung.
  if (doorName === 'Cảnh Môn') { score += 14; reasons.push('✅ Cảnh Môn (đề cương/tài liệu)'); }
  if (doorName === 'Khai Môn') { score += 7; reasons.push('✅ Khai Môn (mở bài/mở ý)'); }
  if (doorName === 'Hưu Môn') { score += 6; reasons.push('✅ Hưu Môn (ôn lại/củng cố)'); }
  if (doorName === 'Sinh Môn') { score += 2; reasons.push('✅ Sinh Môn (tiếp thu/hồi đáp tốt)'); }
  if (doorName === 'Đỗ Môn') { score -= 6; reasons.push('❌ Đỗ Môn (đóng tài liệu/chưa công bố)'); }
  if (doorName === 'Tử Môn') { score -= 8; reasons.push('❌ Tử Môn (áp lực/kết quả xấu)'); }
  if (doorName === 'Kinh Môn') { score -= 5; reasons.push('⚠️ Kinh Môn (nhiễu loạn/lịch biến động)'); }

  if (starName === 'Thiên Phụ') { score += 10; reasons.push('✅ Thiên Phụ (giáo viên/tài liệu chuẩn)'); }
  if (starName === 'Thiên Tâm') { score += 5; reasons.push('✅ Thiên Tâm (logic ôn tập)'); }
  if (starName === 'Thiên Nhậm') { score += 5; reasons.push('✅ Thiên Nhậm (bền nhịp học)'); }
  if (starName === 'Thiên Anh') { score += 5; reasons.push('✅ Thiên Anh (đề/điểm lộ diện)'); }

  if (deityName === 'Trực Phù') { score += 5; reasons.push('✅ Trực Phù (được chỉ đường)'); }
  if (deityName === 'Cửu Thiên') { score += 4; reasons.push('✅ Cửu Thiên (mở nhanh/thông nhanh)'); }
  if (deityName === 'Lục Hợp') { score += 3; reasons.push('✅ Lục Hợp (khớp bài/khớp nhịp)'); }
  if (deityName === 'Thái Âm') { score += 2; reasons.push('✅ Thái Âm (tự học/nghiên cứu)'); }
  if (deityName === 'Đằng Xà') {
    if (doorName === 'Cảnh Môn') {
      score += 1;
      reasons.push('⚠️ Đằng Xà (đề cương có twist/lắt léo)');
    } else {
      score -= 3;
      reasons.push('❌ Đằng Xà (rối thông tin/bẫy đánh đố)');
    }
  }

  if (isExam && doorName === 'Hưu Môn') {
    score += 1;
    reasons.push('✅ Hưu Môn (giữ bình tĩnh trong phòng thi)');
  }

  const es = getElementState(PALACE_META[palaceNum].element, tkName);
  if (es.isStrong) { score += 1; reasons.push(`✅ ${es.state}`); }
  if (es.isWeak) { score -= 1; reasons.push(`⚠️ ${es.state}`); }

  if (palace?.dichMa) {
    score += 6;
    reasons.push('✅ Dịch Mã (nhịp nhanh/biến động sát giờ)');
  }
  if (palace?.khongVong) { score -= 7; reasons.push('⚠️ Không Vong'); }
  if (palace?.trucPhu) { score += 3; reasons.push('✅ Trực Phù'); }
  if (palace?.trucSu) { score += 2; reasons.push('✅ Trực Sử'); }
  if (['Ất', 'Bính', 'Đinh'].includes(stemName)) { score += 2; reasons.push(`✅ Tam Kỳ ${stemName}`); }

  return { score, reasons };
}

function scoreWealthPalace(palaceNum, palace, tkName) {
  let score = 0;
  const reasons = [];
  const doorName = palace?.mon?.name || '';
  const starName = palace?.star?.name || '';
  const deityName = palace?.than?.name || '';
  const stemName = palace?.can?.name || '';

  if (doorName === 'Sinh Môn') { score += 12; reasons.push('✅ Sinh Môn (lợi nhuận/ROI)'); }
  if (doorName === 'Khai Môn') { score += 6; reasons.push('✅ Khai Môn (mở vị thế/thanh khoản)'); }
  if (doorName === 'Hưu Môn') { score += 4; reasons.push('✅ Hưu Môn (giữ tiền/chờ vùng đẹp)'); }
  if (doorName === 'Kinh Môn') { score -= 4; reasons.push('⚠️ Kinh Môn (biến động mạnh)'); }
  if (doorName === 'Tử Môn') { score -= 8; reasons.push('❌ Tử Môn (rủi ro đốt vốn)'); }
  if (doorName === 'Thương Môn') { score -= 5; reasons.push('❌ Thương Môn (hao tổn/tổn thương vốn)'); }

  if (stemName === 'Mậu') { score += 10; reasons.push('✅ Mậu (vốn/tiền mặt/thanh khoản)'); }
  if (stemName === 'Kỷ') { score += 4; reasons.push('✅ Kỷ (gom lại vốn, hệ thống hóa dòng tiền)'); }

  if (doorName === 'Sinh Môn' && stemName === 'Mậu') {
    score += 8;
    reasons.push('✅ Trục Mậu + Sinh (vốn gặp lợi nhuận)');
  }

  if (starName === 'Thiên Tâm') { score += 4; reasons.push('✅ Thiên Tâm (kỷ luật vào/ra)'); }
  if (starName === 'Thiên Nhậm') { score += 3; reasons.push('✅ Thiên Nhậm (giữ thesis dài hơi)'); }
  if (starName === 'Thiên Phụ') { score += 3; reasons.push('✅ Thiên Phụ (cố vấn/thesis chuẩn)'); }
  if (starName === 'Thiên Xung') { score += 2; reasons.push('✅ Thiên Xung (nhịp trading nhanh)'); }

  if (deityName === 'Lục Hợp') { score += 3; reasons.push('✅ Lục Hợp (khớp lệnh/khớp deal)'); }
  if (deityName === 'Thái Âm') { score += 3; reasons.push('✅ Thái Âm (giữ bài, tích lũy kín)'); }
  if (deityName === 'Cửu Thiên') { score += 3; reasons.push('✅ Cửu Thiên (tốc độ/thanh khoản nhanh)'); }
  if (deityName === 'Bạch Hổ') { score -= 5; reasons.push('❌ Bạch Hổ (sát vốn/rủi ro cao)'); }
  if (deityName === 'Đằng Xà') { score -= 4; reasons.push('❌ Đằng Xà (bẫy giá/bẫy dữ liệu)'); }

  const es = getElementState(PALACE_META[palaceNum].element, tkName);
  if (es.isStrong) { score += 1; reasons.push(`✅ ${es.state}`); }
  if (es.isWeak) { score -= 1; reasons.push(`⚠️ ${es.state}`); }

  if (palace?.dichMa) { score += 3; reasons.push('✅ Dịch Mã (thanh khoản nhanh/nhịp gấp)'); }
  if (palace?.khongVong) { score -= 8; reasons.push('⚠️ Không Vong'); }
  if (palace?.trucPhu) { score += 2; reasons.push('✅ Trực Phù'); }
  if (palace?.trucSu) { score += 2; reasons.push('✅ Trực Sử'); }

  return { score, reasons };
}

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

    if (normalizedTopicKey === 'hoc-tap' || normalizedTopicKey === 'thi-cu') {
      const studyScore = scoreStudyPalace(normalizedTopicKey, p, pal, tkName);
      score = studyScore.score;
      reasons.push(...studyScore.reasons);
      candidates.push({ palace: p, score, reasons });
      continue;
    }

    if (normalizedTopicKey === 'tai-van') {
      const wealthScore = scoreWealthPalace(p, pal, tkName);
      score = wealthScore.score;
      reasons.push(...wealthScore.reasons);
      candidates.push({ palace: p, score, reasons });
      continue;
    }

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
  const wealthFast = Boolean(pal?.dichMa || chart?.isPhanNgam || star === 'Thiên Xung' || than === 'Cửu Thiên' || mon === 'Khai Môn' || mon === 'Kinh Môn');
  const wealthSlow = Boolean(chart?.isPhucAm || than === 'Cửu Địa' || star === 'Thiên Nhậm' || mon === 'Sinh Môn' || mon === 'Đỗ Môn' || mon === 'Hưu Môn');

  // Combo dispatch: detect flag combos and return topic-specific advice
  const flags = deriveFlags(chart, pal);
  const combo = getPrimaryCombo(flags);
  if (combo) {
    const comboAdvice = getComboAdviceForDungThan(combo.id, normalizedTopicKey, { dir, pNm, mon, than, star, can, ok });
    if (comboAdvice) return comboAdvice;
  }

  if (pal?.khongVong) {
    const voidAdviceMap = {
      'hoc-tap': `${ok} Học tập hướng ${dir}. ${star} × ${mon} — Cẩn thận, trục này dính Không Vong: đề cương hoặc thông báo có thể còn là ảo ảnh, lời hứa suông, hoặc bị treo vô thời hạn. Đừng dồn toàn bộ sức vào thứ chưa xác minh; hãy ôn theo khung chắc trước và chỉ tăng lực khi có tài liệu thật.`,
      'thi-cu': `${ok} Nhập thi hướng ${dir}. ${can} hỗ trợ — Cẩn thận, cung này dính Không Vong: lịch, thông báo hoặc kỳ vọng kết quả có thể rỗng hoặc chậm hơn dự tính. Đừng all-in vào một kịch bản duy nhất; phải giữ phương án dự phòng.`,
      'tinh-duyen': `${ok} Hẹn hò hướng ${dir} (${pNm}). ${than} hỗ trợ — Cẩn thận, tín hiệu này dính Không Vong: lời hứa hoặc kỳ vọng rất dễ là ảo ảnh, nói được mà chưa chắc làm được. Đừng dồn hết tim sức vào lúc này; cần nhìn hành động thật trước khi tin.`,
      'gia-dao': `${ok} Giữ nhà hướng ${dir}. ${than} × ${mon} — Cung này dính Không Vong: điều vừa nghe có thể chưa phải sự thật trọn vẹn, hoặc lời hứa sửa đổi còn rất rỗng. Hãy xác minh và tách cảm xúc khỏi dữ kiện trước khi quyết định.`,
      'tai-van': `${ok} Hướng tài lộc: ${dir} (Cung ${pNm}). ${mon} × ${than} — Cẩn thận, đây là ảo ảnh, lời hứa suông (Void). Đừng dồn tiền vào lúc này; phải kiểm chứng dòng tiền, giấy tờ và khả năng thực thi trước.`,
      'kinh-doanh': `${ok} Kinh doanh hướng ${dir}. ${mon} × ${than} — Cung này dính Không Vong: deal, nhu cầu thị trường hoặc cam kết đối tác có thể đang rỗng hơn vẻ ngoài. Đừng bung lực lớn ngay; hãy thử nhỏ và kiểm chứng thật nhanh.`,
      'bat-dong-san': `${ok} Giao dịch nhà đất hướng ${dir}. ${than} × ${mon} — Cẩn thận, tín hiệu này dính Không Vong: hồ sơ, lời hứa hoặc tiến độ rất dễ treo. Đừng dồn tiền/cọc vào lúc này nếu chưa soi pháp lý và xác minh thực địa.`,
      'su-nghiep': `${ok} Hành động hướng ${dir}. ${can} × ${mon} — Cung này dính Không Vong: lời hứa, vị trí hoặc cam kết từ phía trên có thể chưa thành hình. Đừng dồn toàn lực theo kỳ vọng miệng; phải đòi xác nhận rõ ràng bằng hành động hoặc văn bản.`,
      'muu-luoc': `${ok} Lập chiến lược hướng ${dir}. ${can} × ${than} — Cung này dính Không Vong: giả định cốt lõi có thể đang rỗng hoặc sai dữ kiện. Tạm thời đừng đẩy toàn bộ lực, hãy xác minh lại premise trước rồi mới triển khai.`,
    };
    return voidAdviceMap[normalizedTopicKey]
      || `${ok} Hướng ${dir} (${pNm}). ${mon} × ${than} — Cẩn thận, cung này dính Không Vong: tín hiệu dễ là ảo ảnh hoặc bị delay dài. Đừng dồn tiền/sức vào lúc này nếu chưa xác minh bằng dữ kiện thật.`;
  }

  const map = {
    'tai-van': `${ok} Hướng tài lộc: ${dir} (Cung ${pNm}). ${mon} × ${than} — ${cat
      ? wealthFast
        ? `Đây là nhịp tiền nhanh: hợp đánh theo thanh khoản, vào-ra dứt điểm và chốt khi đạt mục tiêu. Tuyệt đối không biến một lệnh tốc độ thành khoản gồng dài hạn.`
        : wealthSlow
          ? `Đây là bài toán kiên nhẫn: hợp tích lũy theo thesis, chia vốn thành nhiều nhịp và chịu dao động ngắn hạn có kiểm soát.`
          : `Có cửa sinh lời nhưng phải đi bằng kỷ luật vốn, không được all-in chỉ vì thấy tín hiệu đẹp.`
      : `Mạch tiền đang dễ hụt nhịp hoặc sai kỳ vọng. Ưu tiên giữ tiền mặt, hạ khối lượng và chỉ hành động khi thanh khoản cùng dữ kiện đều sáng.`}`,

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

    'hoc-tap': `${ok} Học tập hướng ${dir}. ${star} × ${mon} — ${cat
      ? pal?.dichMa
        ? `Trục đề cương đang cưỡi Dịch Mã: tài liệu hoặc thông báo có thể bật ra rất nhanh và khá bất ngờ. Đừng ngồi chờ; hãy chuẩn bị sẵn khung ôn để đón đầu ngay khi nó xuất hiện.`
        : `Trục tài liệu và người chỉ bài đang mở. Nếu bám đúng đề cương, đúng thầy, đúng nhịp ôn thì kiến thức vào rất nhanh và không bị học lan man.`
      : `Việc học đang bị rối nhịp hoặc lệch trọng tâm. Đừng ôm quá nhiều thứ một lúc; hãy quay lại phần nền, phần giáo viên đã nhấn mạnh và phần đề cương đang lộ ra.`}`,

    'thi-cu': `${ok} Nhập thi hướng ${dir}. ${can} hỗ trợ — ${cat
      ? pal?.dichMa
        ? `Nhịp thi đang rất nhanh và dễ có biến động sát giờ. Hãy chuẩn bị trước các phương án ứng biến, vì khi đề hoặc lịch xoay chiều bạn sẽ phải phản ứng ngay.`
        : `Trí tuệ đang ở trạng thái minh mẫn nhất. Khả năng ứng biến và tư duy logic của bạn sẽ giúp bạn "vượt vũ môn" một cách thuyết phục. Hãy tin vào sự chuẩn bị của mình.`
      : `Tâm lý có chút xao nhãng hoặc áp lực quá tải. Hãy dành thời gian để hệ thống lại kiến thức cốt lõi thay vì học dàn trải. Sự điềm tĩnh sẽ là vũ khí lớn nhất của bạn.`}`,

    'gia-dao': `${ok} Giữ nhà hướng ${dir}. ${than} × ${mon} — ${cat
      ? `Gia đạo vẫn còn cửa hòa. Chỉ cần có một người hạ giọng trước và nói đúng vấn đề, không khí trong nhà có thể dịu đi rất nhanh.`
      : `Nhà đang dễ bật thành chiến tranh lạnh hoặc lời qua tiếng lại. Nếu còn cố thắng thua bằng miệng, mâu thuẫn sẽ ăn sâu thêm thay vì được gỡ ra.`}`,

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
      ? `Cung này mở cửa giao dịch, nhưng chỉ nên đi tiếp sau khi đã soi đủ pháp lý, người đứng tên, quy hoạch và điều kiện thoát deal. Đẹp trên giấy chưa đủ; phải sạch ở thực địa.`
      : `Cần đặc biệt lưu ý về quy hoạch, tranh chấp ngầm hoặc tiến độ treo. Đừng để vẻ ngoài hào nhoáng đánh lừa, hãy kiểm tra thực địa và hồ sơ pháp lý thật kỹ trước khi đặt cọc.`}`,

    'muu-luoc': `${ok} Lập chiến lược hướng ${dir}. ${can} × ${than} — ${cat
      ? `Tầm nhìn của bạn đang đi trước thời đại. Một kế hoạch sắc bén, khả thi và có tính đột phá cao. Hãy bắt tay vào hiện thực hóa, thành công chỉ là vấn đề thời gian.`
      : `Bản kế hoạch hiện tại vẫn còn những điểm mù (blind spots). Hãy tìm kiếm thêm dữ liệu thực tế và phản biện từ những người có kinh nghiệm để hoàn thiện nó.`}`,
  };
  return map[normalizedTopicKey] || `${ok} Hướng Dụng Thần: ${dir} (Cung ${p}·${pNm}). ${mon} × ${than} × ${star} — điểm ${best.score >= 0 ? '+' : ''}${best.score}.`;
}
