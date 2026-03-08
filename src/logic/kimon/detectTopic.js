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
    'tiền', 'tài chính', 'tài sản',
    // Kênh đầu tư & thị trường
    'chứng khoán', 'cổ phiếu', 'trái phiếu', 'crypto', 'coin', 'vàng', 'gold', 'forex',
    // Hành động trading
    'đầu tư', 'xuống tiền', 'rút tiền', 'bơm vốn', 'trade', 'mua vào', 'bán ra',
    // Từ lóng trading
    'đu đỉnh', 'bắt đáy', 'cắt lỗ', 'chốt lời', 'gồng lỗ', 'gồng lãi', 'bơm xả',
    // Kết quả tài chính
    'lời', 'lỗ', 'lãi', 'thua lỗ', 'cháy tài khoản', 'về bờ',
    'vốn', 'trading',
  ],
  'suc-khoe': [
    'bệnh', 'đau', 'khám', 'thuốc', 'bác sĩ', 'viện', 'sức khỏe', 'sức khoẻ',
    'mệt', 'ốm', 'gym', 'tập', 'chạy bộ', 'ngủ', 'stress', 'tinh thần',
  ],
  'tinh-duyen': [
    'crush', 'người yêu', 'bạn gái', 'bạn trai', 'yêu', 'hẹn hò', 'cưới',
    'hôn nhân', 'chia tay', 'tình cảm', 'thả thính', 'tán', 'ngoại tình',
    'vợ', 'chồng', 'người ấy', 'tình yêu',
  ],
  'su-nghiep': [
    'công việc', 'thăng chức', 'sếp', 'đồng nghiệp', 'lương', 'career',
    'nghỉ việc', 'chuyển việc', 'thuyên chuyển', 'sa thải', 'tăng lương',
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
    'thi', 'điểm', 'học', 'phỏng vấn', 'interview', 'bài tập', 'deadline', 'exam',
    'đỗ', 'trượt', 'ôn', 'luận văn', 'đồ án',
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
    'nhà', 'đất', 'BĐS', 'bất động sản', 'thuê', 'mua nhà', 'căn hộ',
    'chung cư', 'biệt thự', 'sổ đỏ', 'sang tên',
  ],
  'muu-luoc': [
    'mưu', 'chiến lược', 'strategy', 'kế hoạch dài hạn', 'tầm nhìn',
    'roadmap', 'pivot', 'mưu lược',
  ],
};

// ══════════════════════════════════════════════════════════════════════════════
// TIER MAP — topic key → tier
// ══════════════════════════════════════════════════════════════════════════════

const STRATEGY_TOPICS = new Set(['muu-luoc', 'dam-phan', 'doi-no', 'kien-tung']);
const COMPANION_TOPICS = new Set(['chung']);

function getTier(topic) {
  if (!topic || COMPANION_TOPICS.has(topic)) return 'companion';
  if (STRATEGY_TOPICS.has(topic)) return 'strategy';
  return 'topic';
}

// ══════════════════════════════════════════════════════════════════════════════
// ALL VALID TOPIC KEYS
// ══════════════════════════════════════════════════════════════════════════════

const VALID_TOPICS = new Set([
  'tai-van', 'suc-khoe', 'tinh-duyen', 'su-nghiep', 'kinh-doanh',
  'thi-cu', 'ky-hop-dong', 'dam-phan', 'doi-no', 'kien-tung',
  'xuat-hanh', 'xin-viec', 'bat-dong-san', 'muu-luoc', 'chung',
]);

// ══════════════════════════════════════════════════════════════════════════════
// NORMALIZE — strip diacritics for fuzzy matching
// ══════════════════════════════════════════════════════════════════════════════

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
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

  const msgLower = userMessage.toLowerCase();
  const msgNorm = normalize(userMessage);
  const words = msgNorm.split(/\s+/).filter(Boolean);

  // Too short & no keyword match → companion
  if (words.length < 2) {
    return { topic: null, confidence: null, tier: 'companion' };
  }

  let bestTopic = null;
  let bestScore = 0;

  for (const [topic, keywords] of Object.entries(ORIGINAL_KEYWORD_MAP)) {
    const normKeywords = NORMALIZED_KEYWORD_MAP[topic];

    for (let i = 0; i < keywords.length; i++) {
      // Try exact Vietnamese match first
      if (msgLower.includes(keywords[i].toLowerCase())) {
        const score = keywords[i].length; // Longer keyword = more specific
        if (score > bestScore) {
          bestScore = score;
          bestTopic = topic;
        }
      }
      // Fallback to normalized match
      else if (msgNorm.includes(normKeywords[i])) {
        const score = normKeywords[i].length;
        if (score > bestScore) {
          bestScore = score;
          bestTopic = topic;
        }
      }
    }
  }

  if (bestTopic) {
    return { topic: bestTopic, confidence: 'keyword', tier: getTier(bestTopic) };
  }

  return { topic: null, confidence: null, tier: 'companion' };
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
  const classifyPrompt = `Phân loại câu hỏi sau vào 1 trong các category. Chỉ trả về KEY, không giải thích.

Categories: tai-van, suc-khoe, tinh-duyen, su-nghiep, kinh-doanh, thi-cu, ky-hop-dong, dam-phan, doi-no, kien-tung, xuat-hanh, xin-viec, bat-dong-san, muu-luoc, chung

Câu hỏi: "${userMessage}"

KEY:`;

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
      return { topic: 'chung', confidence: 'ai', tier: 'companion' };
    }

    const data = await response.json();
    const text = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim().toLowerCase().replace(/[^a-z-]/g, '');

    if (VALID_TOPICS.has(text)) {
      return { topic: text, confidence: 'ai', tier: getTier(text) };
    }

    return { topic: 'chung', confidence: 'ai', tier: 'companion' };
  } catch {
    return { topic: 'chung', confidence: 'ai', tier: 'companion' };
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

  // Message too short for AI classify
  const words = (userMessage || '').split(/\s+/).filter(Boolean);
  if (words.length < 3) {
    return { topic: 'chung', confidence: 'fallback', tier: 'companion' };
  }

  // AI classify fallback
  if (apiKey) {
    return classifyWithAI(userMessage, apiKey);
  }

  return { topic: 'chung', confidence: 'fallback', tier: 'companion' };
}
