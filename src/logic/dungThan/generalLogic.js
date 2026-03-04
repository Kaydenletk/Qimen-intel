import {
  computeConfidence,
  createFlagEvidence,
  createUsefulGodEvidence,
  makeOutput,
  scoreToSignal,
} from './sharedRules.js';

export function buildGeneralInsight(context) {
  const rawScore = context.topicResult?.score || 0;
  const scoreSignal = scoreToSignal(rawScore);
  const confidenceCalc = computeConfidence(context.flags);
  const flagEvidence = createFlagEvidence(context.flags);

  const headline = scoreSignal > 0 ? 'Tiến Từng Nhịp' : scoreSignal < 0 ? 'Giữ Thế An Toàn' : 'Quan Sát Có Kỷ Luật';
  const coreMessage = `Tập trung hướng ${context.direction}, cung ${context.usefulPalaceNum} (${context.palaceName}).`;
  const narrative = `Dựa trên ${context.door || 'Môn'} · ${context.star || 'Tinh'} · ${context.deity || 'Thần'}, hệ thống đánh giá trạng thái ${scoreSignal > 0 ? 'thuận' : scoreSignal < 0 ? 'cản' : 'trung tính'}.`;

  const doList = [
    'Giữ quyết định trong phạm vi kiểm soát.',
    'Theo dõi tín hiệu mới trước khi mở rộng.',
    'Chốt lại ưu tiên quan trọng nhất trong ngày.',
  ];
  const avoidList = [
    'Đổi chiến lược liên tục.',
    'Bỏ qua cảnh báo nhỏ.',
  ];

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
  });
}
