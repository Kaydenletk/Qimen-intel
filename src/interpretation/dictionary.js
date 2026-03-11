/**
 * dictionary.js — Từ Điển Diễn Giải (Interpretation Dictionary)
 * 
 * Lưu ý: Tầng này tuân thủ INTERPRETATION_SPEC.md. Chuyển hóa các thuật ngữ 
 * sách cổ mang tính đe dọa (ác mộng, chết chóc, hành hình) thành các 
 * trạng thái tâm lý, năng lượng và chiến lược quản trị hiện đại.
 */

import { QMDJ_DICTIONARY as QMDJ_TOPIC_DICT } from '../logic/dungThan/qmdjDictionary.js';

export const DICTIONARY = {
  // ── BÁT MÔN (Trạng thái Năng Lượng & Hành Động) ──────────────────────────
  doors: {
    door_open: {
      name: 'Khai Môn',
      type: 'cat',
      energy: 'positive',
      summary: 'Sự khởi đầu, cởi mở, cơ hội mới, công khai thảo luận.',
      psychology: 'Tâm lý sẵn sàng đón nhận, minh bạch, muốn bứt phá ra khỏi giới hạn cũ.'
    },
    door_rest: {
      name: 'Hưu Môn',
      type: 'cat',
      energy: 'positive',
      summary: 'Sự nghỉ ngơi, phục hồi, tĩnh lặng, quý nhân giúp đỡ ngầm.',
      psychology: 'Trao quyền, lùi lại một bước để quan sát, không cưỡng cầu.'
    },
    door_life: {
      name: 'Sinh Môn',
      type: 'cat',
      energy: 'positive',
      summary: 'Sinh sôi nảy nở, dòng tiền, sự phát triển không ngừng, lợi nhuận.',
      psychology: 'Chủ động, đầy sức sống, hướng tới kết quả vật chất và tăng trưởng.'
    },
    door_scenery: {
      name: 'Cảnh Môn',
      type: 'binh',
      energy: 'neutral',
      summary: 'Đề cương, tài liệu, giấy tờ, bề ngoài hào nhoáng, cái danh ảo.',
      psychology: 'Phấn chấn tức thời, chú trọng hình thức, có thể chói lóa nhưng không bền vững.'
    },
    door_death: {
      name: 'Tử Môn',
      type: 'hung',
      energy: 'negative',
      summary: 'Cạn kiệt năng lượng, ngõ cụt, thế bí, sự buông xuôi, kết thúc một chu kỳ.',
      psychology: 'Bảo thủ, tắc nghẽn, cần chấp nhận buông bỏ cái cũ để tái tạo ván cờ mới.'
    },
    door_harm: {
      name: 'Thương Môn',
      type: 'hung',
      energy: 'negative',
      summary: 'Tổn thương, hao tài, va chạm, cạnh tranh khốc liệt.',
      psychology: 'Dễ bốc đồng, sát phạt, cần kiểm soát cảm xúc tránh gây tổn thương cho mình và người khác.'
    },
    door_delusion: {
      name: 'Đỗ Môn',
      type: 'binh',
      energy: 'neutral',
      summary: 'Sự che giấu, bế tắc kỹ thuật, phòng thủ, giữ bí mật.',
      psychology: 'Nghi ngờ, đóng kín, không muốn chia sẻ thông tin, phòng vệ cao độ.'
    },
    door_fear: {
      name: 'Kinh Môn',
      type: 'hung',
      energy: 'negative',
      summary: 'Tin đồn, sự kinh động, nỗi sợ vô hình, tranh cãi bằng miệng.',
      psychology: 'Hoang mang, lo âu, thiếu tự tin, dễ bị thao túng bởi thông tin bên ngoài.'
    },
    door_none: {
      name: 'Vô Môn',
      type: 'neutral',
      energy: 'neutral',
      summary: 'Không có trạng thái (Trung Cung).',
      psychology: 'Trạng thái hạt nhân, chờ phân rã.'
    }
  },

  // ── BÁT THẦN (Tâm lý Tiềm Thức & Yếu tố Bất Ngờ) ──────────────────────────
  gods: {
    god_chief: {
      name: 'Trực Phù',
      type: 'cat',
      summary: 'Năng lượng dẫn dắt, sự bảo trợ tối cao, người lãnh đạo.',
      psychology: 'Tự tin, đẳng cấp, được cấp trên hoặc quy luật tự nhiên hậu thuẫn.'
    },
    god_snake: {
      name: 'Đằng Xà',
      type: 'hung',
      summary: 'Sự uốn éo, lắt léo, rắc rối quấn lấy nhau, giằng xé tâm can.',
      psychology: 'Rối nhiễu tâm lý, mất phương hướng tạm thời, hay dao động, đa nghi.'
    },
    god_moon: {
      name: 'Thái Âm',
      type: 'cat',
      summary: 'Sự che chở ngầm, ý tưởng tinh tế, người hậu thuẫn giấu mặt.',
      psychology: 'Làm việc âm thầm, nội tâm sâu sắc, có chiến lược ngầm khó đoán.'
    },
    god_harmony: {
      name: 'Lục Hợp',
      type: 'cat',
      summary: 'Sự liên kết, đối tác, hợp đồng, hôn nhân, môi giới.',
      psychology: 'Mong muốn hòa giải, tìm kiếm tiếng nói chung và sự đồng thuận nhiều bên.'
    },
    god_white_tiger: {
      name: 'Bạch Hổ',
      type: 'hung',
      summary: 'Áp lực cực lớn, thách thức, sự dữ dội, hành động quyết liệt.',
      psychology: 'Căng thẳng cao độ, tính hiếu chiến, sẵn sàng va chạm để giải quyết vấn đề.'
    },
    god_black_tortoise: {
      name: 'Huyền Vũ',
      type: 'hung',
      summary: 'Sự mập mờ, bối rối, tin giả, sự rò rỉ hoặc thất thoát.',
      psychology: 'Thiếu minh bạch, có ý đồ tư lợi, hoặc bản thân đang bị ru ngủ trong ảo tưởng.'
    },
    god_nine_earths: {
      name: 'Cửu Địa',
      type: 'cat',
      summary: 'Sự chậm rãi, vững chắc, tài sản ngầm, sự tích dồn lâu năm.',
      psychology: 'Kiên nhẫn, bảo thủ, thích an toàn, tiến từng bước chậm mà chắc.'
    },
    god_nine_heavens: {
      name: 'Cửu Thiên',
      type: 'cat',
      summary: 'Tầm nhìn xa, sự khuếch trương, bành trướng, bay cao.',
      psychology: 'Tham vọng lớn, năng động, đôi khi thiếu thực tế vì nhìn quá xa.'
    }
  },

  // ── CỬU TINH (Hoàn Cảnh Vĩ Mô & Quý Nhân) ───────────────────────────────
  stars: {
    star_grass: {
      name: 'Thiên Bồng',
      type: 'hung',
      summary: 'Tài trí thao lược, phiêu lưu lớn, rủi ro cao, kinh doanh mạo hiểm.',
      psychology: 'Liều lĩnh, đầy khát vọng, dám chơi ván cờ lớn bất chấp quy tắc.'
    },
    star_grain: {
      name: 'Thiên Nhuế',
      type: 'hung',
      summary: 'Lỗi hệ thống, sự cố, bệnh tật, những vấn đề tồn đọng từ bên trong.',
      psychology: 'Cảm giác vướng mắc, cần phải thanh lọc và sửa lỗi lại cấu trúc.'
    },
    star_destructor: {
      name: 'Thiên Xung',
      type: 'cat',
      summary: 'Việc gấp, tốc độ, hành động chớp nhoáng, sự tiên phong.',
      psychology: 'Nhiệt huyết, tức thời, không muốn chờ đợi, làm nhanh rút gọn.'
    },
    star_assistant: {
      name: 'Thiên Phụ',
      type: 'cat',
      summary: 'Ngôi sao học giả, nhà trường/giáo viên, môi trường giáo dục, sự dìu dắt.',
      psychology: 'Thích học hỏi, tôn trọng tri thức, kiên nhẫn bồi đắp nền tảng.'
    },
    star_bird: {
      name: 'Thiên Cầm',
      type: 'binh',
      summary: 'Sự tĩnh tại, người có năng lực bao quát, vị trí trung tâm.',
      psychology: 'Điềm đạm, nhìn nhận đa chiều, có tư chất làm trọng tài.'
    },
    star_heart: {
      name: 'Thiên Tâm',
      type: 'cat',
      summary: 'Trí tuệ điều hành, khả năng lập kế hoạch, thầy thuốc/người chữa lành.',
      psychology: 'Lý trí, rành mạch, tính toán chi ly, dùng tư duy logic để gỡ rối.'
    },
    star_pillar: {
      name: 'Thiên Trụ',
      type: 'hung',
      summary: 'Sự phá hủy để xây mới, tiếng vang lớn, sự cố bất ngờ.',
      psychology: 'Ngỗ ngược, độc lập cực đoan, muốn đập bỏ cấu trúc cũ.'
    },
    star_ambassador: {
      name: 'Thiên Nhậm',
      type: 'cat',
      summary: 'Nông nghiệp, tích lũy, người nhẫn nại, sự chống đỡ bền bỉ.',
      psychology: 'Chịu thương chịu khó, cam kết dài hạn, có sức chịu đựng áp lực tốt.'
    },
    star_hero: {
      name: 'Thiên Anh',
      type: 'binh',
      summary: 'Sự tỏa sáng, truyền thông, nổi bật, nhưng dễ tàn lụi nhanh.',
      psychology: 'Muốn thể hiện bản thân, nóng nảy, khao khát được công nhận.'
    }
  },

  // ── THIÊN CAN (Thiên/Địa Bàn) ───────────────────────────────
  stems: {
    jia: { name: 'Giáp', element: 'wood', nature: 'Người đứng đầu, tài sản lớn' },
    yi: { name: 'Ất', element: 'wood', nature: 'Nhà tư vấn, bác sĩ, hy vọng, sự linh hoạt' },
    bing: { name: 'Bính', element: 'fire', nature: 'Thẩm quyền, rắc rối bề nổi, sự nhiệt thành' },
    ding: { name: 'Đinh', element: 'fire', nature: 'Ý tưởng đột phá, cơ hội lách luật, tia sáng' },
    wu: { name: 'Mậu', element: 'earth', nature: 'Vốn, dòng tiền, sự tích lũy, cái tôi kiêu hãnh' },
    ji: { name: 'Kỷ', element: 'earth', nature: 'Mưu đồ đen tối, hố sâu, suy nghĩ cục bộ' },
    geng: { name: 'Canh', element: 'metal', nature: 'Kẻ thù, áp lực, đối thủ cạnh tranh chặn đường' },
    xin: { name: 'Tân', element: 'metal', nature: 'Sai lầm, sự cải tổ, thay đổi cốt lõi' },
    ren: { name: 'Nhâm', element: 'water', nature: 'Sự luân chuyển, di dời, dòng chảy bất định' },
    gui: { name: 'Quý', element: 'water', nature: 'Hệ thống kẹt cứng, chướng ngại không gian giới hạn' }
  }
};

/**
 * Tiện ích lấy Diễn Giải
 */
export const getInterpretation = (category, key) => {
  if (DICTIONARY[category] && DICTIONARY[category][key]) {
    return DICTIONARY[category][key];
  }
  return { name: key, summary: '', psychology: 'Không rõ.' };
};

const TOPIC_ALIASES = {
  'thi-cu': 'hoc-tap',
  'tinh-yeu': 'tinh-duyen',
  'dien-trach': 'bat-dong-san',
  'chien-luoc': 'muu-luoc',
  'gia-dinh': 'gia-dao',
};

function normalizeTopicKey(topicKey = '') {
  return TOPIC_ALIASES[topicKey] || topicKey || '';
}

function extractDefaultText(entry = {}) {
  if (!entry || typeof entry !== 'object') return '';
  return entry.default || '';
}

export const QMDJ_DICT = Object.freeze(
  Object.fromEntries(
    Object.entries(QMDJ_TOPIC_DICT).map(([category, entries]) => [
      category,
      Object.fromEntries(
        Object.entries(entries).map(([label, payload]) => [label, extractDefaultText(payload)])
      ),
    ])
  )
);

export { QMDJ_TOPIC_DICT };

export function lookupQmdjDictionaryEntry(label = '', topicKey = '') {
  if (!label) return null;
  const normalizedTopicKey = normalizeTopicKey(topicKey);

  for (const [category, entries] of Object.entries(QMDJ_TOPIC_DICT)) {
    const payload = entries?.[label];
    if (!payload) continue;
    return {
      category,
      label,
      text: payload[normalizedTopicKey] || payload.default || '',
      defaultText: payload.default || '',
      topicKey: normalizedTopicKey,
    };
  }

  return null;
}

export function collectQmdjDictionaryEntries(labels = [], topicKey = '') {
  const uniqueLabels = [...new Set((Array.isArray(labels) ? labels : []).filter(Boolean))];
  return uniqueLabels
    .map(label => lookupQmdjDictionaryEntry(label, topicKey))
    .filter(entry => entry && entry.text);
}
