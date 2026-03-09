const PARTIAL_RESPONSE_LEAD = 'Kymon chưa trả lời trọn vẹn.';
const PARTIAL_RESPONSE_MESSAGE = 'Phản hồi vừa rồi bị cắt giữa chừng ở phía hệ thống. Mình chưa muốn chốt nửa vời.';
const PARTIAL_RESPONSE_ACTION = 'Bạn gửi lại câu hỏi ngắn hơn nhé.';
const UNCLEAR_RESPONSE_MESSAGE = 'Phản hồi từ hệ thống chưa đủ rõ để hiển thị an toàn.';
const STRUCTURED_KIMON_KEYS = [
  'mode',
  'lead',
  'timeHint',
  'message',
  'closingLine',
  'summary',
  'analysis',
  'action',
  'tongQuan',
  'kimonQuote',
  'verdict',
  'buoc1_gocReVanDe',
  'buoc2_trangThaiMucTieu',
  'buoc3_noiLucVaTamLy',
  'buoc4_muuLuocHanhDong',
  'step1_rootCause',
  'step2_targetStatus',
  'step3_userEnergy',
  'step4_tacticalStrategy',
  'rootCause',
  'targetStatus',
  'userEnergy',
  'tacticalStrategy',
];
const STEP1_KEYS = ['buoc1_gocReVanDe', 'step1_rootCause', 'rootCause'];
const STEP2_KEYS = ['buoc2_trangThaiMucTieu', 'step2_targetStatus', 'targetStatus'];
const STEP3_KEYS = ['buoc3_noiLucVaTamLy', 'step3_userEnergy', 'userEnergy'];
const STEP4_KEYS = ['buoc4_muuLuocHanhDong', 'step4_tacticalStrategy', 'tacticalStrategy'];

function stripMarkdownCodeFences(rawText = '') {
  return String(rawText)
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

function extractBalancedJsonObject(rawText = '') {
  const cleaned = stripMarkdownCodeFences(rawText);
  const start = cleaned.indexOf('{');
  if (start === -1) return '';

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let index = start; index < cleaned.length; index++) {
    const ch = cleaned[index];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (ch === '\\') {
      escapeNext = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        return cleaned.slice(start, index + 1).trim();
      }
    }
  }

  return '';
}

function extractFirstJsonObject(rawText = '') {
  const balanced = extractBalancedJsonObject(rawText);
  if (balanced) return balanced;

  const cleaned = stripMarkdownCodeFences(rawText);
  const start = cleaned.indexOf('{');
  if (start === -1) return cleaned.trim();
  return cleaned.slice(start).trim();
}

function extractJsonCandidate(rawText = '') {
  return extractFirstJsonObject(rawText);
}

function repairJsonLikeString(rawText = '') {
  const source = extractJsonCandidate(rawText);
  if (!source) return '';

  let result = '';
  let inString = false;
  let escapeNext = false;

  for (let index = 0; index < source.length; index++) {
    const ch = source[index];

    if (escapeNext) {
      result += ch;
      escapeNext = false;
      continue;
    }

    if (ch === '\\') {
      result += ch;
      escapeNext = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString && (ch === '\n' || ch === '\r')) {
      result += '\\n';
      continue;
    }

    result += ch;
  }

  return result.replace(/,\s*([}\]])/g, '$1').trim();
}

function normalizeTextValue(value = '') {
  return typeof value === 'string'
    ? value.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
    : '';
}

function pickFirstStringField(source = {}, keys = []) {
  for (const key of keys) {
    if (typeof source?.[key] === 'string' && source[key].trim()) {
      return source[key].trim();
    }
  }
  return '';
}

function extractMarkdownBulletItems(rawText = '') {
  return normalizeTextValue(rawText)
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^[*-]\s+/.test(line))
    .map(line => line.replace(/^[*-]\s+/, '').trim())
    .filter(Boolean);
}

function extractClosingLineFromBlock(rawText = '') {
  const lines = normalizeTextValue(rawText)
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  for (let index = lines.length - 1; index >= 0; index--) {
    const candidate = lines[index]
      .replace(/^[*-]\s+/, '')
      .replace(/^#+\s*/, '')
      .replace(/^\*\*([^*]+)\*\*:?\s*/, '$1')
      .trim();
    if (!candidate) continue;
    if (/^Bước\s*[1-4]/i.test(candidate)) continue;
    return candidate;
  }

  return '';
}

function looksLikeStructuredKimonOutput(rawText = '') {
  const pattern = STRUCTURED_KIMON_KEYS.join('|');
  return new RegExp(`"(?:${pattern})"\\s*:`).test(String(rawText || ''));
}

function extractLooseStringField(rawText = '', key = '') {
  if (!key) return '';
  const source = String(rawText || '');
  const marker = `"${key}"`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) return '';

  const colonIndex = source.indexOf(':', markerIndex + marker.length);
  if (colonIndex === -1) return '';

  let quoteIndex = -1;
  for (let index = colonIndex + 1; index < source.length; index++) {
    const ch = source[index];
    if (ch === '"') {
      quoteIndex = index;
      break;
    }
    if (!/\s/.test(ch)) break;
  }
  if (quoteIndex === -1) return '';

  let result = '';
  let escapeNext = false;
  for (let index = quoteIndex + 1; index < source.length; index++) {
    const ch = source[index];

    if (escapeNext) {
      result += ch;
      escapeNext = false;
      continue;
    }

    if (ch === '\\') {
      escapeNext = true;
      continue;
    }

    if (ch === '"') {
      return result.trim();
    }

    const pattern = STRUCTURED_KIMON_KEYS.join('|');
    if ((ch === '\n' || ch === '\r') && new RegExp(`^\\s*(?:[}"{]|"(?:${pattern})")`).test(source.slice(index + 1))) {
      break;
    }

    result += ch;
  }

  return result.trim();
}

function extractLooseStringFieldByKeys(rawText = '', keys = []) {
  for (const key of keys) {
    const value = extractLooseStringField(rawText, key);
    if (value) return value;
  }
  return '';
}

function salvageMalformedStructuredPayload(rawText = '') {
  const source = String(rawText || '').trim();
  if (!source || !looksLikeStructuredKimonOutput(source)) return null;

  const salvaged = {
    mode: extractLooseStringField(source, 'mode') || 'interpretation',
    summary: extractLooseStringField(source, 'summary') || extractLooseStringField(source, 'lead'),
    analysis: extractLooseStringField(source, 'analysis') || extractLooseStringField(source, 'message'),
    action: extractLooseStringField(source, 'action') || extractLooseStringField(source, 'closingLine'),
    quickTake: '',
    timeHint: extractLooseStringField(source, 'timeHint'),
    lead: extractLooseStringField(source, 'lead'),
    message: extractLooseStringField(source, 'message'),
    closingLine: extractLooseStringField(source, 'closingLine'),
    kimonQuote: extractLooseStringField(source, 'kimonQuote'),
    buoc1_gocReVanDe: extractLooseStringFieldByKeys(source, STEP1_KEYS),
    buoc2_trangThaiMucTieu: extractLooseStringFieldByKeys(source, STEP2_KEYS),
    buoc3_noiLucVaTamLy: extractLooseStringFieldByKeys(source, STEP3_KEYS),
    buoc4_muuLuocHanhDong: extractLooseStringFieldByKeys(source, STEP4_KEYS),
  };

  if (
    !salvaged.summary &&
    !salvaged.analysis &&
    !salvaged.action &&
    !salvaged.timeHint &&
    !salvaged.buoc1_gocReVanDe &&
    !salvaged.buoc2_trangThaiMucTieu &&
    !salvaged.buoc3_noiLucVaTamLy &&
    !salvaged.buoc4_muuLuocHanhDong
  ) {
    return {
      mode: 'interpretation',
      summary: PARTIAL_RESPONSE_LEAD,
      analysis: PARTIAL_RESPONSE_MESSAGE,
      action: PARTIAL_RESPONSE_ACTION,
      quickTake: '',
      timeHint: '',
      lead: '',
      message: '',
      closingLine: '',
    };
  }

  return salvaged;
}

function createFallbackPayload(rawText = '') {
  const source = String(rawText).trim();
  const message = looksLikeStructuredKimonOutput(source)
    ? PARTIAL_RESPONSE_MESSAGE
    : UNCLEAR_RESPONSE_MESSAGE;
  return {
    mode: 'interpretation',
    summary: PARTIAL_RESPONSE_LEAD,
    analysis: message,
    action: PARTIAL_RESPONSE_ACTION,
    quickTake: PARTIAL_RESPONSE_LEAD,
    timeHint: '',
    lead: PARTIAL_RESPONSE_LEAD,
    message,
    closingLine: PARTIAL_RESPONSE_ACTION,
    traLoiTrucTiep: message,
    thoiDiemGoiY: '',
    tongQuan: message,
    tamLy: {
      trangThai: '',
      dongChay: '',
    },
    chienLuoc: {
      noiDung: '',
    },
    hanhDong: [],
    kimonQuote: '',
  };
}

function normalizeKimonPayload(parsed, rawText = '') {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return createFallbackPayload(rawText || String(parsed || ''));
  }

  const normalized = { ...parsed };
  const step1 = pickFirstStringField(normalized, STEP1_KEYS);
  const step2 = pickFirstStringField(normalized, STEP2_KEYS);
  const step3 = pickFirstStringField(normalized, STEP3_KEYS);
  const step4 = pickFirstStringField(normalized, STEP4_KEYS);

  normalized.mode = typeof normalized.mode === 'string' ? normalized.mode : 'interpretation';
  normalized.summary = typeof normalized.summary === 'string' ? normalized.summary : '';
  normalized.analysis = typeof normalized.analysis === 'string' ? normalized.analysis : '';
  normalized.action = typeof normalized.action === 'string' ? normalized.action : '';
  normalized.lead = typeof normalized.lead === 'string' ? normalized.lead : '';
  normalized.quickTake = typeof normalized.quickTake === 'string' ? normalized.quickTake : '';
  normalized.timeHint = typeof normalized.timeHint === 'string' ? normalized.timeHint : '';
  normalized.message = typeof normalized.message === 'string' ? normalized.message : '';
  normalized.closingLine = typeof normalized.closingLine === 'string' ? normalized.closingLine : '';
  normalized.kimonQuote = typeof normalized.kimonQuote === 'string' ? normalized.kimonQuote : '';
  normalized.buoc1_gocReVanDe = step1;
  normalized.buoc2_trangThaiMucTieu = step2;
  normalized.buoc3_noiLucVaTamLy = step3;
  normalized.buoc4_muuLuocHanhDong = step4;

  if (step1 && !normalized.tongQuan) normalized.tongQuan = step1;
  if (step1 && !normalized.lead) normalized.lead = step1;
  if (step4 && !normalized.closingLine) normalized.closingLine = extractClosingLineFromBlock(step4);
  if (step4 && !normalized.action) normalized.action = extractClosingLineFromBlock(step4);
  if (step2 || step3 || step4) {
    const combinedStepMessage = [step2, step3, step4].filter(Boolean).join('\n\n');
    if (combinedStepMessage && !normalized.message) normalized.message = combinedStepMessage;
    if ([step1, combinedStepMessage].filter(Boolean).join('\n\n') && !normalized.analysis) {
      normalized.analysis = [step1, combinedStepMessage].filter(Boolean).join('\n\n');
    }
  }

  if (!normalized.summary) normalized.summary = normalized.quickTake || normalized.lead || '';
  if (!normalized.analysis) {
    normalized.analysis = normalized.message || '';
    if (!normalized.analysis && normalized.timeHint) normalized.analysis = `Thời điểm: ${normalized.timeHint}`;
  }
  if (!normalized.action) normalized.action = normalized.closingLine || '';

  if (!normalized.lead) normalized.lead = normalized.summary;
  if (!normalized.quickTake) normalized.quickTake = normalized.summary;
  if (!normalized.message) normalized.message = normalized.analysis;
  if (!normalized.closingLine) normalized.closingLine = normalized.action;

  normalized.message = normalizeTextValue(normalized.message);
  normalized.lead = normalizeTextValue(normalized.lead);
  normalized.closingLine = normalizeTextValue(normalized.closingLine);

  if (!normalized.message) {
    const compositeMessage = [...new Set([normalized.lead, normalized.quickTake, normalized.timeHint, normalized.closingLine]
      .filter(Boolean))]
      .join('\n\n');
    if (compositeMessage) normalized.message = compositeMessage;
  }

  if (typeof normalized.traLoiTrucTiep !== 'string') {
    normalized.traLoiTrucTiep = normalized.message || normalized.lead || normalized.quickTake || '';
  }

  if (typeof normalized.thoiDiemGoiY !== 'string') {
    normalized.thoiDiemGoiY = normalized.timeHint || '';
  }

  if (normalized.message && !normalized.traLoiTrucTiep) {
    normalized.traLoiTrucTiep = normalized.message;
  }

  if (normalized.message && !normalized.tongQuan) {
    normalized.tongQuan = normalized.message;
  }

  // Reverse: populate lead/message from Deep Dive fields
  if (normalized.tongQuan && !normalized.lead) {
    normalized.lead = normalized.tongQuan;
  }
  if (normalized.tongQuan && !normalized.message) {
    const parts = [
      normalized.tamLy?.trangThai,
      normalized.tamLy?.dongChay,
      normalized.chienLuoc?.noiDung,
    ].filter(Boolean);
    normalized.message = parts.join('\n\n') || normalized.tongQuan;
  }
  if (normalized.kimonQuote && !normalized.closingLine) {
    normalized.closingLine = normalized.kimonQuote;
  }
  if (normalized.closingLine && !normalized.kimonQuote) {
    normalized.kimonQuote = normalized.closingLine;
  }

  if (normalized.timeHint && !normalized.thoiDiemGoiY) {
    normalized.thoiDiemGoiY = normalized.timeHint;
  }

  if (normalized.lead && !normalized.quickTake) {
    normalized.quickTake = normalized.lead;
  }

  if (!normalized.summary && normalized.quickTake) {
    normalized.summary = normalized.quickTake;
  }

  if (!normalized.analysis && normalized.message) {
    normalized.analysis = normalized.message;
  }

  if (!normalized.action && normalized.closingLine) {
    normalized.action = normalized.closingLine;
  }

  if (!normalized.tamLy || typeof normalized.tamLy !== 'object' || Array.isArray(normalized.tamLy)) {
    normalized.tamLy = {
      trangThai: '',
      dongChay: '',
    };
  } else {
    normalized.tamLy = {
      trangThai: typeof normalized.tamLy.trangThai === 'string' ? normalized.tamLy.trangThai : '',
      dongChay: typeof normalized.tamLy.dongChay === 'string' ? normalized.tamLy.dongChay : '',
    };
  }
  if (step3 && !normalized.tamLy.trangThai) normalized.tamLy.trangThai = step3;
  if (step2 && !normalized.tamLy.dongChay) normalized.tamLy.dongChay = step2;

  if (typeof normalized.chienLuoc === 'string') {
    normalized.chienLuoc = { noiDung: normalized.chienLuoc };
  } else if (!normalized.chienLuoc || typeof normalized.chienLuoc !== 'object' || Array.isArray(normalized.chienLuoc)) {
    normalized.chienLuoc = { noiDung: '' };
  } else {
    normalized.chienLuoc = {
      noiDung: typeof normalized.chienLuoc.noiDung === 'string' ? normalized.chienLuoc.noiDung : '',
    };
  }
  if (step4 && !normalized.chienLuoc.noiDung) normalized.chienLuoc.noiDung = step4;

  if (!Array.isArray(normalized.hanhDong)) {
    if (typeof normalized.hanhDong === 'string' && normalized.hanhDong.trim()) {
      normalized.hanhDong = [normalized.hanhDong.trim()];
    } else {
      normalized.hanhDong = [];
    }
  } else {
    normalized.hanhDong = normalized.hanhDong.filter(item => typeof item === 'string' && item.trim());
  }
  if (!normalized.hanhDong.length && step4) {
    normalized.hanhDong = extractMarkdownBulletItems(step4);
  }

  if (step4 && !normalized.kimonQuote) {
    normalized.kimonQuote = extractClosingLineFromBlock(step4);
  }

  if (!normalized.tongQuan) {
    normalized.tongQuan = createFallbackPayload(rawText).tongQuan;
  }

  return normalized;
}

export function parseKimonJsonResponse(rawText = '') {
  const candidate = extractJsonCandidate(rawText);
  try {
    const parsed = JSON.parse(candidate);
    return normalizeKimonPayload(parsed, rawText);
  } catch {
    const repaired = repairJsonLikeString(rawText);
    if (repaired) {
      try {
        const reparsed = JSON.parse(repaired);
        return normalizeKimonPayload(reparsed, rawText);
      } catch {}
    }
    const salvaged = salvageMalformedStructuredPayload(rawText);
    if (salvaged) {
      return normalizeKimonPayload(salvaged, rawText);
    }
    return createFallbackPayload(stripMarkdownCodeFences(rawText));
  }
}

export function coerceKimonResponsePayload(payload, rawText = '') {
  return normalizeKimonPayload(payload, rawText);
}

export function toKimonResponseSchema(payload, rawText = '') {
  // Check original payload for Deep Dive / Strategy fields BEFORE normalization
  const originalHasTongQuan = payload && typeof payload.tongQuan === 'string' && payload.tongQuan.trim();
  const originalHasVerdict = payload && typeof payload.verdict === 'string' && payload.verdict.trim();
  const originalHasKymonProSteps = Boolean(
    payload && [payload.buoc1_gocReVanDe, payload.buoc2_trangThaiMucTieu, payload.buoc3_noiLucVaTamLy, payload.buoc4_muuLuocHanhDong]
      .some(value => typeof value === 'string' && value.trim())
  );

  const normalized = normalizeKimonPayload(payload, rawText);

  const hasUsableSalvage = [normalized.lead, normalized.timeHint, normalized.message, normalized.closingLine]
    .some(value => typeof value === 'string' && value.trim());

  if (rawText && !extractBalancedJsonObject(rawText) && !hasUsableSalvage) {
    const fallback = createFallbackPayload(rawText);
    return {
      mode: fallback.mode,
      lead: fallback.lead,
      timeHint: fallback.timeHint,
      message: fallback.message,
      closingLine: fallback.closingLine,
    };
  }

  const hasStructuredBody = [normalized.lead, normalized.message, normalized.analysis, normalized.tongQuan]
    .some(value => typeof value === 'string' && value.trim());
  const closingLine = normalized.closingLine || (
    rawText && !extractBalancedJsonObject(rawText) && !hasStructuredBody
      ? PARTIAL_RESPONSE_ACTION
      : ''
  );
  const result = {
    mode: typeof normalized.mode === 'string' && normalized.mode.trim() ? normalized.mode.trim() : 'interpretation',
    lead: typeof normalized.lead === 'string' ? normalized.lead.trim() : '',
    timeHint: typeof normalized.timeHint === 'string' ? normalized.timeHint.trim() : '',
    message: typeof normalized.message === 'string' ? normalized.message.trim() : '',
    closingLine: typeof closingLine === 'string' ? closingLine.trim() : '',
  };

  // Preserve Deep Dive schema fields only when ORIGINAL payload had them
  if (originalHasTongQuan) {
    result.tongQuan = normalized.tongQuan;
    if (normalized.tamLy && (normalized.tamLy.trangThai || normalized.tamLy.dongChay)) result.tamLy = normalized.tamLy;
    if (normalized.chienLuoc && normalized.chienLuoc.noiDung) result.chienLuoc = normalized.chienLuoc;
    if (normalized.hanhDong && normalized.hanhDong.length) result.hanhDong = normalized.hanhDong;
    if (normalized.kimonQuote) result.kimonQuote = normalized.kimonQuote;
  }

  // Preserve Strategy schema fields only when ORIGINAL payload had them
  if (originalHasVerdict) {
    result.verdict = normalized.verdict;
    if (normalized.analysis) result.analysis = normalized.analysis;
    if (normalized.adversary) result.adversary = normalized.adversary;
    if (normalized.tactics) result.tactics = normalized.tactics;
  }

  if (originalHasKymonProSteps) {
    if (normalized.buoc1_gocReVanDe) result.buoc1_gocReVanDe = normalized.buoc1_gocReVanDe;
    if (normalized.buoc2_trangThaiMucTieu) result.buoc2_trangThaiMucTieu = normalized.buoc2_trangThaiMucTieu;
    if (normalized.buoc3_noiLucVaTamLy) result.buoc3_noiLucVaTamLy = normalized.buoc3_noiLucVaTamLy;
    if (normalized.buoc4_muuLuocHanhDong) result.buoc4_muuLuocHanhDong = normalized.buoc4_muuLuocHanhDong;
  }

  return result;
}
