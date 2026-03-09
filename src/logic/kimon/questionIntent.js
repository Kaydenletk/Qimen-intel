function normalize(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const QUESTION_AXES = [
  {
    key: 'pricing',
    label: 'Định giá / Giá tiền',
    hints: [
      'gia bao nhieu', 'bao nhieu tien', 'dinh gia', 'gia chot', 'gia treo',
      'ra gia', 'gia ban', 'ban duoc bao nhieu', 'tri gia', 'duoc gia bao nhieu',
    ],
    promptRules: [
      'Nếu user hỏi giá bao nhiêu hoặc định giá, lead phải trả lời thẳng theo trục giá: giá treo, giá chạm, giá chốt, hay chưa thể định giá thật.',
      'Không được đổi trục sang lời khuyên hàn gắn, chữa lành, hay quan hệ nếu người hỏi đang hỏi con số hoặc khả năng chốt giá.',
      'Nếu trận chưa đủ để chốt số tuyệt đối, phải nói rõ đó là giá treo hay giá ảo, hoặc đưa ra một khung số/x-trục thay vì né câu hỏi.',
      'closingLine phải chốt vào giá, khả năng bán, khả năng chốt, hoặc sự lệch giữa giá nói và giá thực.',
    ],
  },
  {
    key: 'yes_no',
    label: 'Quyết định Có / Không',
    hints: [
      'co nen', 'co duoc khong', 'co thanh cong khong', 'co ban duoc khong',
      'co qua mon khong', 'co hop khong', 'co on khong',
    ],
    promptRules: [
      'Nếu user hỏi có/không, lead phải trả lời rõ nghiêng về có cửa, khó thuận, chưa nên, hay chưa chốt được.',
      'closingLine phải giữ trục quyết định, không đổi sang triết lý chung chung.',
    ],
  },
  {
    key: 'timing',
    label: 'Thời điểm / Khi nào',
    hints: [
      'khi nao', 'luc nao', 'bao gio', 'gio nao', 'thoi diem nao', 'khung gio nao',
    ],
    promptRules: [
      'Nếu user hỏi khi nào, lead phải trả lời thẳng là đang có cửa ngay, phải chờ, hay chỉ hợp một khung giờ nhất định.',
      'closingLine phải neo vào nhịp thời gian hoặc cửa hành động, không trôi sang nhận xét tính cách.',
    ],
  },
  {
    key: 'person',
    label: 'Đọc người / Bản chất đối tượng',
    hints: [
      'nguoi nay', 'phan tich nguoi nay', 'ho la nguoi the nao', 'co dang tin khong',
      'giao vien nay', 'nguoi do', 'gap ho',
    ],
    promptRules: [
      'Nếu user hỏi đọc người, lead phải chốt bản chất người đó trước: đáng tin tới đâu, lắt léo hay thẳng, dùng được hay nên giữ khoảng cách.',
      'closingLine phải chốt đúng trục con người, không đổi sang giá tiền hay giấy tờ.',
    ],
  },
  {
    key: 'state',
    label: 'Tình trạng / Vấn đề đang là gì',
    hints: [
      'ra sao', 'nhu the nao', 'dang co van de gi', 'co chuyen gi', 'dang sao roi',
      'hien tai ra sao', 'dang the nao',
    ],
    promptRules: [
      'Nếu user hỏi tình trạng, lead phải chốt ngay trạng thái chính: đang hẫng, đang tắc, đang thuận bề ngoài nhưng có góc khuất, hay đang bật lên.',
      'closingLine phải tóm đúng trạng thái chính của sự việc.',
    ],
  },
];

export function detectQuestionIntent(userContext = '') {
  const normalized = normalize(userContext);
  if (!normalized) return null;

  for (const axis of QUESTION_AXES) {
    if (axis.hints.some(hint => normalized.includes(hint))) {
      return {
        key: axis.key,
        label: axis.label,
        promptRules: axis.promptRules,
      };
    }
  }

  return null;
}

export function buildQuestionIntentContext(userContext = '') {
  const axis = detectQuestionIntent(userContext);
  if (!axis) return '';

  return [
    '[TRỤC CÂU HỎI]',
    `- Kiểu câu hỏi: ${axis.label}.`,
    ...axis.promptRules.map(rule => `- ${rule}`),
  ].join('\n');
}
