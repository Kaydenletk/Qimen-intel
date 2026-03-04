import {
  computeConfidence,
  createFlagEvidence,
  createUsefulGodEvidence,
  makeOutput,
  scoreToSignal,
} from './sharedRules.js';

export function buildWealthInsight(context) {
  let rawScore = context.topicResult?.score || 0;
  const hardRisk = context.flags.VOID || context.flags.FU_YIN || context.flags.FAN_YIN;

  if (['Sinh', 'Khai'].includes(context.door)) rawScore += 3;
  if (context.deity === 'Lục Hợp' || context.deity === 'Cửu Thiên') rawScore += 2;
  if (context.deity === 'Bạch Hổ' && context.door === 'Sinh') rawScore -= 6;
  if (context.deity === 'Đằng Xà' || context.door === 'Tử') rawScore -= 4;
  if (['Mậu', 'Kỷ'].includes(context.heavenStem) && context.flags.VOID) rawScore -= 4;
  if (hardRisk) rawScore -= 2;

  const scoreSignal = scoreToSignal(rawScore);
  const confidenceCalc = computeConfidence(context.flags);
  const flagEvidence = createFlagEvidence(context.flags);

  const headline = scoreSignal > 0
    ? 'Tăng Trưởng Có Kỷ Luật'
    : scoreSignal < 0
      ? 'Phòng Thủ Cắt Rò Rỉ'
      : 'Giữ Lực Quan Sát';
  const coreMessage = scoreSignal > 0
    ? `Hướng ${context.direction} có cửa tăng trưởng, ưu tiên lệnh nhỏ và kiểm soát nhịp.`
    : scoreSignal < 0
      ? `Rủi ro tại cung ${context.usefulPalaceNum}; ưu tiên bảo toàn vốn trước khi mở rộng.`
      : `Thị trường ở trạng thái trung tính, tập trung quản trị rủi ro.`;

  const narrative = [
    `Môn ${context.door || '—'} đi cùng Thần ${context.deity || '—'} tại ${context.direction}.`,
    hardRisk ? 'Cờ nhiễu đang bật, cần giảm khối lượng quyết định.' : 'Không có cờ nhiễu nặng tại cung dụng thần.',
  ].join(' ');

  const doList = [
    'Chia nhỏ quyết định theo từng nhịp.',
    'Đặt ngưỡng dừng lỗ/chốt lời trước khi vào lệnh.',
    'Ưu tiên tài sản có thanh khoản cao.',
  ];
  const avoidList = [
    'All-in theo cảm xúc.',
    'Kéo dài một vị thế đang sai.',
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
    disclaimer: 'Thông tin chỉ mang tính tham khảo chiến lược, không phải khuyến nghị đầu tư.',
  });
}
