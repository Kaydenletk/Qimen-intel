import {
  makeOutput,
  scoreToSignal,
  computeConfidence,
} from './sharedRules.js';
import { getPrimaryCombo, getComboTopicAdvice } from './flagCombos.js';

const FLAG_SEVERITY = {
  VOID: 'medium',
  GRAVE: 'high',
  FU_YIN: 'high',
  FAN_YIN: 'high',
  DOOR_COMPELLING: 'medium',
  PALACE_COMPELLING: 'medium',
  DICH_MA: 'info',
};

function buildUsefulGodEvidence(context, scoreSignal) {
  return [
    {
      type: 'Door',
      name: context.door || '—',
      palaceNum: context.usefulPalaceNum,
      state: scoreSignal > 0 ? 'thuận' : scoreSignal < 0 ? 'cản' : 'trung tính',
    },
    {
      type: 'Star',
      name: context.star || '—',
      palaceNum: context.usefulPalaceNum,
      state: scoreSignal > 0 ? 'thuận' : scoreSignal < 0 ? 'cản' : 'trung tính',
    },
    {
      type: 'Deity',
      name: context.deity || '—',
      palaceNum: context.usefulPalaceNum,
      state: scoreSignal > 0 ? 'thuận' : scoreSignal < 0 ? 'cản' : 'trung tính',
    },
  ];
}

function buildFlagEvidence(flags = {}) {
  return Object.entries(flags)
    .filter(([, active]) => Boolean(active))
    .map(([name]) => ({
      name,
      severity: FLAG_SEVERITY[name] || 'info',
    }));
}

export function buildStudyInsight(context) {
  const combo = getPrimaryCombo(context.flags);
  const comboAdvice = combo ? getComboTopicAdvice(combo.id, context.topicKey || 'hoc-tap') : null;
  let rawScore = context.topicResult?.score || 0;

  if (context.door === 'Cảnh') rawScore += 4;
  if (context.star === 'Thiên Phụ' || context.star === 'Phụ') rawScore += 3;
  if (context.deity === 'Cửu Thiên') rawScore += 2;

  // Combo-aware scoring: use combo scoreAdjust, skip individual flag adjustments
  if (combo) {
    rawScore += combo.scoreAdjust;
  } else {
    if (context.flags.DICH_MA) rawScore += 3;
    if (context.flags.VOID) rawScore -= 10;
    if (context.flags.FU_YIN || context.flags.FAN_YIN) rawScore -= 3;
  }

  let scoreSignal = scoreToSignal(rawScore);
  if (combo && (combo.severity === 'critical' || combo.severity === 'high')) scoreSignal = -1;
  else if (context.flags.VOID && scoreSignal > 0) scoreSignal = -1;
  const confidenceCalc = computeConfidence(context.flags);
  const usefulGodEvidence = buildUsefulGodEvidence(context, scoreSignal);
  const flagEvidence = buildFlagEvidence(context.flags);

  const headline = comboAdvice
    ? comboAdvice.headline
    : scoreSignal > 0
    ? 'Vào Guồng Học Tập'
    : scoreSignal < 0
      ? 'Rà Lại Lỗ Hổng Kiến Thức'
      : 'Ổn Nhịp Ôn Tập';
  const coreMessage = comboAdvice
    ? `Cung ${context.usefulPalaceNum} (${context.palaceName}): ${comboAdvice.coreMessage}`
    : context.flags.VOID
    ? `Cung ${context.usefulPalaceNum} (${context.palaceName}) đang dính Không Vong; đề cương hoặc thông báo có thể còn là lời hứa suông, chưa nên đặt cược hết nhịp ôn vào đó.`
    : scoreSignal > 0
    ? `Cung ${context.usefulPalaceNum} (${context.palaceName}) đang đỡ cho việc học; ưu tiên ôn theo trục ${context.direction}.`
    : scoreSignal < 0
      ? `Việc học tại ${context.direction} đang có điểm nghẽn; cần sửa lỗ hổng trước khi tăng tốc.`
      : `Nhịp học đang trung tính; giữ lịch ôn đều và kiểm tra lại nền tảng.`;
  const narrative = [
    `Môn ${context.door || '—'} cho thấy trạng thái tiếp thu hiện tại, Sao ${context.star || '—'} phản ánh chất lượng tài liệu và cách học.`,
    `Thần ${context.deity || '—'} quyết định nhịp thi cử ${scoreSignal > 0 ? 'hanh thông hơn' : scoreSignal < 0 ? 'dễ bị nhiễu hoặc chậm nhịp' : 'ở mức vừa phải'}.`,
    combo
      ? `${combo.label}: ${comboAdvice?.coreMessage || combo.conflictHint}`
      : context.flags.DICH_MA
      ? 'Dịch Mã đang bật, nghĩa là tài liệu hoặc thông báo có thể đến rất nhanh, khá bất ngờ; phải chuẩn bị sẵn để đón đầu thay vì ngồi chờ.'
      : context.flags.VOID
        ? 'Không Vong đang bật, nên tránh học tủ hoặc đặt cược hết vào một dạng đề.'
        : context.flags.FU_YIN
          ? 'Phục Ngâm đang đè nhịp, học mãi một vòng vẫn dễ giậm chân tại chỗ nếu không đổi cách ôn.'
          : context.flags.FAN_YIN
            ? 'Phản Ngâm đang bật, lịch hoặc trọng tâm ôn rất dễ xoay chiều đột ngột nên phải giữ phương án dự phòng.'
            : 'Không có cờ rỗng lớn, có thể bám kế hoạch ôn tập theo từng chặng.',
  ].join(' ');

  const doList = [
    comboAdvice?.doHint
      || (context.flags.DICH_MA
        ? 'Chuẩn bị sẵn bộ note ngắn và khung ôn để xoay ngay khi đề cương hoặc thông báo xuất hiện.'
        : 'Ôn theo đề cương chuẩn và chốt 3 ý trọng tâm mỗi buổi.'),
    'Luyện một vòng câu hỏi hoặc đề mẫu để kiểm tra lỗ hổng.',
    'Giữ lịch học ngắn nhưng đều, ưu tiên môn đang yếu trước.',
  ];
  const avoidList = [
    'Học tủ hoặc nhồi sát giờ thi.',
    comboAdvice?.avoidHint
      || (context.flags.VOID ? 'Dồn hết công sức vào tin đồn hoặc lời hứa chưa kiểm chứng về đề cương.' : 'Đổi hướng theo tin đồn chưa kiểm chứng.'),
    'Đổi phương pháp liên tục khi chưa đo lại hiệu quả.',
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
  });
}
