import { QMDJ_DICTIONARY } from './qmdjDictionary.js';
import { detectFlagCombos } from './flagCombos.js';

const FLAG_PRIORITY = ['Dịch Mã', 'Không Vong', 'Phục Ngâm', 'Phản Ngâm'];

// Map Vietnamese flag names → flag keys for combo detection
const FLAG_NAME_TO_KEY = {
  'Dịch Mã': 'DICH_MA',
  'Không Vong': 'VOID',
  'Phục Ngâm': 'FU_YIN',
  'Phản Ngâm': 'FAN_YIN',
};

function normalizeTopicKey(topicKey) {
  if (!topicKey) return '';
  if (topicKey === 'thi-cu') return 'hoc-tap';
  if (topicKey === 'tinh-yeu') return 'tinh-duyen';
  if (topicKey === 'dien-trach') return 'bat-dong-san';
  if (topicKey === 'chien-luoc') return 'muu-luoc';
  if (topicKey === 'gia-dinh') return 'gia-dao';
  return topicKey;
}

function normalizeDoorName(name) {
  if (!name) return '';
  return name.includes('Môn') ? name : `${name} Môn`;
}

function lookupCategory(element) {
  if (!element) return null;

  const doorName = normalizeDoorName(element);
  if (QMDJ_DICTIONARY.Doors[doorName]) {
    return { label: doorName, payload: QMDJ_DICTIONARY.Doors[doorName] };
  }
  if (QMDJ_DICTIONARY.Deities[element]) {
    return { label: element, payload: QMDJ_DICTIONARY.Deities[element] };
  }
  if (QMDJ_DICTIONARY.Stars[element]) {
    return { label: element, payload: QMDJ_DICTIONARY.Stars[element] };
  }
  if (QMDJ_DICTIONARY.Stems[element]) {
    return { label: element, payload: QMDJ_DICTIONARY.Stems[element] };
  }
  if (QMDJ_DICTIONARY.Flags[element]) {
    return { label: element, payload: QMDJ_DICTIONARY.Flags[element] };
  }
  return null;
}

function isFlagElement(element) {
  return FLAG_PRIORITY.includes(element);
}

export function getAIHints(topicKey, extractedElements = []) {
  const normalizedTopicKey = normalizeTopicKey(topicKey);
  const uniqueElements = Array.from(
    new Set((Array.isArray(extractedElements) ? extractedElements : []).filter(Boolean))
  );
  // Detect flag combos from elements
  const flagsObj = {};
  for (const el of uniqueElements) {
    if (FLAG_NAME_TO_KEY[el]) flagsObj[FLAG_NAME_TO_KEY[el]] = true;
  }
  const detectedCombos = detectFlagCombos(flagsObj);

  const prioritizedElements = [
    ...FLAG_PRIORITY.filter(flag => uniqueElements.includes(flag)),
    ...uniqueElements.filter(element => !isFlagElement(element)),
  ];
  const flagLines = [];
  const regularLines = [];

  for (const element of prioritizedElements) {
    const match = lookupCategory(element);
    if (!match) continue;
    const hintText = match.payload[normalizedTopicKey] || match.payload.default;
    if (!hintText) continue;
    const line = `- Đối với [${match.label}]: Hãy ẩn dụ nó là "${hintText}".`;
    if (isFlagElement(match.label)) {
      flagLines.push(line);
    } else {
      regularLines.push(line);
    }
  }

  const lines = [];
  if (flagLines.length) {
    lines.push('[QUAN TRỌNG - FLAGS]');
    // Insert combo warnings (severity-sorted, highest first)
    for (const combo of detectedCombos) {
      const severityTag = combo.severity === 'critical' ? ' - MỨC CRITICAL' : '';
      lines.push(`[CẢNH BÁO ĐẶC BIỆT${severityTag}]: ${combo.label}. ${combo.conflictHint}`);
    }
    lines.push(...flagLines);
  }
  if (regularLines.length) {
    lines.push(...regularLines);
  }
  if (!lines.length) return '';
  return `[GỢI Ý ẨN DỤ CHO AI]\n${lines.join('\n')}`;
}
