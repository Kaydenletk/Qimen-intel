function stripMarkdownCodeFences(rawText = '') {
  return String(rawText)
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

function extractJsonCandidate(rawText = '') {
  const cleaned = stripMarkdownCodeFences(rawText);
  const match = cleaned.match(/\{[\s\S]*\}/);
  return (match ? match[0] : cleaned).trim();
}

function createFallbackPayload(rawText = '') {
  const message = String(rawText).trim() || 'Kymon chưa trả về nội dung rõ ràng.';
  return {
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

  if (typeof normalized.message === 'string' && !normalized.tongQuan) {
    normalized.tongQuan = normalized.message;
  }

  if (!normalized.tongQuan && rawText) {
    normalized.tongQuan = String(rawText).trim();
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

  if (typeof normalized.chienLuoc === 'string') {
    normalized.chienLuoc = { noiDung: normalized.chienLuoc };
  } else if (!normalized.chienLuoc || typeof normalized.chienLuoc !== 'object' || Array.isArray(normalized.chienLuoc)) {
    normalized.chienLuoc = { noiDung: '' };
  } else {
    normalized.chienLuoc = {
      noiDung: typeof normalized.chienLuoc.noiDung === 'string' ? normalized.chienLuoc.noiDung : '',
    };
  }

  if (!Array.isArray(normalized.hanhDong)) {
    if (typeof normalized.hanhDong === 'string' && normalized.hanhDong.trim()) {
      normalized.hanhDong = [normalized.hanhDong.trim()];
    } else {
      normalized.hanhDong = [];
    }
  } else {
    normalized.hanhDong = normalized.hanhDong.filter(item => typeof item === 'string' && item.trim());
  }

  normalized.kimonQuote = typeof normalized.kimonQuote === 'string' ? normalized.kimonQuote : '';

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
    return createFallbackPayload(stripMarkdownCodeFences(rawText));
  }
}

export function coerceKimonResponsePayload(payload, rawText = '') {
  return normalizeKimonPayload(payload, rawText);
}
