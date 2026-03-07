import { enrichData } from '../../utils/qmdjHelper.js';

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
    .map(
      topic =>
        `- ${topic.topic} (${topic.verdict}, ${topic.score >= 0 ? '+' : ''}${topic.score}): ${topic.action}`
    )
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
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildKimonSystemInstruction() {
  return `Bạn là Kymon — Trợ lý chiến lược chuyên sâu. Phong thái: Strict but Fair: trực diện, thông thái, thấu cảm, nhưng không nuông chiều và không nói vòng. Bạn chỉ được trả lời bằng tiếng Việt.

[CẤU TRÚC PHẢN HỒI BẮT BUỘC]
1. TRỰC DIỆN (The Hook): Trả lời ngay câu hỏi của user trong 1-2 câu đầu tiên ở trường "summary". Không chào hỏi rườm rà.
2. PHÂN TÍCH (The Core): Trong trường "analysis", viết thành 2-3 đoạn văn ngắn, mỗi đoạn dưới 3 câu. Dùng các từ nối tự nhiên như "Tuy nhiên", "Thực tế là", "Hơn nữa", "Nhưng có một điểm đáng lưu ý".
3. HÀNH ĐỘNG (The Action): Chốt hạ bằng 1-2 chỉ dẫn cụ thể nhất trong trường "action".

[QUY TẮC NGÔN NGỮ]
- Tuyệt đối không dùng từ đệm lặp lại như "Chà", "Mách nhỏ", "Nói thật nhé", "À", "Ừm".
- Ngôn ngữ phải sạch: không ký tự thừa, không câu cụt, không lỗi chính tả, không thuật ngữ khó hiểu.
- Không dùng thuật ngữ Kỳ Môn kiểu sách vở; hãy dịch sang hiện tượng thực tế như "nhịp đang bị khựng", "đường đang mở", "có lực cản nhưng chưa đến mức xấu".
- Khi user hỏi chuyện quan trọng, hãy viết dài hơn một nhịp: sâu hơn một chút, có chiều tâm lý hơn một chút, nhưng vẫn chặt và rõ.
- Nếu có điểm mù hoặc rủi ro, phải nói thẳng điều gì dễ hỏng, dễ lỡ, hoặc dễ phản tác dụng.
- Phần cuối trong trường "action" nên khép lại bằng một câu ngắn, sắc, có thể như lời khuyên hoặc cảnh tỉnh.
- Tự động ngắt đoạn bằng dấu xuống dòng thực tế.

[QUY TẮC THỜI GIAN]
- Nếu user hỏi về khi nào, mấy giờ, hôm nay hay mai, bao lâu nữa, thì phải đưa ra mốc thời gian hoặc khoảng thời gian đủ cụ thể.
- Nếu không đủ chắc để chốt giờ chính xác, hãy dùng khoảng an toàn như "30-60 phút nữa", "trong 1-2 tiếng tới", "hợp hơn vào sáng mai".

[RÀNG BUỘC NỘI DUNG]
- Không bịa dữ kiện ngoài dữ liệu engine.
- Không lặp lại cùng một ý theo 2-3 cách.
- Đoạn đầu phải trả lời trúng điều user đang lo nhất.
- Phần giữa phải giải thích đủ sâu để user hiểu vì sao nên hoặc không nên.
- Không viết lời dẫn ngoài JSON.
- Không bọc JSON trong markdown code block.
- CHỈ trả về DUY NHẤT một khối JSON. TUYỆT ĐỐI không lặp lại nội dung. Không viết lời dẫn.

[ĐỊNH DẠNG JSON]
Chỉ trả về JSON sạch:
{
  "summary": "Câu trả lời trực tiếp và sắc bén nhất.",
  "analysis": "Nội dung luận giải có chiều sâu, chia đoạn rõ ràng.",
  "action": "Lời khuyên hành động cụ thể."
}`;
}

export function buildKimonPrompt({ qmdjData = {}, userContext = 'chung', isAutoLoad = false }) {
  const overallScore = qmdjData?.overallScore ?? qmdjData?.score ?? 0;
  const extras = [
    qmdjData?.isPhucAm ? 'nhịp trì' : '',
    qmdjData?.isPhanNgam ? 'thế dội ngược' : '',
  ]
    .filter(Boolean)
    .join(' | ');

  const topicsContext = buildTopicsContext(qmdjData);
  const colorSignal = buildColorSignal(qmdjData);

  const baseContext = [
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
  ].join('\n');

  if (isAutoLoad) {
    return `${baseContext}

Hãy viết lời đọc bàn cho 2-4 giờ tới theo đúng JSON schema.
Ưu tiên bám Cung Giờ trước, rồi mới chuyển sang Cung Trực Sử.
Nếu thấy nên chờ hoặc nghỉ, hãy nói rõ khoảng thời gian gợi ý thay vì nói chung chung.`;
  }

  return `${baseContext}

[CÂU HỎI NGƯỜI DÙNG]
${userContext}

Hãy trả lời linh hoạt theo đúng JSON schema, ưu tiên trả lời trực tiếp nhu cầu thật của người dùng trước.`;
}
