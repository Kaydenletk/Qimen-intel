import {
  computeConfidence,
  createFlagEvidence,
  createUsefulGodEvidence,
  enforceLoveVocabulary,
  makeOutput,
  scoreToSignal,
} from './sharedRules.js';
import { getPrimaryCombo, getComboTopicAdvice } from './flagCombos.js';

export function buildLoveInsight(context) {
  const combo = getPrimaryCombo(context.flags);
  const comboAdvice = combo ? getComboTopicAdvice(combo.id, 'tinh-duyen') : null;
  let rawScore = context.topicResult?.score || 0;
  if (['Hưu', 'Sinh'].includes(context.door)) rawScore += 3;
  if (['Lục Hợp', 'Thái Âm'].includes(context.deity)) rawScore += 3;
  if (['Tử', 'Kinh'].includes(context.door)) rawScore -= 5;
  if (['Bạch Hổ', 'Đằng Xà', 'Huyền Vũ'].includes(context.deity)) rawScore -= 4;

  if (combo) {
    rawScore += combo.scoreAdjust;
  } else {
    if (context.flags.VOID) rawScore -= 9;
    if (context.flags.FAN_YIN) rawScore -= 4;
  }

  let scoreSignal = scoreToSignal(rawScore);
  if (combo && (combo.severity === 'critical' || combo.severity === 'high')) scoreSignal = -1;
  else if (context.flags.VOID && scoreSignal > 0) scoreSignal = -1;
  const confidenceCalc = computeConfidence(context.flags);
  const flagEvidence = createFlagEvidence(context.flags);

  const headline = comboAdvice
    ? comboAdvice.headline
    : scoreSignal > 0 ? 'Mở Lòng Đúng Nhịp' : scoreSignal < 0 ? 'Giữ Nhịp Tình Cảm' : 'Lắng Nghe Trước Khi Tiến';
  const coreMessage = comboAdvice
    ? `Cung ${context.usefulPalaceNum} (${context.palaceName}): ${comboAdvice.coreMessage}`
    : context.flags.VOID
    ? `Cung ${context.usefulPalaceNum} (${context.palaceName}) đang dính Không Vong; lời hứa hoặc kỳ vọng rất dễ rỗng, cần nhìn hành động thật trước khi tin.`
    : scoreSignal > 0
    ? `Hướng ${context.direction} phù hợp để tăng kết nối và nói chuyện thẳng thắn.`
    : scoreSignal < 0
      ? `Tránh dồn ép cảm xúc tại giai đoạn này; cần giữ biên an toàn.`
      : `Ưu tiên quan sát phản hồi và điều chỉnh cách giao tiếp.`;
  const narrative = combo
    ? `${combo.label}: ${comboAdvice?.coreMessage || combo.conflictHint}`
    : context.flags.VOID
    ? `Môn ${context.door || '—'} cùng Thần ${context.deity || '—'} cho thấy kết nối này đang bị phủ một lớp Không Vong: nghe thì có vẻ hứa hẹn, nhưng rất dễ là ảo ảnh, nói được mà chưa chắc làm được. Nếu chưa có hành động thật, đừng dồn trái tim hay thời gian vào lời nói đẹp.`
    : `Môn ${context.door || '—'} cùng Thần ${context.deity || '—'} cho thấy trạng thái quan hệ ${scoreSignal > 0 ? 'dễ hòa hợp' : scoreSignal < 0 ? 'dễ va chạm' : 'chưa rõ nhịp'}.`;

  const doList = [
    comboAdvice?.doHint || (context.flags.VOID ? 'Quan sát hành động thật thay vì bám vào lời hứa.' : 'Nói rõ nhu cầu cá nhân bằng ngôn ngữ bình tĩnh.'),
    context.flags.VOID ? 'Xác minh lại điều đối phương cam kết bằng mốc thời gian cụ thể.' : 'Hẹn một cuộc trò chuyện không bị ngắt quãng.',
    'Chốt một hành động nhỏ để cùng cải thiện quan hệ.',
  ];
  const avoidList = [
    comboAdvice?.avoidHint || (context.flags.VOID ? 'Tin ngay vào lời hứa đẹp nhưng chưa có việc làm tương ứng.' : 'Chụp mũ hoặc suy diễn động cơ.'),
    'Đưa quyết định cực đoan khi đang nóng.',
  ];

  const usefulGodEvidence = createUsefulGodEvidence({
    ...context,
    scoreSignal,
  });

  return enforceLoveVocabulary(makeOutput({
    scoreSignal,
    confidenceCalc,
    headline,
    coreMessage,
    narrative,
    doList,
    avoidList,
    usefulGodEvidence,
    flagEvidence,
  }));
}
