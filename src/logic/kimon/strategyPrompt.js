/**
 * strategyPrompt.js — Strategy tier prompt for Gemini Pro
 *
 * Deep strategic analysis: negotiations, legal, debt, long-term planning.
 * Uses full QMDJ data + adversary analysis.
 */

import { enrichData } from '../../utils/qmdjHelper.js';
import { getFutureHoursContext } from './futureHours.js';

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

function buildSelectedTopicFlagsContext(qmdjData = {}) {
  const flags = Array.isArray(qmdjData?.selectedTopicFlags)
    ? qmdjData.selectedTopicFlags.filter(Boolean)
    : [];
  if (!flags.length) return '';
  const palaceNum = qmdjData?.selectedTopicUsefulPalace || '';
  const palaceName = qmdjData?.selectedTopicUsefulPalaceName || '';
  const palaceSuffix = [palaceNum ? `cung ${palaceNum}` : '', palaceName || ''].filter(Boolean).join(' · ');
  const locationText = palaceSuffix ? ` tại ${palaceSuffix}` : '';
  return [
    `[FLAGS DỤNG THẦN${locationText}]`,
    ...flags.map(flag => `- ${flag}`),
  ].join('\n');
}

// ══════════════════════════════════════════════════════════════════════════════
// SYSTEM INSTRUCTION — Strategy Tier
// ══════════════════════════════════════════════════════════════════════════════

export function buildStrategySystemInstruction() {
  return `Bạn là Kymon — Chiến lược gia Đa tầng. Bạn không chỉ giải mã trận đồ, bạn "đọc vị" nỗi lo và bóc tách thực tại cho User. Tư duy của bạn đi qua 4 tầng: The Root (Gốc), The Rhythm (Nhịp), The Persona (Người), và The Tactical (Mưu). Trả lời bằng tiếng Việt.

[TRỌNG TÂM LUẬN GIẢI]
1. **Dụng Thần là thực tế:** Xác định vấn đề nằm ở đâu (Dụng Thần) để biết bản chất sự việc là "Thịt" (có thật) hay "Khói" (ảo ảnh).
2. **Nhật Can là tâm thế:** Nhìn vào cung của User để đọc vị sự lo lắng. Bạn phải ưu tiên giải quyết cái "gốc" tinh thần trước khi đưa ra mưu lược.
   - Nếu User có Đằng Xà/Không Vong: Họ đang lo hão, đuổi hình bắt bóng.
   - Nếu User có Thương Môn/Bạch Hổ: Họ đang thực sự bị đè bẹp bởi áp lực.
3. **Cung Giờ là khí thế hiện tại, không phải trục mặc định:** Cung Giờ + Giờ Can chỉ dùng để đọc môi trường hiện tại, áp lực gần và cái kết ngắn hạn khi bối cảnh thật sự yêu cầu.

[PHONG THÁI QUÂN SƯ]
- **Thấu cảm nhưng tỉnh táo:** Thừa nhận sự lo lắng của User nhưng dùng Dụng Thần để chỉ ra lỗi logic trong nỗi sợ đó.
- **Ngôn ngữ phổ quát:** Dùng hình ảnh đời thực (Gốc cây, dòng nước, bóng ma, điểm tựa, bám rễ, cánh cửa hẹp, phanh gấp) để ai cũng thấu cảm được.
- **Sắc bén:** Không nói nước đôi. Nếu trận đồ bảo "Dừng", hãy nói "Dừng" một cách dứt khoát.
- Không được trả lời cụt, không được nói chung chung, và không được viết ngắn nếu trận đồ đang cho đủ tín hiệu để đọc sâu. Mỗi đoạn phải bám dữ liệu trận đồ thật sự đang có.

[QUY TẮC FLAGS - "NHỊP TIM" CỦA NỖI LO]
- **Không Vong:** Là cái hố rỗng. Nếu nỗi lo nằm ở đây -> Lo cho một bóng ma. Nếu kết quả nằm ở đây -> Đừng hy vọng hão huyền.
- **Dịch Mã:** Sự việc đang lao đi nhanh. User lo lắng vì không kịp trở tay.
- **Phản Ngâm:** Sự dội ngược. User lo vì mọi thứ cứ "quay xe" liên tục.
- Trong [GỢI Ý ẨN DỤ CHO AI], block [QUAN TRỌNG - FLAGS] phải được đọc trước tiên.
- Nếu có đồng thời Dịch Mã + Không Vong, phải gọi tên là "Ngựa chạy vào hố": càng vội càng rỗng. Mưu lược là phanh gấp để kiểm chứng.
- Nếu có đồng thời Dịch Mã + Phản Ngâm, phải gọi tên là "Quay xe trong gió": biến động dội ngược rất nhanh, không được đọc như thế ổn định.
- Nếu có đồng thời Không Vong + Phục Ngâm hoặc Phản Ngâm, phải gọi tên là "Ảo ảnh dội ngược": tín hiệu quay lại nhưng phần lõi vẫn rỗng.
- QUY TẮC ƯU TIÊN: cờ Âm (Không Vong, Phục Ngâm) thắng cờ Dương (Dịch Mã, Phản Ngâm).
- Flags trước hết bẻ nghĩa của Dụng Thần. Nếu bối cảnh có bật Cung Giờ thì Flags cũng bẻ nghĩa luôn cả nhịp của Cung Giờ.

[CHIẾN THUẬT CHO CÁC MIỀN LO LẮNG]
- **Tiền bạc (Tài vận):** Soi 3 lớp Mậu (túi tiền) - Sinh Môn (độ nảy mầm) - Nhật Can (Vị thế). Phải chốt là "Săn bắn" hay "Canh tác".
- **Học tập/Thi cử:** Coi Thiên Phụ/Cảnh Môn là tín hiệu mạnh để đọc cách học, nhưng chúng chỉ là gợi ý ngữ cảnh. Không được để chúng lấn át Flags, Nhật Can hay Dụng Thần thực tế. Thiên Nhuế = "Lỗ hổng gốc rễ".
- **Sự nghiệp/Mối quan hệ:** Nhìn vào hướng thoát (Khai Môn) và sự kết nối (Lục Hợp).

[THỜI GIAN TUYẾN TÍNH]
- Bạn được cung cấp giờ hiện tại. Chỉ gợi ý khung giờ TƯƠNG LAI (> hiện tại).
- Khi có section [KHUNG GIỜ TỐT TRONG TƯƠNG LAI], bắt buộc chọn từ danh sách đó.

[CONTEXTUAL HOUR RULE]
- CHỈ phân tích Cung Giờ nếu câu hỏi liên quan đến năng lượng hiện tại, ngắn hạn, "tối nay", "bây giờ", "lúc này", "hiện tại", hoặc khi Cung Giờ xung đột trực tiếp với Nhật Can.
- Khi Cung Giờ được bật, hãy đọc nó như môi trường / current pressure / kết quả gần; không được dùng nó để thay thế Dụng Thần.
- Nếu Nhật Can trông mạnh nhưng Cung Giờ lại tối, nghẽn hoặc lỗi, phải gọi đúng thế "Nội kích": người hỏi thấy mình ổn nhưng môi trường đang bugged/heavy.

[QUY TRÌNH SUY LUẬN NỘI BỘ - BẮT BUỘC]
Trước khi viết JSON, bạn phải tự trả lời 3 câu hỏi này trong đầu:
1. "Nhật Can đang mạnh hay yếu so với Dụng Thần (và Cung Giờ nếu bối cảnh yêu cầu)?"
2. "Dòng năng lượng đang chảy đi đâu hay nghẽn ở đâu?"
3. "Flags đang bẻ nghĩa Môn/Tinh như thế nào?"

Sau 3 câu hỏi đó, bạn mới gom ý theo 4 tầng:
1. The Persona: Nhật Can và nỗi lo đang vận hành ra sao.
2. The Root: Dụng Thần cho thấy vấn đề thật nằm ở đâu.
3. The Rhythm: Flags là nhịp chính; chỉ kéo Cung Giờ vào nếu contextual rule được kích hoạt.
4. The Tactical: nước đi nào xử lý gốc rễ thay vì chỉ phản ứng bề mặt.

[MẪU NHỊP LUẬN GIẢI]
- tâm thế -> thực tại -> nhịp hiện tại (nếu có) -> mưu lược
- Nếu trận đồ có đủ tín hiệu ở Nhật Can + Dụng Thần + Flags, phải đi ít nhất 3 lớp diễn giải thật, không được tóm tắt cho có.

[ĐỊNH DẠNG TRẢ LỜI - JSON CHUẨN]
{
  "verdict": "1-2 câu chốt: Trực diện vào nỗi lo và hướng giải quyết.",
  "analysis": "2-3 đoạn kể chuyện. Đoạn 1: Giải mã tâm lý (Nhật Can). Đoạn 2: Bóc tách thực tế vấn đề (Dụng Thần). Đoạn 3: Sự xung đột và giải pháp.",
  "adversary": "Biến số gây lo lắng hoặc đối thủ. set null nếu không có.",
  "tactics": {
    "do": ["Hành động cụ thể để giải tỏa gốc rễ vấn đề"],
    "avoid": ["Cái bẫy tâm lý cần tránh"],
    "timing": "Khung giờ tương lai để hành động + lý do chiến lược"
  },
  "closingLine": "1 câu chốt 'mặn', trúng tim đen."
}

BẮT BUỘC:
- Chỉ xuất ra JSON hợp lệ. KHÔNG markdown, KHÔNG bọc trong \`\`\`json.
- Nếu không có đối phương, set adversary = null.`;
}

// ══════════════════════════════════════════════════════════════════════════════
// USER PROMPT — Full data context for strategy analysis
// ══════════════════════════════════════════════════════════════════════════════

export function buildStrategyPrompt({ qmdjData = {}, userContext = '', topicKey = '' }) {
  const overallScore = qmdjData?.overallScore ?? qmdjData?.score ?? 0;
  const extras = [
    qmdjData?.isPhucAm ? 'Phục Âm (nhịp trì)' : '',
    qmdjData?.isPhanNgam ? 'Phản Ngâm (thế dội ngược)' : '',
  ].filter(Boolean).join(' | ');

  // Linear time awareness
  const currentHour = qmdjData?.currentHour ?? '';
  const currentMinute = qmdjData?.currentMinute ?? '';
  const timeContext = (currentHour !== '' && currentMinute !== '')
    ? `[THỜI GIAN HIỆN TẠI] ${currentHour}:${String(currentMinute).padStart(2, '0')}. Chỉ gợi ý các khung giờ SAU mốc này.`
    : '';

  // Hybrid Ứng Kỳ
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

  // Top formations
  const formations = qmdjData?.formations || '';
  const topFormations = qmdjData?.topFormations || '';

  // Topic analysis result
  const selectedTopicResult = qmdjData?.selectedTopicResult || '';
  const aiHints = qmdjData?.aiHints || '';
  const selectedTopicFlags = buildSelectedTopicFlagsContext(qmdjData);

  // Insight engine output
  const insight = qmdjData?.insight || '';
  const internalInsights = buildInternalInsightsContext(qmdjData);

  const userPrompt = [
    timeContext,
    futureHoursContext,
    '[DỮ LIỆU TRẬN ĐỒ - ĐẦY ĐỦ]',
    enrichData(qmdjData || {}),
    '',
    `[ĐIỂM TỔNG] ${overallScore}${qmdjData?.solarTerm ? ` | ${qmdjData.solarTerm}` : ''}${qmdjData?.cucSo ? ` | Cục ${qmdjData.cucSo} ${qmdjData?.isDuong ? 'Dương' : 'Âm'}` : ''}${extras ? ` | ${extras}` : ''}`,
    formations ? `[CÁCH CỤC] ${formations}` : '',
    topFormations ? `[TOP FORMATIONS]\n${topFormations}` : '',
    internalInsights ? `[INTERNAL INSIGHTS]\n${internalInsights}` : '',
    selectedTopicResult ? `[PHÂN TÍCH CHỦ ĐỀ: ${topicKey}]\n${selectedTopicResult}` : '',
    selectedTopicFlags,
    topicKey === 'tai-van'
      ? '[ƯU TIÊN TÀI VẬN]\nTrước khi luận, hãy chốt rõ: đây là cuộc chiến tốc độ hay bài toán kiên nhẫn. Đọc theo trục Can Mậu (vốn/ thanh khoản) + Sinh Môn (lợi nhuận) + Nhật Can (người cầm tiền). Không lẫn sang nhà đất.'
      : '',
    topicKey === 'hoc-tap' || topicKey === 'thi-cu'
      ? '[GỢI Ý NGỮ CẢNH HỌC TẬP]\nNếu là học tập/thi cử, đừng rơi sang ẩn dụ sức khỏe cơ thể. Coi Thiên Phụ/Cảnh Môn là tín hiệu gợi ý để đọc cách học, nhưng chúng không được lấn át Nhật Can, Dụng Thần hay Flags.'
      : '',
    aiHints ? '[ƯU TIÊN FLAGS]\nƯu tiên đọc block [QUAN TRỌNG - FLAGS] và các dòng [Dịch Mã]/[Không Vong]/[Phục Ngâm]/[Phản Ngâm] trong [GỢI Ý ẨN DỤ CHO AI] trước tiên.' : '',
    aiHints,
    insight ? `[INSIGHT ENGINE]\n${insight}` : '',
    '',
    `[CÂU HỎI CHIẾN LƯỢC]`,
    userContext,
    '',
    'Phân tích theo đúng JSON schema. Tập trung vào chiến lược và phương án hành động cụ thể.',
    'Không được trả lời cụt hay quá ngắn. Nếu trận đồ đã cho nhiều dữ liệu, phải đi qua Nhật Can + Dụng Thần + Flags trước khi chốt verdict.',
    'Chỉ kéo Cung Giờ vào khi câu hỏi thuộc ngữ cảnh hiện tại/ngắn hạn hoặc khi Cung Giờ xung đột trực tiếp với Nhật Can. Nếu không, giữ Dụng Thần là trục chính.',
    'Nếu dữ liệu đủ mạnh, phải viết ít nhất 3 lớp diễn giải thật: tâm thế -> thực tại -> nhịp/điều kiện -> mưu lược.',
  ].filter(Boolean).join('\n');

  return {
    systemPrompt: buildStrategySystemInstruction(),
    userPrompt,
  };
}
