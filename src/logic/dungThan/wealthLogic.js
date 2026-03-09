import {
  computeConfidence,
  createFlagEvidence,
  createUsefulGodEvidence,
  makeOutput,
  scoreToSignal,
} from './sharedRules.js';
import { getPrimaryCombo, getComboTopicAdvice } from './flagCombos.js';
import { BAT_MON_DIABAN, CONTROLS } from '../../core/tables.js';

function getDoorElement(door) {
  const entry = Object.values(BAT_MON_DIABAN).find(item => item.short === door || item.name === door);
  return entry?.element || '';
}

function detectInvestmentRhythm(context, combo) {
  const shortReasons = [];
  const longReasons = [];
  const defensiveReasons = [];

  if (context.flags.VOID) defensiveReasons.push('Không Vong làm dòng tiền hụt thực');
  if (context.flags.FU_YIN) defensiveReasons.push('Phục Ngâm khóa nhịp, vốn kẹt');
  if (context.flags.FAN_YIN) shortReasons.push('Phản Ngâm báo nhịp quay xe rất nhanh');
  if (context.flags.DICH_MA) shortReasons.push('Dịch Mã ép nhịp phản ứng và chốt nhanh');

  if (context.door === 'Khai') shortReasons.push('Khai Môn hợp mở vị thế nhanh, đánh theo setup rõ');
  if (context.door === 'Kinh') shortReasons.push('Kinh Môn báo biến động mạnh, chỉ hợp đánh có kỷ luật');
  if (context.door === 'Sinh') longReasons.push('Sinh Môn hợp nuôi lợi nhuận và giữ vị thế có nền');
  if (context.door === 'Đỗ') longReasons.push('Đỗ Môn hợp gom ngầm và tích lũy kiên nhẫn');
  if (context.door === 'Thương' || context.door === 'Tử') defensiveReasons.push(`${context.door} Môn kéo rủi ro sát vốn`);

  if (context.star === 'Xung') shortReasons.push('Thiên Xung thiên về đánh nhanh, ra quyết định dứt');
  if (context.star === 'Anh') shortReasons.push('Thiên Anh đẩy nhịp giá sáng mạnh nhưng nóng');
  if (context.star === 'Nhâm') longReasons.push('Thiên Nhậm thiên về chịu đựng, hợp giữ thế dài');
  if (context.star === 'Phụ') longReasons.push('Thiên Phụ hợp cách đi bài bản, dựa vào thesis');
  if (context.star === 'Tâm') longReasons.push('Thiên Tâm hợp chiến lược vào lệnh có kịch bản');

  if (context.deity === 'Cửu Địa') longReasons.push('Cửu Địa ưu tiên tích sản chắc nền');
  if (context.deity === 'Thái Âm') longReasons.push('Thái Âm hợp tích lũy âm thầm và giữ bài');
  if (context.deity === 'Lục Hợp') longReasons.push('Lục Hợp cho nhịp giữ vị thế ổn định hơn lướt nóng');
  if (context.deity === 'Cửu Thiên') shortReasons.push('Cửu Thiên đẩy cục diện đi rất nhanh');
  if (context.deity === 'Bạch Hổ' || context.deity === 'Đằng Xà' || context.deity === 'Huyền Vũ') {
    defensiveReasons.push(`${context.deity} làm méo dữ liệu hoặc tăng sát thương vốn`);
  }

  if (combo?.id === 'HORSE_FAN_YIN') shortReasons.push('Combo buộc ưu tiên ngắn hạn, tuyệt đối không gồng dài');
  if (combo?.id === 'HORSE_VOID' || combo?.id === 'VOID_FU_YIN' || combo?.id === 'VOID_FAN_YIN') {
    defensiveReasons.push('Combo rủi ro đang đè lên mọi ý định mở vị thế');
  }

  let mode = 'neutral';
  if (defensiveReasons.length >= 2 || combo?.severity === 'critical' || combo?.id === 'HORSE_VOID' || combo?.id === 'VOID_FAN_YIN') {
    mode = 'defensive';
  } else if (shortReasons.length >= longReasons.length + 1) {
    mode = 'short-term';
  } else if (longReasons.length) {
    mode = 'long-term';
  }

  const summary = mode === 'short-term'
    ? 'Đây là cuộc chiến tốc độ: chỉ hợp lệnh ngắn, mục tiêu rõ, ra vào dứt.'
    : mode === 'long-term'
      ? 'Đây là bài toán kiên nhẫn: hợp tích lũy có thesis, chịu dao động ngắn hạn.'
      : mode === 'defensive'
        ? 'Đây là chế độ phòng thủ: ưu tiên giữ tiền mặt và xác minh thanh khoản.'
        : 'Nhịp tài vận đang lưng chừng, chưa đủ đẹp để all-in theo một kịch bản.';

  return {
    mode,
    summary,
    shortReasons,
    longReasons,
    defensiveReasons,
  };
}

function buildCapitalWarnings(context) {
  const warnings = [];
  const doorElement = getDoorElement(context.door);

  if (context.door === 'Sinh' && doorElement && context.dayStemElement && CONTROLS[doorElement] === context.dayStemElement) {
    warnings.push('Sinh Môn đang ép ngược Nhật Can: lợi nhuận có hình nhưng rất khó thực sự chui vào túi bạn, dễ hụt ở khâu chốt.');
  }

  if (context.capitalPalace?.khongVong || context.capitalFlags?.VOID) {
    warnings.push(`Can Mậu đang rơi vào Không Vong${context.capitalPalaceNum ? ` tại cung ${context.capitalPalaceNum} (${context.capitalPalaceName})` : ''}: vốn nhìn có mà thanh khoản lại nghẽn, tiền mặt không sẵn như tưởng tượng.`);
  }

  return warnings;
}

function headlineByMode(mode, scoreSignal) {
  if (mode === 'defensive') return 'Giữ Tiền Mặt Là Lệnh Sống';
  if (mode === 'short-term') return scoreSignal > 0 ? 'Đánh Nhanh, Chốt Gọn' : 'Lướt Sóng Có Phanh';
  if (mode === 'long-term') return scoreSignal > 0 ? 'Tích Lũy Theo Thesis' : 'Kiên Nhẫn Chờ Vùng Đẹp';
  if (scoreSignal > 0) return 'Tăng Trưởng Có Kỷ Luật';
  if (scoreSignal < 0) return 'Phòng Thủ Cắt Rò Rỉ';
  return 'Giữ Lực Quan Sát';
}

function buildModeCore(context, rhythm, capitalWarnings, scoreSignal) {
  const location = `Cung ${context.usefulPalaceNum} (${context.palaceName})`;
  const profitWarning = capitalWarnings[0] || '';
  const capitalWarning = capitalWarnings[1] || '';

  if (rhythm.mode === 'defensive') {
    return `${location}: ${rhythm.summary}${capitalWarning ? ` ${capitalWarning}` : ''}`;
  }
  if (rhythm.mode === 'short-term') {
    return `${location}: ${rhythm.summary} Ưu tiên thanh khoản nhanh, không biến vị thế ngắn hạn thành lời thề dài hạn.${profitWarning ? ` ${profitWarning}` : ''}`;
  }
  if (rhythm.mode === 'long-term') {
    return `${location}: ${rhythm.summary} Nếu giải ngân thì phải theo nhịp tích lũy nhiều đợt, không chase giá.${capitalWarning ? ` ${capitalWarning}` : ''}`;
  }
  if (scoreSignal > 0) {
    return `${location}: có cửa sinh lời nhưng vẫn phải giao dịch theo kỷ luật, không được bỏ stop hoặc phóng tay quá sức.`;
  }
  if (scoreSignal < 0) {
    return `${location}: rủi ro đang lớn hơn biên lợi nhuận kỳ vọng, nên giảm khối lượng trước khi nghĩ tới mở rộng vị thế.`;
  }
  return `${location}: thị trường đang trung tính, phù hợp quan sát hơn là hành động lớn.`;
}

export function buildWealthInsight(context) {
  const combo = getPrimaryCombo(context.flags);
  const comboAdvice = combo ? getComboTopicAdvice(combo.id, context.topicKey || 'tai-van') : null;
  let rawScore = context.topicResult?.score || 0;

  if (context.door === 'Sinh') rawScore += 4;
  if (context.door === 'Khai') rawScore += 3;
  if (context.door === 'Hưu') rawScore += 1;
  if (context.deity === 'Lục Hợp' || context.deity === 'Cửu Thiên') rawScore += 2;
  if (context.star === 'Tâm' || context.star === 'Phụ') rawScore += 2;
  if (context.star === 'Nhâm') rawScore += 1;
  if (context.deity === 'Bạch Hổ' && context.door === 'Sinh') rawScore -= 6;
  if (context.deity === 'Đằng Xà' || context.door === 'Tử' || context.door === 'Thương') rawScore -= 4;
  if (['Mậu', 'Kỷ'].includes(context.heavenStem) && context.flags.VOID) rawScore -= 4;

  if (combo) {
    rawScore += combo.scoreAdjust;
  } else {
    if (context.flags.VOID) rawScore -= 8;
    if (context.flags.FU_YIN || context.flags.FAN_YIN) rawScore -= 3;
  }

  const rhythm = detectInvestmentRhythm(context, combo);
  const capitalWarnings = buildCapitalWarnings(context);

  if (rhythm.mode === 'short-term') rawScore += 1;
  if (rhythm.mode === 'long-term') rawScore += 1;
  if (rhythm.mode === 'defensive') rawScore -= 3;
  if (capitalWarnings.length) rawScore -= Math.min(4, capitalWarnings.length * 2);

  let scoreSignal = scoreToSignal(rawScore);
  if (combo && (combo.severity === 'critical' || combo.severity === 'high')) scoreSignal = -1;
  else if (context.flags.VOID && scoreSignal > 0) scoreSignal = -1;
  else if (rhythm.mode === 'defensive' && scoreSignal > 0) scoreSignal = 0;

  const confidenceCalc = computeConfidence(context.flags);
  const flagEvidence = createFlagEvidence(context.flags);

  const headline = comboAdvice
    ? comboAdvice.headline
    : headlineByMode(rhythm.mode, scoreSignal);
  const coreMessage = comboAdvice
    ? `Cung ${context.usefulPalaceNum} (${context.palaceName}): ${comboAdvice.coreMessage}`
    : buildModeCore(context, rhythm, capitalWarnings, scoreSignal);

  const narrative = [
    `Môn ${context.door || '—'} đang giữ vai trò nhịp giao dịch, Sao ${context.star || '—'} cho biết thị trường hợp đánh tốc độ hay giữ thesis, còn Thần ${context.deity || '—'} quyết định bạn có được chống lưng để giữ vị thế hay không.`,
    `Phân loại nhịp: ${rhythm.summary} ${rhythm.shortReasons[0] ? `Tín hiệu nhanh nhất là ${rhythm.shortReasons[0].toLowerCase()}.` : ''}${rhythm.longReasons[0] ? ` Tín hiệu giữ dài nằm ở ${rhythm.longReasons[0].toLowerCase()}.` : ''}${rhythm.defensiveReasons[0] ? ` Rào chắn lớn nhất là ${rhythm.defensiveReasons[0].toLowerCase()}.` : ''}`,
    combo
      ? `${combo.label}: ${comboAdvice?.narrative || comboAdvice?.coreMessage || combo.conflictHint}`
      : capitalWarnings.length
        ? capitalWarnings.join(' ')
        : context.flags.VOID
          ? 'Không Vong đang bật: đây không phải môi trường để hưng phấn đuổi giá. Nếu chưa thấy tiền thật, khớp lệnh thật, thanh khoản thật thì coi như chưa có gì.'
          : 'Chưa có combo cờ xấu đè trận, nên mọi hành động phải xoay quanh kỷ luật vốn và kịch bản đã viết trước khi bấm nút.',
  ].join(' ');

  const doList = comboAdvice
    ? [
        comboAdvice.doHint,
        'Viết trước điểm vào, điểm ra và mức lỗ chịu được.',
        'Giữ nhật ký giao dịch để xem mình đang đánh nhanh hay tích lũy đúng thesis.',
      ]
    : rhythm.mode === 'short-term'
      ? [
          'Chỉ dùng vị thế nhỏ, chốt lời ngay khi đạt mục tiêu; không biến lệnh nhanh thành khoản giữ dài hạn.',
          'Đặt stop rõ trước khi vào lệnh, nếu sai nhịp thì thoát ngay.',
          'Ưu tiên mã/tài sản có thanh khoản thật và spread gọn.',
        ]
      : rhythm.mode === 'long-term'
        ? [
            'Giải ngân theo nhiều nhịp, dựa trên thesis và vùng giá chấp nhận được.',
            'Giữ một phần tiền mặt để mua tiếp khi thesis còn đúng nhưng giá rung mạnh.',
            'Đánh giá lại thesis theo quý, không để tin ngắn hạn bẻ gãy kế hoạch dài hạn.',
          ]
        : [
            'Giữ tiền mặt là trục chính, chỉ quan sát hoặc test rất nhỏ.',
            'Xác minh dòng tiền, thanh khoản và dữ liệu gốc trước khi nghĩ tới giải ngân.',
            'Nếu đã có vị thế, ưu tiên giảm rủi ro hơn là cố vớt thêm lợi nhuận.',
          ];

  const avoidList = comboAdvice
    ? [
        comboAdvice.avoidHint,
        'Biến một nhận định nhanh thành cam kết vốn quá lớn.',
      ]
    : rhythm.mode === 'short-term'
      ? [
          'Gồng lỗ hoặc ôm qua đêm chỉ vì tiếc một lệnh đã sai.',
          'Nhầm nhịp trading thành câu chuyện đầu tư dài hạn.',
        ]
      : rhythm.mode === 'long-term'
        ? [
            'FOMO theo nến ngắn hoặc đổi thesis chỉ vì một nhịp rung.',
            'Dồn hết vốn vào một lần giải ngân duy nhất.',
          ]
        : [
            'Xuống tiền lớn khi thanh khoản, dữ kiện hoặc lời hứa còn rỗng.',
            'Tin vào cú đảo chiều đẹp trên màn hình mà bỏ qua xác nhận thực tế.',
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
    markersForAI: context.markersForAI,
    nguHanhRelation: context.nguHanhRelation,
  });
}
