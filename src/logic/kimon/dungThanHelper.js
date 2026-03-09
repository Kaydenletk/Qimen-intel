import { PALACE_META } from '../../core/tables.js';

export const TOPIC_DUNG_THAN_MAP = {
  'thi-cu': { mon: 'Cảnh', tinh: 'Phụ', priority: ['mon', 'tinh'] },
  'hoc-tap': { mon: 'Cảnh', tinh: 'Phụ', priority: ['mon', 'tinh'] },
  'gia-dao': { mon: 'Sinh', than: 'Lục Hợp', priority: ['mon', 'than'] },
  'tinh-duyen': { than: 'Lục Hợp', priority: ['than'] },
  'tai-van': { can: 'Mậu', mon: 'Sinh', priority: ['can', 'mon'] },
  'kinh-doanh': { can: 'Mậu', mon: 'Sinh', priority: ['can', 'mon'] },
  'bat-dong-san': { can: 'Mậu', mon: 'Sinh', priority: ['can', 'mon'] },
  'su-nghiep': { mon: 'Khai', priority: ['mon'] },
  'xin-viec': { mon: 'Khai', priority: ['mon'] },
  'suc-khoe': { tinh: 'Nhuế', tinh_cuu: 'Tâm', priority: ['tinh', 'tinh_cuu'] },
  'kien-tung': { mon: 'Kinh', priority: ['mon'] },
  'doi-no': { mon: 'Thương', priority: ['mon'] },
};

const TOPIC_ALIASES = {
  'tinh-yeu': 'tinh-duyen',
  'dien-trach': 'bat-dong-san',
  'gia-dinh': 'gia-dao',
  'chien-luoc': 'muu-luoc',
};

const PERSON_ANALYSIS_HINTS = [
  'phan tich nguoi',
  'nguoi nay',
  'gap ho',
  'gap nguoi',
  'giao vien nay',
  'thay nay',
  'co ay',
  'anh ay',
  'ho la nguoi',
];

const TIME_REFERENCE_PATTERNS = [
  /\b\d{1,2}h(?:\d{1,2})?\b/u,
  /\b\d{1,2}:\d{2}\b/u,
];

const TIME_REFERENCE_HINTS = [
  'luc',
  'hom nay',
  'sang',
  'trua',
  'chieu',
  'toi',
  'gio',
];

function canonicalizeTopic(topic = '') {
  return TOPIC_ALIASES[topic] || topic;
}

function normalizeLooseText(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readEntityLabel(entity = {}, fallbacks = []) {
  for (const key of fallbacks) {
    const value = entity?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function normalizeDisplayPalace(palaceNum, palace = {}) {
  const numericPalace = Number(palaceNum);
  return {
    id: numericPalace,
    huong: palace?.directionLabel?.displayShort || palace?.direction || PALACE_META[numericPalace]?.dir || '',
    palaceName: palace?.palaceName || PALACE_META[numericPalace]?.name || `Cung ${numericPalace}`,
    mon: readEntityLabel(palace?.mon, ['displayShort', 'short', 'displayName', 'name', 'internalName']),
    tinh: readEntityLabel(palace?.star, ['displayShort', 'short', 'displayName', 'name', 'internalName']),
    than: readEntityLabel(palace?.than, ['displayShort', 'displayName', 'name', 'internalName']),
    can: readEntityLabel(palace?.can, ['displayShort', 'displayName', 'name', 'internalName']),
    dichMa: Boolean(palace?.dichMa),
    khongVong: Boolean(palace?.khongVong),
    trucSu: Boolean(palace?.trucSu),
    trucPhu: Boolean(palace?.trucPhu),
  };
}

export function normalizeBoardData(boardData = {}) {
  if (!boardData) return [];

  if (typeof boardData === 'string') {
    try {
      return normalizeBoardData(JSON.parse(boardData));
    } catch {
      return [];
    }
  }

  if (Array.isArray(boardData)) {
    return boardData
      .map(item => ({
        id: Number(item?.id || item?.palaceNum || 0),
        huong: item?.huong || item?.direction || '',
        palaceName: item?.palaceName || '',
        mon: item?.mon || '',
        tinh: item?.tinh || '',
        than: item?.than || '',
        can: item?.can || '',
        dichMa: Boolean(item?.dichMa),
        khongVong: Boolean(item?.khongVong),
        trucSu: Boolean(item?.trucSu),
        trucPhu: Boolean(item?.trucPhu),
      }))
      .filter(item => item.id && item.id !== 5)
      .sort((a, b) => a.id - b.id);
  }

  return Object.entries(boardData)
    .map(([palaceNum, palace]) => normalizeDisplayPalace(palaceNum, palace))
    .filter(item => item.id && item.id !== 5)
    .sort((a, b) => a.id - b.id);
}

function getTargetSummary(target = {}) {
  return [
    target.mon ? `Môn ${target.mon}` : '',
    target.than ? `Thần ${target.than}` : '',
    target.tinh ? `Tinh ${target.tinh}` : '',
    target.tinh_cuu ? `Tinh cứu ${target.tinh_cuu}` : '',
    target.can ? `Can ${target.can}` : '',
  ].filter(Boolean).join(' + ');
}

function getTargetPriority(target = {}) {
  if (Array.isArray(target.priority) && target.priority.length) return target.priority;
  return ['mon', 'than', 'tinh', 'tinh_cuu', 'can'].filter(key => Boolean(target[key]));
}

function isPersonAnalysisRequest(userContext = '') {
  const normalized = normalizeLooseText(userContext);
  return PERSON_ANALYSIS_HINTS.some(hint => normalized.includes(hint));
}

function hasExplicitTimeReference(userContext = '') {
  const raw = userContext || '';
  if (TIME_REFERENCE_PATTERNS.some(pattern => pattern.test(raw))) return true;
  const normalized = normalizeLooseText(raw);
  return TIME_REFERENCE_HINTS.some(hint => normalized.includes(hint));
}

function collectPalaceFlags(palace = {}) {
  const flags = [];
  if (palace.khongVong) flags.push('Không Vong');
  if (palace.than === 'Đằng Xà') flags.push('Đằng Xà');
  if (palace.dichMa) flags.push('Dịch Mã');
  return flags;
}

function getDungThanMatch(palace = {}, target = {}) {
  let score = 0;
  const matchedBy = [];
  const matchedFields = [];
  const priority = getTargetPriority(target);

  for (const [index, key] of priority.entries()) {
    const targetValue = target[key];
    if (!targetValue) continue;

    const matched = key === 'mon'
      ? palace.mon === targetValue
      : key === 'than'
        ? palace.than === targetValue
        : key === 'tinh'
          ? palace.tinh === targetValue
          : key === 'tinh_cuu'
            ? palace.tinh === targetValue
            : key === 'can'
              ? palace.can === targetValue
              : false;

    if (!matched) continue;

    matchedFields.push(key);
    score += 100 - (index * 12);

    if (key === 'mon') matchedBy.push(`Môn ${targetValue}`);
    if (key === 'than') matchedBy.push(`Thần ${targetValue}`);
    if (key === 'tinh') matchedBy.push(`Tinh ${targetValue}`);
    if (key === 'tinh_cuu') matchedBy.push(`Tinh cứu ${targetValue}`);
    if (key === 'can') matchedBy.push(`Can ${targetValue}`);
  }

  if (matchedFields.length > 1) {
    score += (matchedFields.length - 1) * 120;
  }

  return {
    score,
    matchedBy,
    matchedFields,
    matchedCount: matchedFields.length,
    primaryRank: matchedFields.length
      ? Math.min(...matchedFields.map(field => priority.indexOf(field)).filter(index => index >= 0))
      : Number.POSITIVE_INFINITY,
  };
}

export function findTopicDungThanPalace(topic = '', boardData = {}) {
  const canonicalTopic = canonicalizeTopic(topic);
  const target = TOPIC_DUNG_THAN_MAP[canonicalTopic];
  if (!target) return null;

  const board = normalizeBoardData(boardData);
  let matchedPalace = null;

  for (const palace of board) {
    const match = getDungThanMatch(palace, target);
    if (!match.score) continue;

    const isBetterMatch = !matchedPalace
      || match.matchedCount > matchedPalace.matchedCount
      || (match.matchedCount === matchedPalace.matchedCount && match.primaryRank < matchedPalace.primaryRank)
      || (match.matchedCount === matchedPalace.matchedCount && match.primaryRank === matchedPalace.primaryRank && match.score > matchedPalace.score);

    if (isBetterMatch) {
      matchedPalace = {
        ...palace,
        topic: canonicalTopic,
        score: match.score,
        matchedBy: match.matchedBy,
        matchedFields: match.matchedFields,
        matchedCount: match.matchedCount,
        primaryRank: match.primaryRank,
        matchedByText: match.matchedBy.join(' + '),
        target,
        targetSummary: getTargetSummary(target),
      };
    }
  }

  return matchedPalace;
}

function findHourPalace(boardData = {}, hourPalaceNum = null) {
  const board = normalizeBoardData(boardData);
  const numericHourPalace = Number(hourPalaceNum);
  if (!numericHourPalace) return null;
  return board.find(palace => palace.id === numericHourPalace) || null;
}

function formatPalaceText(palace = {}, isDungThan = false) {
  const lines = [
    `Cung ${palace.huong || palace.palaceName} (P${palace.id}):`,
    isDungThan ? '===> [DỤNG THẦN CHÍNH - BẮT BUỘC PHÂN TÍCH TRỌNG TÂM TẠI ĐÂY] <===' : '',
    isDungThan ? '[ĐÂY LÀ CUNG DỤNG THẦN CHÍNH]' : '',
    `- Môn: ${palace.mon || '—'}`,
    `- Tinh: ${palace.tinh || '—'}`,
    `- Thần: ${palace.than || '—'}`,
    `- Can: ${palace.can || '—'}`,
  ];

  const flags = collectPalaceFlags(palace);
  for (const flag of flags) {
    lines.push(`- Cờ: ${flag}`);
  }

  return lines.filter(Boolean).join('\n');
}

export function buildDungThanBoardText({ topic = '', boardData = {}, userContext = '', hourPalaceNum = null } = {}) {
  const marker = resolveDungThanMarker({ topic, boardData, userContext, hourPalaceNum });
  if (!marker?.palaceNum) return '';

  return normalizeBoardData(boardData)
    .map(palace => formatPalaceText(palace, palace.id === marker.palaceNum))
    .join('\n');
}

export function resolveDungThanMarker({ topic = '', boardData = {}, userContext = '', hourPalaceNum = null } = {}) {
  const canonicalTopic = canonicalizeTopic(topic);
  const board = normalizeBoardData(boardData);
  if (!board.length) return null;

  const personWithTime = isPersonAnalysisRequest(userContext) && hasExplicitTimeReference(userContext);
  if (personWithTime) {
    const hourPalace = findHourPalace(board, hourPalaceNum);
    if (hourPalace) {
      return {
        topic: canonicalTopic,
        palaceNum: hourPalace.id,
        palaceName: hourPalace.palaceName,
        direction: hourPalace.huong,
        matchedBy: ['Cung Giờ'],
        matchedByText: 'Cung Giờ (ưu tiên đọc người gặp đúng mốc thời gian)',
        targetSummary: 'Ưu tiên Cung Giờ cho câu hỏi phân tích người có mốc giờ cụ thể',
        boardText: board.map(palace => formatPalaceText(palace, palace.id === hourPalace.id)).join('\n'),
      };
    }
  }

  const matchedPalace = findTopicDungThanPalace(canonicalTopic, board);
  if (!matchedPalace) return null;

  return {
    topic: matchedPalace.topic,
    palaceNum: matchedPalace.id,
    palaceName: matchedPalace.palaceName,
    direction: matchedPalace.huong,
    matchedBy: matchedPalace.matchedBy,
    matchedByText: matchedPalace.matchedByText,
    target: matchedPalace.target,
    targetSummary: matchedPalace.targetSummary,
    boardText: board.map(palace => formatPalaceText(palace, palace.id === matchedPalace.id)).join('\n'),
  };
}
