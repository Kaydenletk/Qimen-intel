import {
  BAT_MON_DIABAN,
  BAT_THAN,
  CONTROLS,
  CUU_TINH,
  PALACE_META,
  PRODUCES,
  STEMS_BY_NAME,
} from '../../core/tables.js';
import { describeRoleStance, getTopicRoleLabels } from './roleLabels.js';
import { normalizeLooseVietnameseText } from './textNormalization.js';

const OPPOSITE_PALACE = {
  1: 9,
  2: 8,
  3: 7,
  4: 6,
  6: 4,
  7: 3,
  8: 2,
  9: 1,
};

const GUEST_TOPIC_KEYS = new Set(['dam-phan', 'kien-tung', 'doi-no', 'muu-luoc', 'tai-van', 'kinh-doanh']);
const HOST_HINTS = ['cho', 'doi phan hoi', 'giu the', 'bao toan', 'phong thu', 'an binh', 'quan sat', 'giu vi tri'];
const GUEST_HINTS = [
  'dam phan', 'thuong luong', 'xuong tien', 'co nen mua', 'gap ho', 'goi dien',
  'tan cong', 'ra don', 'chu dong', 'ky', 'doi no', 'kien', 'xu ly',
];

function parseDisplayPalaces(qmdjData = {}) {
  const raw = qmdjData?.displayPalaces || qmdjData?.palaces || {};
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return raw && typeof raw === 'object' ? raw : {};
}

function getPalaceEntry(qmdjData = {}, palaceNum = null) {
  if (!palaceNum) return null;
  const palaces = parseDisplayPalaces(qmdjData);
  return palaces?.[palaceNum] || palaces?.[String(palaceNum)] || null;
}

function pickText(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function resolveDoorMeta(palace = {}) {
  const name = pickText(
    palace?.mon?.name,
    palace?.mon?.displayName,
    palace?.mon?.short,
    palace?.mon?.displayShort,
    palace?.door,
    palace?.doorName
  );
  return Object.values(BAT_MON_DIABAN).find(item => item.name === name || item.short === name) || null;
}

function resolveStarMeta(palace = {}) {
  const name = pickText(
    palace?.star?.name,
    palace?.star?.displayName,
    palace?.star?.short,
    palace?.star?.displayShort,
    palace?.tinh?.name,
    palace?.tinh?.displayName
  );
  return CUU_TINH.find(item => item.name === name || item.short === name) || null;
}

function resolveDeityMeta(palace = {}) {
  const name = pickText(
    palace?.than?.name,
    palace?.than?.displayName,
    palace?.than?.short,
    palace?.than?.displayShort,
    palace?.deity,
    palace?.deityName
  );
  return BAT_THAN.find(item => item.name === name) || null;
}

function resolveHeavenStemName(palace = {}) {
  return pickText(
    palace?.can?.name,
    palace?.can?.displayShort,
    palace?.can,
    palace?.heavenStem,
    palace?.heavenStemName
  );
}

function resolveEarthStemName(palace = {}) {
  return pickText(
    palace?.earthStem,
    palace?.earthStemLabel,
    palace?.diaCan,
    palace?.diaCanName
  );
}

function resolveTargetPalaceNum(qmdjData = {}) {
  const canonical = Number(qmdjData?.selectedTopicCanonicalDungThan?.palaceNum);
  if (Number.isFinite(canonical) && canonical > 0) return canonical;
  const useful = Number(qmdjData?.selectedTopicUsefulPalace);
  if (Number.isFinite(useful) && useful > 0) return useful;
  return null;
}

function resolveDayStemElement(qmdjData = {}) {
  const stemName = pickText(
    qmdjData?.dayPillar?.stem?.displayShort,
    qmdjData?.dayPillar?.stem?.name,
    qmdjData?.dayPillar?.stemName,
    qmdjData?.dayStemName
  );
  return STEMS_BY_NAME[stemName]?.element || qmdjData?.selectedTopicNguHanh?.userElement || '';
}

function relationText(actorLabel, actorElement, palaceElement, palaceLabel, actorType = 'generic') {
  if (!actorElement || !palaceElement) {
    return `${actorLabel} chưa đủ dữ liệu ngũ hành để đối chiếu với ${palaceLabel}.`;
  }
  if (actorElement === palaceElement) {
    return `${actorLabel} (${actorElement}) hòa với ${palaceLabel} (${palaceElement}) — lực không gãy, tác dụng giữ được nền.`;
  }
  if (PRODUCES[actorElement] === palaceElement) {
    return `${actorLabel} (${actorElement}) sinh ${palaceLabel} (${palaceElement}) — tín hiệu này được đất nuôi, dễ lan thành khí chính.`;
  }
  if (PRODUCES[palaceElement] === actorElement) {
    return `${actorLabel} (${actorElement}) được ${palaceLabel} (${palaceElement}) sinh — có đất đỡ lưng nên tác dụng rõ hơn.`;
  }
  if (CONTROLS[actorElement] === palaceElement) {
    return actorType === 'door'
      ? `${actorLabel} (${actorElement}) khắc ${palaceLabel} (${palaceElement}) — đây là Môn Bức: cửa đang ép đất, cát lực giảm hoặc hung lực bùng mạnh hơn bình thường.`
      : `${actorLabel} (${actorElement}) khắc ${palaceLabel} (${palaceElement}) — sao đè đất, tác dụng bị đẩy sang cực đoan hơn.`;
  }
  if (CONTROLS[palaceElement] === actorElement) {
    return `${actorLabel} (${actorElement}) bị ${palaceLabel} (${palaceElement}) khắc — tín hiệu có xuất hiện nhưng khó phát huy hết lực.`;
  }
  return `${actorLabel} (${actorElement}) và ${palaceLabel} (${palaceElement}) không trực tiếp sinh khắc, nên phải đọc thêm theo tổ hợp Môn/Tinh/Thần.`;
}

function shouldUseDirection(topicKey = '', userContext = '') {
  const normalized = normalizeLooseVietnameseText(userContext || '');
  if (['dam-phan', 'kien-tung', 'doi-no', 'xuat-hanh', 'suc-khoe', 'bat-dong-san', 'muu-luoc'].includes(topicKey)) {
    return true;
  }
  return ['gap', 'hop', 'di', 'den', 'goi', 'chua benh', 'xuong tien', 'dau tu'].some(hint => normalized.includes(hint));
}

export function buildRoleStanceContext(qmdjData = {}, userContext = '') {
  const topicKey = qmdjData?.selectedTopicKey || '';
  const normalized = normalizeLooseVietnameseText(userContext || '');
  let guestScore = GUEST_TOPIC_KEYS.has(topicKey) ? 2 : 0;
  let hostScore = 0;

  if (GUEST_HINTS.some(hint => normalized.includes(hint))) guestScore += 2;
  if (HOST_HINTS.some(hint => normalized.includes(hint))) hostScore += 2;

  const roleLabels = getTopicRoleLabels(topicKey);
  const activeSide = describeRoleStance(topicKey, true);
  const receptiveSide = describeRoleStance(topicKey, false);
  const lens = guestScore > hostScore
    ? `${activeSide.actorWithStance} -> ${activeSide.subjectWithStance}`
    : hostScore > guestScore
      ? `${receptiveSide.actorWithStance} <- ${receptiveSide.subjectWithStance}`
      : 'Chưa khóa cứng';
  const rationale = guestScore > hostScore
    ? `${roleLabels.actorLabel} đang là bên ra đòn trước, nên ưu tiên nhìn Thiên Bàn như phần khí đang ép nhịp lên ${roleLabels.subjectLabel}.`
    : hostScore > guestScore
      ? `${roleLabels.actorLabel} đang ở thế giữ vị trí hoặc chờ phản ứng, nên ưu tiên Địa Bàn như phần nền để xem ${roleLabels.subjectLabel} đang ép tới đâu.`
      : `Ca này chưa tự lộ rõ bên nào cầm nhịp; AI phải nói rõ đang đọc ${roleLabels.actorLabel} theo thế Chủ động hay Tiếp nhận và vì sao.`;

  return [
    '[VỊ THẾ HAI BÊN]',
    `- ${roleLabels.actorLabel} = phía người hỏi, nơi bạn đang cầm quyết định và phản ứng với tình huống.`,
    `- ${roleLabels.subjectLabel} = phía mục tiêu hoặc sự việc đang được đem ra xét.`,
    `- Khi ${roleLabels.actorLabel} là bên ra đòn trước, đọc là ${activeSide.actorWithStance}; phía còn lại là ${activeSide.subjectWithStance}.`,
    `- Khi tình huống ép ngược lại, đọc là ${receptiveSide.actorWithStance}; phía còn lại là ${receptiveSide.subjectWithStance}.`,
    `- Nhịp mặc định cho ca này: ${lens}.`,
    `- Lý do: ${rationale}`,
  ].join('\n');
}

export function buildVoidPressureContext(qmdjData = {}) {
  const palaceNum = resolveTargetPalaceNum(qmdjData);
  const palace = getPalaceEntry(qmdjData, palaceNum);
  if (!palace?.khongVong) return '';
  const palaceLabel = palace?.palaceName || PALACE_META[palaceNum]?.name || `cung ${palaceNum}`;

  return [
    '[VOID PRESSURE ON USEFUL GOD]',
    `- Dụng Thần tại cung ${palaceNum} (${palaceLabel}) đang dính Không Vong.`,
    '- Mọi điểm sáng ở cung này phải đọc như vỏ bọc, khí chưa thành hình, lời hứa chưa đủ thực.',
    '- Verdict không được chốt theo mặt sáng thuần; bắt buộc hạ nhiệt và nói rõ điều kiện kiểm chứng trước khi hành động.',
  ].join('\n');
}

export function buildPalaceDynamicsContext(qmdjData = {}) {
  const palaceNum = resolveTargetPalaceNum(qmdjData);
  const palace = getPalaceEntry(qmdjData, palaceNum);
  if (!palaceNum || !palace) return '';

  const palaceMeta = PALACE_META[palaceNum];
  const door = resolveDoorMeta(palace);
  const star = resolveStarMeta(palace);
  if (!door && !star) return '';

  const lines = [
    '[MÔN - TINH - CUNG]',
    `- Cung đang đậu: ${palaceMeta?.name || palaceNum} · ${palaceMeta?.dir || ''} · hành ${palaceMeta?.element || 'chưa rõ'}.`,
  ];

  if (door) {
    lines.push(`- ${relationText(`Môn ${door.name}`, door.element, palaceMeta?.element || '', `Cung ${palaceMeta?.name || palaceNum}`, 'door')}`);
  }
  if (star) {
    lines.push(`- ${relationText(`Tinh ${star.name}`, star.element, palaceMeta?.element || '', `Cung ${palaceMeta?.name || palaceNum}`, 'star')}`);
  }

  lines.push('- Cát Môn rơi vào cung bị khắc thì lực giảm; Hung Môn khắc cung thì sát lực tăng, không được chỉ nhìn tên Môn mà bỏ qua cái đất nó đang đậu.');
  return lines.join('\n');
}

export function buildDirectionalRecommendationContext(qmdjData = {}, userContext = '') {
  const topicKey = qmdjData?.selectedTopicKey || '';
  const palaces = parseDisplayPalaces(qmdjData);
  const targetPalaceNum = resolveTargetPalaceNum(qmdjData);
  const dayStemElement = resolveDayStemElement(qmdjData);

  if (!Object.keys(palaces).length) return '';
  if (!shouldUseDirection(topicKey, userContext)) {
    return [
      '[DIRECTIONAL RECOMMENDATION]',
      '- Case này không ưu tiên phương vị cứng; tactics.direction có thể chốt ngắn là chưa cần lấy hướng làm trục hành động.',
    ].join('\n');
  }

  const scored = [];
  for (let palaceNum = 1; palaceNum <= 9; palaceNum++) {
    if (palaceNum === 5) continue;
    const palace = getPalaceEntry(qmdjData, palaceNum);
    if (!palace) continue;

    const door = resolveDoorMeta(palace);
    const star = resolveStarMeta(palace);
    const deity = resolveDeityMeta(palace);
    const heavenStem = resolveHeavenStemName(palace);
    const earthStem = resolveEarthStemName(palace);
    const palaceMeta = PALACE_META[palaceNum];
    let score = palaceNum === targetPalaceNum ? 6 : 0;
    const reasons = [];

    if (door?.type === 'cat') { score += 3; reasons.push(`${door.name} là Cát Môn`); }
    if (door?.type === 'hung') { score -= 2; reasons.push(`${door.name} là Hung Môn`); }
    if (star?.type === 'cat') { score += 2; reasons.push(`${star.name} là Cát Tinh`); }
    if (star?.type === 'hung') { score -= 1; reasons.push(`${star.name} là Hung Tinh`); }
    if (deity?.type === 'cat') { score += 2; reasons.push(`${deity.name} là Cát Thần`); }
    if (deity?.type === 'hung') { score -= 1; reasons.push(`${deity.name} là Hung Thần`); }
    if (palace?.khongVong) { score -= 4; reasons.push('dính Không Vong'); }
    if (heavenStem === 'Canh' || earthStem === 'Canh') { score -= 3; reasons.push('Canh làm cung gắt và dễ va chạm'); }
    if (OPPOSITE_PALACE[targetPalaceNum] === palaceNum) { score -= 2; reasons.push('đối xung với cung Dụng Thần'); }
    if (dayStemElement && PRODUCES[palaceMeta?.element] === dayStemElement) {
      score += 2;
      reasons.push(`cung ${palaceMeta?.element} sinh cho Nhật Can ${dayStemElement}`);
    }
    if (dayStemElement && CONTROLS[palaceMeta?.element] === dayStemElement) {
      score -= 2;
      reasons.push(`cung ${palaceMeta?.element} khắc Nhật Can ${dayStemElement}`);
    }

    scored.push({
      palaceNum,
      score,
      direction: palace?.directionLabel?.displayShort || palace?.direction || palaceMeta?.dir || '',
      reasons,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  const worst = [...scored].sort((a, b) => a.score - b.score)[0];
  if (!best || !worst) return '';

  return [
    '[DIRECTIONAL RECOMMENDATION]',
    `- Hướng nên tận dụng: ${best.direction} (P${best.palaceNum}) — ${best.reasons.slice(0, 2).join(', ') || 'đây là cung đỡ nhịp nhất cho hành động.'}`,
    `- Hướng nên tránh: ${worst.direction} (P${worst.palaceNum}) — ${worst.reasons.slice(0, 2).join(', ') || 'cung này làm khí hành động méo hoặc hao.'}`,
    '- Nếu câu hỏi không thực sự cần di chuyển/bố trí/hẹn gặp, tactics.direction được phép chốt ngắn: chưa lấy phương vị làm trục chính.',
  ].join('\n');
}
