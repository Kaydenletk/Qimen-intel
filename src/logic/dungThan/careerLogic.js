import {
  computeConfidence,
  createFlagEvidence,
  createUsefulGodEvidence,
  makeOutput,
  scoreToSignal,
} from './sharedRules.js';
import { getPrimaryCombo, getComboTopicAdvice } from './flagCombos.js';

const NEGOTIATION_KEYS = new Set(['dam-phan', 'kien-tung']);

function headlineBySignal(signal, isNegotiation) {
  if (isNegotiation) {
    if (signal > 0) return 'Chốt Lợi Thế';
    if (signal < 0) return 'Giữ Thế Phòng Thủ';
    return 'Giữ Nhịp Đàm Phán';
  }
  if (signal > 0) return 'Đẩy Nhịp Thăng Tiến';
  if (signal < 0) return 'Giảm Rủi Ro Sự Nghiệp';
  return 'Chỉnh Đội Hình Trước Khi Tiến';
}

export function buildCareerInsight(context, topicKey) {
  const isNegotiation = NEGOTIATION_KEYS.has(topicKey);
  const combo = getPrimaryCombo(context.flags);
  const comboAdvice = combo ? getComboTopicAdvice(combo.id, topicKey || 'su-nghiep') : null;
  let rawScore = context.topicResult?.score || 0;

  if (context.deity === 'Trực Phù') rawScore += 3;
  if (['Khai', 'Sinh', 'Cảnh'].includes(context.door)) rawScore += 3;
  if (context.door === 'Kinh' && !isNegotiation) rawScore -= 4;
  if (context.flags.DOOR_COMPELLING) rawScore += 1;

  if (combo) {
    rawScore += combo.scoreAdjust;
  } else {
    if (context.flags.VOID) rawScore -= 8;
    if (context.flags.FU_YIN || context.flags.FAN_YIN) rawScore -= 4;
  }

  let scoreSignal = scoreToSignal(rawScore);
  if (combo && (combo.severity === 'critical' || combo.severity === 'high')) scoreSignal = -1;
  const confidenceCalc = computeConfidence(context.flags);
  const flagEvidence = createFlagEvidence(context.flags);

  const headline = comboAdvice ? comboAdvice.headline : headlineBySignal(scoreSignal, isNegotiation);
  const coreMessage = comboAdvice
    ? `Cung ${context.usefulPalaceNum} (${context.palaceName}): ${comboAdvice.coreMessage}`
    : context.flags.VOID
    ? `Cung ${context.usefulPalaceNum} (${context.palaceName}) đang dính Không Vong; cam kết công việc hoặc điều khoản rất dễ rỗng, cần xác minh trước khi dồn lực.`
    : isNegotiation
    ? `Giữ trọng tâm mục tiêu tại ${context.direction}, nói ngắn và khóa điều khoản.`
    : `Tập trung cung ${context.usefulPalaceNum} (${context.palaceName}) để tăng xác suất kết quả.`;
  const narrative = combo
    ? `${combo.label}: ${comboAdvice?.coreMessage || combo.conflictHint}`
    : context.flags.VOID
    ? `Không Vong đang bật, nên lời hứa về vai trò, deadline hoặc điều khoản có thể chưa có nền thật. Đây không phải lúc để tin miệng và đẩy toàn lực; phải yêu cầu mốc thời gian và xác nhận rõ ràng.`
    : isNegotiation
    ? `Thần ${context.deity || '—'} và Môn ${context.door || '—'} đang tạo thế thương lượng ${scoreSignal > 0 ? 'có lợi' : scoreSignal < 0 ? 'dễ hở sườn' : 'trung tính'}.`
    : `Môn ${context.door || '—'} phối hợp Sao ${context.star || '—'} cho thấy nhịp sự nghiệp ${scoreSignal > 0 ? 'thuận mở rộng' : scoreSignal < 0 ? 'nên giảm tốc' : 'cần thêm chuẩn bị'}.`;

  const doList = comboAdvice
    ? [comboAdvice.doHint, 'Yêu cầu xác nhận bằng văn bản', 'Giữ phương án B rõ ràng']
    : isNegotiation
    ? ['Chốt mục tiêu chính trước', 'Yêu cầu xác nhận điều khoản bằng văn bản', 'Giữ một phương án B rõ ràng']
    : ['Ưu tiên 1 nhiệm vụ tạo điểm số cao nhất', 'Báo cáo ngắn gọn theo số liệu', 'Đẩy lịch họp quan trọng vào khung giờ ổn'];
  const avoidList = comboAdvice
    ? [comboAdvice.avoidHint, 'Cam kết quá mức năng lực hiện tại']
    : isNegotiation
    ? ['Nói lan man vượt phạm vi', 'Nhượng bộ khi chưa chốt lợi ích']
    : ['Nhảy nhiều ưu tiên cùng lúc', 'Cam kết quá mức năng lực hiện tại'];

  const usefulGodEvidence = createUsefulGodEvidence({
    ...context,
    scoreSignal,
  });

  return makeOutput({
    scoreSignal,
    confidenceCalc,
    headline,
    coreMessage,
    narrative,
    doList,
    avoidList,
    usefulGodEvidence,
    flagEvidence,
    markersForAI: context.markersForAI,
    nguHanhRelation: context.nguHanhRelation,
  });
}
