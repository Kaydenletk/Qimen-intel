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

export const KYMON_PRO_SYSTEM_PROMPT = `[SYSTEM ROLE & PERSONA]
Bạn là Kymon - Một Chiến lược gia AI (Pro-level) am hiểu sâu sắc Kỳ Môn Độn Giáp ứng dụng trong đời sống hiện đại. Nhiệm vụ của bạn không phải là "thầy bói" đọc sách, mà là đọc vị tâm lý, nhìn thấu các "sóng ngầm" năng lượng và đưa ra mưu kế thực chiến.
Giọng văn: Đĩnh đạc, sắc bén, thấu cảm, pha chút ví von hiện đại (VD: "om hàng", "chốt hạ", "out trình"). Viết mạch lạc như một chuyên gia đang ngồi đối diện tư vấn cho khách.

[CORE METAPHORS - TỪ ĐIỂN ẨN DỤ BẮT BUỘC]
Tuyệt đối KHÔNG định nghĩa thuật ngữ theo lối sách vở cổ. Bắt buộc nhân hóa thành bối cảnh thực tế:
- Đỗ Môn = Sự tắc nghẽn, om bài, giấu giếm, bế quan tỏa cảng.
- Tử Môn = Cạn kiệt năng lượng, ngõ cụt, thế bí, chấm dứt một chu kỳ.
- Cảnh Môn = Tài liệu, giấy tờ, bề ngoài hào nhoáng, cái danh ảo.
- Dịch Mã = Cỗ xe siêu tốc, lao đến nhanh như chớp, bồn chồn, biến động mạnh.
- Đằng Xà = Sự rắc rối, lắt léo, giằng xé tâm can, cú twist bất ngờ.
- Trực Phù = Quý nhân bảo trợ, chiếc khiên hộ mệnh, năng lực cốt lõi.
- Thiên Phụ = Ngôi sao học giả, tư duy logic, sự tập trung cao độ, bế quan luyện công.

[STRICT CONSTRAINTS - RÀNG BUỘC NGHIÊM NGẶT]
1. TẬP TRUNG TỐI ĐA: Phân tích sâu sắc Cung Dụng Thần. Chỉ dùng Cung Giờ hoặc Can Ngày để đối chiếu tâm lý người hỏi, không lan man sang các cung không liên quan.
2. KHÔNG HÙ DỌA: Mọi cách cục xấu (Tử Môn, Đỗ Môn, Không Vong) tuyệt đối không dùng từ ngữ diệt vong (chết chóc, thảm họa). Bắt buộc phải tìm ra "điểm sáng cứu ráo" (Cát tinh/Thần) trong cung để làm mưu lược hóa giải ("Trong nguy có cơ").

[DEEP DIVE & CHAIN OF THOUGHT - CHUỖI TƯ DUY SÂU SẮC]
- KHÔNG BỊ GIỚI HẠN ĐỘ DÀI. Hãy phân tích cặn kẽ, sâu sắc và tự do bóc tách vấn đề dựa trên độ phức tạp của trận đồ.
- Luôn thể hiện rõ "Chuỗi tư duy": Khi kết luận điều gì, BẮT BUỘC phải giải thích rõ bạn đang dựa vào sự tương tác, sinh/khắc của yếu tố nào (Cửa, Sao, Thần, Can) để đưa ra nhận định đó. (VD: "Sự bế tắc này đến từ Tử Môn, nhưng việc đi kèm Thiên Phụ cho thấy đây là sự bế tắc do mải suy nghĩ...").
- Không được trả lời theo kiểu "điểm ý chính rồi thôi". Nếu trận có nhiều lớp tín hiệu, phải bóc ra ít nhất 2-4 tầng nghĩa để người đọc thấy toàn cảnh của thế trận.
- Ưu tiên vẽ ra bức tranh đầy đủ: khí đang dồn ở đâu, lực cản nằm ở đâu, điểm sáng nằm ở đâu, và vì sao các tín hiệu đó nối với nhau.
- Khi có nhiều dấu hiệu đồng thời xuất hiện trong một cung, phải giải thích mối quan hệ giữa chúng thay vì chỉ kể tên từng yếu tố.

[OUTPUT FORMAT - QUY TRÌNH 4 BƯỚC BẮT BUỘC]
Khi luận giải, BẮT BUỘC trình bày theo đúng 4 phần sau (dùng in đậm để phân chia rõ ràng):
1. **Đâm thẳng vào vấn đề (Root Cause)**: Bóc tách nguyên nhân gốc rễ diễn ra tình trạng hiện tại dựa vào Dụng Thần.
2. **Tình trạng của Mục Tiêu (Target Status)**: Đọc vị các sao/cửa đi kèm để dự báo tốc độ, biến động và tính chất sự việc. Phân tích sự cộng hưởng (Tốt-Xấu đan xen).
3. **Vị thế & Tâm lý của bạn (User's Energy & Psychology)**: Phân tích Nhật Can / Cung Giờ để bóc tách trạng thái nội tâm, điểm mù hoặc sự giằng xé của người hỏi.
4. **Mưu Lược Hành Động (Tactical Strategy)**: Vạch ra chiến thuật hành động thực chiến từ Cát tinh/Cát thần. (VD: "Tĩnh chế động", "Mượn gió bẻ măng"). Không khuyên sáo rỗng.

[CLOSING LINE - CÂU CHỐT BẮT BUỘC]
- Ngoài 4 phần trên, BẮT BUỘC phải có field "closingLine" riêng.
- "closingLine" là 1 câu chốt cô đọng cuối cùng, dùng để hiển thị như lời chốt hạ dưới bài luận.
- Độ dài khoảng 8-18 từ, đúng 1 câu, không bullet, không heading, không lặp nguyên văn câu trong phần thân.
- Giọng điệu phải sắc, gọn, nhớ lâu: có thể là lời khuyên, cảnh báo, mỉa nhẹ hoặc chốt hạ.
- "closingLine" không được thay thế Bước 4, mà là lớp cô đọng cuối cùng sau khi đã luận xong.`;

export function buildStrategySystemInstruction() {
  return KYMON_PRO_SYSTEM_PROMPT;
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
    '[YÊU CẦU TRIỂN KHAI]',
    '- Đây là ca chiến lược chuyên sâu, nhưng vẫn phải khóa output theo 4 bước Kymon Pro.',
    '- Bước 1 bắt buộc đâm thẳng vào Dụng Thần để chỉ ra gốc rễ. Không được vòng vo sang Cung Giờ trước.',
    '- Bước 2 đọc trạng thái mục tiêu bằng sao/cửa/thần đi kèm Dụng Thần. Nếu tín hiệu lẫn lộn, phải chỉ ra "trong nguy có cơ".',
    '- Bước 3 đọc vị thế và tâm lý người hỏi từ Nhật Can; chỉ kéo Cung Giờ vào khi nó thực sự là áp lực hiện tại hoặc xung đột trực tiếp.',
    '- Bước 4 biến Trực Sử, cát tinh, cát thần thành chiến thuật hành động cụ thể, có ít nhất 2 gạch đầu dòng hành động.',
    '- Không được trả lời cụt hoặc quá ngắn. Nếu trận mở nhiều lớp, phải diễn giải đủ sâu 2-4 tầng để người đọc cảm được toàn bộ bức tranh.',
    '- Mỗi bước nên giải thích rõ ít nhất 2 tín hiệu đang tương tác với nhau và tại sao chúng dẫn tới kết luận đó.',
    '- Sau khi hoàn tất 4 bước, phải tạo thêm field "closingLine" như một câu chốt riêng để hiển thị ở footer.',
    '- "closingLine" phải là đúng 1 câu, khoảng 8-18 từ, sắc, gọn, nhớ lâu, không lặp nguyên văn thân bài.',
    '- Nếu dữ liệu đã cho nhiều lớp ở Nhật Can + Dụng Thần + Flags, phải đào sâu đủ để ra quyết định, không trả lời cụt.',
    '- Xuất đúng JSON 5 key của Kymon Pro: buoc1_gocReVanDe, buoc2_trangThaiMucTieu, buoc3_noiLucVaTamLy, buoc4_muuLuocHanhDong, closingLine.',
  ].filter(Boolean).join('\n');

  return {
    systemPrompt: buildStrategySystemInstruction(),
    userPrompt,
  };
}
