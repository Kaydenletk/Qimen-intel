/**
 * energyFlowLogic.js — Energy Flow Summary Generator
 *
 * Generates a 3-4 sentence psychological/energy analysis based on:
 * - Nhật Can (Day Stem) position + Gate + Star + Deity
 * - Phản Ngâm/Phục Ngâm status
 * - Không Vong (Void) and Dịch Mã (Horse) indicators
 *
 * Output structure:
 * - Câu 1: Current mental state (Môn + Thần)
 * - Câu 2: Hidden conflict or advantage in thinking (Cung + Tinh)
 * - Câu 3: Energy blind spot (Void/Phản Ngâm)
 * - Câu 4: Advice to rebalance energy
 */

// ══════════════════════════════════════════════════════════════════════════════
// DOOR-BASED MENTAL STATE MAPPINGS (Môn + Thần → Trạng thái tinh thần)
// ══════════════════════════════════════════════════════════════════════════════

const DOOR_MENTAL_STATE = {
  'Khai': {
    positive: 'Bạn đang trong trạng thái mở, sẵn sàng đón nhận cơ hội mới và đưa ra quyết định dứt khoát.',
    neutral: 'Tâm trí bạn đang thông suốt, có thể nhìn vấn đề khá rõ ràng.',
    withBadDeity: 'Dù tâm trí mở nhưng có chút bất an ngầm, như thể có điều gì đó chưa đúng.',
  },
  'Sinh': {
    positive: 'Năng lượng tăng trưởng đang rất mạnh trong bạn, có động lực muốn mở rộng và phát triển.',
    neutral: 'Bạn có cảm giác hy vọng và muốn xây dựng điều gì đó mới.',
    withBadDeity: 'Dù có năng lượng tích cực nhưng bạn đang cảm thấy có lực cản từ bên ngoài.',
  },
  'Hưu': {
    positive: 'Tâm trạng đang ở pha nghỉ ngơi và hồi phục, cần không gian để tĩnh lặng.',
    neutral: 'Bạn cần nhịp thở, không nên ép bản thân phải hoạt động liên tục.',
    withBadDeity: 'Sự mệt mỏi có thể đang che mờ phán đoán, cần cẩn thận với quyết định lớn.',
  },
  'Đỗ': {
    positive: 'Bạn đang trong giai đoạn cần giữ kín, thu mình và quan sát.',
    neutral: 'Có vẻ bạn đang cảm thấy bế tắc hoặc muốn che giấu những dự định bên trong.',
    withBadDeity: 'Cảm giác mắc kẹt đang rất rõ, có thể dẫn đến quyết định nóng vội.',
  },
  'Thương': {
    positive: 'Bạn đang mang một khối áp lực trong lòng, dễ cảm thấy bị tổn thương.',
    neutral: 'Có chút bực dọc hoặc tổn thương ngầm, dễ phản ứng mạnh hơn mức cần thiết.',
    withBadDeity: 'Năng lượng đang khá nhiễu và dễ xung đột, cần kiểm soát cảm xúc.',
  },
  'Cảnh': {
    positive: 'Bạn đang rực cháy với kỳ vọng lớn, khá nôn nóng muốn thấy kết quả.',
    neutral: 'Tâm trí sáng nhưng dễ ảo tưởng, cần kiểm chứng thực tế.',
    withBadDeity: 'Sự hưng phấn có thể che mờ rủi ro thực sự, nên cẩn thận.',
  },
  'Kinh': {
    positive: 'Nội tâm đang nhiễu và dễ lo sợ, bật chế độ phòng vệ liên tục.',
    neutral: 'Có sự bất an mơ hồ, đầu óc hay chạy đến kịch bản xấu nhất.',
    withBadDeity: 'Năng lượng lo âu đang rất mạnh, có thể ảnh hưởng đến khả năng đánh giá.',
  },
  'Tử': {
    positive: 'Bạn đang ở pha muốn kết thúc một vòng cũ, dọn gọn để lấy lại kiểm soát.',
    neutral: 'Có cảm giác muốn buông bỏ hoặc cắt đứt điều gì đó không còn phù hợp.',
    withBadDeity: 'Năng lượng kết thúc mạnh, nhưng cần cẩn thận để không cắt nhầm.',
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// DEITY MODIFIERS (Thần → điều chỉnh năng lượng)
// ══════════════════════════════════════════════════════════════════════════════

const DEITY_INFLUENCE = {
  'Trực Phù': { type: 'cat', desc: 'có sự hỗ trợ từ "người dẫn đường" năng lượng cao' },
  'Đằng Xà': { type: 'hung', desc: 'dễ bị cuốn vào suy nghĩ rối rắm và lo âu' },
  'Thái Âm': { type: 'cat', desc: 'trực giác đang khá mạnh, nên lắng nghe tiếng nói bên trong' },
  'Lục Hợp': { type: 'cat', desc: 'năng lượng kết nối và hợp tác đang thuận' },
  'Câu Trận': { type: 'hung', desc: 'dễ gặp cản trở và tranh chấp' },
  'Bạch Hổ': { type: 'hung', desc: 'có áp lực mạnh hoặc xung đột tiềm ẩn' },
  'Chu Tước': { type: 'hung', desc: 'dễ gặp thị phi hoặc hiểu lầm trong giao tiếp' },
  'Huyền Vũ': { type: 'hung', desc: 'cần cẩn thận với thông tin không rõ ràng hoặc lừa dối' },
  'Cửu Địa': { type: 'cat', desc: 'năng lượng ổn định và bền vững' },
  'Cửu Thiên': { type: 'cat', desc: 'có năng lượng vươn lên và mở rộng' },
};

// ══════════════════════════════════════════════════════════════════════════════
// PALACE ELEMENT CONFLICTS (Cung + Tinh → xung đột ngầm)
// ══════════════════════════════════════════════════════════════════════════════

const ELEMENT_RELATIONSHIPS = {
  // Khắc (conflict)
  'Hỏa-Thủy': 'conflict', // Fire vs Water
  'Thủy-Hỏa': 'conflict',
  'Thủy-Thổ': 'conflict', // Water vs Earth (water is controlled by earth)
  'Thổ-Thủy': 'conflict',
  'Mộc-Kim': 'conflict',  // Wood vs Metal
  'Kim-Mộc': 'conflict',
  'Kim-Hỏa': 'conflict',  // Metal vs Fire
  'Hỏa-Kim': 'conflict',
  'Thổ-Mộc': 'conflict',  // Earth vs Wood
  'Mộc-Thổ': 'conflict',
  // Sinh (support)
  'Mộc-Hỏa': 'support',   // Wood feeds Fire
  'Hỏa-Thổ': 'support',   // Fire creates Earth
  'Thổ-Kim': 'support',   // Earth creates Metal
  'Kim-Thủy': 'support',  // Metal creates Water
  'Thủy-Mộc': 'support',  // Water feeds Wood
};

const STAR_ELEMENT = {
  'Thiên Bồng': 'Thủy',
  'Thiên Nhuế': 'Thổ',
  'Thiên Xung': 'Mộc',
  'Thiên Phụ': 'Mộc',
  'Thiên Cầm': 'Thổ',
  'Thiên Tâm': 'Kim',
  'Thiên Trụ': 'Kim',
  'Thiên Nhậm': 'Thổ',
  'Thiên Anh': 'Hỏa',
};

const DAY_STEM_ELEMENT = {
  'Giáp': 'Mộc', 'Ất': 'Mộc',
  'Bính': 'Hỏa', 'Đinh': 'Hỏa',
  'Mậu': 'Thổ', 'Kỷ': 'Thổ',
  'Canh': 'Kim', 'Tân': 'Kim',
  'Nhâm': 'Thủy', 'Quý': 'Thủy',
};

const PALACE_ELEMENT = {
  1: 'Thủy',  // Khảm - Bắc
  2: 'Thổ',  // Khôn - Tây Nam
  3: 'Mộc',  // Chấn - Đông
  4: 'Mộc',  // Tốn - Đông Nam
  5: 'Thổ',  // Trung Cung
  6: 'Kim',  // Càn - Tây Bắc
  7: 'Kim',  // Đoài - Tây
  8: 'Thổ',  // Cấn - Đông Bắc
  9: 'Hỏa',  // Ly - Nam
};

// ══════════════════════════════════════════════════════════════════════════════
// VOID AND SPECIAL STATE MESSAGES
// ══════════════════════════════════════════════════════════════════════════════

const VOID_MESSAGES = [
  'Cẩn thận với những kỳ vọng quá lớn vào lúc này, vì có một "khoảng trống" thông tin mà bạn chưa nhìn thấy.',
  'Có một điểm mù năng lượng - những gì bạn đang kỳ vọng có thể không thực tế như tưởng.',
  'Đang có hiệu ứng ảo ảnh: sự việc trông vậy mà không phải vậy.',
];

const FAN_YIN_MESSAGES = [
  'Năng lượng đang dao động mạnh - mọi nỗ lực nhanh chóng dễ bị dội ngược lại.',
  'Tình thế có thể thay đổi đột ngột, cần có kế hoạch B.',
  'Dòng chảy dội ngược - những gì trông thuận lợi ban đầu có thể đảo chiều.',
];

const FU_YIN_MESSAGES = [
  'Năng lượng đang trì trệ, có cảm giác uể oải hoặc muốn buông xuôi.',
  'Mọi thứ dường như đứng yên, cần kiên nhẫn chờ đợi thời điểm tốt hơn.',
  'Nhịp năng lượng đang chậm lại, không nên ép buộc kết quả.',
];

const DICH_MA_MESSAGES = [
  'Có sự bồn chồn muốn thay đổi, năng lượng di chuyển đang kích hoạt.',
  'Đây có thể là thời điểm tốt cho sự dịch chuyển hoặc thay đổi môi trường.',
  'Năng lượng Dịch Mã đang thúc đẩy hành động và di chuyển.',
];

// ══════════════════════════════════════════════════════════════════════════════
// BALANCE ADVICE GENERATOR
// ══════════════════════════════════════════════════════════════════════════════

const BALANCE_ADVICE = {
  'conflict-hung': [
    'Hãy cho phép mình chậm lại, không cần phản ứng ngay với mọi kích thích.',
    'Tập trung vào hơi thở và cảm nhận cơ thể trước khi đưa ra quyết định.',
    'Tìm một người đáng tin để chia sẻ, thay vì giữ mọi thứ bên trong.',
  ],
  'conflict-neutral': [
    'Ưu tiên một việc nhỏ có thể hoàn thành ngay để lấy lại cảm giác kiểm soát.',
    'Ghi chép lại những suy nghĩ đang xáo trộn thay vì để chúng xoay vòng trong đầu.',
    'Cho phép mình "không biết" thay vì ép bản thân phải có câu trả lời ngay.',
  ],
  'support-cat': [
    'Đây là nhịp tốt để chốt một quyết định nhỏ và quan sát phản hồi.',
    'Tin vào trực giác, nhưng vẫn kiểm chứng bằng dữ liệu thực tế.',
    'Tận dụng năng lượng thuận để mở rộng kết nối và cơ hội mới.',
  ],
  'neutral': [
    'Giữ nhịp ổn định, không vội vàng cũng không trì hoãn quá lâu.',
    'Quan sát thêm trước khi tăng cam kết vào bất kỳ hướng nào.',
    'Làm những việc nhỏ có thể kiểm soát được để xây dựng momentum.',
  ],
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION: Generate Energy Flow Summary
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Generates an Energy Flow Summary based on Qimen chart data
 *
 * @param {Object} chart - The full Qimen chart from buildFullChart()
 * @returns {Object} - Energy flow summary with sentences and metadata
 */
export function generateEnergyFlowSummary(chart) {
  if (!chart || !chart.palaces) {
    return {
      sentences: ['Không đủ dữ liệu để phân tích dòng năng lượng.'],
      summary: 'Không đủ dữ liệu để phân tích dòng năng lượng.',
      mentalState: null,
      conflict: null,
      blindSpot: null,
      advice: null,
    };
  }

  const sentences = [];
  const metadata = {
    dayStem: chart.dayPillar?.stemName || '',
    dayPalace: null,
    door: null,
    star: null,
    deity: null,
    palaceElement: null,
    dayStemElement: null,
    starElement: null,
    hasFanYin: chart.isPhanNgam,
    hasFuYin: chart.isPhucAm,
    hasVoid: false,
    hasDichMa: false,
  };

  // Find the Day Stem palace
  let dayPalaceNum = null;
  for (let p = 1; p <= 9; p++) {
    const pal = chart.palaces[p];
    if (pal?.isNgayCan || pal?.can?.name === chart.dayPillar?.stemName) {
      dayPalaceNum = p;
      break;
    }
  }

  if (!dayPalaceNum) {
    return {
      sentences: ['Không tìm thấy vị trí Nhật Can trong trận đồ.'],
      summary: 'Không tìm thấy vị trí Nhật Can trong trận đồ.',
      ...metadata,
    };
  }

  const dayPalace = chart.palaces[dayPalaceNum];
  metadata.dayPalace = dayPalaceNum;
  metadata.door = dayPalace?.mon?.short || dayPalace?.mon?.name;
  metadata.star = dayPalace?.star?.name || dayPalace?.star?.short;
  metadata.deity = dayPalace?.than?.name;
  metadata.palaceElement = PALACE_ELEMENT[dayPalaceNum];
  metadata.dayStemElement = DAY_STEM_ELEMENT[chart.dayPillar?.stemName];
  metadata.starElement = STAR_ELEMENT[metadata.star];
  metadata.hasVoid = dayPalace?.khongVong;
  metadata.hasDichMa = dayPalace?.dichMa;

  // ════════════════════════════════════════════════════════════════════════════
  // SENTENCE 1: Mental State (Môn + Thần)
  // ════════════════════════════════════════════════════════════════════════════
  const doorKey = metadata.door;
  const doorData = DOOR_MENTAL_STATE[doorKey];
  const deityData = DEITY_INFLUENCE[metadata.deity];
  const isBadDeity = deityData?.type === 'hung';

  let mentalState = '';
  if (doorData) {
    if (isBadDeity) {
      mentalState = doorData.withBadDeity || doorData.neutral;
    } else if (deityData?.type === 'cat') {
      mentalState = doorData.positive;
    } else {
      mentalState = doorData.neutral;
    }
  } else {
    mentalState = 'Trạng thái tinh thần hiện tại đang ở mức trung tính, cần quan sát thêm.';
  }

  // Add deity influence
  if (deityData) {
    mentalState += ` Đồng thời, ${deityData.desc}.`;
  }

  sentences.push(mentalState);
  metadata.mentalState = mentalState;

  // ════════════════════════════════════════════════════════════════════════════
  // SENTENCE 2: Hidden Conflict/Support (Cung + Tinh)
  // ════════════════════════════════════════════════════════════════════════════
  let conflictSentence = '';
  const stemElement = metadata.dayStemElement;
  const palaceEl = metadata.palaceElement;
  const relationKey = `${stemElement}-${palaceEl}`;
  const relationship = ELEMENT_RELATIONSHIPS[relationKey];

  if (relationship === 'conflict') {
    conflictSentence = `Dù lý trí mách bảo phải hành động, nhưng thực tế bạn đang cảm thấy như bị kìm hãm bởi môi trường xung quanh (${stemElement} gặp ${palaceEl}).`;
  } else if (relationship === 'support') {
    conflictSentence = `Có một dòng chảy thuận lợi ngầm hỗ trợ bạn - môi trường đang cộng hưởng với năng lượng bên trong (${stemElement} được ${palaceEl} hỗ trợ).`;
  } else {
    conflictSentence = `Năng lượng bên trong và bên ngoài đang ở thế cân bằng, không có xung đột lớn nhưng cũng không có sự hỗ trợ mạnh.`;
  }

  // Add star influence
  if (metadata.starElement && metadata.dayStemElement) {
    const starRelKey = `${metadata.dayStemElement}-${metadata.starElement}`;
    const starRel = ELEMENT_RELATIONSHIPS[starRelKey];
    if (starRel === 'conflict') {
      conflictSentence += ` Sao ${metadata.star} mang năng lượng ${metadata.starElement} đang tạo thêm áp lực.`;
    } else if (starRel === 'support') {
      conflictSentence += ` Sao ${metadata.star} đang hỗ trợ tích cực.`;
    }
  }

  sentences.push(conflictSentence);
  metadata.conflict = conflictSentence;

  // ════════════════════════════════════════════════════════════════════════════
  // SENTENCE 3: Energy Blind Spot (Void/Phản Ngâm/Phục Ngâm/Dịch Mã)
  // ════════════════════════════════════════════════════════════════════════════
  let blindSpotSentence = '';
  const blindSpots = [];

  if (chart.isPhanNgam) {
    blindSpots.push(FAN_YIN_MESSAGES[Math.floor(Math.random() * FAN_YIN_MESSAGES.length)]);
  }
  if (chart.isPhucAm) {
    blindSpots.push(FU_YIN_MESSAGES[Math.floor(Math.random() * FU_YIN_MESSAGES.length)]);
  }
  if (metadata.hasVoid) {
    blindSpots.push(VOID_MESSAGES[Math.floor(Math.random() * VOID_MESSAGES.length)]);
  }
  if (metadata.hasDichMa) {
    blindSpots.push(DICH_MA_MESSAGES[Math.floor(Math.random() * DICH_MA_MESSAGES.length)]);
  }

  if (blindSpots.length > 0) {
    blindSpotSentence = blindSpots.join(' ');
  } else {
    blindSpotSentence = 'Không phát hiện điểm mù năng lượng đặc biệt nào vào thời điểm này.';
  }

  sentences.push(blindSpotSentence);
  metadata.blindSpot = blindSpotSentence;

  // ════════════════════════════════════════════════════════════════════════════
  // SENTENCE 4: Balance Advice
  // ════════════════════════════════════════════════════════════════════════════
  let adviceSentence = '';
  let adviceCategory = 'neutral';

  if (relationship === 'conflict' && isBadDeity) {
    adviceCategory = 'conflict-hung';
  } else if (relationship === 'conflict') {
    adviceCategory = 'conflict-neutral';
  } else if (relationship === 'support' && deityData?.type === 'cat') {
    adviceCategory = 'support-cat';
  }

  const adviceOptions = BALANCE_ADVICE[adviceCategory] || BALANCE_ADVICE['neutral'];
  adviceSentence = adviceOptions[Math.floor(Math.random() * adviceOptions.length)];

  sentences.push(adviceSentence);
  metadata.advice = adviceSentence;

  // ════════════════════════════════════════════════════════════════════════════
  // COMPILE SUMMARY
  // ════════════════════════════════════════════════════════════════════════════
  const summary = sentences.join(' ');

  return {
    sentences,
    summary,
    mentalState: metadata.mentalState,
    conflict: metadata.conflict,
    blindSpot: metadata.blindSpot,
    advice: metadata.advice,
    metadata: {
      dayStem: metadata.dayStem,
      dayPalace: metadata.dayPalace,
      door: metadata.door,
      star: metadata.star,
      deity: metadata.deity,
      palaceElement: metadata.palaceElement,
      dayStemElement: metadata.dayStemElement,
      hasFanYin: metadata.hasFanYin,
      hasFuYin: metadata.hasFuYin,
      hasVoid: metadata.hasVoid,
      hasDichMa: metadata.hasDichMa,
    },
  };
}

/**
 * Generate a deterministic (non-random) Energy Flow Summary for consistent output
 * @param {Object} chart - The full Qimen chart
 * @returns {Object} - Energy flow summary
 */
export function generateDeterministicEnergyFlow(chart) {
  if (!chart || !chart.palaces) {
    return {
      sentences: ['Không đủ dữ liệu để phân tích dòng năng lượng.'],
      summary: 'Không đủ dữ liệu để phân tích dòng năng lượng.',
    };
  }

  // Find Day Stem palace
  let dayPalaceNum = null;
  for (let p = 1; p <= 9; p++) {
    const pal = chart.palaces[p];
    if (pal?.isNgayCan || pal?.can?.name === chart.dayPillar?.stemName) {
      dayPalaceNum = p;
      break;
    }
  }

  if (!dayPalaceNum) {
    return {
      sentences: ['Không tìm thấy vị trí Nhật Can trong trận đồ.'],
      summary: 'Không tìm thấy vị trí Nhật Can trong trận đồ.',
    };
  }

  const dayPalace = chart.palaces[dayPalaceNum];
  const doorKey = dayPalace?.mon?.short || dayPalace?.mon?.name;
  const deityName = dayPalace?.than?.name;
  const starName = dayPalace?.star?.name || dayPalace?.star?.short;

  const doorData = DOOR_MENTAL_STATE[doorKey];
  const deityData = DEITY_INFLUENCE[deityName];
  const isBadDeity = deityData?.type === 'hung';

  const sentences = [];

  // Sentence 1: Mental state
  let s1 = '';
  if (doorData) {
    s1 = isBadDeity ? (doorData.withBadDeity || doorData.neutral) : doorData.neutral;
  } else {
    s1 = 'Trạng thái tinh thần hiện tại đang ở mức trung tính.';
  }
  if (deityData) {
    s1 += ` Đồng thời, ${deityData.desc}.`;
  }
  sentences.push(s1);

  // Sentence 2: Element relationship
  const stemEl = DAY_STEM_ELEMENT[chart.dayPillar?.stemName];
  const palaceEl = PALACE_ELEMENT[dayPalaceNum];
  const rel = ELEMENT_RELATIONSHIPS[`${stemEl}-${palaceEl}`];

  let s2 = '';
  if (rel === 'conflict') {
    s2 = `Dù lý trí mách bảo phải hành động, nhưng thực tế bạn đang cảm thấy như bị kìm hãm bởi môi trường (${stemEl} gặp ${palaceEl}).`;
  } else if (rel === 'support') {
    s2 = `Có dòng chảy thuận lợi hỗ trợ - môi trường đang cộng hưởng với năng lượng bên trong.`;
  } else {
    s2 = `Năng lượng đang ở thế cân bằng, không có xung đột lớn.`;
  }
  sentences.push(s2);

  // Sentence 3: Blind spots
  const blindSpots = [];
  if (chart.isPhanNgam) blindSpots.push('Năng lượng đang dao động mạnh (Phản Ngâm) - mọi nỗ lực nhanh chóng dễ bị dội ngược.');
  if (chart.isPhucAm) blindSpots.push('Năng lượng đang trì trệ (Phục Ngâm), cần kiên nhẫn.');
  if (dayPalace?.khongVong) blindSpots.push('Cẩn thận với kỳ vọng quá lớn - có điểm mù thông tin (Không Vong).');
  if (dayPalace?.dichMa) blindSpots.push('Có năng lượng Dịch Mã - thời điểm tốt cho thay đổi.');

  const s3 = blindSpots.length > 0
    ? blindSpots.join(' ')
    : 'Không phát hiện điểm mù năng lượng đặc biệt.';
  sentences.push(s3);

  // Sentence 4: Advice
  let s4 = '';
  if (rel === 'conflict' && isBadDeity) {
    s4 = 'Hãy cho phép mình chậm lại, không cần phản ứng ngay với mọi kích thích.';
  } else if (rel === 'conflict') {
    s4 = 'Ưu tiên một việc nhỏ có thể hoàn thành ngay để lấy lại cảm giác kiểm soát.';
  } else if (rel === 'support') {
    s4 = 'Đây là nhịp tốt để chốt một quyết định nhỏ và quan sát phản hồi.';
  } else {
    s4 = 'Giữ nhịp ổn định, quan sát thêm trước khi tăng cam kết.';
  }
  sentences.push(s4);

  return {
    sentences,
    summary: sentences.join(' '),
    mentalState: sentences[0],
    conflict: sentences[1],
    blindSpot: sentences[2],
    advice: sentences[3],
    metadata: {
      dayStem: chart.dayPillar?.stemName,
      dayPalace: dayPalaceNum,
      door: doorKey,
      star: starName,
      deity: deityName,
      hasFanYin: chart.isPhanNgam,
      hasFuYin: chart.isPhucAm,
      hasVoid: dayPalace?.khongVong,
      hasDichMa: dayPalace?.dichMa,
    },
  };
}
