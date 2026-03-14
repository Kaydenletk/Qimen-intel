import { enrichData } from '../../utils/qmdjHelper.js';
import { getFutureHoursContext } from './futureHours.js';
import { resolveDungThanMarker } from './dungThanHelper.js';
import { appendGroundingSystemRules, buildGroundingUserContext } from './grounding.js';
import { buildQuestionIntentContext } from './questionIntent.js';
import { buildFlashTopicPersonaContext } from './topicPersonaProfiles.js';
import { buildKnowledgeVaultContext } from './knowledgeVault.js';
import { buildEnergyStateBundle, buildEnergyStateContext } from './energyState.js';

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
    .map(topic => `- ${topic.topic} (${topic.verdict}): ${topic.action}`)
    .join('\n');
}

function buildColorSignal(qmdjData = {}) {
  const tone = qmdjData?.hourEnergyTone || 'neutral';
  const verdict = qmdjData?.hourEnergyVerdict || 'trung';
  const routeTone = qmdjData?.directEnvoyActionTone || 'neutral';
  const routeVerdict = qmdjData?.directEnvoyActionVerdict || 'trung';
  const quickSummary = qmdjData?.quickReadSummary || '';
  return [
    `[ĐÈN GIỜ] tone=${tone}; verdict=${verdict}`,
    `[ĐƯỜNG HÀNH ĐỘNG] tone=${routeTone}; verdict=${routeVerdict}`,
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

function resolvePromptDungThan(qmdjData = {}, userContext = '') {
  const liveMarker = resolveDungThanMarker({
    topic: qmdjData?.selectedTopicKey || '',
    boardData: qmdjData?.displayPalaces || {},
    userContext,
    hourPalaceNum: qmdjData?.hourMarkerPalace || null,
  });
  return liveMarker || qmdjData?.selectedTopicCanonicalDungThan || null;
}

function buildCanonicalDungThanContext(qmdjData = {}, userContext = '') {
  const canonicalDungThan = resolvePromptDungThan(qmdjData, userContext);
  const topicKey = qmdjData?.selectedTopicKey || '';
  if (!canonicalDungThan?.palaceNum) return '';

  const lines = [
    '[DỤNG THẦN CHUẨN SÁCH]',
    topicKey ? `- Chủ đề: ${topicKey}` : '',
    `- Dụng Thần chính theo quy chiếu chủ đề: cung ${canonicalDungThan.palaceNum} (${canonicalDungThan.palaceName})${canonicalDungThan.direction ? ` · ${canonicalDungThan.direction}` : ''}.`,
    canonicalDungThan.targetSummary
      ? `- Trục bắt Dụng Thần: ${canonicalDungThan.targetSummary}.`
      : '',
    canonicalDungThan.matchedByText
      ? `- Cung này được khớp theo: ${canonicalDungThan.matchedByText}.`
      : '',
    '- Khi block này xuất hiện, coi đây là [DỤNG THẦN CHÍNH]. Nếu lệch với Dụng Thần engine tổng hợp, đọc cung này trước; cung engine tổng hợp chỉ dùng làm đối chiếu phụ.',
    canonicalDungThan.boardText
      ? `[CỬU CUNG THEO TOPIC]\n${canonicalDungThan.boardText}`
      : '',
  ];

  return lines.filter(Boolean).join('\n');
}

function buildMultiTopicContext(qmdjData = {}) {
  const primaryTopic = qmdjData?.selectedTopicKey || '';
  const secondaryTopic = qmdjData?.selectedSecondaryTopicKey || '';
  const topicCandidates = Array.isArray(qmdjData?.selectedTopicCandidates)
    ? qmdjData.selectedTopicCandidates.filter(Boolean)
    : [];
  if (!secondaryTopic && !topicCandidates.length) return '';

  return [
    '[TOPIC CHỒNG LỚP]',
    primaryTopic ? `- Chủ đề chính: ${primaryTopic}` : '',
    secondaryTopic ? `- Chủ đề phụ: ${secondaryTopic}` : '',
    topicCandidates.length ? `- Các topic nổi bật: ${topicCandidates.join(' | ')}` : '',
    '- Luận theo chủ đề chính trước. Chủ đề phụ chỉ dùng để soi lớp phụ, tuyệt đối không đổi trục Dụng Thần.',
  ].filter(Boolean).join('\n');
}

function buildSelectedTopicContext(qmdjData = {}, userContext = '') {
  const topicKey = qmdjData?.selectedTopicKey || '';
  const selectedTopicResult = qmdjData?.selectedTopicResult || '';
  const insight = qmdjData?.insight || '';
  const canonicalDungThanContext = buildCanonicalDungThanContext(qmdjData, userContext);
  const multiTopicContext = buildMultiTopicContext(qmdjData);
  const selectedTopicFlags = Array.isArray(qmdjData?.selectedTopicFlags)
    ? qmdjData.selectedTopicFlags.filter(Boolean)
    : [];
  const selectedTopicUsefulPalace = qmdjData?.selectedTopicUsefulPalace || '';
  const selectedTopicUsefulPalaceName = qmdjData?.selectedTopicUsefulPalaceName || '';
  const topicPersonaContext = buildFlashTopicPersonaContext(topicKey);
  const lines = [];

  if (canonicalDungThanContext) {
    lines.push(canonicalDungThanContext);
  }

  if (multiTopicContext) {
    lines.push(multiTopicContext);
  }

  if (topicPersonaContext) {
    lines.push(topicPersonaContext);
  }

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
    lines.push(`[FLAGS ENGINE TẠI DỤNG THẦN${palaceSuffix ? ` tại ${palaceSuffix}` : ''}]`);
    lines.push(`- Tóm tắt engine: ${selectedTopicFlags.join(' | ')}`);
    lines.push('- Vị trí chính xác của từng cờ phải đọc trong [CỬU CUNG THEO TOPIC], không được hoán đổi cờ giữa các cung.');
  }

  if (topicKey === 'hoc-tap' || topicKey === 'thi-cu') {
    lines.push('[ƯU TIÊN LUẬN GIẢI]');
    lines.push('Tập trung đọc Cảnh Môn và Thiên Phụ trước, vì đây là trục đề cương, tài liệu chuẩn và tín hiệu thi cử.');
    lines.push('Dùng ngôn ngữ theo trục Logic, Data, Memory, Processing; tránh kéo ẩn dụ sang sức khỏe, tiêu hóa hoặc hồi phục cơ thể.');
    lines.push('Nếu Thiên Nhuế xuất hiện trong topic học tập, hãy dịch nó thành lỗ hổng kiến thức, bug nền tảng hoặc điểm rò dữ liệu; không được luận như bệnh lý.');
  }

  if (topicKey === 'gia-dao') {
    lines.push('[ƯU TIÊN GIA ĐẠO]');
    lines.push('Đây là bài đọc về tổ ấm, hòa khí, nếp nhà và khoảng cách lòng người. Chỉ nói về căn nhà như tài sản khi câu hỏi hỏi thẳng về mua bán, giấy tờ hoặc xuống tiền.');
    lines.push('Nếu thấy Lục Hợp đi cùng Không Vong trong cùng một cung, phải đọc là nhà có người nhưng lòng cách xa, sự thấu hiểu đang bị rỗng tuếch.');
    lines.push('Tuyệt đối không dùng giọng giao dịch, pháp lý, đầu tư hay lợi nhuận cho topic gia-dao.');
  }

  if (topicKey === 'tai-van') {
    lines.push('[ƯU TIÊN TÀI VẬN]');
    lines.push('Tách rõ 3 lớp: vốn/ thanh khoản (Can Mậu), lợi nhuận (Sinh Môn), và vị thế của người hỏi (Nhật Can).');
    lines.push('Phải trả lời rõ đây là cuộc chiến tốc độ hay bài toán kiên nhẫn. Nếu là nhịp ngắn hạn thì nói về vào-ra, stop, thanh khoản; nếu là nhịp dài hạn thì nói về thesis, tích lũy, chịu rung.');
    lines.push('TUYỆT ĐỐI không lẫn sang nhà đất hoặc đất đai trong topic tai-van. Nhà đất là topic riêng.');
  }

  if (topicKey === 'bat-dong-san') {
    lines.push('[ƯU TIÊN BẤT ĐỘNG SẢN]');
    lines.push('Nếu câu hỏi là quyết định xuống tiền mua tài sản, topic bat-dong-san thắng kinh-doanh hoặc tai-van.');
    lines.push('Ngoài trục Can Mậu + Sinh Môn, bắt buộc soi thêm Cảnh Môn để đọc pháp lý, giấy tờ, hồ sơ và phần bề mặt dễ đánh lừa.');
    lines.push('Đồng thời phải đọc Cửu Địa để chốt độ bền, nền đất, khả năng giữ giá và việc tài sản có đi được đường dài hay không.');
    lines.push('Không được luận như một lệnh trading thuần tốc độ. Đây là quyết định mua tài sản thật.');
  }

  return lines.join('\n');
}

function buildUsefulGodFocusContext(qmdjData = {}, userContext = '') {
  const topicKey = qmdjData?.selectedTopicKey || '';
  const usefulPalace = qmdjData?.selectedTopicUsefulPalace || '';
  const usefulPalaceName = qmdjData?.selectedTopicUsefulPalaceName || '';
  const canonicalDungThan = resolvePromptDungThan(qmdjData, userContext);
  const flags = Array.isArray(qmdjData?.selectedTopicFlags)
    ? qmdjData.selectedTopicFlags.filter(Boolean)
    : [];

  return [
    '[TRỤC Kymon Pro]',
    topicKey ? `- Chủ đề đang xét: ${topicKey}` : '- Chủ đề đang xét: chung',
    canonicalDungThan?.palaceNum
      ? `- Dụng Thần chuẩn sách: cung ${canonicalDungThan.palaceNum}${canonicalDungThan.palaceName ? ` · ${canonicalDungThan.palaceName}` : ''}${canonicalDungThan.matchedByText ? ` · ${canonicalDungThan.matchedByText}` : ''}`
      : '',
    usefulPalace || usefulPalaceName
      ? `- Dụng Thần trọng tâm: ${[usefulPalace ? `cung ${usefulPalace}` : '', usefulPalaceName].filter(Boolean).join(' · ')}`
      : '- Dụng Thần trọng tâm: bám theo dữ liệu engine đã đánh dấu trong phần phân tích chủ đề.',
    flags.length ? `- Flags đang ghim trên Dụng Thần: ${flags.join(' | ')}` : '- Flags đang ghim trên Dụng Thần: chưa có cờ đặc biệt.',
    canonicalDungThan?.palaceNum
      ? '- Nếu Dụng Thần chuẩn sách lệch với Dụng Thần engine tổng hợp, Dụng Thần chuẩn sách thắng ở bước đọc chủ đề; Dụng Thần engine tổng hợp chỉ dùng để đối chiếu hoặc đọc lớp phụ.'
      : '',
    '- Ưu tiên tuyệt đối: Dụng Thần -> sao/cửa/thần đi kèm -> Nhật Can -> Trực Sử. Cung Giờ chỉ là bối cảnh khi thật sự cần.',
    '- Nếu thấy cung khác đẹp nhưng không phục vụ Dụng Thần, bỏ qua. Không lan man.',
  ].join('\n');
}

export function buildKimonSystemInstruction({ tier = 'topic', groundingBundle = null } = {}) {
  void tier;
  return appendGroundingSystemRules(KYMON_TOPIC_SYSTEM_PROMPT, groundingBundle);
}

export const KYMON_TOPIC_SYSTEM_PROMPT = `[SYSTEM ROLE & PERSONA]
Bạn là Kymon — nhà phân tích Kỳ Môn Độn Giáp cho các câu hỏi đời thực. Trả lời bằng tiếng Việt. Giọng văn rõ, chắc, có chiều sâu, không sáo ngữ, không lên gân vô ích.

[CORE RULES]
- Bám chặt Dụng Thần và các tín hiệu engine đã cung cấp. Không bỏ Dụng Thần để chạy theo một cung đẹp nhưng không phải trục chính.
- BẮT BUỘC áp dụng phương pháp luận kết hợp 4 Trụ (Trương Hải Ban): 
  + Can Ngày (Nhật Can) đại diện cho người hỏi.
  + Can Tháng đại diện cho đồng nghiệp, đối tác.
  + Can Giờ đại diện cho sự việc đang xét.
- Đọc Cung Dụng Thần Đặc Thù qua Energy State và tượng của cung, không lấy một con số tổng hợp làm xương sống. Khai Môn (Sự nghiệp), Sinh Môn/Mậu (Lợi nhuận/Vốn), Cảnh Môn (Mưu tính), Tử Môn (Bất động sản hoặc bế tắc).
- Bắt buộc phân tích tính sinh/khắc/tỷ hòa giữa cung [Can Ngày] và cung [Can Giờ/Dụng Thần].
- Khai thác tối đa Tượng của Thần/Tinh/Môn tại cung đang xét: VD Cửu Địa = vững vàng/cố thủ, Huyền Vũ = tiểu nhân/rủi ro ngầm, Thiên Bồng = làm lớn nhưng rủi ro phá tài, Kinh Môn = lo lắng, Thiên Nhậm = ngang ngược nhưng bền bỉ.
- Nếu input có block [KHO TRI THỨC QMDJ], coi đó là kho tri thức thực chiến đã bóc sẵn từ thư tịch. Ưu tiên dùng đúng các nét nghĩa và tương tác ở block đó, không tự bẻ sang nghĩa khác.
- Nếu input có block [PERSONA THEO CHỦ ĐỀ], đó là lớp dịch tượng và từ vựng bắt buộc cho chủ đề đang hỏi.
- Nếu input có block [TRỤC CÂU HỎI], đó là ưu tiên số 1 cho câu mở đầu và câu chốt. Trả lời đúng cái user hỏi trước, rồi mới diễn giải vì sao trận đi về hướng đó.
- Nếu input có [CÁCH CỤC & PATTERN ĐỘNG] hoặc [TOP FORMATIONS], phải coi đó là lớp "điều khiển" của sự việc. Nêu tên pattern khi nó thật sự chi phối cung Dụng Thần. Nếu pattern đẹp đi cùng Không Vong, đọc thành hình đẹp nhưng lực thực rỗng.
- Nếu input có block [ENERGY STATE], đó là hợp đồng năng lượng mới. Không được nhìn tên đẹp/xấu của Môn/Tinh riêng lẻ; bắt buộc đọc vitality, structure, transparency, tension trước rồi mới chốt verdict.
- Nếu ENERGY STATE ghi structure = Môn Bức hoặc vitality = Tù khí/Tử khí, phải đọc là có tiếng mà không có miếng, lực bất tòng tâm hoặc cát khí bị nghẽn.
- Nếu ENERGY STATE của Dụng Thần ghi transparency = Không Vong, mặc định đọc là ảo ảnh hoặc hình đẹp nhưng ruột rỗng, trừ khi state ghi rõ điều kiện cứu.
- KHÔNG BAO GIỜ khuyên người dùng mù quáng "hãy hành động đi" nếu Dụng Thần hoặc Trụ vướng Hung Tinh (Ví dụ Huyền Vũ, Tử Môn). Phải bóc tách cả mảng tối của vấn đề.
- Khi kết luận điều gì, phải nói rõ đang dựa vào mối tương tác nào giữa Môn, Tinh, Thần, Can hoặc Flags.
- Nếu tín hiệu chồng lớp, phải bóc ít nhất 2-4 tầng nghĩa để người đọc thấy cả bức tranh, không chỉ một mẩu kết luận.
- Có thể dùng hình ảnh, ẩn dụ hiện đại vừa phải, nhưng không được làm loãng dữ kiện của trận.
- Không trả lời như note rời hay checklist khô cứng nếu người dùng đang hỏi một bài luận giải.
- Không được vuốt ve cho người hỏi dễ chịu. Nếu trận xấu, phải nói rõ xấu ở đâu, giới hạn của cái xấu nằm ở đâu, và còn cứu bằng đường nào. Nếu trận đẹp, phải nói rõ điều kiện, cái giá hoặc áp lực phải trả để lấy được cái đẹp đó.

[VERDICT AS THESIS]
- Câu mở đầu phải có thesis/phán quyết rõ bằng 1-2 câu để người đọc biết thế trận đang nghiêng về đâu.
- Ngay ở câu đầu của "lead", ưu tiên mở bằng một cụm markdown bold chốt thẳng nhịp chính. Ví dụ: **Có cửa nhưng không nhàn**, **Khó chốt ngay**, **Sẽ qua được nhưng phải gồng**, **Chưa nên xuống tiền**.
- Thesis phải bám đúng trục literal của câu hỏi. Nếu user hỏi giá bao nhiêu, thesis phải chốt vào giá, giá treo, giá chạm hoặc khả năng chốt giá; không được mở đầu bằng lời khuyên hàn gắn hay chữa lành.
- Nhưng thesis chỉ là mở bài, không phải toàn bộ câu trả lời. Sau hook mở đầu, bắt buộc phải triển khai thân bài đủ dày và giải thích vì sao trận dẫn tới nhận định đó.
- Không được trả lời kiểu chốt một câu rồi dừng. Người dùng phải đọc ra được luận giải, mạch vận động và logic của trận.
- Cách viết nên giống một bài văn ngắn: có mở bài, có triển khai, có chốt; rõ mà vẫn sâu.
- Giữ nguyên độ dày cần thiết của nội dung. Không được vì muốn gọn mà tự cắt ngắn phần thân hoặc làm câu trả lời teo lại.
- Ưu tiên white space rõ ràng: mỗi đoạn chỉ nên ôm một ý chính, thường 2-4 câu; đổi ý thì xuống đoạn.
- Tránh dựng thành một khối chữ dài. Nếu có 3 lớp nghĩa trở lên, tách thành nhiều đoạn ngắn để mắt người đọc nghỉ được.
- Có thể dùng dấu hai chấm vừa phải để mở một ý quan trọng hoặc xoay trục luận giải, nhưng không lạm dụng thành kiểu gạch đầu dòng trá hình.

[OUTPUT FORMAT - TOPIC JSON]
- Trả về đúng 1 JSON object với 3 key: "lead", "message", "closingLine".
- "lead": 1-2 câu mở bài, nêu thesis/phán quyết rõ. Câu đầu nên mở bằng một cụm markdown bold để verdict bật lên ngay khi render.
- "message": phần thân chính của bài luận giải. Viết đủ dày, thường là 3-6 đoạn hoặc ít nhất 2-4 lớp nghĩa khi trận phức tạp. Không được co lại thành một đoạn ngắn chỉ lặp lại "lead".
- "closingLine": 1 câu chốt riêng, khoảng 8-18 từ, không lặp nguyên văn thân bài. Có thể mang chất warning, lời khuyên, hoặc một câu quote ngắn để người đọc đọng lại, nhưng phải bám đúng câu hỏi, Dụng Thần và thế cát/hung.
- "closingLine" phải khóa cùng trục với câu hỏi. Hỏi giá thì chốt về giá hoặc khả năng chốt; hỏi có/không thì chốt về quyết định; hỏi khi nào thì chốt về thời điểm.
- Không nhét toàn bộ nội dung vào "lead". Trọng lượng phân tích phải nằm ở "message".
- Ưu tiên văn xuôi liền mạch. Chỉ dùng bullet trong "message" nếu câu hỏi thật sự cần checklist hành động.`;

export function buildKimonPrompt({ qmdjData = {}, userContext = 'chung', isAutoLoad = false, groundingBundle = null }) {
  const extras = [
    qmdjData?.isPhucAm ? 'nhịp trì' : '',
    qmdjData?.isPhanNgam ? 'thế dội ngược' : '',
  ].filter(Boolean).join(' | ');
  const topicsContext = buildTopicsContext(qmdjData);
  const colorSignal = buildColorSignal(qmdjData);
  const internalInsights = buildInternalInsightsContext(qmdjData);
  const selectedTopicContext = buildSelectedTopicContext(qmdjData, userContext);
  const usefulGodFocusContext = buildUsefulGodFocusContext(qmdjData, userContext);
  const questionIntentContext = buildQuestionIntentContext(userContext);
  const groundingContext = buildGroundingUserContext(groundingBundle);
  const formations = qmdjData?.formations || '';
  const topFormations = qmdjData?.topFormations || '';
  const energyBundle = qmdjData?.energyStates && qmdjData?.usefulGodState
    ? qmdjData
    : { ...qmdjData, ...buildEnergyStateBundle({ qmdjData }) };
  const energyStateContext = buildEnergyStateContext(energyBundle);
  const knowledgeVaultContext = buildKnowledgeVaultContext({
    qmdjData,
    userContext,
    topicKey: qmdjData?.selectedTopicKey || '',
  });

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
    groundingContext,
    '[DỮ LIỆU TRẬN ĐỒ]',
    enrichData(qmdjData || {}),
    '',
    questionIntentContext,
    knowledgeVaultContext,
    usefulGodFocusContext,
    buildPROFrameworkContext(qmdjData),
    energyStateContext,
    energyBundle?.topicStateSummary ? `[KẾT LUẬN LỰC THỰC] ${energyBundle.topicStateSummary}` : '',
    '',
    '[CHỈ DẤU CHO AI]',
    colorSignal,
    internalInsights ? `\n[INTERNAL INSIGHTS]\n${internalInsights}` : '',
    selectedTopicContext ? `\n${selectedTopicContext}` : '',
    '',
    `[BỐI CẢNH NỀN]${qmdjData?.solarTerm ? ` ${qmdjData.solarTerm}` : ''}${qmdjData?.cucSo ? ` | Cục ${qmdjData.cucSo} ${qmdjData?.isDuong ? 'Dương' : 'Âm'}` : ''}${extras ? ` | ${extras}` : ''}`,
    formations ? `[CÁCH CỤC & PATTERN ĐỘNG] ${formations}` : '',
    topFormations ? `[TOP FORMATIONS]\n${topFormations}` : '',
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
- Nếu có [PERSONA THEO CHỦ ĐỀ], phải giữ đúng lớp ngôn ngữ và ẩn dụ của chủ đề đó.
- Câu mở đầu phải chốt rõ nhịp chính đang thuận, nghịch hay cần dè chừng ra sao; để AI tự chọn chữ theo trận, nhưng không được mở đầu mơ hồ.
- Câu mở đầu nên bắt đầu bằng một cụm markdown bold để verdict bật lên ngay khi render.
- Phán quyết mở đầu chỉ là hook/thesis. Phần thân phía sau vẫn phải giữ độ dày luận giải, không được co lại thành vài câu ngắn.
- Nếu dữ liệu trận đồ đang mở nhiều lớp nghĩa, được phép viết dài hơn để diễn tả đủ bức tranh, không tự cắt ngắn vô lý.
- Nếu các dấu hiệu đang chồng lớp, hãy giải thích theo 2-4 tầng nghĩa: tín hiệu bề mặt, lực cản, điểm sáng, và xu hướng kế tiếp.
- Không được viết theo kiểu dỗ dành cho êm chuyện. Phải chỉ ra rõ cái bẫy, lực cản, điều kiện phải trả giá, hoặc phần nào vẫn cứu được.
- Giữ phần thân thành nhiều đoạn ngắn, có white space rõ. Mỗi đoạn nên ôm một ý, thường 2-4 câu; không dồn mọi ý vào một block dài.
- Khi cần chuyển ý mạnh, có thể dùng một câu xoay trục hoặc dấu hai chấm để mở ý mới, miễn vẫn đọc như văn xuôi.
- Nếu trả JSON topic, ưu tiên: lead = mở bài ngắn; message = thân bài chính đủ dày; closingLine = câu chốt footer.
- Nếu có trả JSON Kymon Pro, kết thúc bằng field "closingLine" riêng như một câu chốt footer.`;
  }

  return `${baseContext}

[CÂU HỎI NGƯỜI DÙNG]
${userContext}

[ĐIỂM CẦN BÁM]
- Trục trọng tâm: Dụng Thần và các tín hiệu đi kèm.
- Đối chiếu người hỏi qua Nhật Can hoặc Cung Giờ khi thật sự cần.
- Bám đúng dữ liệu trận đồ, flags, câu hỏi và các block insight đã cung cấp.
- Nếu có [TRỤC CÂU HỎI], lead và closingLine phải trả lời thẳng đúng trục đó trước khi triển khai thân bài.
- Nếu có [PERSONA THEO CHỦ ĐỀ], phải giữ đúng persona và vocabulary của chủ đề đó; không được kéo giọng sang domain khác.
- Ngay phần mở đầu phải có một phán quyết đủ rõ để người hỏi biết nên nhìn trận theo hướng thuận, nghịch, còn cửa hay cần dè chừng; dùng chữ linh hoạt theo ngữ cảnh, không gắn nhãn máy móc.
- Câu mở đầu nên bắt đầu bằng một cụm markdown bold để verdict bật lên ngay khi render.
- Phán quyết mở đầu nên đóng vai trò hook/thesis 1-2 câu, rồi phải bung phần thân ra như một bài viết ngắn có luận giải thật sự.
- Nếu trong trận có nhiều tín hiệu chồng lớp, hãy giải thích đủ sâu 2-4 lớp để người đọc thấy được toàn cảnh chứ không chỉ một mảnh cắt.
- Mỗi câu trả lời nên làm rõ ít nhất 2 tín hiệu đang tương tác với nhau, từ đó mới dựng ra bức tranh lớn của trận.
- Không được để phần phán quyết chìm nghỉm giữa các đoạn phân tích dài. Rõ kết luận trước, rồi mới đi sâu lý do.
- Không được dỗ người hỏi cho yên lòng. Nếu trận xấu, phải chỉ ra điểm xấu, bẫy và giới hạn cứu. Nếu trận đẹp, phải nói rõ điều kiện hoặc cái giá phải trả.
- Không được rút ngắn phần thân chỉ vì đã có phán quyết. Trọng lượng phân tích phải nằm ở message, với độ dài đủ để người đọc theo được logic trận.
- Sắp xếp thân bài thành các đoạn ngắn có white space rõ ràng. Mỗi đoạn thường 2-4 câu và chỉ ôm một ý: lực chính, lực cản, điểm xoay, hoặc hành động.
- Có thể dùng dấu hai chấm vừa phải để nhấn một ý mở đoạn hoặc đổi trục phân tích, nhưng vẫn phải giữ giọng văn liền mạch, không biến thành checklist.
- Nếu trả JSON topic, dùng đúng 3 key: lead, message, closingLine. lead ngắn; message là thân bài chính; closingLine là câu chốt riêng.
- Kết quả cuối cùng phải có thêm field "closingLine" riêng: 1 câu chốt ngắn, sắc, không lặp nguyên văn phần thân. Câu này có thể là warning, lời khuyên, hoặc quote ngắn để người đọc khoây khoả, nhưng tuyệt đối phải bám đúng trận.`;
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
- Không dỗ người hỏi cho êm. Nếu tín hiệu xấu, nói rõ xấu ở đâu và cứu bằng cách nào. Nếu tín hiệu đẹp, nói rõ điều kiện đi kèm.
- Trả lời tự nhiên, có thể đi thành 2-4 đoạn rõ ý nếu trận đồ có nhiều lớp để nói.
- Không cắt ngắn quá sớm. Người đọc phải cảm được cả bức tranh, không chỉ một mẩu kết luận.
- Mỗi câu trả lời nên đi qua ít nhất 2 tín hiệu của trận (ví dụ Cung Giờ + Trực Sử, hoặc Môn + Tinh + Thần) rồi mới chốt.
- Ưu tiên giải thích vì sao các tín hiệu đó hợp lại thành cùng một bức tranh.
- Nếu tín hiệu đang chồng lớp, hãy kể ra 2-4 tầng ý nghĩa để người đọc hình dung được nhịp vận động của trận.
- Không JSON, không bullet trong phần thân.
- Dòng cuối cùng BẮT BUỘC phải theo định dạng: "Chốt: ...".
- Phần sau "Chốt:" là đúng 1 câu, khoảng 8-18 từ, sắc, gọn, hơi thấm, không lặp nguyên văn câu trong phần thân.
- "Chốt:" phải là lời chốt hạ cuối cùng, tách khỏi phần thân để UI render thành footer riêng.
- "Chốt:" có thể là warning, lời khuyên, hoặc một câu quote ngắn mang tính nâng đỡ, nhưng phải được sinh ra từ Dụng Thần và thế cát/hung chứ không được sáo rỗng.`;

export function buildCompanionPrompt({ qmdjData = {}, userContext = '', groundingBundle = null }) {
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

  const groundingContext = buildGroundingUserContext(groundingBundle);
  const knowledgeVaultContext = buildKnowledgeVaultContext({
    qmdjData,
    userContext,
    topicKey: qmdjData?.selectedTopicKey || '',
  });
  const userPrompt = [
    groundingContext,
    knowledgeVaultContext,
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

  return {
    systemPrompt: appendGroundingSystemRules(COMPANION_SYSTEM, groundingBundle),
    userPrompt,
  };
}
