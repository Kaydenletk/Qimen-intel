import { readFileSync } from 'node:fs';

const library = JSON.parse(
  readFileSync(new URL('../lib/usefulGodLibrary.json', import.meta.url), 'utf8')
);

const TOPIC_KEY_MAP = {
  'tai-van': { libraryKey: 'MONEY_INVEST', strength: 'strong' },
  'kinh-doanh': { libraryKey: 'MONEY_INVEST', strength: 'strong' },
  'ky-hop-dong': { libraryKey: 'MONEY_INVEST', strength: 'strong' },
  'dam-phan': { libraryKey: 'MONEY_INVEST', strength: 'strong' },
  'doi-no': { libraryKey: 'MONEY_INVEST', strength: 'strong' },
  'bat-dong-san': { libraryKey: 'MONEY_INVEST', strength: 'strong' },
  'dien-trach': { libraryKey: 'MONEY_INVEST', strength: 'strong' },
  'su-nghiep': { libraryKey: 'CAREER_INTERVIEW', strength: 'strong' },
  'xin-viec': { libraryKey: 'CAREER_INTERVIEW', strength: 'strong' },
  'muu-luoc': { libraryKey: 'CAREER_INTERVIEW', strength: 'medium' },
  'kien-tung': { libraryKey: 'CAREER_INTERVIEW', strength: 'weak' },
  'thi-cu': { libraryKey: 'EXAM_STUDY', strength: 'strong' },
  'hoc-tap': { libraryKey: 'EXAM_STUDY', strength: 'strong' },
  'suc-khoe': { libraryKey: 'HEALTH_CHECK', strength: 'strong' },
  'tinh-duyen': { libraryKey: 'MONEY_INVEST', strength: 'weak' },
  'tinh-yeu': { libraryKey: 'MONEY_INVEST', strength: 'weak' },
  'xuat-hanh': { libraryKey: 'MONEY_INVEST', strength: 'weak' },
};

const ACTION_LABEL_MAP = {
  GO: 'Làm',
  GO_FAST: 'Làm',
  GO_WITH_GUARD: 'Làm',
  GO_LIGHT: 'Làm nhẹ',
  HOLD: 'Chờ',
  WAIT: 'Chờ',
  CUT: 'Tránh',
};

const FALLBACK_ONELINER = 'Chưa đủ dữ liệu để tạo khuyến nghị chi tiết.';

function normalizeText(raw) {
  if (!raw) return '';
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const DOOR_NAME_MAP = {
  khai: 'Khai',
  'khai mon': 'Khai',
  sinh: 'Sinh',
  'sinh mon': 'Sinh',
  huu: 'Huu',
  'huu mon': 'Huu',
  do: 'Do',
  'do mon': 'Do',
  thuong: 'Thuong',
  'thuong mon': 'Thuong',
  canh: 'Canh',
  'canh mon': 'Canh',
  kinh: 'Kinh',
  'kinh mon': 'Kinh',
  tu: 'Tu',
  'tu mon': 'Tu',
};

const STAR_NAME_MAP = {
  'thien bong': 'ThienBong',
  bong: 'ThienBong',
  'thien nhue': 'ThienNhue',
  nhue: 'ThienNhue',
  'thien xung': 'ThienXung',
  xung: 'ThienXung',
  'thien phu': 'ThienPhu',
  phu: 'ThienPhu',
  'thien cam': 'ThienCam',
  cam: 'ThienCam',
  'thien tam': 'ThienTam',
  tam: 'ThienTam',
  'thien tru': 'ThienTru',
  tru: 'ThienTru',
  'thien nham': 'ThienNham',
  nham: 'ThienNham',
  'thien anh': 'ThienAnh',
  anh: 'ThienAnh',
};

const DEITY_NAME_MAP = {
  'truc phu': 'TrucPhu',
  'dang xa': 'DangXa',
  'thai am': 'ThaiAm',
  'luc hop': 'LucHop',
  'bach ho': 'BachHo',
  'huyen vu': 'HuyenVu',
  'cuu dia': 'CuuDia',
  'cuu thien': 'CuuThien',
};

const STEM_NAME_MAP = {
  giap: 'Giáp',
  at: 'Ất',
  binh: 'Bính',
  dinh: 'Đinh',
  mau: 'Mậu',
  ky: 'Kỷ',
  canh: 'Canh',
  tan: 'Tân',
  nham: 'Nhâm',
  quy: 'Quý',
};

function normalizeDoorName(raw) {
  return DOOR_NAME_MAP[normalizeText(raw)] || null;
}

function normalizeStarName(raw) {
  return STAR_NAME_MAP[normalizeText(raw)] || null;
}

function normalizeDeityName(raw) {
  return DEITY_NAME_MAP[normalizeText(raw)] || null;
}

function normalizeStemName(raw) {
  return STEM_NAME_MAP[normalizeText(raw)] || null;
}

function resolveTopicMapping(topicKey, mappingNotes) {
  const mapped = TOPIC_KEY_MAP[topicKey];
  if (!mapped) {
    mappingNotes.push(`Topic "${topicKey}" chưa có mapping riêng, fallback MONEY_INVEST.`);
    return { libraryKey: 'MONEY_INVEST', strength: 'weak' };
  }

  if (mapped.strength !== 'strong') {
    mappingNotes.push(
      `Topic alias ${mapped.strength}: ${topicKey} → ${mapped.libraryKey}.`
    );
  }
  return mapped;
}

function actionLabelFromMode(actionMode) {
  return ACTION_LABEL_MAP[actionMode] || 'Chờ';
}

function pickOneLiner(topicProfile, actionMode, topicResult) {
  const candidates = [actionMode, 'GO_LIGHT', 'GO', 'HOLD', 'WAIT', 'CUT'];
  for (const mode of candidates) {
    const line = topicProfile?.oneLiners?.[mode];
    if (line) return line;
  }
  return topicResult?.actionAdvice || FALLBACK_ONELINER;
}

function uniqueLines(lines) {
  const seen = new Set();
  const out = [];
  for (const line of lines) {
    if (!line || seen.has(line)) continue;
    seen.add(line);
    out.push(line);
  }
  return out;
}

function resolveGlobalFlags(chart, globalFlags = {}) {
  return {
    VOID: Boolean(globalFlags.VOID),
    FU_YIN: Boolean(globalFlags.FU_YIN ?? chart?.isPhucAm),
    FAN_YIN: Boolean(globalFlags.FAN_YIN ?? chart?.isPhanNgam),
    DOOR_COMPELLING: Boolean(globalFlags.DOOR_COMPELLING),
    PALACE_COMPELLING: Boolean(globalFlags.PALACE_COMPELLING),
    GRAVE: Boolean(globalFlags.GRAVE),
  };
}

function collectFlags(chart, pal, globalFlags, mappingNotes) {
  const mergedFlags = new Map();
  const normalizedGlobal = resolveGlobalFlags(chart, globalFlags);

  const markFlag = (flag, source) => {
    if (!flag) return;
    const existing = mergedFlags.get(flag);
    if (existing) {
      existing.sources.add(source);
      return;
    }
    mergedFlags.set(flag, {
      name: flag,
      label: library.flags[flag]?.label || flag,
      severity: library.flags[flag]?.severity ?? null,
      multiplier: library.flags[flag]?.confidenceMultiplier ?? 1,
      sources: new Set([source]),
    });
  };

  if (pal?.khongVong) markFlag('VOID', 'local');
  if (pal?.trucSu) {
    markFlag('DOOR_COMPELLING', 'derived');
    mappingNotes.push('DOOR_COMPELLING được suy ra từ palace.trucSu.');
  }
  if (pal?.trucPhu) {
    markFlag('PALACE_COMPELLING', 'derived');
    mappingNotes.push('PALACE_COMPELLING được suy ra từ palace.trucPhu.');
  }

  for (const [flag, active] of Object.entries(normalizedGlobal)) {
    if (!active) continue;
    if (flag === 'GRAVE') {
      mappingNotes.push('GRAVE/Nhập Mộ chưa có module xác định, bỏ qua multiplier.');
      continue;
    }
    if (!library.flags[flag]) {
      mappingNotes.push(`Flag ${flag} chưa có trong library, bỏ qua multiplier.`);
      continue;
    }
    markFlag(flag, 'global');
  }

  if (pal?.dichMa) {
    mappingNotes.push('Dịch Mã có mặt tại cung dụng thần, chưa áp multiplier confidence.');
  }

  // Current core does not expose GRAVE/Nhập Mộ detection.
  if (!normalizedGlobal.GRAVE) {
    mappingNotes.push('GRAVE/Nhập Mộ chưa có module xác định, confidence giữ nguyên cho cờ này.');
  }

  return Array.from(mergedFlags.values()).map(flag => ({
    ...flag,
    source: Array.from(flag.sources).join('+'),
  }));
}

function computeConfidence(activeFlags) {
  let confidence = Number(library.meta?.defaultConfidence ?? 0.72);
  for (const flag of activeFlags) {
    const multiplier = Number(flag.multiplier ?? 1);
    confidence *= multiplier;
  }
  confidence = Math.max(0.1, Math.min(0.99, confidence));
  return Math.round(confidence * 1000) / 1000;
}

function matchUseful(item, context) {
  const { normalizedDoor, normalizedStar, normalizedDeity, normalizedHeavenStem, normalizedEarthStem, activeFlags } = context;

  if (item.type === 'Door') {
    return normalizedDoor === item.name;
  }
  if (item.type === 'Star') {
    return normalizedStar === item.name;
  }
  if (item.type === 'Deity') {
    return normalizedDeity === item.name;
  }
  if (item.type === 'Stem') {
    return normalizedHeavenStem === item.name || normalizedEarthStem === item.name;
  }
  if (item.type === 'Flag') {
    return activeFlags.some(f => f.name === item.name);
  }
  return false;
}

function pickActionMode(normalizedDoor) {
  if (normalizedDoor && library.doorProfiles?.[normalizedDoor]?.actionMode) {
    return library.doorProfiles[normalizedDoor].actionMode;
  }
  return 'HOLD';
}

function resolveTactics(topicProfile, normalizedDoor) {
  const topicDo = topicProfile?.tactics?.do;
  const topicAvoid = topicProfile?.tactics?.avoid;

  if (Array.isArray(topicDo) && topicDo.length && Array.isArray(topicAvoid) && topicAvoid.length) {
    return {
      do: topicDo,
      avoid: topicAvoid,
    };
  }

  const doorProfile = normalizedDoor ? library.doorProfiles?.[normalizedDoor] : null;
  return {
    do: Array.isArray(doorProfile?.do) ? doorProfile.do : [],
    avoid: Array.isArray(doorProfile?.avoid) ? doorProfile.avoid : [],
  };
}

function buildEvidence({ topicResult, topicProfile, activeFlags, confidence, mappingNotes, primaryHits, pal }) {
  const lines = [];
  lines.push(
    `Dụng thần tại ${topicResult?.usefulGodDir || '—'} · cung ${topicResult?.usefulGodPalace || '—'} (${topicResult?.usefulGodPalaceName || '—'}).`
  );

  if (primaryHits.length) {
    const hitText = primaryHits
      .map(h => `${h.type}:${h.name} (w=${h.weight})`)
      .join(', ');
    lines.push(`Match primaryUseful: ${hitText}.`);
  } else {
    lines.push(
      `Chưa match primaryUseful trực tiếp cho profile ${topicProfile?.title || 'N/A'}, dùng fallback theo score/verdict hiện tại.`
    );
  }

  const redFlags = activeFlags.map(f => `${f.label} x${f.multiplier}`);
  if (redFlags.length) {
    lines.push(`Flags ảnh hưởng confidence: ${redFlags.join(', ')}.`);
  } else {
    lines.push('Không có red-flag multiplier đang active ở cung dụng thần.');
  }

  lines.push(`Confidence sau điều chỉnh: ${confidence}.`);

  if (pal?.dichMa) {
    lines.push('Dịch Mã hiện diện tại cung dụng thần: ưu tiên hành động ngắn và có điểm dừng.');
  }

  if (mappingNotes.length) {
    lines.push(`Ghi chú mapping: ${mappingNotes[0]}`);
  }

  return uniqueLines(lines).slice(0, 5);
}

function buildFallbackInsight({ topicResult, errorMessage, mappingNotes }) {
  return {
    actionLabel: 'Chờ',
    oneLiner: topicResult?.actionAdvice || FALLBACK_ONELINER,
    confidence: Number(library.meta?.defaultConfidence ?? 0.72),
    evidence: [`Insight engine fallback: ${errorMessage}`],
    tactics: { do: [], avoid: [] },
    learn: {
      usefulGods: [],
      flags: [],
      mappingNotes: uniqueLines(mappingNotes),
    },
  };
}

export function buildInsight({ chart, topicKey, topicResult, globalFlags = {} }) {
  const mappingNotes = [];

  try {
    const mappedTopic = resolveTopicMapping(topicKey, mappingNotes);
    const topicProfile = library.topicMappings?.[mappedTopic.libraryKey] || null;

    if (!topicResult?.usefulGodPalace || !chart?.palaces) {
      mappingNotes.push('Thiếu usefulGodPalace hoặc chart.palaces, fallback insight.');
      return buildFallbackInsight({
        topicResult,
        errorMessage: 'missing chart/topicResult context',
        mappingNotes,
      });
    }

    const usefulPalace = topicResult.usefulGodPalace;
    const pal = chart.palaces[usefulPalace];

    if (!pal) {
      mappingNotes.push(`Không tìm thấy palace ${usefulPalace} trong chart.`);
      return buildFallbackInsight({
        topicResult,
        errorMessage: `palace ${usefulPalace} not found`,
        mappingNotes,
      });
    }

    const rawDoor = pal?.mon?.short || pal?.mon?.name || '';
    const rawStar = pal?.star?.name || pal?.star?.short || '';
    const rawDeity = pal?.than?.name || '';

    const normalizedDoor = normalizeDoorName(rawDoor);
    const normalizedStar = normalizeStarName(rawStar);
    const normalizedDeity = normalizeDeityName(rawDeity);
    const normalizedHeavenStem = normalizeStemName(pal?.can?.name || '');
    const normalizedEarthStem = normalizeStemName(pal?.earthStem || '');

    if (rawDoor && normalizedDoor) {
      mappingNotes.push(`Door normalized: ${rawDoor} -> ${normalizedDoor}.`);
    } else if (rawDoor) {
      mappingNotes.push(`Door chưa normalize được: ${rawDoor}.`);
    }

    if (rawStar && normalizedStar) {
      mappingNotes.push(`Star normalized: ${rawStar} -> ${normalizedStar}.`);
    } else if (rawStar) {
      mappingNotes.push(`Star chưa normalize được: ${rawStar}.`);
    }

    const activeFlags = collectFlags(chart, pal, globalFlags, mappingNotes);
    const confidence = computeConfidence(activeFlags);

    const context = {
      normalizedDoor,
      normalizedStar,
      normalizedDeity,
      normalizedHeavenStem,
      normalizedEarthStem,
      activeFlags,
    };

    const primaryUseful = Array.isArray(topicProfile?.primaryUseful) ? topicProfile.primaryUseful : [];
    const primaryHits = primaryUseful
      .filter(item => matchUseful(item, context))
      .map(item => ({
        type: item.type,
        name: item.name,
        weight: item.weight,
        sourcePalace: usefulPalace,
      }));

    const actionMode = pickActionMode(normalizedDoor);
    const actionLabel = actionLabelFromMode(actionMode);
    const oneLiner = pickOneLiner(topicProfile, actionMode, topicResult);

    const tactics = resolveTactics(topicProfile, normalizedDoor);
    const evidence = buildEvidence({
      topicResult,
      topicProfile,
      activeFlags,
      confidence,
      mappingNotes,
      primaryHits,
      pal,
    });

    const insight = {
      actionLabel,
      oneLiner,
      confidence,
      evidence,
      tactics,
      learn: {
        usefulGods: primaryHits,
        flags: activeFlags,
        mappingNotes: uniqueLines(mappingNotes),
      },
    };

    if (topicProfile?.disclaimer) {
      insight.disclaimer = topicProfile.disclaimer;
    }

    return insight;
  } catch (error) {
    return buildFallbackInsight({
      topicResult,
      errorMessage: error?.message || 'unknown error',
      mappingNotes,
    });
  }
}

export const __test = {
  library,
  TOPIC_KEY_MAP,
  normalizeDoorName,
  normalizeStarName,
  actionLabelFromMode,
  computeConfidence,
  resolveTopicMapping,
};
