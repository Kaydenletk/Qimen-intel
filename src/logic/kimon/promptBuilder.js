import { enrichData } from '../../utils/qmdjHelper.js';
import { getFutureHoursContext } from './futureHours.js';
import { KYMON_PRO_SYSTEM_PROMPT } from './strategyPrompt.js';

function parseTopics(qmdjData = {}) {
  const raw = qmdjData?.allTopics || '[]';
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildTopicsContext(qmdjData = {}) {
  const topics = parseTopics(qmdjData);
  if (!topics.length) return 'Không có dữ liệu chủ đề mở rộng.';
  return topics
    .map(topic => `- ${topic.topic} (${topic.verdict}, ${topic.score >= 0 ? '+' : ''}${topic.score}): ${topic.action}`)
    .join('\n');
}

function buildColorSignal(qmdjData = {}) {
  const tone = qmdjData?.hourEnergyTone || 'neutral';
  const verdict = qmdjData?.hourEnergyVerdict || 'trung';
  const routeTone = qmdjData?.directEnvoyActionTone || 'neutral';
  const routeVerdict = qmdjData?.directEnvoyActionVerdict || 'trung';
  const quickSummary = qmdjData?.quickReadSummary || '';
  return [
    `[ĐÈN GIỜ] tone=${tone}; verdict=${verdict}; score=${qmdjData?.hourEnergyScore ?? 0}`,
    `[ĐƯỜNG HÀNH ĐỘNG] tone=${routeTone}; verdict=${routeVerdict}; score=${qmdjData?.directEnvoyActionScore ?? 0}`,
    quickSummary ? `[KẾT LUẬN NHANH] ${quickSummary}` : '',
  ].filter(Boolean).join('\n');
}

function buildInternalInsightsContext(qmdjData = {}) {
  const palaceSummaries = qmdjData?.palaceSummaries || {};
  const hourPalace = qmdjData?.hourMarkerPalace;
  const routePalace = qmdjData?.directEnvoyPalace;
  const hourLogic = palaceSummaries?.[hourPalace]?.logicRaw || palaceSummaries?.[String(hourPalace)]?.logicRaw || '';
  const routeLogic = palaceSummaries?.[routePalace]?.logicRaw || palaceSummaries?.[String(routePalace)]?.logicRaw || '';
  const quickMuuKe = palaceSummaries?.[hourPalace]?.muuKe || palaceSummaries?.[String(hourPalace)]?.muuKe || '';
  const quickCounter = palaceSummaries?.[hourPalace]?.counter || palaceSummaries?.[String(hourPalace)]?.counter || '';

  return [
    hourLogic ? `[LOGIC RAW CUNG GIỜ] ${hourLogic}` : '',
    routeLogic ? `[LOGIC RAW TRỰC SỬ] ${routeLogic}` : '',
    quickMuuKe ? `[MƯU KẾ GỢI Ý] ${quickMuuKe}` : '',
    quickCounter ? `[KHẮC CHẾ GỢI Ý] ${quickCounter}` : '',
  ].filter(Boolean).join('\n');
}

function buildPROFrameworkContext(qmdjData = {}) {
  const markers = qmdjData?.selectedTopicMarkersForAI;
  const nguHanh = qmdjData?.selectedTopicNguHanh;
  if (!markers) return '';

  const lines = [
    '[BẢN ĐỒ 4 BƯỚC CHO AI]',
    markers.rootCausePalace
      ? `- Bước 1 (Gốc rễ): Đọc cung ${markers.rootCausePalace} (${markers.rootCausePalaceName}) — Dụng Thần, gốc rễ vấn đề.`
      : '',
    markers.rootCausePalace
      ? `- Bước 2 (Tình trạng): Đọc Môn + Tinh + Thần tại cung ${markers.rootCausePalace} để thấy nhịp và tính chất sự việc.`
      : '',
    markers.userPalace
      ? `- Bước 3 (Tâm lý): Đọc cung ${markers.userPalace} (${markers.userPalaceName}) — Nhật Can, tâm lý và vị thế người hỏi.`
      : '- Bước 3 (Tâm lý): Nhật Can chưa xác định rõ trên bàn, đọc Cung Giờ thay thế.',
    markers.actionPalace
      ? `- Bước 4 (Mưu lược): Đọc cung ${markers.actionPalace} (${markers.actionPalaceName}) — Trực Sử, đường thoát hiểm và hành động.`
      : '- Bước 4 (Mưu lược): Tìm cung có Cát Tinh/Cát Thần gần nhất.',
    markers.blockerFlags?.length
      ? `- Blocker tại cung Dụng Thần: ${markers.blockerFlags.join(', ')}.`
      : '',
  ];

  if (nguHanh?.promptBlock) {
    lines.push('');
    lines.push(nguHanh.promptBlock);
  }

  return lines.filter(Boolean).join('\n');
}

function buildSelectedTopicContext(qmdjData = {}) {
  const topicKey = qmdjData?.selectedTopicKey || '';
  const selectedTopicResult = qmdjData?.selectedTopicResult || '';
  const insight = qmdjData?.insight || '';
  const aiHints = qmdjData?.aiHints || '';
  const selectedTopicFlags = Array.isArray(qmdjData?.selectedTopicFlags)
    ? qmdjData.selectedTopicFlags.filter(Boolean)
    : [];
  const selectedTopicUsefulPalace = qmdjData?.selectedTopicUsefulPalace || '';
  const selectedTopicUsefulPalaceName = qmdjData?.selectedTopicUsefulPalaceName || '';
  const lines = [];

  if (selectedTopicResult) {
    lines.push(`[PHÂN TÍCH CHỦ ĐỀ: ${topicKey || 'chung'}]`);
    lines.push(selectedTopicResult);
  }

  if (insight) {
    lines.push('[INSIGHT ENGINE]');
    lines.push(insight);
  }

  if (selectedTopicFlags.length) {
    const palaceSuffix = [selectedTopicUsefulPalace ? `cung ${selectedTopicUsefulPalace}` : '', selectedTopicUsefulPalaceName || '']
      .filter(Boolean)
      .join(' · ');
    lines.push(`[FLAGS DỤNG THẦN${palaceSuffix ? ` tại ${palaceSuffix}` : ''}]`);
    selectedTopicFlags.forEach(flag => lines.push(`- ${flag}`));
  }

  if (aiHints) {
    lines.push('[NGUYÊN TẮC ĐỌC FLAGS]');
    lines.push('Flags đã được engine tính toán và tổng hợp trong headline/coreMessage ở trên. Bám sát kết luận engine thay vì tự luận lại.');
    lines.push('Cờ Âm (Không Vong, Phục Ngâm) luôn thắng cờ Dương (Dịch Mã, Phản Ngâm). An toàn hơn tốc độ.');
    lines.push('Nếu engine ghi Dịch Mã: đọc theo nhịp nhanh, không khuyên chờ. Nếu engine ghi Không Vong: ưu tiên xác minh, không khuyên dồn lực.');
    lines.push('Khi 2+ flags chồng lớp, engine đã ghi combo tại headline/coreMessage. Dùng combo đó làm trục, không tự sáng tạo kịch bản khác.');
    lines.push(aiHints);
  }

  if (topicKey === 'hoc-tap' || topicKey === 'thi-cu') {
    lines.push('[ƯU TIÊN LUẬN GIẢI]');
    lines.push('Tập trung đọc Cảnh Môn và Thiên Phụ trước, vì đây là trục đề cương, tài liệu chuẩn và tín hiệu thi cử.');
    lines.push('Dùng ngôn ngữ theo trục Logic, Data, Memory, Processing; tránh kéo ẩn dụ sang sức khỏe, tiêu hóa hoặc hồi phục cơ thể.');
    lines.push('Nếu Thiên Nhuế xuất hiện trong topic học tập, hãy dịch nó thành lỗ hổng kiến thức, bug nền tảng hoặc điểm rò dữ liệu; không được luận như bệnh lý.');
  }

  if (topicKey === 'tai-van') {
    lines.push('[ƯU TIÊN TÀI VẬN]');
    lines.push('Tách rõ 3 lớp: vốn/ thanh khoản (Can Mậu), lợi nhuận (Sinh Môn), và vị thế của người hỏi (Nhật Can).');
    lines.push('Phải trả lời rõ đây là cuộc chiến tốc độ hay bài toán kiên nhẫn. Nếu là nhịp ngắn hạn thì nói về vào-ra, stop, thanh khoản; nếu là nhịp dài hạn thì nói về thesis, tích lũy, chịu rung.');
    lines.push('TUYỆT ĐỐI không lẫn sang nhà đất hoặc đất đai trong topic tai-van. Nhà đất là topic riêng.');
  }

  return lines.join('\n');
}

function buildUsefulGodFocusContext(qmdjData = {}) {
  const topicKey = qmdjData?.selectedTopicKey || '';
  const usefulPalace = qmdjData?.selectedTopicUsefulPalace || '';
  const usefulPalaceName = qmdjData?.selectedTopicUsefulPalaceName || '';
  const flags = Array.isArray(qmdjData?.selectedTopicFlags)
    ? qmdjData.selectedTopicFlags.filter(Boolean)
    : [];

  return [
    '[TRỤC Kymon Pro]',
    topicKey ? `- Chủ đề đang xét: ${topicKey}` : '- Chủ đề đang xét: chung',
    usefulPalace || usefulPalaceName
      ? `- Dụng Thần trọng tâm: ${[usefulPalace ? `cung ${usefulPalace}` : '', usefulPalaceName].filter(Boolean).join(' · ')}`
      : '- Dụng Thần trọng tâm: bám theo dữ liệu engine đã đánh dấu trong phần phân tích chủ đề.',
    flags.length ? `- Flags đang ghim trên Dụng Thần: ${flags.join(' | ')}` : '- Flags đang ghim trên Dụng Thần: chưa có cờ đặc biệt.',
    '- Ưu tiên tuyệt đối: Dụng Thần -> sao/cửa/thần đi kèm -> Nhật Can -> Trực Sử. Cung Giờ chỉ là bối cảnh khi thật sự cần.',
    '- Nếu thấy cung khác đẹp nhưng không phục vụ Dụng Thần, bỏ qua. Không lan man.',
  ].join('\n');
}

export function buildKimonSystemInstruction({ tier = 'topic' } = {}) {
  void tier;
  return KYMON_PRO_SYSTEM_PROMPT;
}

export function buildKimonPrompt({ qmdjData = {}, userContext = 'chung', isAutoLoad = false }) {
  const overallScore = qmdjData?.overallScore ?? qmdjData?.score ?? 0;
  const extras = [
    qmdjData?.isPhucAm ? 'nhịp trì' : '',
    qmdjData?.isPhanNgam ? 'thế dội ngược' : '',
  ].filter(Boolean).join(' | ');
  const topicsContext = buildTopicsContext(qmdjData);
  const colorSignal = buildColorSignal(qmdjData);
  const internalInsights = buildInternalInsightsContext(qmdjData);
  const selectedTopicContext = buildSelectedTopicContext(qmdjData);
  const usefulGodFocusContext = buildUsefulGodFocusContext(qmdjData);

  // Linear time awareness
  const currentHour = qmdjData?.currentHour ?? '';
  const currentMinute = qmdjData?.currentMinute ?? '';
  const timeContext = (currentHour !== '' && currentMinute !== '')
    ? `[THỜI GIAN HIỆN TẠI] ${currentHour}:${String(currentMinute).padStart(2, '0')}. Chỉ gợi ý các khung giờ SAU mốc này.`
    : '';

  // Hybrid Ứng Kỳ: Pre-calculate future good hours
  let futureHoursContext = '';
  if (currentHour !== '' && qmdjData?.displayPalaces) {
    try {
      const palaces = typeof qmdjData.displayPalaces === 'string'
        ? JSON.parse(qmdjData.displayPalaces)
        : qmdjData.displayPalaces;
      const { promptText } = getFutureHoursContext(palaces, currentHour, currentMinute || 0);
      futureHoursContext = promptText;
    } catch {
      // Fallback: no future hours context
    }
  }

  const baseContext = [
    timeContext,
    futureHoursContext,
    '[DỮ LIỆU TRẬN ĐỒ]',
    enrichData(qmdjData || {}),
    '',
    usefulGodFocusContext,
    buildPROFrameworkContext(qmdjData),
    '',
    '[CHỈ DẤU CHO AI]',
    colorSignal,
    internalInsights ? `\n[INTERNAL INSIGHTS]\n${internalInsights}` : '',
    selectedTopicContext ? `\n${selectedTopicContext}` : '',
    '',
    `[ĐIỂM TỔNG] ${overallScore}${qmdjData?.solarTerm ? ` | ${qmdjData.solarTerm}` : ''}${qmdjData?.cucSo ? ` | Cục ${qmdjData.cucSo} ${qmdjData?.isDuong ? 'Dương' : 'Âm'}` : ''}${extras ? ` | ${extras}` : ''}`,
    '',
    '[CÁC CHỦ ĐỀ KHÁC]',
    topicsContext,
  ].filter(Boolean).join('\n');

  if (isAutoLoad) {
    return `${baseContext}

[BỐI CẢNH TỰ ĐỘNG]
Đây là chế độ auto-load cho 2-4 giờ tới.

[ĐIỂM CẦN BÁM]
- Trục trọng tâm: Dụng Thần nếu engine đã chỉ rõ.
- Cung Giờ chỉ là bối cảnh ngắn hạn.
- Bám đúng dữ liệu trận đồ, flags và câu hỏi ngầm của nhịp thời gian sắp tới.
- Nếu dữ liệu trận đồ đang mở nhiều lớp nghĩa, được phép viết dài hơn để diễn tả đủ bức tranh, không tự cắt ngắn vô lý.
- Nếu các dấu hiệu đang chồng lớp, hãy giải thích theo 2-4 tầng nghĩa: tín hiệu bề mặt, lực cản, điểm sáng, và xu hướng kế tiếp.
- Nếu có trả JSON Kymon Pro, kết thúc bằng field "closingLine" riêng như một câu chốt footer.`;
  }

  return `${baseContext}

[CÂU HỎI NGƯỜI DÙNG]
${userContext}

[ĐIỂM CẦN BÁM]
- Trục trọng tâm: Dụng Thần và các tín hiệu đi kèm.
- Đối chiếu người hỏi qua Nhật Can hoặc Cung Giờ khi thật sự cần.
- Bám đúng dữ liệu trận đồ, flags, câu hỏi và các block insight đã cung cấp.
- Nếu trong trận có nhiều tín hiệu chồng lớp, hãy giải thích đủ sâu 2-4 lớp để người đọc thấy được toàn cảnh chứ không chỉ một mảnh cắt.
- Mỗi câu trả lời nên làm rõ ít nhất 2 tín hiệu đang tương tác với nhau, từ đó mới dựng ra bức tranh lớn của trận.
- Kết quả cuối cùng phải có thêm field "closingLine" riêng: 1 câu chốt ngắn, sắc, không lặp nguyên văn phần thân.`;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPANION MODE — Lightweight prompt for Gemini Flash
// ══════════════════════════════════════════════════════════════════════════════

const COMPANION_SYSTEM = `Bạn là Kymon — bạn đồng hành am hiểu Kỳ Môn Độn Giáp. Giọng: ngang hàng, điềm tĩnh, hơi khô hài. Trả lời bằng tiếng Việt.

NGUYÊN TẮC:
- Với câu hỏi đời thường: dùng Khí Nền Chung (Cung Giờ + Trực Sử) để luận.
- KHÔNG kéo câu hỏi vào chủ đề lớn (tài chính, sự nghiệp) trừ khi user hỏi thẳng.
- Xâu chuỗi Môn + Tinh + Thần thành 1 dòng năng lượng, không liệt kê rời rạc.
- Thuật ngữ Kỳ Môn: chỉ nêu khi giúp làm sáng vấn đề, kèm giải thích đời thường.
- KHÔNG sáo ngữ: "năng lượng cân bằng", "hãy tin vào bản thân".
- Trả lời tự nhiên, có thể đi thành 2-4 đoạn rõ ý nếu trận đồ có nhiều lớp để nói.
- Không cắt ngắn quá sớm. Người đọc phải cảm được cả bức tranh, không chỉ một mẩu kết luận.
- Mỗi câu trả lời nên đi qua ít nhất 2 tín hiệu của trận (ví dụ Cung Giờ + Trực Sử, hoặc Môn + Tinh + Thần) rồi mới chốt.
- Ưu tiên giải thích vì sao các tín hiệu đó hợp lại thành cùng một bức tranh.
- Nếu tín hiệu đang chồng lớp, hãy kể ra 2-4 tầng ý nghĩa để người đọc hình dung được nhịp vận động của trận.
- Không JSON, không bullet trong phần thân.
- Dòng cuối cùng BẮT BUỘC phải theo định dạng: "Chốt: ...".
- Phần sau "Chốt:" là đúng 1 câu, khoảng 8-18 từ, sắc, gọn, hơi thấm, không lặp nguyên văn câu trong phần thân.
- "Chốt:" phải là lời chốt hạ cuối cùng, tách khỏi phần thân để UI render thành footer riêng.`;

export function buildCompanionPrompt({ qmdjData = {}, userContext = '' }) {
  const hourPalace = qmdjData?.hourMarkerPalace ?? '';
  const hourDir = qmdjData?.hourMarkerDirection ?? '';
  const hourDoor = qmdjData?.hourDoor ?? '';
  const hourStar = qmdjData?.hourStar ?? '';
  const hourDeity = qmdjData?.hourDeity ?? '';
  const hourScore = qmdjData?.hourEnergyScore ?? 0;

  const trucSuPalace = qmdjData?.directEnvoyPalace ?? '';
  const trucSuDir = qmdjData?.directEnvoyDirection ?? '';
  const trucSuDoor = qmdjData?.directEnvoyDoor ?? '';
  const trucSuStar = qmdjData?.directEnvoyStar ?? '';
  const trucSuDeity = qmdjData?.directEnvoyDeity ?? '';
  const trucSuScore = qmdjData?.directEnvoyActionScore ?? 0;

  const states = [
    qmdjData?.isPhucAm ? 'Phục Âm' : '',
    qmdjData?.isPhanNgam ? 'Phản Ngâm' : '',
  ].filter(Boolean).join(', ');

  const userPrompt = [
    `[CUNG GIỜ] Cung ${hourPalace} (${hourDir}): Môn=${hourDoor} | Tinh=${hourStar} | Thần=${hourDeity} | Score=${hourScore}`,
    `[TRỰC SỬ] Cung ${trucSuPalace} (${trucSuDir}): Môn=${trucSuDoor} | Tinh=${trucSuStar} | Thần=${trucSuDeity} | Score=${trucSuScore}`,
    states ? `[TRẠNG THÁI] ${states}` : '',
    '',
    `[CÂU HỎI] ${userContext}`,
    '',
    'Trả lời tự nhiên, sắc nhưng không quá ngắn.',
    'Nếu trận mở nhiều lớp, có thể viết 2-4 đoạn để nói rõ người đọc đang đứng trong bức tranh nào.',
    'Phải giải thích ít nhất 2 tín hiệu trong trận và cách chúng nối với nhau.',
    'Nếu trận có nhiều tầng nghĩa, hãy bóc đủ 2-4 tầng thay vì kết luận vội.',
    'Kết thúc bằng đúng 1 dòng "Chốt: ..." để chốt hạ ý chính.',
  ].filter(s => s !== false).join('\n');

  return { systemPrompt: COMPANION_SYSTEM, userPrompt };
}
