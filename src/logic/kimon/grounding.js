import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { canonicalizeTopicKey } from './detectTopic.js';
import { normalizeLooseVietnameseText, toTightSearchKey } from './textNormalization.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../../');
const DEFAULT_NO_SOURCE_REASON = 'Chưa đủ thư tịch đã nạp';
const DEFAULT_METHODOLOGY_ONLY_REASON = 'Luận theo nguyên lý cơ bản do chưa có đoạn chuyên biệt';
const DEFAULT_GROUNDED_REASON = 'Luận theo thư tịch trực tiếp';
const METHODOLOGY_ADJACENT_THRESHOLD = 6;
const TOPICAL_SCORE_MIN = 2;
const MAX_TOPICAL_CHUNKS = 4;

const READY_SOURCE_STATUS = 'ready_text';
const SOURCE_REGISTRY = Object.freeze([
  {
    sourceId: 'truong-hai-ban',
    title: 'Kỳ môn độn giáp Trương Hải Ban',
    kind: 'book',
    status: READY_SOURCE_STATUS,
    priority: 100,
    language: 'vi',
    fileNameHints: [
      'Kỳ môn đọn giápTrương hải ban.txt',
      'Ky mon don giapTruong hai ban.txt',
    ],
  },
  {
    sourceId: 'kmdg-pdf',
    title: 'KMĐG',
    kind: 'book',
    status: 'missing_text',
    priority: 50,
    language: 'vi',
    fileNameHints: ['KMĐG.pdf', 'KMDG.pdf'],
  },
  {
    sourceId: 'joey-yap-compendium',
    title: 'Joey Yap Qi Men Dun Jia Compendium',
    kind: 'book',
    status: 'missing_text',
    priority: 50,
    language: 'en',
    fileNameHints: ['Joey-yap-qi-men-dun-jia-compendium.pdf'],
  },
]);

const METHODOLOGY_HINTS = [
  'can ngay',
  'can thang',
  'can gio',
  'nhat can',
  'dung than',
  'truc phu',
  'truc su',
  'cua khai',
  'khai mon',
  'sinh mon',
  'cua sinh',
  'can mau',
  'cung khon',
];

const KNOWN_QMDJ_MARKERS = [
  'khai mon',
  'cua khai',
  'sinh mon',
  'cua sinh',
  'canh mon',
  'cua canh',
  'tu mon',
  'cua tu',
  'do mon',
  'cua do',
  'huu mon',
  'cua huu',
  'kinh mon',
  'cua kinh',
  'thuong mon',
  'cua thuong',
  'can ngay',
  'can thang',
  'can gio',
  'nhat can',
  'truc phu',
  'truc su',
  'mau',
  'can mau',
  'khon',
  'cung 2',
  'cung khon',
];

const TOPIC_ALIAS_MAP = Object.freeze({
  'su-nghiep': ['cong viec', 'thang chuc', 'khai mon', 'cua khai', 'chuc vu', 'cong danh'],
  'tai-van': ['tai chinh', 'loi nhuan', 'sinh mon', 'cua sinh', 'mau', 'can mau', 'von'],
  'mang-thai': ['mang thai', 'thai', 'sinh no', 'khon', 'cung 2', 'cung khon'],
});

const SEARCH_STOPWORDS = new Set([
  'a', 'ai', 'anh', 'ban', 'bao', 'bay', 'bi', 'co', 'cua', 'cho', 'chi', 'da', 'dang',
  'de', 'di', 'do', 'duoc', 'gio', 'gi', 'ha', 'hay', 'het', 'hom', 'khi', 'khong', 'la',
  'lai', 'lam', 'luc', 'minh', 'mot', 'nao', 'nay', 'neu', 'nguoi', 'nhung', 'nhe', 'nua',
  'roi', 'ra', 'sao', 'se', 'tai', 'the', 'thi', 'toi', 'tra', 'trong', 'tu', 'va', 'voi',
]);

let cachedCorpus = null;
let cachedSignature = '';

function listRootFiles(repoRoot = REPO_ROOT) {
  return fs.readdirSync(repoRoot, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => entry.name);
}

function resolveSourcePath(entry, repoRoot = REPO_ROOT) {
  if (!entry?.fileNameHints?.length) return null;
  const rootFiles = listRootFiles(repoRoot);
  const normalizedHints = new Set(entry.fileNameHints.map(hint => normalizeLooseVietnameseText(hint)));

  for (const fileName of rootFiles) {
    if (normalizedHints.has(normalizeLooseVietnameseText(fileName))) {
      return path.join(repoRoot, fileName);
    }
  }

  return null;
}

function normalizeSourceText(raw = '') {
  return String(raw)
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function looksLikeHeading(paragraph = '') {
  const trimmed = paragraph.trim();
  if (!trimmed) return false;
  if (trimmed.length > 100) return false;
  return !/[.!?;:]$/.test(trimmed);
}

function buildSectionsFromText(rawText = '') {
  const paragraphs = normalizeSourceText(rawText)
    .split(/\n{2,}/)
    .map(paragraph => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const sections = [];
  let current = [];
  let currentLength = 0;

  const flushCurrent = () => {
    if (!current.length) return;
    sections.push(current);
    current = [];
    currentLength = 0;
  };

  for (const paragraph of paragraphs) {
    const paragraphLength = paragraph.length;
    const shouldStartNewSection = looksLikeHeading(paragraph) || (current.length && currentLength + paragraphLength > 2200);

    if (shouldStartNewSection) flushCurrent();

    current.push(paragraph);
    currentLength += paragraphLength + 2;
  }

  flushCurrent();
  return sections;
}

function buildChunkId(sourceId, sectionIndex, chunkIndex) {
  return `${sourceId}-s${String(sectionIndex).padStart(2, '0')}-c${String(chunkIndex).padStart(2, '0')}`;
}

function splitOversizedParagraph(paragraph = '', maxLength = 820, overlap = 180) {
  const source = String(paragraph || '').trim();
  if (!source || source.length <= maxLength) return source ? [source] : [];

  const parts = [];
  let start = 0;

  while (start < source.length) {
    let end = Math.min(start + maxLength, source.length);
    if (end < source.length) {
      const softBreak = source.lastIndexOf(' ', end);
      if (softBreak > start + 420) {
        end = softBreak;
      }
    }

    const piece = source.slice(start, end).trim();
    if (!piece) break;
    parts.push(piece);
    if (end >= source.length) break;

    start = Math.max(end - overlap, start + 1);
    while (start < source.length && source[start] === ' ') start += 1;
  }

  return parts;
}

function createChunksForSection({ sourceId, sectionKey, sectionParagraphs = [], sectionIndex = 1 } = {}) {
  const paragraphUnits = sectionParagraphs.flatMap(paragraph => splitOversizedParagraph(paragraph));
  const chunks = [];
  let startIndex = 0;
  let chunkIndex = 1;

  while (startIndex < paragraphUnits.length) {
    let endIndex = startIndex;
    let chunkText = '';

    while (endIndex < paragraphUnits.length) {
      const candidate = chunkText
        ? `${chunkText}\n\n${paragraphUnits[endIndex]}`
        : paragraphUnits[endIndex];
      if (chunkText && candidate.length > 900) break;
      chunkText = candidate;
      endIndex += 1;
      if (chunkText.length >= 650) break;
    }

    if (!chunkText) {
      chunkText = paragraphUnits[startIndex] || '';
      endIndex = startIndex + 1;
    }

    const chunkId = buildChunkId(sourceId, sectionIndex, chunkIndex);
    chunks.push({
      sourceId,
      sectionKey,
      chunkId,
      text: chunkText.trim(),
      searchKey: normalizeLooseVietnameseText(chunkText),
      tightSearchKey: toTightSearchKey(chunkText),
      chunkRole: 'topical',
      prevChunkId: null,
      nextChunkId: null,
    });

    chunkIndex += 1;
    startIndex = endIndex > startIndex + 1 ? endIndex - 1 : endIndex;
  }

  for (let index = 0; index < chunks.length; index++) {
    const prev = chunks[index - 1];
    const next = chunks[index + 1];
    chunks[index].prevChunkId = prev?.chunkId || null;
    chunks[index].nextChunkId = next?.chunkId || null;
  }

  return chunks;
}

function scoreMethodologyChunk(chunk) {
  let score = 0;
  for (const hint of METHODOLOGY_HINTS) {
    if (chunk.searchKey.includes(hint) || chunk.tightSearchKey.includes(toTightSearchKey(hint))) {
      score += 3;
    }
  }
  return score;
}

function buildSourceDocument(entry, repoRoot = REPO_ROOT) {
  const resolvedPath = resolveSourcePath(entry, repoRoot);
  if (!resolvedPath || entry.status !== READY_SOURCE_STATUS) {
    return {
      ...entry,
      resolvedPath: resolvedPath || null,
      available: false,
      chunks: [],
    };
  }

  const rawText = fs.readFileSync(resolvedPath, 'utf8');
  const sections = buildSectionsFromText(rawText);
  const chunks = sections.flatMap((sectionParagraphs, sectionIndex) => createChunksForSection({
    sourceId: entry.sourceId,
    sectionKey: `${entry.sourceId}:section:${String(sectionIndex + 1).padStart(2, '0')}`,
    sectionParagraphs,
    sectionIndex: sectionIndex + 1,
  }));

  return {
    ...entry,
    resolvedPath,
    available: chunks.length > 0,
    chunks,
  };
}

function buildCorpusSignature(registry = SOURCE_REGISTRY, repoRoot = REPO_ROOT) {
  return registry.map(entry => {
    const resolvedPath = resolveSourcePath(entry, repoRoot);
    const stat = resolvedPath ? fs.statSync(resolvedPath) : null;
    return [
      entry.sourceId,
      entry.status,
      resolvedPath || 'missing',
      stat?.mtimeMs || 0,
      stat?.size || 0,
    ].join(':');
  }).join('|');
}

function createGroundingCorpus({ registry = SOURCE_REGISTRY, repoRoot = REPO_ROOT } = {}) {
  const sourceDocs = registry.map(entry => buildSourceDocument(entry, repoRoot));
  const readySources = sourceDocs.filter(source => source.status === READY_SOURCE_STATUS && source.available);
  const allChunks = readySources.flatMap(source => source.chunks.map(chunk => ({
    ...chunk,
    title: source.title,
    priority: source.priority,
  })));

  let methodologyChunkId = null;
  let bestMethodologyScore = -1;
  for (const chunk of allChunks) {
    const score = scoreMethodologyChunk(chunk) + (chunk.priority || 0) / 100;
    if (score > bestMethodologyScore) {
      bestMethodologyScore = score;
      methodologyChunkId = chunk.chunkId;
    }
  }

  const chunks = allChunks.map(chunk => chunk.chunkId === methodologyChunkId
    ? { ...chunk, chunkRole: 'methodology' }
    : chunk);

  return {
    registry: sourceDocs,
    readySources,
    chunks,
    methodologyChunk: chunks.find(chunk => chunk.chunkId === methodologyChunkId) || null,
  };
}

function getGroundingCorpus(options = {}) {
  const signature = buildCorpusSignature(options.registry, options.repoRoot);
  if (cachedCorpus && cachedSignature === signature) return cachedCorpus;
  cachedCorpus = createGroundingCorpus(options);
  cachedSignature = signature;
  return cachedCorpus;
}

function uniqueNormalizedList(values = []) {
  return Array.from(new Set(
    values
      .map(value => normalizeLooseVietnameseText(value))
      .filter(Boolean)
  ));
}

function tokenizeSearchKey(text = '') {
  return uniqueNormalizedList(
    normalizeLooseVietnameseText(text)
      .split(' ')
      .filter(token => token.length >= 2 && !SEARCH_STOPWORDS.has(token))
  );
}

function extractChartMarkers(qmdjData = {}) {
  const rawFields = [
    qmdjData?.selectedTopicCanonicalDungThan?.targetSummary,
    qmdjData?.selectedTopicCanonicalDungThan?.matchedByText,
    qmdjData?.selectedTopicCanonicalDungThan?.boardText,
    qmdjData?.selectedTopicResult,
    qmdjData?.hourDoor,
    qmdjData?.hourStar,
    qmdjData?.hourDeity,
    qmdjData?.directEnvoyDoor,
    qmdjData?.directEnvoyStar,
    qmdjData?.directEnvoyDeity,
    qmdjData?.selectedTopicFlags?.join(' '),
  ].filter(Boolean).map(value => normalizeLooseVietnameseText(value));

  const markers = new Set();
  for (const marker of KNOWN_QMDJ_MARKERS) {
    if (rawFields.some(field => field.includes(marker))) {
      markers.add(marker);
    }
  }
  return Array.from(markers);
}

function buildRetrievalContext({ topic = 'chung', qmdjData = {}, userContext = '', isAutoLoad = false } = {}) {
  const canonicalTopic = canonicalizeTopicKey(topic || qmdjData?.selectedTopicKey || 'chung') || 'chung';
  const effectiveQuery = isAutoLoad || userContext === '__AUTO_LOAD__' ? '' : userContext;
  const queryKey = normalizeLooseVietnameseText(effectiveQuery);
  const aliasPhrases = TOPIC_ALIAS_MAP[canonicalTopic] || [];
  const markerPhrases = extractChartMarkers({
    ...qmdjData,
    selectedTopicKey: qmdjData?.selectedTopicKey || canonicalTopic,
  });
  const exactPhrases = uniqueNormalizedList([queryKey, ...aliasPhrases.filter(alias => alias.includes(' '))]);
  const aliasList = uniqueNormalizedList(aliasPhrases);
  const markerList = uniqueNormalizedList(markerPhrases);
  const queryTokens = tokenizeSearchKey(queryKey);

  return {
    canonicalTopic,
    queryKey,
    queryTokens,
    exactPhrases,
    aliasPhrases: aliasList,
    markerPhrases: markerList,
  };
}

function chunkContainsPhrase(chunk, phrase = '') {
  if (!phrase) return false;
  const tightPhrase = toTightSearchKey(phrase);
  return chunk.searchKey.includes(phrase) || (tightPhrase && chunk.tightSearchKey.includes(tightPhrase));
}

function scoreTopicalChunk(chunk, context) {
  if (chunk.chunkRole === 'methodology') {
    return { score: 0, exactHits: [], aliasHits: [], markerHits: [], tokenHits: [] };
  }

  const exactHits = context.exactPhrases.filter(phrase => phrase && chunkContainsPhrase(chunk, phrase));
  const aliasHits = context.aliasPhrases.filter(phrase => phrase && chunkContainsPhrase(chunk, phrase));
  const markerHits = context.markerPhrases.filter(phrase => phrase && chunkContainsPhrase(chunk, phrase));
  const tokenHits = context.queryTokens.filter(token => token && (
    chunk.searchKey.includes(token) || chunk.tightSearchKey.includes(token)
  ));

  let score = 0;
  if (context.queryKey && chunkContainsPhrase(chunk, context.queryKey)) score += 9;
  score += exactHits.filter(phrase => phrase !== context.queryKey).length * 6;
  score += aliasHits.length * 3;
  score += markerHits.length * 2;
  score += Math.min(tokenHits.length, 6) * 0.5;
  if (aliasHits.length && markerHits.length) score += 2;

  return { score, exactHits, aliasHits, markerHits, tokenHits };
}

function groupChunksBySource(chunks = []) {
  const grouped = new Map();
  for (const chunk of chunks) {
    const current = grouped.get(chunk.sourceId) || {
      sourceId: chunk.sourceId,
      title: chunk.title,
      chunkIds: [],
    };
    current.chunkIds.push(chunk.chunkId);
    grouped.set(chunk.sourceId, current);
  }
  return Array.from(grouped.values());
}

function selectAdjacentChunk(topicalCandidates = [], chunkMap = new Map()) {
  const best = topicalCandidates[0];
  if (!best || best.score < METHODOLOGY_ADJACENT_THRESHOLD) return null;

  const neighborIds = [best.prevChunkId, best.nextChunkId].filter(Boolean);
  const neighbors = neighborIds
    .map(chunkId => chunkMap.get(chunkId))
    .filter(chunk => chunk && chunk.sectionKey === best.sectionKey);

  return neighbors[0] || null;
}

function createGroundingBundleFromCorpus({
  topic = 'chung',
  qmdjData = {},
  userContext = '',
  isAutoLoad = false,
  corpus = null,
  registry = SOURCE_REGISTRY,
  repoRoot = REPO_ROOT,
} = {}) {
  const activeCorpus = corpus || getGroundingCorpus({ registry, repoRoot });

  if (!activeCorpus.readySources.length || !activeCorpus.methodologyChunk) {
    return {
      mode: 'no_source',
      strict: true,
      methodologyChunk: null,
      topicalChunks: [],
      sources: [],
      reason: DEFAULT_NO_SOURCE_REASON,
    };
  }

  const context = buildRetrievalContext({ topic, qmdjData, userContext, isAutoLoad });
  const chunkMap = new Map(activeCorpus.chunks.map(chunk => [chunk.chunkId, chunk]));
  const scoredTopicalChunks = activeCorpus.chunks
    .map(chunk => ({ ...chunk, ...scoreTopicalChunk(chunk, context) }))
    .filter(chunk => chunk.score >= TOPICAL_SCORE_MIN)
    .sort((left, right) => right.score - left.score || left.chunkId.localeCompare(right.chunkId));

  const topicalChunks = scoredTopicalChunks.slice(0, MAX_TOPICAL_CHUNKS);
  const adjacentChunk = selectAdjacentChunk(topicalChunks, chunkMap);
  const extendedTopicalChunks = adjacentChunk && !topicalChunks.some(chunk => chunk.chunkId === adjacentChunk.chunkId)
    ? [...topicalChunks, adjacentChunk]
    : topicalChunks;

  const sources = groupChunksBySource([
    activeCorpus.methodologyChunk,
    ...extendedTopicalChunks,
  ]);

  if (!extendedTopicalChunks.length) {
    return {
      mode: 'methodology_only',
      strict: true,
      methodologyChunk: activeCorpus.methodologyChunk,
      topicalChunks: [],
      sources,
      reason: DEFAULT_METHODOLOGY_ONLY_REASON,
    };
  }

  return {
    mode: 'grounded',
    strict: true,
    methodologyChunk: activeCorpus.methodologyChunk,
    topicalChunks: extendedTopicalChunks,
    sources,
    reason: DEFAULT_GROUNDED_REASON,
  };
}

function formatPromptChunk(chunk) {
  if (!chunk) return '';
  return [
    `- Nguồn: ${chunk.title} | ${chunk.chunkId}`,
    chunk.text,
  ].join('\n');
}

export function buildGroundingUserContext(groundingBundle = null) {
  if (!groundingBundle || groundingBundle.mode === 'no_source') return '';

  const lines = [
    '[THƯ TỊCH BẮT BUỘC]',
    `- Chế độ grounding: ${groundingBundle.mode}.`,
    `- Lý do: ${groundingBundle.reason}.`,
    '- Chỉ được kết luận từ các trích đoạn dưới đây và dữ liệu trận đồ.',
    '- Nếu thư tịch chưa nói đủ, phải nói rõ giới hạn thay vì tự lấp chỗ trống.',
    '',
    '[NGUYÊN LÝ CỐT LÕI]',
    formatPromptChunk(groundingBundle.methodologyChunk),
    '',
    '[TRÍCH ĐOẠN LIÊN QUAN]',
  ];

  if (groundingBundle.topicalChunks.length) {
    for (const chunk of groundingBundle.topicalChunks) {
      lines.push(formatPromptChunk(chunk));
      lines.push('');
    }
  } else {
    lines.push('- Không có đoạn chuyên biệt khớp trực tiếp; chỉ được luận từ nguyên lý cơ bản + dữ liệu trận đồ.');
    lines.push('');
  }

  if (groundingBundle.mode === 'methodology_only') {
    lines.push('[GIỚI HẠN THƯ TỊCH]');
    lines.push('- Thư tịch hiện chưa có đoạn chuyên biệt cho case này. Hãy nói rõ đây là suy luận từ nguyên lý cơ bản của sách + tín hiệu bàn cờ.');
  }

  return lines.filter(Boolean).join('\n');
}

export function appendGroundingSystemRules(systemPrompt = '', groundingBundle = null) {
  if (!groundingBundle || groundingBundle.mode === 'no_source') return systemPrompt;

  const rules = [
    '[GROUNDING BẮT BUỘC]',
    '- Chỉ được dùng [NGUYÊN LÝ CỐT LÕI], [TRÍCH ĐOẠN LIÊN QUAN] và dữ liệu trận đồ để kết luận.',
    '- Không dùng kiến thức mạng, trí nhớ chung, hay suy diễn ngoài thư tịch đã nạp.',
    '- Mọi kết luận kỹ thuật phải bám đúng trích đoạn; nếu không đủ, nói rõ giới hạn.',
  ];

  if (groundingBundle.mode === 'methodology_only') {
    rules.push('- Vì đây là mode methodology_only, phải nói rõ thư tịch chưa ghi chép trực tiếp case này và chỉ luận ở mức nguyên lý cơ bản.');
  }

  return `${systemPrompt}\n\n${rules.join('\n')}`;
}

export function toClientGroundingMeta(groundingBundle = null) {
  if (!groundingBundle) return null;
  return {
    mode: groundingBundle.mode,
    strict: Boolean(groundingBundle.strict),
    reason: groundingBundle.reason || '',
    sources: Array.isArray(groundingBundle.sources) ? groundingBundle.sources.map(source => ({
      sourceId: source.sourceId,
      title: source.title,
      chunkIds: Array.isArray(source.chunkIds) ? [...source.chunkIds] : [],
    })) : [],
  };
}

export function getKimonGroundingBundle(options = {}) {
  return createGroundingBundleFromCorpus(options);
}

export const __test = {
  SOURCE_REGISTRY,
  buildCorpusSignature,
  buildGroundingUserContext,
  buildRetrievalContext,
  buildSectionsFromText,
  createChunksForSection,
  createGroundingBundleFromCorpus,
  createGroundingCorpus,
  getGroundingCorpus,
  normalizeSourceText,
  resolveSourcePath,
  scoreMethodologyChunk,
  scoreTopicalChunk,
};
