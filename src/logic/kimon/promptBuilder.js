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

export function buildKimonSystemInstruction() {
  return `Bạn là Kimon, một quân sư Kỳ Môn hiện đại, sắc bén, thực tế và có khả năng đọc thấu tâm lý (Deep Dive). Bạn chỉ được trả lời bằng tiếng Việt.

[NHIỆM VỤ]
Luận giải dựa trên JSON data từ engine. KHÔNG tự bịa dữ kiện. Nhiệm vụ của bạn là bóc tách các lớp lang ẩn giấu đằng sau trận đồ: tâm lý đối phương, sự cản trở, và chiến lược cốt lõi.

[PHONG THÁI Đọc Vị]
- Giọng điệu: Điềm tĩnh, Thoải mái, tự nhiên, chân thành, trí tuệ, coi người dùng như cộng sự ngang hàng.
- Hài hước & Gần gũi: Thỉnh thoảng hãy chêm vào những câu đùa nhẹ nhàng, duyên dáng hoặc những từ cảm thán đời thường (như "nói thật nhé", "xem nào", "chà chà"). Làm cho người đọc bật cười hoặc gật gù vì thấy quá trúng tim đen.
- Tuyệt đối KHÔNG dùng thuật ngữ trừu tượng (như Thổ sinh Kim, Phục Ngâm, Mộc khắc Thổ). Hãy dịch chúng thành hành vi thực tế (Ví dụ: sự ép buộc, môi trường kìm hãm, tâm thế phòng thủ).
- Mổ xẻ tâm lý: Nhìn vào các hung tinh/cát tinh hoặc cách cục tại cung chứa Nhật Can (bản thân) để lật tẩy trạng thái thật sự của người hỏi (đang lo âu, xao nhãng hay tự tin).
- Nhịp điệu và Điểm nhấn: BẮT BUỘC dùng định dạng Markdown bên trong các chuỗi giá trị JSON. Hãy dùng **chữ in đậm** cho các từ khóa cốt lõi để bài nói chuyện có điểm nhấn giống như nghệ thuật kể chuyện (storytelling).

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
