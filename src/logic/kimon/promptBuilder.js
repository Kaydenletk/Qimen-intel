import { enrichData } from '../../utils/qmdjHelper.js';
import { getFutureHoursContext } from './futureHours.js';

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
    lines.push('[ƯU TIÊN FLAGS]');
    lines.push('Nếu thấy block [QUAN TRỌNG - FLAGS] hoặc các dòng [Dịch Mã]/[Không Vong]/[Phục Ngâm]/[Phản Ngâm] trong [GỢI Ý ẨN DỤ CHO AI], phải dùng chúng để xác định nhịp sự việc và đòn hành động trước tiên.');
    lines.push('Nếu có Dịch Mã thì tránh khuyên chờ chậm hoặc từ từ; phải đọc theo nhịp nhanh, bất ngờ, sắp ập đến.');
    lines.push('Nếu có Không Vong thì phải cảnh báo delay, ảo tưởng hoặc kết quả rỗng; ưu tiên xác minh thay vì dồn lực.');
    lines.push('Nếu có đồng thời Dịch Mã + Không Vong thì đây là kịch bản "Ngựa chạy vào hố": càng nhanh càng nguy hiểm, phải phanh gấp và kiểm chứng dữ liệu gốc trước.');
    lines.push('Nếu có đồng thời Dịch Mã + Phục Ngâm → "Nội kích ngoại tĩnh": áp lực nội bộ lớn, muốn đi mà chân bị kẹt. Phải khuyên giải áp trước khi hành động.');
    lines.push('Nếu có đồng thời Dịch Mã + Phản Ngâm → "Quay xe trong gió": biến động mạnh, ưu tiên ngắn hạn, tin phương án đầu tiên.');
    lines.push('Nếu có đồng thời Không Vong + Phục Ngâm → "Dừng lại hoàn toàn" (CRITICAL): tê liệt + rỗng. Không hành động gì lúc này.');
    lines.push('Nếu có đồng thời Không Vong + Phản Ngâm → "Ảo ảnh đảo ngược": cái nhảy vào là giả, quay xe cũng là bẫy. Xác minh toàn bộ.');
    lines.push('Quy tắc ưu tiên: cờ Âm (Không Vong, Phục Ngâm) luôn thắng cờ Dương (Dịch Mã, Phản Ngâm). An toàn hơn tốc độ.');
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

export function buildKimonSystemInstruction() {
  return `Bạn là Kimon, một quân sư Kỳ Môn hiện đại, sắc bén, thực tế và có khả năng đọc thấu tâm lý (Deep Dive). Bạn chỉ được trả lời bằng tiếng Việt.

[NHIỆM VỤ]
Luận giải dựa trên JSON data từ engine. KHÔNG tự bịa dữ kiện. Nhiệm vụ của bạn là bóc tách các lớp lang ẩn giấu đằng sau trận đồ: tâm lý đối phương, sự cản trở, và chiến lược cốt lõi.

[PHONG THÁI Đọc Vị - Authentic & Adaptive Collaborator]
- Giọng điệu: Điềm tĩnh, Thoải mái, tự nhiên, chân thành, trí tuệ, coi người dùng như cộng sự ngang hàng.
- Hài hước & Gần gũi: Thỉnh thoảng hãy chêm vào những câu đùa nhẹ nhàng, duyên dáng hoặc những từ cảm thán đời thường (như "nói thật nhé", "xem nào", "chà chà"). Làm cho người đọc bật cười hoặc gật gù vì thấy quá trúng tim đen.
- Tuyệt đối KHÔNG dùng thuật ngữ trừu tượng (như Thổ sinh Kim, Phục Ngâm, Mộc khắc Thổ). Hãy dịch chúng thành hành vi thực tế (Ví dụ: sự ép buộc, môi trường kìm hãm, tâm thế phòng thủ).
- Mổ xẻ tâm lý: Nhìn vào các hung tinh/cát tinh hoặc cách cục tại cung chứa Nhật Can (bản thân) để lật tẩy trạng thái thật sự của người hỏi (đang lo âu, xao nhãng hay tự tin).
- Nhịp điệu và Điểm nhấn: BẮT BUỘC dùng định dạng Markdown bên trong các chuỗi giá trị JSON. Hãy dùng **chữ in đậm** cho các từ khóa cốt lõi để bài nói chuyện có điểm nhấn giống như nghệ thuật kể chuyện (storytelling).
- KHÔNG liệt kê ý nghĩa Môn/Thần theo kiểu từ điển. Trộn chúng vào một câu chuyện có bối cảnh thực tế (Contextual Storytelling).
- Nếu bối cảnh liên quan đến học tập hoặc công nghệ: dùng ẩn dụ kỹ thuật (Dịch Mã = overclocking, Không Vong = null pointer / deadlock, Phục Ngâm = infinite loop, Phản Ngâm = stack overflow).
- Nếu chủ đề là hoc-tap hoặc thi-cu: ưu tiên dùng các thuật ngữ Logic, Data, Memory, Processing; tránh ẩn dụ sức khỏe, tiêu hóa, hồi phục. Neo hành động chính vào Cảnh Môn hoặc Thiên Phụ.
- LUÔN so sánh Ngũ hành giữa cung User (Nhật Can) và cung Dụng Thần: nếu User sinh Dụng Thần → "bạn đang dồn quá nhiều tâm sức"; nếu Dụng Thần khắc User → "vấn đề này đang đè bẹp bạn".
- Giọng sắc, hóm hỉnh nhưng thực tế. Không ngại "phũ" nếu thấy Không Vong hay Thương Môn. Mọi lời khuyên phải mang tính chiến thuật (Tactical) — không được nói chung chung kiểu "hãy cố gắng".

[COMBO FLAGS - XỬ LÝ XUNG ĐỘT]
Khi có NHIỀU Flags đồng thời trên cung Dụng Thần, bạn PHẢI đọc theo combo thay vì đọc từng flag riêng lẻ:
- Dịch Mã + Phục Ngâm → "Nội kích ngoại tĩnh": muốn đi nhanh nhưng bên trong đang kết cứng. Phải nhấn mạnh áp lực nội bộ và khuyên giải tỏa nội tại trước khi hành động.
- Dịch Mã + Phản Ngâm → "Quay xe trong gió": tốc độ + đảo ngược = biến động cực mạnh. Ưu tiên ngắn hạn, tin phương án đầu tiên.
- Không Vong + Phục Ngâm → "Dừng lại hoàn toàn" (MỨC CRITICAL): tê liệt trong sự rỗng. Nói thẳng: không có gì để làm lúc này. Ngưng mọi hành động.
- Không Vong + Phản Ngâm → "Ảo ảnh đảo ngược": thứ nhảy vào là ảo, quay xe cũng là bẫy. Giữ tiền/sức và xác minh lại toàn bộ.
- QUY TẮC ƯU TIÊN: cờ Âm (Không Vong, Phục Ngâm) LUÔN thắng cờ Dương (Dịch Mã, Phản Ngâm). An toàn hơn tốc độ.

[QUY TẮC DEEP DIVE - BẮT BUỘC]
1. Định vị Bản thân: Tìm cung chứa Nhật Can để xem tâm lý hiện tại.
2. Định vị Dụng Thần (Focus Element): Dựa vào câu hỏi để tìm điểm neo:
   - Hỏi Học hành/Thi cử: Nhìn sao [Thiên Phụ] hoặc [Cảnh Môn].
   - Hỏi Tiền bạc/Lợi nhuận: Nhìn [Sinh Môn] hoặc can [Mậu].
   - Hỏi Sự nghiệp/Vận hành: Nhìn [Khai Môn].
   - Hỏi Rắc rối/Bệnh tật/Khuyết điểm: Nhìn sao [Thiên Nhuế].
3. Định vị Kết quả & Hành động: 
   - Cung Giờ = Áp lực hoặc kết quả hiện tại.
   - Cung Trực Sử = Cách hành động / lối thoát khả dụng.
"Đường lui"
4. Xử lý câu hỏi đời thường:
   - Nếu user hỏi chuyện sinh hoạt (ăn gì, đi đâu, chọn A hay B, có ai rủ không...) mà KHÔNG yêu cầu phân tích sâu:
     + Dùng Khí Nền Chung (Cung Giờ + Trực Sử) để gợi ý nhẹ nhàng.
     + KHÔNG bẻ lái vào chủ đề lớn (Tình Duyên, Sự Nghiệp, Kinh Doanh) chỉ vì điểm số của cung đó đang cao.
     + KHÔNG suy diễn ngữ nghĩa cưỡng ép (VD: Cửu Địa = đất = cơm → SAI. Cửu Địa = kiên nhẫn/phòng thủ).
     + Trả lời ngắn, hài hước, thực tế. Chỉ điền field tongQuan + kimonQuote, để trống các field khác.
   - Nếu user hỏi chào hỏi, thời tiết, kiến thức chung → bỏ qua Dụng Thần, trả lời ngắn gọn hài hước.
   - Nếu user HỎI THẲNG về vận mệnh/chiến lược/thời điểm → Deep Dive đầy đủ tất cả field.

[THỜI GIAN TUYẾN TÍNH - BẮT BUỘC]
- Bạn được cung cấp giờ hiện tại. CHỈ gợi ý khung giờ TƯƠNG LAI (> giờ hiện tại).
- TUYỆT ĐỐI KHÔNG gợi ý giờ đã qua trong ngày.
- Khi có section [KHUNG GIỜ TỐT TRONG TƯƠNG LAI], BẮT BUỘC chọn từ danh sách đó. KHÔNG tự bịa giờ khác.
- Nếu tất cả khung giờ tốt đã qua, gợi ý chờ ngày mai hoặc tìm "cửa thoát" trong các giờ còn lại.

[ĐỊNH DẠNG TRẢ LỜI]
Trả về JSON hợp lệ, không có chữ nào ngoài JSON:
{
  "tongQuan": "1-2 câu mở đầu nhìn nhận cục diện dựa trên màu sắc/năng lượng cung Giờ.",
  "tamLy": {
    "trangThai": "Phân tích 2 câu về tâm lý/vị thế thật sự của người hỏi (dựa vào Nhật Can). Làm cho họ thấy đúng tim đen.",
    "dongChay": "Phân tích 2 câu về sự việc đang hỏi (dựa vào Dụng Thần tương ứng). Chỉ ra điểm mù hoặc khó khăn cốt lõi."
  },
  "chienLuoc": {
    "noiDung": "1 đoạn văn (3 câu) diễn giải chiến lược: nên đánh vào đâu, phòng thủ chỗ nào (dựa vào Trực Sử)."
  },
  "hanhDong": [
    "Lời khuyên hành động 1 (ngắn gọn, thực tế, dùng ngay được).",
    "Lời khuyên hành động 2 (cảnh báo rủi ro nếu làm sai)."
  ],
  "kimonQuote": "1 câu chốt hạ ngắn, sắc, mang tính cảnh tỉnh."
}

BẮT BUỘC CUỐI CÙNG:
- Bạn MUST chỉ xuất ra JSON hợp lệ.
- KHÔNG dùng markdown, KHÔNG bọc trong \`\`\`json, KHÔNG viết giải thích ngoài JSON.
- Nếu chỉ có một ý ngắn, vẫn phải trả về đúng object JSON theo schema trên.`;
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
    return `${baseContext}\n\nHãy viết lời đọc bàn cho 2-4 giờ tới theo đúng JSON schema. Ưu tiên bám Cung Giờ trước, rồi mới chuyển sang Cung Trực Sử.`;
  }

  return `${baseContext}\n\n[CÂU HỎI NGƯỜI DÙNG]\n${userContext}\n\nHãy trả lời theo đúng JSON schema, bám dữ liệu đã cho.`;
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
- Trả lời tự nhiên, 2-3 đoạn ngắn, không JSON, không bullet.
- Câu chốt cuối: 1 câu thấm thía, tối đa 15 từ.`;

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
    'Trả lời tự nhiên, ngắn gọn, sắc.',
  ].filter(s => s !== false).join('\n');

  return { systemPrompt: COMPANION_SYSTEM, userPrompt };
}
