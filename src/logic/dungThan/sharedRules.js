import { getPrimaryCombo } from './flagCombos.js';

export const CONFIDENCE_BASE = 0.72;

export const FLAG_MULTIPLIERS = {
  VOID: 0.75,
  GRAVE: 0.72,
  FU_YIN: 0.6,
  FAN_YIN: 0.6,
  DOOR_COMPELLING: 0.75,
  PALACE_COMPELLING: 0.75,
  DICH_MA: 1.05,
};

export const FLAG_SEVERITY = {
  VOID: 'medium',
  GRAVE: 'high',
  FU_YIN: 'high',
  FAN_YIN: 'high',
  DOOR_COMPELLING: 'medium',
  PALACE_COMPELLING: 'medium',
  DICH_MA: 'info',
};

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function scoreToSignal(score) {
  if (score >= 8) return 1;
  if (score <= -3) return -1;
  return 0;
}

export function computeConfidence(flags, base = CONFIDENCE_BASE) {
  // Combo-aware: use override multiplier instead of compounding individual flags
  const combo = getPrimaryCombo(flags);
  if (combo) {
    const final = clamp(base * combo.conf, 0.1, 0.99);
    return {
      base,
      multipliers: [{ name: combo.id, value: combo.conf }],
      final: Math.round(final * 1000) / 1000,
    };
  }

  // No combo: compound individual flag multipliers
  const multipliers = [];
  let final = base;

  for (const [name, active] of Object.entries(flags || {})) {
    if (!active) continue;
    if (!FLAG_MULTIPLIERS[name]) continue;
    const multiplier = FLAG_MULTIPLIERS[name];
    final *= multiplier;
    multipliers.push({ name, value: multiplier });
  }

  final = clamp(final, 0.1, 0.99);
  return {
    base,
    multipliers,
    final: Math.round(final * 1000) / 1000,
  };
}

function scoreLabel(scoreSignal) {
  if (scoreSignal > 0) return 'thuận';
  if (scoreSignal < 0) return 'cản';
  return 'trung tính';
}

export function createUsefulGodEvidence(context) {
  return [
    {
      type: 'Door',
      name: context.door || '—',
      palaceNum: context.usefulPalaceNum,
      state: scoreLabel(context.scoreSignal),
    },
    {
      type: 'Star',
      name: context.star || '—',
      palaceNum: context.usefulPalaceNum,
      state: scoreLabel(context.scoreSignal),
    },
    {
      type: 'Deity',
      name: context.deity || '—',
      palaceNum: context.usefulPalaceNum,
      state: scoreLabel(context.scoreSignal),
    },
  ];
}

export function createFlagEvidence(flags) {
  return Object.entries(flags || {})
    .filter(([, active]) => Boolean(active))
    .map(([name]) => ({
      name,
      severity: FLAG_SEVERITY[name] || 'info',
    }));
}

const LOVE_BANNED = ['dòng tiền', 'lợi nhuận', 'đầu tư', 'deal', 'doanh thu', 'all-in', 'hợp đồng'];

export function enforceLoveVocabulary(output) {
  const bucket = [
    output?.headline || '',
    output?.coreMessage || '',
    output?.narrative || '',
    ...(output?.do || []),
    ...(output?.avoid || []),
  ].join(' ').toLowerCase();

  const hasBanned = LOVE_BANNED.some(word => bucket.includes(word));
  if (!hasBanned) return output;

  return {
    ...output,
    score: output.score < 0 ? -1 : 0,
    headline: 'Giữ Nhịp Cảm Xúc',
    coreMessage: 'Tập trung kết nối, tránh kéo căng mâu thuẫn.',
    narrative: 'Năng lượng tình cảm cần sự mềm mỏng và lắng nghe. Hãy ưu tiên đối thoại rõ ràng thay vì ép kết quả nhanh.',
    do: ['Nói rõ nhu cầu thật', 'Lắng nghe trọn câu', 'Giữ nhịp trao đổi bình tĩnh'],
    avoid: ['Đổ lỗi', 'Quyết định nóng'],
  };
}

export function makeOutput({
  scoreSignal,
  confidenceCalc,
  headline,
  coreMessage,
  narrative,
  doList,
  avoidList,
  usefulGodEvidence,
  flagEvidence,
  disclaimer,
}) {
  const output = {
    score: scoreSignal,
    confidence: confidenceCalc.final,
    headline,
    coreMessage,
    narrative,
    do: doList.slice(0, 3),
    avoid: avoidList.slice(0, 2),
    evidence: {
      usefulGods: usefulGodEvidence,
      flags: flagEvidence,
      calc: confidenceCalc,
    },
  };
  if (disclaimer) output.disclaimer = disclaimer;
  return output;
}
