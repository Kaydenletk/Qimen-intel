import {
  computeConfidence,
  createFlagEvidence,
  createUsefulGodEvidence,
  makeOutput,
  scoreToSignal,
} from './sharedRules.js';
import { getPrimaryCombo, getComboTopicAdvice } from './flagCombos.js';

export function buildPropertyInsight(context) {
  const combo = getPrimaryCombo(context.flags);
  const comboAdvice = combo ? getComboTopicAdvice(combo.id, 'bat-dong-san') : null;
  let rawScore = context.topicResult?.score || 0;

  if (['Sinh', 'Khai'].includes(context.door)) rawScore += 4;
  if (context.deity === 'Cửu Địa' || context.deity === 'Lục Hợp') rawScore += 3;
  if (context.deity === 'Thái Âm') rawScore += 2;
  if (context.star === 'Phụ' || context.star === 'Tâm') rawScore += 2;
  if (context.flags.VOID) rawScore -= 8;
  if (context.flags.FU_YIN || context.flags.FAN_YIN) rawScore -= 3;
  if (context.door === 'Tử' || context.deity === 'Câu Trận') rawScore -= 4;

  if (combo) rawScore += combo.scoreAdjust;

  let scoreSignal = scoreToSignal(rawScore);
  if (combo && (combo.severity === 'critical' || combo.severity === 'high')) scoreSignal = -1;
  else if (context.flags.VOID && scoreSignal > 0) scoreSignal = -1;

  const confidenceCalc = computeConfidence(context.flags);
  const flagEvidence = createFlagEvidence(context.flags);

  const headline = comboAdvice
    ? comboAdvice.headline
    : scoreSignal > 0
      ? 'Rà Hồ Sơ Để Chốt'
      : scoreSignal < 0
        ? 'Khoá Giao Dịch Để Soi Lại'
        : 'Giữ Deal Trong Tầm Quan Sát';
  const coreMessage = comboAdvice
    ? `Cung ${context.usefulPalaceNum} (${context.palaceName}): ${comboAdvice.coreMessage}`
    : context.flags.VOID
      ? `Cung ${context.usefulPalaceNum} (${context.palaceName}) đang dính Không Vong; hồ sơ, tiến độ hoặc lời hứa từ bên kia chưa đủ thật để xuống cọc.`
      : scoreSignal > 0
        ? `Hướng ${context.direction} có cửa giao dịch, nhưng phải đi qua lớp kiểm pháp lý và người đứng tên thật sạch.`
        : scoreSignal < 0
          ? `Giao dịch ở ${context.direction} còn điểm nghẽn; ưu tiên soi hồ sơ, quy hoạch và lịch cọc trước khi bước thêm.`
          : `Nhà đất đang ở vùng lưng chừng; hợp rà pháp lý hơn là chốt vội.`;
  const narrative = combo
    ? `${combo.label}: ${comboAdvice?.narrative || comboAdvice?.coreMessage || combo.conflictHint}`
    : `Môn ${context.door || '—'} cho biết trạng thái giao dịch, Sao ${context.star || '—'} nói về chất lượng hồ sơ và Thần ${context.deity || '—'} cho biết ai đang giữ lợi thế trên bàn. ${context.flags.VOID ? 'Không Vong khiến giấy tờ hoặc tiến độ dễ bị hụt nhịp.' : 'Nếu hồ sơ sạch và người đại diện đủ chắc, cung này vẫn có thể đi tiếp.'}`;

  const doList = comboAdvice
    ? [comboAdvice.doHint, 'Kiểm tra pháp lý, người đứng tên và tiến độ thật', 'Giữ phương án cọc/giải ngân theo từng bước']
    : [
        'Kiểm tra pháp lý, quy hoạch, người đứng tên và tình trạng thế chấp trước.',
        'Chia giao dịch thành các mốc kiểm chứng: xem thực địa, rà giấy tờ, rồi mới tính tới cọc.',
        'Luôn giữ một điều kiện thoát deal nếu dữ kiện gốc thay đổi.',
      ];
  const avoidList = comboAdvice
    ? [comboAdvice.avoidHint, 'Chốt deal chỉ vì bị ép thời gian']
    : [
        'Đặt cọc khi hồ sơ hoặc dòng tiền bên kia chưa sáng.',
        'Tin hoàn toàn vào lời môi giới mà bỏ qua bước tự xác minh.',
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
