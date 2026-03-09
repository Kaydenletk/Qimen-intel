import {
  computeConfidence,
  createFlagEvidence,
  createUsefulGodEvidence,
  makeOutput,
  scoreToSignal,
} from './sharedRules.js';
import { getPrimaryCombo, getComboTopicAdvice } from './flagCombos.js';

const PALACE_HEALTH_MAP = {
  1: { bodyZone: 'Thận - Tiết niệu', department: 'Thận - Tiết niệu' },
  2: { bodyZone: 'Tỳ vị - Tiêu hóa', department: 'Tiêu hóa' },
  3: { bodyZone: 'Gan - Gân cơ', department: 'Gan mật' },
  4: { bodyZone: 'Mật - Thần kinh thực vật', department: 'Gan mật' },
  5: { bodyZone: 'Trung tâm chuyển hóa', department: 'Nội tổng quát' },
  6: { bodyZone: 'Phổi - Hô hấp', department: 'Hô hấp' },
  7: { bodyZone: 'Miệng - Tai mũi họng', department: 'Tai Mũi Họng' },
  8: { bodyZone: 'Dạ dày - Cột sống', department: 'Tiêu hóa' },
  9: { bodyZone: 'Tim mạch - Huyết áp', department: 'Tim mạch' },
};

const STEM_HEALTH_HINT = {
  Giáp: 'gan',
  Ất: 'gan',
  Bính: 'tim mạch',
  Đinh: 'tim mạch',
  Mậu: 'tỳ vị - tiêu hóa',
  Kỷ: 'tỳ vị - tiêu hóa',
  Canh: 'phổi',
  Tân: 'phổi',
  Nhâm: 'thận',
  Quý: 'thận',
};

export function getPalaceMapping(palaceNum) {
  return PALACE_HEALTH_MAP[palaceNum] || PALACE_HEALTH_MAP[5];
}

export function getStemMapping(stem) {
  return STEM_HEALTH_HINT[stem] || 'nội tổng quát';
}

export function evaluateDoctor(context) {
  const hasMedicalStar = ['Tâm', 'Nhâm'].includes(context.star);
  const hasRecoveryDoor = ['Sinh', 'Hưu', 'Khai'].includes(context.door);
  const hasHardRisk = context.flags.VOID || context.flags.FU_YIN || context.flags.FAN_YIN;
  const clarity = (hasMedicalStar && hasRecoveryDoor && !hasHardRisk) || (hasRecoveryDoor && !hasHardRisk);

  return {
    clarity,
    recommendation: clarity
      ? 'Giờ này đi khám dễ ra kết quả rõ.'
      : 'Nên chuẩn bị checklist triệu chứng để tránh kết quả nhiễu.',
  };
}

export function buildHealthInsight(context) {
  const combo = getPrimaryCombo(context.flags);
  const comboAdvice = combo ? getComboTopicAdvice(combo.id, 'suc-khoe') : null;
  let rawScore = context.topicResult?.score || 0;

  if (context.star === 'Tâm' || context.door === 'Sinh') rawScore += 4;
  if (context.flags.DOOR_COMPELLING || context.flags.PALACE_COMPELLING) rawScore += 1;

  if (combo) {
    rawScore += combo.scoreAdjust;
  } else {
    if (context.door === 'Tử' || context.flags.VOID || context.flags.FAN_YIN) rawScore -= 5;
  }

  let scoreSignal = scoreToSignal(rawScore);
  if (combo && (combo.severity === 'critical' || combo.severity === 'high')) scoreSignal = -1;
  const confidenceCalc = computeConfidence(context.flags);
  const flagEvidence = createFlagEvidence(context.flags);

  const palaceMap = getPalaceMapping(context.usefulPalaceNum);
  const stemHint = getStemMapping(context.heavenStem) || getStemMapping(context.earthStem);
  const doctorEval = evaluateDoctor(context);

  let urgency = 'LOW';
  if (scoreSignal < 0) urgency = 'MED';
  if (context.door === 'Tử' || context.flags.FAN_YIN || context.flags.FU_YIN) urgency = 'HIGH';
  if (combo && combo.severity === 'critical') urgency = 'CRITICAL';

  let recommendedDepartment = palaceMap.department;
  if (context.star === 'Nhuế' && context.palaceName === 'Khôn') {
    recommendedDepartment = 'Tiêu hóa';
  }
  if (['Mậu', 'Kỷ'].includes(context.heavenStem) || ['Mậu', 'Kỷ'].includes(context.earthStem)) {
    recommendedDepartment = 'Tiêu hóa';
  }

  const headline = scoreSignal > 0 ? 'Ổn Định Theo Dõi' : scoreSignal < 0 ? 'Khám Sớm Có Kỷ Luật' : 'Kiểm Tra Chủ Động';
  const coreMessage = `Ưu tiên ${recommendedDepartment.toLowerCase()} tại hướng ${context.direction}.`;
  const narrative = [
    `Cung ${context.usefulPalaceNum} (${context.palaceName}) báo hiệu trục ${palaceMap.bodyZone}.`,
    `Thiên can nghiêng về ${stemHint}; ${doctorEval.recommendation}`,
    `Mức khẩn: ${urgency}.`,
  ].join(' ');

  const doList = [
    `Đặt lịch ${recommendedDepartment.toLowerCase()} trong 24-72h.`,
    'Ghi nhật ký triệu chứng theo mốc giờ.',
    'Mang theo xét nghiệm/thuốc đang dùng.',
  ];

  const avoidList = [
    'Tự chẩn đoán và đổi thuốc liên tục.',
    'Trì hoãn khi triệu chứng tăng nhanh.',
  ];

  const usefulGodEvidence = createUsefulGodEvidence({
    ...context,
    scoreSignal,
  });
  usefulGodEvidence.push({
    type: 'Medical',
    name: recommendedDepartment,
    palaceNum: context.usefulPalaceNum,
    state: urgency,
  });

  const output = makeOutput({
    scoreSignal,
    confidenceCalc,
    headline,
    coreMessage,
    narrative,
    doList,
    avoidList,
    usefulGodEvidence,
    flagEvidence,
    disclaimer: 'Thông tin chỉ mang tính tham khảo chiến lược, không thay thế tư vấn bác sĩ.',
    markersForAI: context.markersForAI,
    nguHanhRelation: context.nguHanhRelation,
  });

  output.recommendedDepartment = recommendedDepartment;
  output.urgency = urgency;
  return output;
}
