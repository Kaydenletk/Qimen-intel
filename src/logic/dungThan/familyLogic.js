import {
  computeConfidence,
  createFlagEvidence,
  createUsefulGodEvidence,
  makeOutput,
  scoreToSignal,
} from './sharedRules.js';
import { getPrimaryCombo, getComboTopicAdvice } from './flagCombos.js';

export function buildFamilyInsight(context) {
  const combo = getPrimaryCombo(context.flags);
  const comboAdvice = combo ? getComboTopicAdvice(combo.id, 'gia-dao') : null;
  let rawScore = context.topicResult?.score || 0;

  if (context.door === 'Hưu') rawScore += 3;
  if (context.door === 'Thương') rawScore -= 4;
  if (context.door === 'Đỗ') rawScore -= 3;
  if (context.deity === 'Lục Hợp') rawScore += 3;
  if (context.deity === 'Đằng Xà') rawScore -= 4;

  if (combo) {
    rawScore += combo.scoreAdjust;
  } else {
    if (context.flags.VOID) rawScore -= 8;
    if (context.flags.FAN_YIN) rawScore -= 3;
  }

  let scoreSignal = scoreToSignal(rawScore);
  if (combo && (combo.severity === 'critical' || combo.severity === 'high')) scoreSignal = -1;
  const confidenceCalc = computeConfidence(context.flags);
  const flagEvidence = createFlagEvidence(context.flags);
  const usefulGodEvidence = createUsefulGodEvidence({
    ...context,
    scoreSignal,
  });

  const headline = comboAdvice
    ? comboAdvice.headline
    : scoreSignal > 0
    ? 'Nhà Còn Cửa Hòa'
    : scoreSignal < 0
      ? 'Hạ Nhiệt Trong Nhà'
      : 'Giữ Nhịp Gia Đạo';
  const coreMessage = comboAdvice
    ? `${comboAdvice.coreMessage}`
    : context.flags.VOID
    ? `Gia đạo tại ${context.direction} đang dính Không Vong; lời hứa hẹn hoặc điều vừa nghe có thể chưa có nền thật, đừng quyết chuyện lớn khi dữ kiện còn rỗng.`
    : scoreSignal > 0
    ? `Gia đạo tại hướng ${context.direction} vẫn còn cửa ngồi lại nói chuyện và gỡ nút.`
    : scoreSignal < 0
      ? `Không khí gia đình đang dễ chạm tự ái; cần hạ giọng trước khi bàn tiếp việc lớn.`
      : `Thế nhà đang trung tính; ưu tiên giữ nhịp ổn định thay vì ép người khác nhận sai ngay.`;
  const narrative = combo
    ? `${combo.label}: ${comboAdvice?.coreMessage || combo.conflictHint}`
    : context.flags.VOID
    ? `Không Vong đang phủ lên chuyện nhà: điều được hứa hoặc được nghe rất dễ thiếu nền tảng thật, càng vội tin càng dễ thất vọng. Lúc này phải xác minh lại rồi mới quyết chuyện tiền, người hoặc cam kết trong nhà.`
    : scoreSignal > 0
    ? `Môn ${context.door || '—'} và Thần ${context.deity || '—'} cho thấy chuyện nhà vẫn còn sợi dây nối. Nếu có một người đứng ra thu xếp đúng lúc, mâu thuẫn có thể dịu nhanh hơn tưởng tượng.`
    : scoreSignal < 0
      ? `Môn ${context.door || '—'} đang chạm đúng chỗ đau trong gia đạo, còn Thần ${context.deity || '—'} làm câu chuyện dễ bị suy diễn hoặc bật thành chiến tranh lạnh. Càng cố thắng lý lúc này càng làm nhà thêm mệt.`
      : `Gia đạo chưa hẳn xấu nhưng cũng chưa thật êm. Cần người giữ nhịp, nói đúng vấn đề và chừa khoảng nghỉ để người khác tiêu hóa cảm xúc.`;

  const doList = [
    comboAdvice?.doHint || 'Chọn một người đủ uy trong nhà để đứng ra nói chuyện.',
    'Bàn từng vấn đề một, tránh gom hết bực dọc cũ vào cùng một lúc.',
    'Chốt một hành động nhỏ để giảm nhiệt trước khi nói đến chuyện lớn.',
  ];
  const avoidList = [
    comboAdvice?.avoidHint || 'Lôi chuyện cũ ra để thắng lời qua tiếng lại.',
    'Ép người khác xin lỗi khi cảm xúc còn đang bốc.',
  ];

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
