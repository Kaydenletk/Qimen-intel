import { collectQmdjDictionaryEntries } from '../../interpretation/dictionary.js';
import { findBestComboAnalogy, findStemInteractionRule } from '../dungThan/comboAnalogies.js';
import { detectFlagCombos, getComboTopicAdvice } from '../dungThan/flagCombos.js';

const DOOR_SHORT_TO_FULL = {
  Khai: 'Khai Môn',
  Hưu: 'Hưu Môn',
  Sinh: 'Sinh Môn',
  Cảnh: 'Cảnh Môn',
  Tử: 'Tử Môn',
  Thương: 'Thương Môn',
  Đỗ: 'Đỗ Môn',
  Kinh: 'Kinh Môn',
};

const STAR_SHORT_TO_FULL = {
  Bồng: 'Thiên Bồng',
  Nhuế: 'Thiên Nhuế',
  Xung: 'Thiên Xung',
  Phụ: 'Thiên Phụ',
  Cầm: 'Thiên Cầm',
  Tâm: 'Thiên Tâm',
  Trụ: 'Thiên Trụ',
  Nhậm: 'Thiên Nhậm',
  Nhâm: 'Thiên Nhậm',
  Anh: 'Thiên Anh',
};

const TOPIC_ALIASES = {
  'thi-cu': 'hoc-tap',
  'tinh-yeu': 'tinh-duyen',
  'dien-trach': 'bat-dong-san',
  'chien-luoc': 'muu-luoc',
  'gia-dinh': 'gia-dao',
};

const FLAG_NAME_TO_KEY = {
  'Dịch Mã': 'DICH_MA',
  'Không Vong': 'VOID',
  'Phục Ngâm': 'FU_YIN',
  'Phản Ngâm': 'FAN_YIN',
};

function normalizeTopicKey(topicKey = '') {
  return TOPIC_ALIASES[topicKey] || topicKey || '';
}

function normalizeDoorName(doorName = '') {
  const cleaned = String(doorName || '').trim();
  if (!cleaned) return '';
  if (cleaned.includes('Môn')) return cleaned;
  return DOOR_SHORT_TO_FULL[cleaned] || cleaned;
}

function normalizeStarName(starName = '') {
  const cleaned = String(starName || '').trim();
  if (!cleaned) return '';
  if (cleaned.startsWith('Thiên ')) return cleaned;
  return STAR_SHORT_TO_FULL[cleaned] || cleaned;
}

function parseCanonicalBoardText(boardText = '') {
  const result = {
    door: '',
    star: '',
    deity: '',
    stem: '',
    flags: [],
  };

  const text = String(boardText || '');
  if (!text) return result;

  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  for (const line of lines) {
    if (line.startsWith('- Môn:')) {
      result.door = normalizeDoorName(line.replace('- Môn:', '').trim());
    } else if (line.startsWith('- Tinh:')) {
      result.star = normalizeStarName(line.replace('- Tinh:', '').trim());
    } else if (line.startsWith('- Thần:')) {
      result.deity = line.replace('- Thần:', '').trim();
    } else if (line.startsWith('- Can:')) {
      result.stem = line.replace('- Can:', '').trim();
    } else if (line.startsWith('- Cờ:')) {
      result.flags = line
        .replace('- Cờ:', '')
        .split(/[|,]/)
        .map(flag => flag.trim())
        .filter(Boolean);
    }
  }

  return result;
}

function formatPalaceSignature(context = {}) {
  const location = [
    context.palaceNum ? `P${context.palaceNum}` : '',
    context.palaceName || '',
    context.direction || '',
  ].filter(Boolean).join(' · ');
  const components = [
    context.door ? `Môn=${context.door}` : '',
    context.star ? `Tinh=${context.star}` : '',
    context.deity ? `Thần=${context.deity}` : '',
    context.stem ? `Can=${context.stem}` : '',
  ].filter(Boolean).join(' | ');
  return [location, components].filter(Boolean).join(' | ');
}

function buildUsefulPalaceContext(qmdjData = {}) {
  const canonical = qmdjData?.selectedTopicCanonicalDungThan || null;
  const parsed = parseCanonicalBoardText(canonical?.boardText || '');
  const palaceNum = canonical?.palaceNum || qmdjData?.selectedTopicUsefulPalace || '';
  const palaceName = canonical?.palaceName || qmdjData?.selectedTopicUsefulPalaceName || '';
  const direction = canonical?.direction || '';
  const flags = parsed.flags;

  if (!palaceNum && !parsed.door && !parsed.star && !parsed.deity && !parsed.stem) return null;

  return {
    role: 'Dụng Thần chính',
    palaceNum,
    palaceName,
    direction,
    door: parsed.door,
    star: parsed.star,
    deity: parsed.deity,
    stem: parsed.stem,
    flags,
  };
}

function buildHourPalaceContext(qmdjData = {}) {
  if (!qmdjData?.hourMarkerPalace && !qmdjData?.hourDoor && !qmdjData?.hourStar && !qmdjData?.hourDeity) return null;
  return {
    role: 'Cung Giờ',
    palaceNum: qmdjData?.hourMarkerPalace || '',
    palaceName: '',
    direction: qmdjData?.hourMarkerDirection || qmdjData?.hourPalaceDirection || '',
    door: normalizeDoorName(qmdjData?.hourDoor || ''),
    star: normalizeStarName(qmdjData?.hourStar || ''),
    deity: qmdjData?.hourDeity || '',
    stem: qmdjData?.hourStem || '',
    flags: [],
  };
}

function buildRoutePalaceContext(qmdjData = {}) {
  if (!qmdjData?.directEnvoyPalace && !qmdjData?.directEnvoyDoor && !qmdjData?.directEnvoyStar && !qmdjData?.directEnvoyDeity) return null;
  return {
    role: 'Trực Sử',
    palaceNum: qmdjData?.directEnvoyPalace || '',
    palaceName: '',
    direction: qmdjData?.directEnvoyDirection || '',
    door: normalizeDoorName(qmdjData?.directEnvoyDoor || ''),
    star: normalizeStarName(qmdjData?.directEnvoyStar || ''),
    deity: qmdjData?.directEnvoyDeity || '',
    stem: '',
    flags: [],
  };
}

function dedupeContexts(contexts = []) {
  const seen = new Set();
  const results = [];

  for (const context of contexts) {
    if (!context) continue;
    const key = [
      context.role,
      context.palaceNum,
      context.door,
      context.star,
      context.deity,
      context.stem,
    ].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(context);
  }

  return results;
}

function collectKnowledgeLabels(contexts = []) {
  return contexts.flatMap(context => [
    context.door,
    context.star,
    context.deity,
    context.stem,
    ...(Array.isArray(context.flags) ? context.flags : []),
  ]).filter(Boolean);
}

function collectActiveFlags(qmdjData = {}, contexts = []) {
  const flags = [
    ...(Array.isArray(qmdjData?.selectedTopicFlags) ? qmdjData.selectedTopicFlags : []),
    ...contexts.flatMap(context => (Array.isArray(context.flags) ? context.flags : [])),
    qmdjData?.isPhucAm ? 'Phục Ngâm' : '',
    qmdjData?.isPhanNgam ? 'Phản Ngâm' : '',
  ].filter(Boolean);

  return Array.from(new Set(flags));
}

function buildDictionaryLines(contexts = [], activeFlags = [], topicKey = '') {
  const labels = Array.from(new Set([
    ...activeFlags,
    ...collectKnowledgeLabels(contexts),
  ]));

  return collectQmdjDictionaryEntries(labels, topicKey)
    .slice(0, 8)
    .map(entry => `- ${entry.label}: ${entry.text}`);
}

function buildComboLines(contexts = []) {
  const lines = [];
  const seen = new Set();

  for (const context of contexts) {
    const combo = findBestComboAnalogy(context.door, context.deity, context.star);
    if (!combo) continue;
    const comboKey = `${context.role}|${combo.analogy}|${combo.source || ''}`;
    if (seen.has(comboKey)) continue;
    seen.add(comboKey);
    lines.push(`- Tổ hợp ${context.role} (${context.door} × ${combo.source === 'than' ? context.deity : context.star}): ${combo.meaning}`);
  }

  return lines;
}

function buildStemInteractionLines(qmdjData = {}, usefulContext = null, topicKey = '') {
  const lines = [];
  const seen = new Set();
  const pairs = [
    {
      label: 'Can Ngày vs Can Giờ',
      left: qmdjData?.dayStem || '',
      right: qmdjData?.hourStem || '',
    },
    {
      label: 'Can Ngày vs Can Dụng Thần',
      left: qmdjData?.dayStem || '',
      right: usefulContext?.stem || '',
    },
  ];

  for (const pair of pairs) {
    if (!pair.left || !pair.right) continue;
    const match = findStemInteractionRule(pair.left, pair.right, topicKey);
    if (!match?.text) continue;
    const key = `${pair.label}|${match.pair}`;
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(`- ${pair.label} (${pair.left} -> ${pair.right}): ${match.text}`);
  }

  return lines;
}

function buildFlagComboLines(activeFlags = [], topicKey = '') {
  if (!activeFlags.length) return [];

  const flags = Object.fromEntries(
    activeFlags
      .map(flag => [FLAG_NAME_TO_KEY[flag], true])
      .filter(([key]) => Boolean(key))
  );

  return detectFlagCombos(flags)
    .slice(0, 3)
    .map(combo => {
      const advice = getComboTopicAdvice(combo.id, topicKey);
      return `- Combo cờ ${combo.label}: ${advice?.coreMessage || combo.conflictHint}`;
    });
}

export function buildKnowledgeVaultContext({ qmdjData = {}, userContext = '', topicKey = '' } = {}) {
  const normalizedTopicKey = normalizeTopicKey(topicKey || qmdjData?.selectedTopicKey || '');
  const usefulContext = buildUsefulPalaceContext(qmdjData);
  const contexts = dedupeContexts([
    usefulContext,
    buildHourPalaceContext(qmdjData),
    buildRoutePalaceContext(qmdjData),
  ]);
  const activeFlags = collectActiveFlags(qmdjData, contexts);

  const sceneLines = contexts.map(context => `- ${context.role}: ${formatPalaceSignature(context)}`);
  const flagSummaryLine = activeFlags.length ? `- Cờ trọng yếu: ${activeFlags.join(' | ')}` : '';
  const dictionaryLines = buildDictionaryLines(contexts, activeFlags, normalizedTopicKey);
  const comboLines = buildComboLines(contexts);
  const flagComboLines = buildFlagComboLines(activeFlags, normalizedTopicKey);
  const stemLines = buildStemInteractionLines(qmdjData, usefulContext, normalizedTopicKey);

  if (!sceneLines.length && !flagSummaryLine && !dictionaryLines.length && !comboLines.length && !flagComboLines.length && !stemLines.length) return '';

  const lines = [
    '[KHO TRI THỨC QMDJ]',
    ...sceneLines,
    flagSummaryLine,
    ...dictionaryLines,
    ...comboLines,
    ...flagComboLines,
    ...stemLines,
    userContext ? '- Khi luận, chỉ dùng các nét nghĩa trong block này để dịch tượng cho đúng ngữ cảnh câu hỏi.' : '',
  ].filter(Boolean);

  return lines.length > 1 ? lines.join('\n') : '';
}
