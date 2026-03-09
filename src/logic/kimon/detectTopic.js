/**
 * detectTopic.js — Hybrid Topic Detection
 *
 * Keyword matching first, AI classify fallback.
 * Determines which tier (companion/topic/strategy) to route the request to.
 */

// ══════════════════════════════════════════════════════════════════════════════
// KEYWORD MAP — Vietnamese keywords → topic key
// ══════════════════════════════════════════════════════════════════════════════

const KEYWORD_MAP = {
  'tai-van': [
    'tiền', 'thủng ví', 'lương', 'thưởng', 'tài chính', 'tài sản',
    // Kênh đầu tư & thị trường
    'chứng khoán', 'cổ phiếu', 'trái phiếu', 'crypto', 'coin', 'tiền ảo', 'vàng', 'gold', 'forex',
    // Hành động trading
    'đầu tư', 'xuống tiền', 'rút tiền', 'bơm vốn', 'trade', 'mua vào', 'bán ra',
    // Từ lóng trading
    'đu đỉnh', 'bắt đáy', 'cắt lỗ', 'chốt lời', 'gồng lỗ', 'gồng lãi', 'bơm xả',
    // Kết quả tài chính
    'lời', 'lỗ', 'lãi', 'thua lỗ', 'cháy tài khoản', 'phá sản', 'về bờ',
    'vốn', 'trading', 'thu nhập',
  ],
  'suc-khoe': [
    'bệnh', 'đau', 'khám', 'thuốc', 'bác sĩ', 'viện', 'sức khỏe', 'sức khoẻ',
    'mệt', 'ốm', 'gym', 'tập', 'chạy bộ', 'ngủ', 'stress', 'tinh thần',
  ],
  'tinh-duyen': [
    'crush', 'người yêu', 'bạn gái', 'bạn trai', 'yêu', 'hẹn hò', 'cưới',
    'hôn nhân', 'chia tay', 'tình cảm', 'thả thính', 'tán', 'ngoại tình',
    'vợ', 'chồng', 'người ấy', 'tình yêu', 'cắm sừng', 'nyc', 'người yêu cũ',
    'mập mờ', 'lạnh nhạt', 'tán đổ', 'tiểu tam', 'bắt cá hai tay', 'vợ chồng', 'tỏ tình',
  ],
  'su-nghiep': [
    'công việc', 'thăng chức', 'sếp', 'đồng nghiệp', 'lương', 'career',
    'nghỉ việc', 'chuyển việc', 'thuyên chuyển', 'sa thải', 'tăng lương',
    'deadline', 'ot', 'nhảy việc', 'bị đuổi', 'lên chức', 'đồng nghiệp toxic', 'dự án',
  ],
  'kinh-doanh': [
    'kinh doanh', 'doanh thu', 'khách hàng', 'mở shop', 'startup', 'khai trương', 'bán hàng',
    // Vận hành & mở rộng
    'mở quán', 'mở công ty', 'khởi nghiệp', 'sang nhượng', 'mặt bằng',
    'nhượng quyền', 'đại lý', 'chi nhánh',
    // Hàng hóa & bán hàng
    'nhập hàng', 'xuất hàng', 'tồn kho', 'nguồn hàng', 'chốt sale', 'xả hàng', 'đơn hàng',
    // Kết quả & dòng tiền (kinh doanh)
    'lợi nhuận', 'doanh số', 'chi phí', 'dòng tiền', 'hòa vốn', 'phá sản',
    // Thị trường & tiếp thị
    'thương hiệu', 'đối tác', 'chạy ads', 'quảng cáo', 'thị trường', 'cạnh tranh', 'đối thủ',
  ],
  'thi-cu': [
    'thi', 'điểm', 'điểm số', 'phỏng vấn', 'interview', 'exam',
    'đỗ', 'trượt', 'kỳ thi', 'đề thi', 'tốt nghiệp', 'thi lại',
  ],
  'hoc-tap': [
    'học', 'học tập', 'học hành', 'đề cương', 'ôn thi', 'ôn bài',
    'bài tập', 'môn', 'test', 'giáo viên', 'thi cử',
    'deadline', 'luận văn', 'đồ án', 'tự học', 'giáo trình',
    'môn học', 'khóa học',
  ],
  'gia-dao': [
    'cãi nhau', 'mẹ chồng', 'gia đạo', 'bố mẹ', 'con cái', 'anh em',
    'họ hàng', 'gia đình', 'nhà chồng', 'nhà vợ', 'bất hòa',
  ],
  'ky-hop-dong': [
    'hợp đồng', 'ký', 'contract', 'thỏa thuận', 'deal', 'ký kết',
  ],
  'dam-phan': [
    'đàm phán', 'thương lượng', 'negotiate', 'offer', 'counteroffer',
    'thỏa hiệp', 'điều khoản',
  ],
  'doi-no': [
    'nợ', 'đòi', 'trả', 'thiếu', 'chưa trả', 'thu hồi', 'thanh toán',
  ],
  'kien-tung': [
    'kiện', 'tòa', 'luật', 'pháp lý', 'tranh chấp', 'luật sư', 'khởi kiện',
  ],
  'xuat-hanh': [
    'đi', 'bay', 'du lịch', 'chuyến', 'xe', 'máy bay', 'về quê',
    'xuất hành', 'visa', 'sân bay',
  ],
  'xin-viec': [
    'xin việc', 'CV', 'resume', 'apply', 'ứng tuyển', 'nhận việc',
    'offer letter', 'thực tập', 'intern',
  ],
  'bat-dong-san': [
    'nhà', 'đất', 'đất đai', 'BĐS', 'bất động sản', 'thuê', 'mua nhà', 'căn hộ',
    'chung cư', 'biệt thự', 'sổ đỏ', 'sang tên', 'bán đất', 'chốt cọc', 'thuê trọ',
  ],
  'muu-luoc': [
    'mưu', 'chiến lược', 'strategy', 'kế hoạch dài hạn', 'tầm nhìn',
    'roadmap', 'pivot', 'mưu lược',
  ],
  'chien-luoc': [
    'chiến lược', 'mưu lược', 'phân tích sâu', 'giải thích chi tiết',
  ],
};

// ══════════════════════════════════════════════════════════════════════════════
// TIER MAP — topic key → tier
// ══════════════════════════════════════════════════════════════════════════════

const STRATEGY_TOPICS = new Set(['tai-van', 'muu-luoc', 'chien-luoc']);

const TOPIC_ALIASES = {
  'tinh-yeu': 'tinh-duyen',
  'dien-trach': 'bat-dong-san',
  'chien-luoc': 'muu-luoc',
  'gia-dinh': 'gia-dao',
};

const KEYWORD_CONTEXT_EXCLUSIONS = {
  'tai-van': {
    'tiền': ['tiền đạo'],
  },
  'hoc-tap': {
    'môn': ['thủ môn'],
  },
  'doi-no': {
    'đòi': ['đội'],
  },
};

const DEEP_DIVE_KEYWORDS = [
  'cơ sở nào', 'tính sao ra', 'luận kỹ', 'phân tích sâu',
  'chi tiết hơn', 'tại sao lại chọn', 'vì sao lại chọn',
  'chiến lược', 'mưu lược', 'giải thích chi tiết',
];

const SMALL_TALK_EXACT_MATCHES = new Set([
  'hi',
  'hello',
  'alo',
  'a lo',
  'chao',
  'xin chao',
  'hello kymon',
  'hi kymon',
  'chao kymon',
  'ok',
  'oke',
  'okay',
  'ok ban',
  'oke ban',
  'cam on',
  'cam on nhe',
  'cam on nha',
  'cam on ban',
  'thanks',
  'thanks ban',
  'thank you',
  'hehe',
  'hihi',
  'haha',
]);

export function canonicalizeTopicKey(topic) {
  if (!topic || typeof topic !== 'string') return topic;
  return TOPIC_ALIASES[topic] || topic;
}

export function detectDeepDive(userMessage) {
  const q = normalize(userMessage || '');
  return DEEP_DIVE_KEYWORDS.some(keyword => q.includes(normalize(keyword)));
}

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasKeywordMatch(text, keyword) {
  if (!text || !keyword) return false;
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegex(keyword)}(?=[^\\p{L}\\p{N}]|$)`, 'u');
  return pattern.test(text);
}

function isKeywordBlocked(topic, keyword, normalizedMessage) {
  const blockedPhrases = KEYWORD_CONTEXT_EXCLUSIONS[topic]?.[keyword] || [];
  return blockedPhrases.some(phrase => normalizedMessage.includes(normalize(phrase)));
}

function getTier(topic) {
  const canonicalTopic = canonicalizeTopicKey(topic);
  if (!canonicalTopic) return 'topic';
  if (STRATEGY_TOPICS.has(canonicalTopic)) return 'strategy';
  return 'topic';
}

// ══════════════════════════════════════════════════════════════════════════════
// ALL VALID TOPIC KEYS
// ══════════════════════════════════════════════════════════════════════════════

const VALID_TOPICS = new Set([
  'tai-van', 'suc-khoe', 'tinh-duyen', 'su-nghiep', 'kinh-doanh',
  'thi-cu', 'hoc-tap', 'gia-dao', 'ky-hop-dong', 'dam-phan', 'doi-no', 'kien-tung',
  'xuat-hanh', 'xin-viec', 'bat-dong-san', 'muu-luoc', 'chien-luoc', 'chung',
]);

// ══════════════════════════════════════════════════════════════════════════════
// NORMALIZE — strip diacritics for fuzzy matching
// ══════════════════════════════════════════════════════════════════════════════

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

function normalizeLooseText(text) {
  return normalize(text)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isSmallTalkMessage(userMessage) {
  const normalized = normalizeLooseText(userMessage || '');
  if (!normalized) return false;
  return SMALL_TALK_EXACT_MATCHES.has(normalized);
}

// Pre-compute normalized keyword map for faster matching
const NORMALIZED_KEYWORD_MAP = {};
for (const [topic, keywords] of Object.entries(KEYWORD_MAP)) {
  NORMALIZED_KEYWORD_MAP[topic] = keywords.map(kw => normalize(kw));
}

// Original keywords for exact Vietnamese matching
const ORIGINAL_KEYWORD_MAP = KEYWORD_MAP;

// ══════════════════════════════════════════════════════════════════════════════
// KEYWORD DETECTION (sync)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * detectTopic — Sync keyword matching
 * @param {string} userMessage
 * @returns {{ topic: string|null, confidence: 'keyword'|null, tier: string }}
 */
export function detectTopic(userMessage) {
  if (!userMessage || typeof userMessage !== 'string') {
    return { topic: null, confidence: null, tier: 'companion' };
  }

  if (isSmallTalkMessage(userMessage)) {
    return { topic: 'chung', confidence: 'fallback', tier: 'companion' };
  }

  const msgLower = userMessage.toLowerCase();
  const msgNorm = normalize(userMessage);

  let bestTopic = null;
  let bestScore = 0;

  for (const [topic, keywords] of Object.entries(ORIGINAL_KEYWORD_MAP)) {
    const normKeywords = NORMALIZED_KEYWORD_MAP[topic];

    for (let i = 0; i < keywords.length; i++) {
      // Try exact Vietnamese match first
      if (hasKeywordMatch(msgLower, keywords[i].toLowerCase())) {
        if (isKeywordBlocked(topic, keywords[i], msgNorm)) continue;
        const score = keywords[i].length; // Longer keyword = more specific
        if (score > bestScore) {
          bestScore = score;
          bestTopic = topic;
        }
      }
      // Fallback to normalized match
      else if (hasKeywordMatch(msgNorm, normKeywords[i])) {
        if (isKeywordBlocked(topic, keywords[i], msgNorm)) continue;
        const score = normKeywords[i].length;
        if (score > bestScore) {
          bestScore = score;
          bestTopic = topic;
        }
      }
    }
  }

  if (bestTopic) {
    const canonicalTopic = canonicalizeTopicKey(bestTopic);
    return { topic: canonicalTopic, confidence: 'keyword', tier: getTier(canonicalTopic) };
  }

  return { topic: null, confidence: null, tier: 'topic' };
}

// ══════════════════════════════════════════════════════════════════════════════
// AI CLASSIFY FALLBACK (async)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * classifyWithAI — Gemini Flash classify call (~20 tokens)
 * @param {string} userMessage
 * @param {string} apiKey
 * @returns {Promise<{ topic: string, confidence: 'ai', tier: string }>}
 */
export async function classifyWithAI(userMessage, apiKey) {
  const classifyPrompt = `You are an intent classifier.
Read the user's Vietnamese message and return a strict JSON object only.
Do not explain. Do not use Markdown.

Valid topics: tai-van, suc-khoe, tinh-duyen, su-nghiep, kinh-doanh, thi-cu, hoc-tap, gia-dao, ky-hop-dong, dam-phan, doi-no, kien-tung, xuat-hanh, xin-viec, bat-dong-san, muu-luoc, chung
Valid tiers: companion, topic, strategy

Return exactly this shape:
{"topic":"<one valid topic>","tier":"<one valid tier>"}

User message: "${userMessage}"`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: classifyPrompt }] }],
          generationConfig: { maxOutputTokens: 20, temperature: 0 },
        }),
      }
    );

    if (!response.ok) {
      return {
        topic: 'chung',
        confidence: 'ai',
        tier: isSmallTalkMessage(userMessage) ? 'companion' : 'topic',
      };
    }

    const data = await response.json();
    const rawText = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    let parsedTopic = '';
    let parsedTier = '';

    try {
      const parsed = JSON.parse(rawText);
      parsedTopic = canonicalizeTopicKey(String(parsed?.topic || '').trim().toLowerCase());
      parsedTier = String(parsed?.tier || '').trim().toLowerCase();
    } catch {
      parsedTopic = canonicalizeTopicKey(rawText.toLowerCase().replace(/[^a-z-]/g, ''));
    }

    if (VALID_TOPICS.has(parsedTopic)) {
      const tier = parsedTopic === 'chung'
        ? (isSmallTalkMessage(userMessage) ? 'companion' : 'topic')
        : (
          parsedTier === 'companion' || parsedTier === 'topic' || parsedTier === 'strategy'
            ? parsedTier
            : getTier(parsedTopic)
        );
      return { topic: parsedTopic, confidence: 'ai', tier };
    }

    return {
      topic: 'chung',
      confidence: 'ai',
      tier: isSmallTalkMessage(userMessage) ? 'companion' : 'topic',
    };
  } catch {
    return {
      topic: 'chung',
      confidence: 'ai',
      tier: isSmallTalkMessage(userMessage) ? 'companion' : 'topic',
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// HYBRID DETECTION (async) — keyword first, AI fallback
// ══════════════════════════════════════════════════════════════════════════════

/**
 * detectTopicHybrid — Run keyword matching, fallback to AI classify
 * @param {string} userMessage
 * @param {string} apiKey
 * @returns {Promise<{ topic: string, confidence: string, tier: string }>}
 */
export async function detectTopicHybrid(userMessage, apiKey) {
  const keywordResult = detectTopic(userMessage);

  if (keywordResult.topic !== null) {
    return keywordResult;
  }

  // AI classify fallback
  if (apiKey) {
    return classifyWithAI(userMessage, apiKey);
  }

  return { topic: 'chung', confidence: 'fallback', tier: 'topic' };
}
