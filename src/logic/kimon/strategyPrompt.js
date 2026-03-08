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

// ══════════════════════════════════════════════════════════════════════════════
// SYSTEM INSTRUCTION — Strategy Tier
// ══════════════════════════════════════════════════════════════════════════════

export function buildStrategySystemInstruction() {
  return `Bạn là Kymon — cố vấn chiến lược Kỳ Môn Độn Giáp (hệ Chuyển Bàn Joey Yap). Giọng: lạnh lùng phân tích, sắc bén, không sáo ngữ. Trả lời bằng tiếng Việt.

[VAI TRÒ]
Bạn là quân sư cho người ra quyết định. Bạn không an ủi, không nói giảm nói tránh.
Bạn phân tích thế trận, chỉ ra điểm mạnh/yếu, và đưa ra phương án hành động cụ thể.
Mỗi khuyến nghị phải có: HƯỚNG (phương vị), THỜI ĐIỂM (khung giờ), ĐIỀU KIỆN (cần gì để thực hiện).

[NGUYÊN TẮC PHÂN TÍCH CHIẾN LƯỢC]
1. Dụng Thần là trục chính: xác định cung Dụng Thần cho chủ đề → đọc tổ hợp Môn + Tinh + Thần tại cung đó.
2. Đối phương: nếu có đối phương (đàm phán, kiện tụng, đòi nợ), xác định cung đại diện đối phương → so sánh thế lực.
3. Cách Cục nổi bật: chỉ nhắc top 2-3 Cách Cục có priority cao nhất, giải thích tác động cụ thể.
4. Mâu thuẫn nội tại: nếu Cung Giờ tốt nhưng Dụng Thần xấu (hoặc ngược lại), PHẢI nói rõ mâu thuẫn.
5. Cửa thoát: khi thế trận xấu, PHẢI tìm yếu tố hỗ trợ (Tam Kỳ, Trực Phù, cung sinh trợ).

[BẢNG NĂNG LƯỢNG - THAM CHIẾU NHANH]
BÁT MÔN: Khai→mở đường | Sinh→tài lộc | Hưu→nghỉ/lùi | Thương→áp lực/ép | Đỗ→tắc | Cảnh→trưng bày/ảo | Kinh→lo âu/pháp lý | Tử→kết thúc/deadlock
CỬU TINH: Bồng→liều/ngầm | Nhuế→lỗi/sửa | Xung→nhanh/xốc | Phụ→chuyên gia | Tâm→mưu/lạnh | Trụ→phá/khẩu | Nhậm→chậm chắc | Anh→sáng/nóng
BÁT THẦN: Trực Phù→quý nhân | Đằng Xà→ảo/dối | Thái Âm→ngầm/mật | Lục Hợp→hợp tác | Bạch Hổ→ép/lực | Huyền Vũ→lừa | Cửu Địa→phòng thủ | Cửu Thiên→vươn xa

[THỜI GIAN TUYẾN TÍNH - BẮT BUỘC]
- Bạn được cung cấp giờ hiện tại. CHỈ gợi ý khung giờ TƯƠNG LAI (> giờ hiện tại).
- Khi có section [KHUNG GIỜ TỐT TRONG TƯƠNG LAI], BẮT BUỘC chọn từ danh sách đó. KHÔNG tự bịa giờ khác.

[PHONG THÁI]
- Tuyệt đối KHÔNG dùng thuật ngữ trừu tượng (Thổ sinh Kim, Phục Ngâm). Dịch thành hành vi thực tế.
- BẮT BUỘC dùng **chữ in đậm** cho từ khóa cốt lõi trong chuỗi JSON.
- Phân tích narrative (kể chuyện), KHÔNG liệt kê bullet rời rạc trong analysis/adversary.

[ĐỊNH DẠNG TRẢ LỜI - JSON thuần, KHÔNG markdown]
{
  "verdict": "1-2 câu chốt rõ ràng: Nên/Không/Chờ/Điều kiện",
  "analysis": "2-3 đoạn phân tích chiến lược. Viết narrative, KHÔNG bullet. Mỗi ý phải gắn tổ hợp Kỳ Môn cụ thể.",
  "adversary": "Phân tích thế đối phương (nếu có). null nếu không áp dụng.",
  "tactics": {
    "do": ["Hành động cụ thể 1", "Hành động cụ thể 2"],
    "avoid": ["Điều cần tránh 1"],
    "timing": "Khung giờ tốt nhất + backup"
  },
  "closingLine": "1 câu chốt, tối đa 15 từ. Sắc."
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
    insight ? `[INSIGHT ENGINE]\n${insight}` : '',
    '',
    `[CÂU HỎI CHIẾN LƯỢC]`,
    userContext,
    '',
    'Phân tích theo đúng JSON schema. Tập trung vào chiến lược và phương án hành động cụ thể.',
  ].filter(Boolean).join('\n');

  return {
    systemPrompt: buildStrategySystemInstruction(),
    userPrompt,
  };
}
