/**
 * comboAnalogies.js — Combo Analogy Library
 *
 * Thư viện ẩn dụ tổ hợp Môn + Thần (2 yếu tố)
 * 20 MVP Combos phổ biến nhất
 *
 * Mục đích: Biến các câu summary khô khan thành narrative sinh động
 * sử dụng Công thức 3 Lớp Sự Thật (Verdict → Analogy → Logic)
 */

// ══════════════════════════════════════════════════════════════════════════════
// COMBO ANALOGIES: Môn + Thần → Ẩn dụ sinh động
// ══════════════════════════════════════════════════════════════════════════════

export const COMBO_ANALOGIES = {
  // === CÁT COMBINATIONS (14) ===

  'Sinh|Cửu Thiên': {
    emoji: '🚀',
    analogy: 'Tên lửa rời bệ',
    meaning: 'Thời điểm tăng trưởng bùng nổ, tầm nhìn vươn xa. Hãy quyết liệt mở rộng.',
  },
  'Sinh|Lục Hợp': {
    emoji: '🤝',
    analogy: 'Hợp tác sinh lời',
    meaning: 'Phát triển qua kết nối, thuận lợi cho đối tác.',
  },
  'Sinh|Trực Phù': {
    emoji: '🌱',
    analogy: 'Quý nhân gieo hạt',
    meaning: 'Cơ hội tăng trưởng với hậu thuẫn từ người quyền lực.',
  },
  'Khai|Trực Phù': {
    emoji: '🎯',
    analogy: 'Quý nhân mở đường',
    meaning: 'Khởi đầu thuận lợi với sự hỗ trợ từ trên.',
  },
  'Khai|Cửu Thiên': {
    emoji: '🦅',
    analogy: 'Đại bàng cất cánh',
    meaning: 'Bắt đầu với tầm nhìn xa, tiềm năng bay cao.',
  },
  'Khai|Lục Hợp': {
    emoji: '🚪',
    analogy: 'Cửa hợp tác',
    meaning: 'Mở đường cho liên minh và kết nối.',
  },
  'Khai|Chu Tước': {
    emoji: '📢',
    analogy: 'Loa phóng thanh',
    meaning: 'Khởi đầu mới đi kèm truyền thông mạnh mẽ. Cần minh bạch lời nói.',
  },
  'Hưu|Cửu Địa': {
    emoji: '🔋',
    analogy: 'Pin đang sạc',
    meaning: 'Đang tích lũy nội lực, cần sự tĩnh lặng để hồi phục. Đừng ép máy chạy quá tải.',
  },
  'Hưu|Thái Âm': {
    emoji: '🌙',
    analogy: 'Trăng soi đường',
    meaning: 'Nghỉ ngơi với trực giác sáng, thời điểm để chiêm nghiệm.',
  },
  'Cảnh|Thái Âm': {
    emoji: '🔮',
    analogy: 'Ánh trăng soi đường',
    meaning: 'Cơ hội rõ ràng nhưng cần sự tinh tế, kín đáo. Không nên phô trương.',
  },
  'Cảnh|Lục Hợp': {
    emoji: '📡',
    analogy: 'Radar cơ hội',
    meaning: 'Phát hiện cơ hội qua mạng lưới, quan sát kỹ trước khi hành động.',
  },
  'Thương|Trực Phù': {
    emoji: '🛡️',
    analogy: 'Khiên chắn thép',
    meaning: 'Cạnh tranh gay gắt nhưng bạn đang nắm thế chủ động. Hãy kiên trì với kỷ luật.',
  },
  'Đỗ|Thái Âm': {
    emoji: '🎭',
    analogy: 'Ẩn mình chờ thời',
    meaning: 'Bí mật tích lũy năng lượng, không để lộ ý đồ.',
  },
  'Hưu|Lục Hợp': {
    emoji: '☕',
    analogy: 'Gặp gỡ thư giãn',
    meaning: 'Nghỉ ngơi với bạn bè, tái tạo năng lượng qua kết nối.',
  },

  // === HUNG COMBINATIONS (10) ===

  'Tử|Đằng Xà': {
    emoji: '☠️',
    analogy: 'Bẫy chết người',
    meaning: 'Nguy hiểm cao do lừa dối, cẩn thận thông tin sai lệch.',
  },
  'Tử|Câu Trận': {
    emoji: '⛓️',
    analogy: 'Xiềng xích',
    meaning: 'Bế tắc do ràng buộc cũ, cần cắt bỏ gánh nặng.',
  },
  'Tử|Thiên Nhuế': {
    emoji: '⚠️',
    analogy: 'Lỗi hệ thống',
    meaning: 'Bế tắc do những sai lầm cũ chưa giải quyết. Phải "fix bug" trước khi muốn chạy tiếp.',
  },
  'Kinh|Đằng Xà': {
    emoji: '😰',
    analogy: 'Ác mộng',
    meaning: 'Lo âu do tin đồn, tâm trí bị nhiễu bởi sợ hãi.',
  },
  'Kinh|Câu Trận': {
    emoji: '🛑',
    analogy: 'Vùng phong tỏa',
    meaning: 'Lo lắng đi kèm với rào cản cũ kỹ. Cần sự can đảm để phá vỡ xiềng xích.',
  },
  'Đỗ|Đằng Xà': {
    emoji: '🕸️',
    analogy: 'Mạng nhện rối rắm',
    meaning: 'Mọi thứ bị đình trệ do thông tin nhiễu loạn hoặc lo âu thái quá. Nên dừng lại quan sát.',
  },
  'Thương|Bạch Hổ': {
    emoji: '⚔️',
    analogy: 'Chiến trường',
    meaning: 'Xung đột dữ dội, có nguy cơ tổn thương.',
  },
  'Thương|Chu Tước': {
    emoji: '🔥',
    analogy: 'Lửa cháy',
    meaning: 'Tranh cãi gay gắt, lời nói có thể gây tổn thương.',
  },
  'Sinh|Bạch Hổ': {
    emoji: '⚡',
    analogy: 'Tăng trưởng rủi ro',
    meaning: 'Cơ hội có thật nhưng đi kèm nguy hiểm, cần cẩn thận.',
  },
  'Cảnh|Chu Tước': {
    emoji: '📣',
    analogy: 'Tiêu điểm chú ý',
    meaning: 'Mọi thứ phơi bày rõ ràng, dễ gặp thị phi nếu không cẩn thận.',
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// COMBO ANALOGIES: Môn + Tinh (Sao) → Ẩn dụ bổ sung
// ══════════════════════════════════════════════════════════════════════════════

export const COMBO_ANALOGIES_STAR = {
  'Tử|Thiên Nhuế': {
    emoji: '⚠️',
    analogy: 'Lỗi hệ thống',
    meaning: 'Bế tắc do những sai lầm cũ chưa giải quyết. Phải "fix bug" trước khi muốn chạy tiếp.',
  },
  'Sinh|Thiên Xung': {
    emoji: '💥',
    analogy: 'Bùng nổ đột phá',
    meaning: 'Tăng trưởng mạnh mẽ với năng lượng đột phá.',
  },
  'Khai|Thiên Tâm': {
    emoji: '🧠',
    analogy: 'Mở khóa trí tuệ',
    meaning: 'Khởi đầu với chiến lược rõ ràng và tư duy sắc bén.',
  },
  'Hưu|Thiên Nhậm': {
    emoji: '🐢',
    analogy: 'Rùa và Thỏ',
    meaning: 'Nghỉ ngơi để đi dài, kiên trì sẽ thắng.',
  },
  'Cảnh|Thiên Anh': {
    emoji: '🌟',
    analogy: 'Sao sáng trên trời',
    meaning: 'Rực rỡ và nổi bật, nhưng dễ cháy nhanh.',
  },
  'Thương|Thiên Xung': {
    emoji: '⚡',
    analogy: 'Sấm sét',
    meaning: 'Xung đột mạnh mẽ và nhanh chóng, có thể phá vỡ hoặc đột phá.',
  },
};

function withStemRule(defaultText, overrides = {}) {
  return { ...overrides, default: defaultText };
}

export const STEM_INTERACTION_RULES = {
  'Ất|Canh': withStemRule(
    'Ất khắc Canh: đường mềm đang bị ép va vào lưỡi cắt. Muốn giữ việc phải cực khéo, nếu cứng tay quá thì đứt nhịp.',
    {
      'tinh-duyen': 'Ất khắc Canh: vợ chồng dễ bất hòa vì cả hai đều giữ cái tôi và không chịu mềm đúng lúc.',
      'gia-dao': 'Ất khắc Canh: lời nói nhỏ nhưng sắc, càng nhịn càng thành vết cắt trong nhà.',
    }
  ),
  'Canh|Ất': withStemRule(
    'Canh khắc Ất: lực cứng đang lấn át đường mềm. Quyết quá thì nhanh, nhưng dễ để lại sẹo trong quan hệ.',
    {
      'tinh-duyen': 'Canh khắc Ất: chồng lấn át vợ, hoặc một bên quá cứng khiến gia đạo nhiều sóng gió.',
      'gia-dao': 'Canh khắc Ất: người mạnh tiếng đang đè người mềm lòng, nhà dễ mất cân bằng nếu cứ nói kiểu áp chế.',
    }
  ),
  'Giáp|Kỷ': withStemRule(
    'Giáp gặp Kỷ: ý muốn mở đường vấp phải lớp điều tiết và quy củ. Làm được, nhưng phải gỡ từng nút thay vì lao thẳng.'
  ),
  'Kỷ|Giáp': withStemRule(
    'Kỷ gặp Giáp: bên trong muốn thu xếp ổn định nhưng bên ngoài lại muốn bứt phá. Nếu không chốt ưu tiên, nhịp sẽ rất rối.'
  ),
  'Bính|Tân': withStemRule(
    'Bính gặp Tân: ánh sáng muốn soi thẳng nhưng thực tế lại bắt phải soi chi tiết. Chủ quan là hở ngay điểm yếu.'
  ),
  'Tân|Bính': withStemRule(
    'Tân gặp Bính: chi tiết nhỏ đang quyết định bức tranh lớn. Một lỗi rất mảnh cũng đủ làm toàn cục chệch đi.'
  ),
  'Đinh|Nhâm': withStemRule(
    'Đinh gặp Nhâm: ý tưởng bén gặp dòng việc lớn. Có tia chớp để xoay cục, nhưng nếu không khóa đúng điểm thì mọi thứ lại trôi mất.'
  ),
  'Nhâm|Đinh': withStemRule(
    'Nhâm gặp Đinh: dòng việc đang mạnh và rộng, còn cách giải quyết lại nhỏ nhưng sắc. Muốn thắng phải dùng đòn gọn, không được dàn trải.'
  ),
  'Mậu|Quý': withStemRule(
    'Mậu gặp Quý: nền vật chất hoặc cái tôi nặng đang vướng vào phần ẩm, ngấm và trì. Cần xử lý chỗ rò rỉ trước khi nghĩ tới mở rộng.'
  ),
  'Quý|Mậu': withStemRule(
    'Quý gặp Mậu: vấn đề không nổ lớn ngay, nhưng ngấm rất lâu vào phần nền. Cứ coi nhẹ thì sau này sửa cực mệt.'
  ),
  'Kỷ|Nhâm': withStemRule(
    'Kỷ gặp Nhâm: bên trong muốn gom việc về khuôn, nhưng thực tế lại trôi mạnh và đổi nhịp liên tục. Không khóa biên là loạn.',
    {
      'su-nghiep': 'Kỷ gặp Nhâm: bạn muốn sắp lại quy trình, nhưng dòng việc và người ngoài đang kéo mọi thứ đi quá nhanh.',
      'muu-luoc': 'Kỷ gặp Nhâm: đây là thế phải vừa giữ khuôn vừa chịu dòng biến động, hợp chiến lược chặn biên hơn là bung toàn lực.',
    }
  ),
  'Nhâm|Kỷ': withStemRule(
    'Nhâm gặp Kỷ: dòng việc lớn đè lên nỗ lực kiểm soát. Nếu cứ ôm hết, người hỏi rất dễ kiệt vì phải vá quá nhiều đầu mối.'
  ),
};

// ══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Normalize Môn name to short form (remove "Môn" suffix)
 * @param {string} monName - Full door name (e.g., "Sinh Môn", "Khai Môn")
 * @returns {string} Short form (e.g., "Sinh", "Khai")
 */
function normalizeMonName(monName) {
  if (!monName) return '';
  return monName.replace(' Môn', '').replace('Môn', '').trim();
}

/**
 * Find combo analogy for a given Môn + Thần combination
 *
 * @param {string} mon - Door name (e.g., "Sinh Môn", "Sinh", "Khai")
 * @param {string} than - Deity name (e.g., "Cửu Thiên", "Trực Phù")
 * @returns {Object|null} Combo object { emoji, analogy, meaning } or null
 */
export function findComboAnalogy(mon, than) {
  if (!mon || !than) return null;

  const monShort = normalizeMonName(mon);
  const comboKey = `${monShort}|${than}`;

  return COMBO_ANALOGIES[comboKey] || null;
}

/**
 * Find combo analogy for Môn + Tinh (Star) combination
 *
 * @param {string} mon - Door name (e.g., "Sinh Môn", "Sinh")
 * @param {string} star - Star name (e.g., "Thiên Xung", "Thiên Nhuế")
 * @returns {Object|null} Combo object { emoji, analogy, meaning } or null
 */
export function findStarComboAnalogy(mon, star) {
  if (!mon || !star) return null;

  const monShort = normalizeMonName(mon);
  const comboKey = `${monShort}|${star}`;

  return COMBO_ANALOGIES_STAR[comboKey] || null;
}

/**
 * Find the best combo analogy (prefers Môn+Thần, falls back to Môn+Tinh)
 *
 * @param {string} mon - Door name
 * @param {string} than - Deity name
 * @param {string} star - Star name
 * @returns {Object|null} Best matching combo object or null
 */
export function findBestComboAnalogy(mon, than, star) {
  // Priority: Môn + Thần (more impactful)
  const thanCombo = findComboAnalogy(mon, than);
  if (thanCombo) return { ...thanCombo, source: 'than' };

  // Fallback: Môn + Tinh
  const starCombo = findStarComboAnalogy(mon, star);
  if (starCombo) return { ...starCombo, source: 'star' };

  return null;
}

/**
 * Get combo insight string for display
 *
 * @param {string} mon - Door name
 * @param {string} than - Deity name
 * @returns {string|null} Formatted insight string or null
 */
export function getComboInsight(mon, than) {
  const combo = findComboAnalogy(mon, than);
  if (!combo) return null;

  return `${combo.emoji} **${combo.analogy}**: ${combo.meaning}`;
}

/**
 * Check if a Môn + Thần combination has a defined combo
 *
 * @param {string} mon - Door name
 * @param {string} than - Deity name
 * @returns {boolean}
 */
export function hasCombo(mon, than) {
  return findComboAnalogy(mon, than) !== null;
}

/**
 * Get all combo keys (for testing/debugging)
 * @returns {string[]}
 */
export function getAllComboKeys() {
  return Object.keys(COMBO_ANALOGIES);
}

function normalizeTopicKey(topicKey = '') {
  if (!topicKey) return '';
  if (topicKey === 'thi-cu') return 'hoc-tap';
  if (topicKey === 'tinh-yeu') return 'tinh-duyen';
  if (topicKey === 'dien-trach') return 'bat-dong-san';
  if (topicKey === 'chien-luoc') return 'muu-luoc';
  if (topicKey === 'gia-dinh') return 'gia-dao';
  return topicKey;
}

export function findStemInteractionRule(leftStem, rightStem, topicKey = '') {
  if (!leftStem || !rightStem) return null;
  const rule = STEM_INTERACTION_RULES[`${leftStem}|${rightStem}`];
  if (!rule) return null;
  const normalizedTopicKey = normalizeTopicKey(topicKey);
  return {
    pair: `${leftStem}|${rightStem}`,
    label: `${leftStem} gặp ${rightStem}`,
    text: rule[normalizedTopicKey] || rule.default || '',
    defaultText: rule.default || '',
  };
}

export function getStemInteractionInsight(leftStem, rightStem, topicKey = '') {
  const match = findStemInteractionRule(leftStem, rightStem, topicKey);
  return match?.text || null;
}
