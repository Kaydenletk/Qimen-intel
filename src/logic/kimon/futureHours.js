/**
 * futureHours.js — Hybrid Ứng Kỳ Engine
 *
 * Tính toán các khung giờ tốt trong tương lai dựa trên trận đồ Kỳ Môn.
 * Thay vì để AI tự đếm cung, engine tính sẵn và inject vào prompt.
 */

import { ELEMENT_MEANINGS } from '../dungThan/quickSummary.js';

// ══════════════════════════════════════════════════════════════════════════════
// BẢNG QUY ĐỔI CUNG → GIỜ (ÁP CUNG TÌM GIỜ)
// ══════════════════════════════════════════════════════════════════════════════
const PALACE_TO_HOURS = {
  1: [{ chi: 'Tý', start: 23, end: 1, label: '23h-01h' }],
  8: [
    { chi: 'Sửu', start: 1, end: 3, label: '01h-03h' },
    { chi: 'Dần', start: 3, end: 5, label: '03h-05h' },
  ],
  3: [{ chi: 'Mão', start: 5, end: 7, label: '05h-07h' }],
  4: [
    { chi: 'Thìn', start: 7, end: 9, label: '07h-09h' },
    { chi: 'Tỵ', start: 9, end: 11, label: '09h-11h' },
  ],
  9: [{ chi: 'Ngọ', start: 11, end: 13, label: '11h-13h' }],
  2: [
    { chi: 'Mùi', start: 13, end: 15, label: '13h-15h' },
    { chi: 'Thân', start: 15, end: 17, label: '15h-17h' },
  ],
  7: [{ chi: 'Dậu', start: 17, end: 19, label: '17h-19h' }],
  6: [
    { chi: 'Tuất', start: 19, end: 21, label: '19h-21h' },
    { chi: 'Hợi', start: 21, end: 23, label: '21h-23h' },
  ],
};

const PALACE_DIRECTIONS = {
  1: 'Bắc',
  2: 'Tây Nam',
  3: 'Đông',
  4: 'Đông Nam',
  6: 'Tây Bắc',
  7: 'Tây',
  8: 'Đông Bắc',
  9: 'Nam',
};

// ══════════════════════════════════════════════════════════════════════════════
// SCORING LOGIC
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Tính điểm cho một cung dựa trên Môn + Tinh + Thần
 */
function scorePalace(palace) {
  if (!palace) return { score: 0, catCount: 0, hungCount: 0 };

  const monName = palace.mon?.displayShort || palace.mon?.internalName || '';
  const tinhName = palace.star?.displayName || palace.star?.internalName || '';
  const thanName = palace.than?.displayName || palace.than?.internalName || '';

  // Normalize mon name (remove "Môn")
  const monShort = monName.replace(/ Môn$/, '').replace(/Môn$/, '');

  const monInfo = ELEMENT_MEANINGS.mon[monShort];
  const tinhInfo = ELEMENT_MEANINGS.tinh[tinhName];
  const thanInfo = ELEMENT_MEANINGS.than[thanName];

  let catCount = 0;
  let hungCount = 0;
  let score = 0;

  // Môn weight: 3 points
  if (monInfo?.nature === 'cat') { catCount++; score += 3; }
  if (monInfo?.nature === 'hung') { hungCount++; score -= 3; }

  // Tinh weight: 2 points
  if (tinhInfo?.nature === 'cat') { catCount++; score += 2; }
  if (tinhInfo?.nature === 'hung') { hungCount++; score -= 2; }

  // Thần weight: 2 points
  if (thanInfo?.nature === 'cat') { catCount++; score += 2; }
  if (thanInfo?.nature === 'hung') { hungCount++; score -= 2; }

  // Bonus for Trực Phù (quý nhân)
  if (thanName === 'Trực Phù') score += 1;

  // Penalty for Không Vong
  if (palace.isKhongVong) score -= 2;

  return {
    score,
    catCount,
    hungCount,
    mon: monShort,
    tinh: tinhName,
    than: thanName,
    isKhongVong: palace.isKhongVong || false,
  };
}

/**
 * Kiểm tra xem khung giờ có nằm trong tương lai không
 */
function isHourInFuture(hourSlot, currentHour, currentMinute = 0) {
  const { start, end } = hourSlot;
  const currentTime = currentHour + currentMinute / 60;

  // Handle overnight case (Tý: 23h-01h)
  if (start > end) {
    // Currently before midnight
    if (currentTime >= 0 && currentTime < end) {
      return false; // Already in this slot
    }
    if (currentTime >= start) {
      return false; // Already in this slot
    }
    return true;
  }

  // Normal case
  return start > currentTime;
}

/**
 * Tạo verdict text dựa trên score
 */
function getVerdict(scoreInfo) {
  const { catCount, hungCount, score } = scoreInfo;

  if (catCount >= 2 && hungCount === 0) return 'Cát';
  if (catCount >= 2) return 'Khá tốt';
  if (score > 0) return 'Thuận';
  if (hungCount >= 2) return 'Cẩn trọng';
  if (score < -2) return 'Xấu';
  return 'Bình';
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════════

/**
 * calculateFutureGoodHours - Tính các khung giờ tốt trong tương lai
 *
 * @param {Object} displayPalaces - Object chứa data của 9 cung (từ chart)
 * @param {number} currentHour - Giờ hiện tại (0-23)
 * @param {number} currentMinute - Phút hiện tại (0-59)
 * @param {Object} options - Tùy chọn
 * @param {number} options.maxResults - Số kết quả tối đa (default: 4)
 * @param {boolean} options.includeNeutral - Có bao gồm giờ trung bình không (default: false)
 * @returns {Array} Danh sách khung giờ tốt, sorted by score desc
 */
export function calculateFutureGoodHours(displayPalaces, currentHour, currentMinute = 0, options = {}) {
  const { maxResults = 4, includeNeutral = false } = options;

  if (!displayPalaces || typeof displayPalaces !== 'object') {
    return [];
  }

  const results = [];

  // Iterate through all palaces (skip 5 - Trung cung)
  for (const palaceNum of [1, 2, 3, 4, 6, 7, 8, 9]) {
    const palace = displayPalaces[palaceNum] || displayPalaces[String(palaceNum)];
    if (!palace) continue;

    const scoreInfo = scorePalace(palace);
    const hourSlots = PALACE_TO_HOURS[palaceNum] || [];
    const direction = PALACE_DIRECTIONS[palaceNum];

    for (const slot of hourSlots) {
      // Skip past hours
      if (!isHourInFuture(slot, currentHour, currentMinute)) {
        continue;
      }

      // Skip bad hours unless explicitly needed
      if (!includeNeutral && scoreInfo.score < 0) {
        continue;
      }

      results.push({
        palace: palaceNum,
        direction,
        chi: slot.chi,
        hourLabel: slot.label,
        startHour: slot.start,
        score: scoreInfo.score,
        verdict: getVerdict(scoreInfo),
        mon: scoreInfo.mon,
        tinh: scoreInfo.tinh,
        than: scoreInfo.than,
        isKhongVong: scoreInfo.isKhongVong,
        catCount: scoreInfo.catCount,
        hungCount: scoreInfo.hungCount,
      });
    }
  }

  // Sort by score (descending), then by startHour (ascending for tie-breaker)
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // For same score, prefer earlier hour
    const aStart = a.startHour < currentHour ? a.startHour + 24 : a.startHour;
    const bStart = b.startHour < currentHour ? b.startHour + 24 : b.startHour;
    return aStart - bStart;
  });

  return results.slice(0, maxResults);
}

/**
 * formatFutureHoursForPrompt - Format kết quả để inject vào prompt
 *
 * @param {Array} futureHours - Kết quả từ calculateFutureGoodHours
 * @returns {string} Text để inject vào prompt
 */
export function formatFutureHoursForPrompt(futureHours) {
  if (!futureHours || futureHours.length === 0) {
    return '[KHÔNG CÓ KHUNG GIỜ TỐT] Tất cả khung giờ còn lại trong ngày đều không thuận. Nên chờ ngày mai hoặc tìm cách hành động tối giản.';
  }

  const lines = ['[KHUNG GIỜ TỐT TRONG TƯƠNG LAI - ĐÃ ĐƯỢC ENGINE TÍNH SẴN]'];
  lines.push('Đây là các khung giờ tốt còn lại trong ngày, ĐÃ LOẠI BỎ giờ đã qua. AI CHỈ CẦN CHỌN VÀ GIẢI THÍCH, KHÔNG TỰ TÍNH.');
  lines.push('');

  futureHours.forEach((h, i) => {
    const rank = i === 0 ? '🥇 Khung vàng' : i === 1 ? '🥈 Khung bạc' : `#${i + 1}`;
    const kvWarning = h.isKhongVong ? ' ⚠️Không Vong' : '';
    lines.push(
      `${rank}: ${h.hourLabel} (${h.direction}, P${h.palace}) | ${h.mon}+${h.tinh}+${h.than} | ${h.verdict} (${h.score > 0 ? '+' : ''}${h.score})${kvWarning}`
    );
  });

  lines.push('');
  lines.push('Khi trả lời câu hỏi về timing, BẮT BUỘC chọn từ danh sách trên. KHÔNG được bịa giờ khác.');

  return lines.join('\n');
}

/**
 * Quick helper để lấy tất cả trong một lần
 */
export function getFutureHoursContext(displayPalaces, currentHour, currentMinute = 0) {
  const futureHours = calculateFutureGoodHours(displayPalaces, currentHour, currentMinute);
  return {
    futureHours,
    promptText: formatFutureHoursForPrompt(futureHours),
  };
}
