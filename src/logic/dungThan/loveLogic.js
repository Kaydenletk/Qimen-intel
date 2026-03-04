import {
  computeConfidence,
  createFlagEvidence,
  createUsefulGodEvidence,
  enforceLoveVocabulary,
  makeOutput,
  scoreToSignal,
} from './sharedRules.js';

export function buildLoveInsight(context) {
  let rawScore = context.topicResult?.score || 0;
  if (['Hưu', 'Sinh'].includes(context.door)) rawScore += 3;
  if (['Lục Hợp', 'Thái Âm'].includes(context.deity)) rawScore += 3;
  if (['Tử', 'Kinh'].includes(context.door)) rawScore -= 5;
  if (['Bạch Hổ', 'Đằng Xà', 'Huyền Vũ'].includes(context.deity)) rawScore -= 4;
  if (context.flags.VOID || context.flags.FAN_YIN) rawScore -= 3;

  const scoreSignal = scoreToSignal(rawScore);
  const confidenceCalc = computeConfidence(context.flags);
  const flagEvidence = createFlagEvidence(context.flags);

  const headline = scoreSignal > 0 ? 'Mở Lòng Đúng Nhịp' : scoreSignal < 0 ? 'Giữ Nhịp Tình Cảm' : 'Lắng Nghe Trước Khi Tiến';
  const coreMessage = scoreSignal > 0
    ? `Hướng ${context.direction} phù hợp để tăng kết nối và nói chuyện thẳng thắn.`
    : scoreSignal < 0
      ? `Tránh dồn ép cảm xúc tại giai đoạn này; cần giữ biên an toàn.`
      : `Ưu tiên quan sát phản hồi và điều chỉnh cách giao tiếp.`;
  const narrative = `Môn ${context.door || '—'} cùng Thần ${context.deity || '—'} cho thấy trạng thái quan hệ ${scoreSignal > 0 ? 'dễ hòa hợp' : scoreSignal < 0 ? 'dễ va chạm' : 'chưa rõ nhịp'}.`;

  const doList = [
    'Nói rõ nhu cầu cá nhân bằng ngôn ngữ bình tĩnh.',
    'Hẹn một cuộc trò chuyện không bị ngắt quãng.',
    'Chốt một hành động nhỏ để cùng cải thiện quan hệ.',
  ];
  const avoidList = [
    'Chụp mũ hoặc suy diễn động cơ.',
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
