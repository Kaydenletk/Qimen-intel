/**
 * Simple HTTP server for QMDJ Engine
 * Run: node server.js
 * Access: http://localhost:3000
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyze } from './src/index.js';
import { generateDeterministicEnergyFlow } from './src/logic/dungThan/index.js';
import { generateQuickSummary } from './src/logic/dungThan/quickSummary.js';
import {
  ORDER as SLOT_ORDER,
  SLOT_TO_PALACE,
  normalizePalaces,
  displayStarShort,
} from './src/core/palaceLayout.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function formatLocalDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseBoundedInt(rawValue, min, max) {
  if (rawValue === null || rawValue === undefined) return null;
  const text = String(rawValue).trim();
  if (!text || !/^-?\d+$/.test(text)) return null;
  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(max, Math.max(min, parsed));
}

function escapeHTML(raw) {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseDateTimeQuery({ dateParam, hourParam, minuteParam }) {
  const now = new Date();
  const parsedHour = parseBoundedInt(hourParam, 0, 23);
  const parsedMinute = parseBoundedInt(minuteParam, 0, 59);
  const hour = parsedHour ?? now.getHours();
  const minute = parsedMinute ?? now.getMinutes();

  if (!dateParam) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
    return { date, hour, minute };
  }

  const [yRaw, mRaw, dRaw] = String(dateParam).split('-').map(n => Number(n));
  if (!Number.isFinite(yRaw) || !Number.isFinite(mRaw) || !Number.isFinite(dRaw)) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
    return { date, hour, minute };
  }

  const date = new Date(yRaw, mRaw - 1, dRaw, hour, minute, 0, 0);
  return { date, hour, minute };
}

function generateHTML(date, hour, minute = 0, options = {}) {
  const { chart, evaluation, topicResults } = analyze(date, hour);
  const autoLocalNow = options.autoLocalNow === true;

  // Generate Energy Flow Summary
  const energyFlow = generateDeterministicEnergyFlow(chart);

  const palacesByNum = normalizePalaces(chart.palaces);

  // Generate Quick Summaries for 9 Palaces (using 'tai-van' as test topic)
  const PALACE_META_MAP = {
    1: { name: 'Khảm', dir: 'Bắc' },
    2: { name: 'Khôn', dir: 'Tây Nam' },
    3: { name: 'Chấn', dir: 'Đông' },
    4: { name: 'Tốn', dir: 'Đông Nam' },
    5: { name: 'Trung', dir: 'Trung Tâm' },
    6: { name: 'Càn', dir: 'Tây Bắc' },
    7: { name: 'Đoài', dir: 'Tây' },
    8: { name: 'Cấn', dir: 'Đông Bắc' },
    9: { name: 'Ly', dir: 'Nam' },
  };
  const palaceSummaries = {};
  for (let p = 1; p <= 9; p++) {
    const pal = palacesByNum[p];
    const meta = PALACE_META_MAP[p];
    if (p === 5 || !pal) {
      palaceSummaries[p] = { summary: 'Trung Cung', verdict: 'Bình', emoji: '⊕', color: 'gray' };
      continue;
    }
    palaceSummaries[p] = generateQuickSummary({
      mon: pal.mon?.name,
      tinh: pal.star?.name,
      than: pal.than?.name,
      topic: 'tai-van',
      direction: meta?.dir,
      palaceName: meta?.name,
    });
  }
  const TOPIC_CHIP_LABELS = {
    'tai-van': 'Tiền bạc / Đầu tư',
    'su-nghiep': 'Công việc / Sự nghiệp',
    'tinh-duyen': 'Tình cảm / Mối quan hệ',
    'kinh-doanh': 'Kinh doanh',
    'suc-khoe': 'Sức khỏe',
    'thi-cu': 'Thi cử',
    'ky-hop-dong': 'Hợp đồng',
    'dam-phan': 'Đàm phán',
    'doi-no': 'Đòi nợ',
    'kien-tung': 'Kiện tụng',
    'xuat-hanh': 'Xuất hành',
    'xin-viec': 'Xin việc',
    'bat-dong-san': 'Bất động sản',
    'muu-luoc': 'Mưu lược',
  };
  const DIRECTION_LABELS_VI = {
    SE: 'Đông Nam',
    S: 'Nam',
    SW: 'Tây Nam',
    E: 'Đông',
    C: 'Trung Cung',
    W: 'Tây',
    NE: 'Đông Bắc',
    N: 'Bắc',
    NW: 'Tây Bắc',
  };
  const SELFPLUS_DEITY_ALIAS = { 'Bạch Hổ': 'Câu Trận', 'Huyền Vũ': 'Chu Tước' };
  const formatScore = score => `${score >= 0 ? '+' : ''}${score}`;
  const scoreTone = score => (score >= 5 ? 'cat' : score < 0 ? 'hung' : 'info');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const scorePercent = score => Math.round(((clamp(score, -20, 20) + 20) / 40) * 100);
  const fallbackActionLabel = score => (score >= 5 ? 'Chủ động' : score <= -5 ? 'Phòng thủ' : 'Quan sát');
  const mapStrategicAction = signal => (signal > 0 ? 'Chủ động' : signal < 0 ? 'Phòng thủ' : 'Quan sát');
  const topFormations = Array.isArray(evaluation.topFormations) ? evaluation.topFormations.slice(0, 8) : [];
  const formationTypeLabel = type => (type === 'cat' ? 'Cát' : type === 'hung' ? 'Hung' : 'Bình');
  const buildFormationEvidence = usefulPalace => {
    const palaceNum = Number(usefulPalace);
    if (!topFormations.length) return [];

    const palaceHits = Number.isFinite(palaceNum)
      ? topFormations.filter(hit => Number(hit?.palace) === palaceNum)
      : [];
    const picked = palaceHits.length ? palaceHits.slice(0, 2) : topFormations.slice(0, 2);
    const heading = palaceHits.length
      ? 'Cách cục tại cung Dụng Thần:'
      : 'Cách cục nổi bật toàn cục:';

    return [
      heading,
      ...picked.map(hit => {
        const tone = formationTypeLabel(hit?.type);
        const name = hit?.name || 'Cách cục';
        const desc = hit?.desc || 'Chưa có mô tả chi tiết.';
        const palaceText = Number.isFinite(Number(hit?.palace)) ? ` (P${hit.palace})` : '';
        return `[${tone}] ${name}${palaceText} — ${desc}`;
      }),
    ];
  };
  const strategicTitle =
    evaluation.overallScore >= 15 ? 'Thuận Gió Tăng Tốc' :
      evaluation.overallScore >= 5 ? 'Tiến Chậm Mà Chắc' :
        evaluation.overallScore >= -5 ? 'Tĩnh Tại Quan Sát' :
          evaluation.overallScore >= -15 ? 'Phòng Thủ Có Kỷ Luật' : 'Dừng Lại Để Tái Cân Bằng';
  const DOOR_KEY_MAP = {
    'Khai': 'Khai',
    'Khai Môn': 'Khai',
    'Sinh': 'Sinh',
    'Sinh Môn': 'Sinh',
    'Hưu': 'Huu',
    'Hưu Môn': 'Huu',
    'Huu': 'Huu',
    'Đỗ': 'Do',
    'Đỗ Môn': 'Do',
    'Do': 'Do',
    'Thương': 'Thuong',
    'Thương Môn': 'Thuong',
    'Thuong': 'Thuong',
    'Cảnh': 'Canh',
    'Cảnh Môn': 'Canh',
    'Canh': 'Canh',
    'Kinh': 'Kinh',
    'Kinh Môn': 'Kinh',
    'Tử': 'Tu',
    'Tử Môn': 'Tu',
    'Tu': 'Tu',
  };
  const DOOR_DISPLAY = {
    Khai: 'Khai Môn',
    Sinh: 'Sinh Môn',
    Huu: 'Hưu Môn',
    Do: 'Đỗ Môn',
    Thuong: 'Thương Môn',
    Canh: 'Cảnh Môn',
    Kinh: 'Kinh Môn',
    Tu: 'Tử Môn',
  };
  const BRIEFING_TITLE_BY_DOOR = {
    Kinh: 'Giữ Bình Tĩnh Trước Nhiễu Động',
    Do: 'Thu Mình Để Căn Chỉnh',
    Thuong: 'Hạ Nhiệt Trước Khi Đối Đầu',
    Canh: 'Kiểm Chứng Trước Khi Bứt Tốc',
    Tu: 'Đóng Cái Cũ, Mở Nhịp Mới',
    Huu: 'Dưỡng Lực Trước Khi Tiến',
    Sinh: 'Nuôi Đà Tăng Trưởng',
    Khai: 'Mở Đường Và Chốt Việc',
  };
  const INTERNAL_STATE_BY_DOOR = {
    Canh: 'Năng lượng hiện tại cho thấy bạn đang rực cháy kỳ vọng và khá nôn nóng muốn thấy kết quả.',
    Do: 'Có vẻ bạn đang thu mình lại, cảm thấy bế tắc hoặc muốn che giấu những dự định bên trong.',
    Kinh: 'Nội tâm đang nhiễu và dễ sợ sai, nên đầu óc liên tục bật chế độ phòng vệ.',
    Thuong: 'Bạn đang có chút bực dọc hoặc tổn thương ngầm, nên rất dễ phản ứng mạnh hơn mức cần thiết.',
    Tu: 'Bạn đang ở pha muốn kết thúc một vòng cũ, dọn gọn để lấy lại quyền kiểm soát.',
    Huu: 'Bạn cần nghỉ nhịp để hồi phục, cơ thể và tâm trí đều đang xin thêm không gian.',
    Sinh: 'Bạn có động lực mở rộng rất rõ, năng lượng tiến lên đang khá mạnh.',
    Khai: 'Bạn đang vào trạng thái thông suốt, quyết định nhanh và nhìn vấn đề khá rõ.',
  };
  const REALITY_CHECK_BY_DOOR = {
    Kinh: 'đây là lúc giảm phản ứng cảm tính, ưu tiên dữ liệu rõ rồi mới chốt bước tiếp theo.',
    Do: 'nhịp này hợp quan sát và gom thông tin, chưa phải lúc đẩy mạnh đối đầu trực diện.',
    Thuong: 'nên quản trị xung đột sớm, giữ biên giao tiếp để tránh đứt mạch quan hệ quan trọng.',
    Canh: 'cửa sáng nhưng dễ ảo, hãy test nhỏ một vòng trước khi tăng cam kết.',
    Tu: 'ưu tiên cắt phần rò rỉ, đóng việc dở dang rồi mới mở hướng mới.',
    Huu: 'nên giữ nhịp bền, làm gọn việc nền thay vì nhận thêm mặt trận mới.',
    Sinh: 'cơ hội có thật, nhưng cần tăng theo nhịp đều thay vì all-in.',
    Khai: 'đây là cửa mở tốt, hợp chốt việc quan trọng bằng thông điệp ngắn và rõ.',
  };
  const normalizeDoorKey = rawDoor => DOOR_KEY_MAP[String(rawDoor || '').trim()] || '';
  const palaceLabelFromNum = palaceNum => {
    const slot = Object.entries(SLOT_TO_PALACE).find(([, p]) => Number(p) === Number(palaceNum))?.[0];
    return DIRECTION_LABELS_VI[slot] || `Cung ${palaceNum}`;
  };
  const displayDeity = pal => {
    const canonical = pal?.than?.name || '';
    if (!canonical) return '—';
    const alias = SELFPLUS_DEITY_ALIAS[canonical];
    return alias || canonical;
  };
  const buildCounselorNarrative = ({ topic, pal, actionLabel, coreMessage, fallbackNarrative }) => {
    const doorName = pal?.mon?.short || pal?.mon?.name || 'Môn chưa xác định';
    const starName = displayStarShort(pal) || 'Tinh chưa xác định';
    const deityName = displayDeity(pal);
    const actionDirective = actionLabel === 'Chủ động'
      ? 'chủ động chốt một bước nhỏ ngay bây giờ và đo phản hồi thực tế.'
      : actionLabel === 'Phòng thủ'
        ? 'ưu tiên giữ nguồn lực, giảm cam kết mới và khóa các điểm rò rỉ.'
        : 'giữ nhịp quan sát, thử ở quy mô nhỏ rồi mới tăng cam kết.';
    const advice = coreMessage || fallbackNarrative || topic?.actionAdvice || 'Giữ nhịp ổn định trước khi mở thêm mặt trận mới.';
    return `Đọc dòng năng lượng: Tôi quan sát thấy Dụng thần ${doorName} đang đóng tại ${topic.usefulGodDir} (cung ${topic.usefulGodPalace}), đi cùng ${starName} và ${deityName}. Lời khuyên thực chiến: ${advice} ${actionDirective}`;
  };

  const palaceRows = [];
  for (const dir of SLOT_ORDER) {
    const p = SLOT_TO_PALACE[dir];
    const pal = palacesByNum[p];
    const directionLabel = DIRECTION_LABELS_VI[dir] || dir;
    if (dir === 'C') {
      palaceRows.push(`
        <tr>
          <td>5</td>
          <td>${pal?.phiTinhNum ?? ''}</td>
          <td>Trung Cung</td>
          <td>${displayStarShort(pal)}</td>
          <td>${pal?.can?.name ?? ''}</td>
          <td>${pal?.earthStem ?? ''}</td>
          <td>—</td>
          <td>—</td>
          <td></td>
        </tr>
      `);
      continue;
    }
    if (!pal) continue;
    const flags = [
      pal.trucPhu ? 'Trực Phù' : '',
      pal.trucSu ? 'Trực Sử' : '',
      pal.khongVong ? 'Không Vong' : '',
      pal.dichMa ? 'Dịch Mã' : '',
      pal.isNgayCan ? 'Ngày Can' : '',
      pal.isGioCan ? 'Giờ Can' : '',
    ].filter(Boolean).join(', ');

    palaceRows.push(`
      <tr>
        <td>${p}</td>
        <td>${pal.phiTinhNum}</td>
        <td>${directionLabel}</td>
        <td>${displayStarShort(pal)}</td>
        <td>${pal.can?.name || ''}</td>
        <td>${pal.earthStem || ''}</td>
        <td>${pal.mon?.short || '—'}</td>
        <td>${displayDeity(pal)}</td>
        <td>${flags}</td>
      </tr>
    `);
  }

  const topicEntries = Object.entries(topicResults)
    .filter(([, res]) => !res.error)
    .map(([key, res]) => ({ key, ...res }));

  const fallbackTopic = {
    key: 'none',
    topic: 'Chưa có dữ liệu chủ đề',
    chipLabel: 'N/A',
    score: 0,
    scoreText: '+0',
    scorePct: 50,
    tone: 'info',
    verdict: 'Bình',
    usefulGodDir: '—',
    usefulGodPalace: '—',
    usefulGodPalaceName: '—',
    actionAdvice: 'Không có dữ liệu phân tích.',
    reasons: ['Không tìm thấy topic hợp lệ trong kết quả hiện tại.'],
    insight: null,
    strategicInsight: null,
  };

  const uiTopics = (topicEntries.length ? topicEntries : [fallbackTopic]).map(t => {
    const strategic = t.strategicInsight && typeof t.strategicInsight === 'object'
      ? t.strategicInsight
      : null;
    const insight = t.insight && typeof t.insight === 'object' ? t.insight : null;
    const insightConfidence = typeof strategic?.confidence === 'number'
      ? clamp(strategic.confidence, 0, 1)
      : typeof insight?.confidence === 'number'
        ? clamp(insight.confidence, 0, 1)
        : clamp((t.score + 20) / 40, 0, 1);
    const strategicEvidence = strategic?.evidence
      ? [
        ...(Array.isArray(strategic?.evidence?.usefulGods)
          ? strategic.evidence.usefulGods.map(g => `Dụng thần ${g.type}: ${g.name} tại cung ${g.palaceNum} (${g.state}).`)
          : []),
        ...(Array.isArray(strategic?.evidence?.flags)
          ? strategic.evidence.flags.map(f => `Cờ ${f.name} (${f.severity}).`)
          : []),
        ...(strategic?.evidence?.calc
          ? [`Confidence: base=${strategic.evidence.calc.base} · multipliers=${(strategic.evidence.calc.multipliers || []).map(m => `${m.name}x${m.value}`).join(', ') || 'none'} · final=${strategic.evidence.calc.final}.`]
          : []),
      ]
      : [];
    const baseInsightEvidence = strategicEvidence.length
      ? strategicEvidence
      : Array.isArray(insight?.evidence) && insight.evidence.length
        ? insight.evidence
        : (Array.isArray(t.reasons) ? t.reasons.slice(0, 6) : []);
    const formationEvidence = buildFormationEvidence(t.usefulGodPalace);
    const insightEvidence = Array.from(new Set([...formationEvidence, ...baseInsightEvidence])).slice(0, 8);
    const usefulPalaceNum = Number(t.usefulGodPalace);
    const usefulPalace = Number.isFinite(usefulPalaceNum) ? palacesByNum[usefulPalaceNum] : null;
    const actionLabel = strategic ? mapStrategicAction(strategic.score) : (insight?.actionLabel || fallbackActionLabel(t.score));
    const oneLiner = strategic?.coreMessage || insight?.oneLiner || t.actionAdvice || '';
    const counselorNarrative = buildCounselorNarrative({
      topic: t,
      pal: usefulPalace,
      actionLabel,
      coreMessage: oneLiner,
      fallbackNarrative: strategic?.narrative || '',
    });
    return {
      key: t.key,
      topic: t.topic,
      chipLabel: TOPIC_CHIP_LABELS[t.key] || t.topic,
      score: t.score,
      scoreText: formatScore(t.score),
      scorePct: scorePercent(t.score),
      tone: scoreTone(t.score),
      verdict: t.verdict?.label || 'Bình',
      usefulGodDir: t.usefulGodDir,
      usefulGodPalace: t.usefulGodPalace,
      usefulGodPalaceName: t.usefulGodPalaceName,
      actionAdvice: t.actionAdvice || '',
      actionLabel,
      oneLiner,
      headline: strategic?.headline || t.topic,
      narrative: counselorNarrative,
      confidence: insightConfidence,
      confidencePct: Math.round(insightConfidence * 100),
      formationEvidence,
      insightEvidence,
      insightEvidenceText: insightEvidence.map(line => `// ${line}`).join('\n'),
      tactics: strategic
        ? { do: Array.isArray(strategic.do) ? strategic.do : [], avoid: Array.isArray(strategic.avoid) ? strategic.avoid : [] }
        : (insight?.tactics || { do: [], avoid: [] }),
      learn: insight?.learn || { usefulGods: [], flags: [], mappingNotes: [] },
      disclaimer: strategic?.disclaimer || insight?.disclaimer || '',
      reasons: Array.isArray(t.reasons) ? t.reasons : [],
    };
  });

  const defaultTopic = uiTopics.find(t => t.key === 'tai-van') || uiTopics[0];
  const rankedTopics = [...uiTopics].sort((a, b) => b.score - a.score);
  const bestTopic = rankedTopics[0] || fallbackTopic;
  const dayStem = chart.dayPillar?.stemName || '';
  let dayPalaceNum = null;
  for (let p = 1; p <= 9; p++) {
    if (palacesByNum[p]?.isNgayCan) {
      dayPalaceNum = p;
      break;
    }
  }
  if (!dayPalaceNum && dayStem) {
    for (let p = 1; p <= 9; p++) {
      if (palacesByNum[p]?.can?.name === dayStem) {
        dayPalaceNum = p;
        break;
      }
    }
  }
  const dayPalace = dayPalaceNum ? palacesByNum[dayPalaceNum] : null;
  const dayDoorKey = normalizeDoorKey(dayPalace?.mon?.short || dayPalace?.mon?.name);
  const dayDoorText = DOOR_DISPLAY[dayDoorKey] || dayPalace?.mon?.short || 'Môn chưa xác định';
  const dayDirText = dayPalaceNum ? palaceLabelFromNum(dayPalaceNum) : 'vị trí chưa xác định';
  const hourStem = chart.gioPillar?.stemName || '';
  let hourPalaceNum = null;
  for (let p = 1; p <= 9; p++) {
    if (palacesByNum[p]?.isGioCan) {
      hourPalaceNum = p;
      break;
    }
  }
  if (!hourPalaceNum) {
    for (let p = 1; p <= 9; p++) {
      if (palacesByNum[p]?.earthStem === hourStem) {
        hourPalaceNum = p;
        break;
      }
    }
  }
  const hourPalace = hourPalaceNum ? palacesByNum[hourPalaceNum] : null;
  const hourDoorKey = normalizeDoorKey(hourPalace?.mon?.short || hourPalace?.mon?.name);
  const hourDoorText = DOOR_DISPLAY[hourDoorKey] || hourPalace?.mon?.short || 'Môn chưa xác định';
  const hourDirText = hourPalaceNum ? palaceLabelFromNum(hourPalaceNum) : 'vị trí chưa xác định';
  let chiefPalaceNum = null;
  for (let p = 1; p <= 9; p++) {
    if (palacesByNum[p]?.trucPhu) {
      chiefPalaceNum = p;
      break;
    }
  }
  const chiefPalace = chiefPalaceNum ? palacesByNum[chiefPalaceNum] : null;
  const chiefDoorKey = normalizeDoorKey(chiefPalace?.mon?.short || chiefPalace?.mon?.name);
  const chiefDoorText = DOOR_DISPLAY[chiefDoorKey] || chiefPalace?.mon?.short || 'Môn chưa xác định';
  const chiefDirText = chiefPalaceNum ? palaceLabelFromNum(chiefPalaceNum) : 'vị trí chưa xác định';

  // Trực Phù prefers Nhuế over Cầm
  let trucPhuDisplay = chart.leadStar || 'Thiên chưa xác định';
  if (trucPhuDisplay === 'Thiên Cầm' || trucPhuDisplay === 'Cầm') {
    trucPhuDisplay = 'Thiên Nhuế';
  }

  const briefingHeading = BRIEFING_TITLE_BY_DOOR[dayDoorKey] || strategicTitle;
  const internalLine = `${INTERNAL_STATE_BY_DOOR[dayDoorKey] || 'Năng lượng hiện tại của bạn đang khá nhiễu, cần chậm một nhịp để nhìn rõ ưu tiên chính.'} (Nhật Can ${dayStem || '—'} tại ${dayDoorText}, ${dayDirText}).`;
  const hourRealityTail = REALITY_CHECK_BY_DOOR[hourDoorKey] || 'hãy ưu tiên bước nhỏ có thể kiểm chứng, tránh quyết định vì cảm xúc nhất thời.';
  const chiefRealityTail = REALITY_CHECK_BY_DOOR[chiefDoorKey] || 'đi nhịp thận trọng, gom thêm dữ kiện trước khi tăng cam kết.';
  const realityLine = hourDoorKey
    ? `Dòng chảy thực tế cho thấy Can giờ ${chart.gioPillar?.displayStemName || hourStem} đang ở ${hourDoorText}, ${hourDirText}; ${hourRealityTail}`
    : `Dòng chảy thực tế cho thấy Trực Phù (${trucPhuDisplay}) đang ở ${chiefDirText} cùng ${chiefDoorText}; ${chiefRealityTail}`;
  const directiveVerb = bestTopic?.actionLabel === 'Chủ động'
    ? 'chủ động chốt một bước nhỏ nhưng dứt khoát'
    : bestTopic?.actionLabel === 'Phòng thủ'
      ? 'ưu tiên phòng thủ và bảo toàn nguồn lực'
      : 'giữ nhịp quan sát và thử nhỏ trước khi tăng lực';
  const directiveLine = bestTopic?.topic && bestTopic?.usefulGodDir
    ? `Trong 2-4 giờ tới, hãy ${directiveVerb} với chủ đề ${bestTopic.chipLabel || bestTopic.topic}, tập trung hướng ${bestTopic.usefulGodDir} (cung ${bestTopic.usefulGodPalace}) rồi đo phản hồi ngay.`
    : 'Trong 2-4 giờ tới, hãy giữ nhịp quan sát và chưa mở rộng cam kết cho đến khi tín hiệu rõ hơn.';

  const briefingParagraph = [internalLine, realityLine, directiveLine]
    .map(line => escapeHTML(line))
    .join('<br><br>');

  const topicRows = topicEntries.map(res => `
    <tr data-topic="${res.topic}" data-direction="${res.usefulGodDir}" data-score="${res.score}">
      <td data-col="topic">${res.topic}</td>
      <td data-col="direction">${res.usefulGodDir}</td>
      <td>${res.usefulGodPalace}</td>
      <td>${res.verdict.label}</td>
      <td data-col="score">${formatScore(res.score)}</td>
    </tr>
  `).join('');

  const signalBadges = evaluation.topFormations.length
    ? evaluation.topFormations.slice(0, 4).map(f => {
      const tone = f.type === 'cat' ? 'cat' : f.type === 'hung' ? 'hung' : 'info';
      const safeName = escapeHTML(f.name || 'Cách cục');
      const safeDesc = escapeHTML(f.desc || 'Chưa có mô tả chi tiết.');
      const safeTitle = escapeHTML(`${f.name || 'Cách cục'}: ${f.desc || 'Chưa có mô tả chi tiết.'}`);
      return `
      <button type="button" class="signal signal-${tone} signal-with-tooltip" title="${safeTitle}" aria-label="${safeTitle}">
        ${safeName}
        <span class="signal-tooltip">${safeDesc}</span>
      </button>
    `;
    }).join('')
    : '<span class="signal signal-info">Không có formation nổi bật</span>';

  const topicChips = uiTopics.map(t => `
    <button type="button" class="topic-chip${t.key === defaultTopic.key ? ' is-active' : ''}" data-topic="${t.key}">
      ${t.chipLabel}
    </button>
  `).join('');

  const topicPayloadJSON = JSON.stringify(uiTopics).replace(/</g, '\\u003c');
  const selectedDate = formatLocalDateInput(date);
  const selectedMinute = minute;
  const timeBasis = 'Theo giờ bạn nhập (floating time, không khóa timezone)';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Strategic Advisor · QMDJ Engine</title>
  <style>
    :root {
      --bg: #F8FAFC;
      --card: #FFFFFF;
      --border: #E2E8F0;
      --text: #1E293B;
      --muted: #64748B;
      --cat: #10B981;
      --hung: #F43F5E;
      --info: #3B82F6;
      --code-bg: #F1F5F9;
      --shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: 'SF Pro Text', 'Avenir Next', 'Helvetica Neue', sans-serif;
      line-height: 1.5;
    }
    .shell {
      max-width: 1180px;
      margin: 0 auto;
      padding: 24px 20px 40px;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      box-shadow: var(--shadow);
    }
    .app-header {
      padding: 18px 20px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
      flex-wrap: wrap;
    }
    .app-title {
      margin: 0;
      font-size: 1.45rem;
      letter-spacing: -0.02em;
      font-family: 'SF Pro Display', 'Avenir Next', sans-serif;
    }
    .app-subtitle {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 0.95rem;
    }
    .controls {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    .controls label {
      font-size: 0.82rem;
      color: var(--muted);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .controls input,
    .controls button,
    .controls .link-btn {
      height: 38px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: #fff;
      color: var(--text);
      padding: 0 12px;
      font-size: 0.92rem;
      text-decoration: none;
    }
    .controls button {
      background: var(--info);
      border-color: var(--info);
      color: #fff;
      cursor: pointer;
      font-weight: 600;
    }
    .controls .link-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--info);
      font-weight: 600;
    }
    .workspace {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 310px;
      gap: 18px;
      align-items: start;
    }
    .main-column {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .main-column::before {
      content: '';
      position: absolute;
      inset: 8px;
      border-radius: 16px;
      background-image:
        linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
      background-size: calc(100% / 3) calc(100% / 3);
      pointer-events: none;
      z-index: 0;
    }
    .main-column > * {
      position: relative;
      z-index: 1;
    }
    .briefing {
      padding: 22px;
    }
    .energy-flow-card {
      padding: 22px;
      background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
      border-color: #fcd34d;
    }
    .energy-flow-card h2 {
      margin: 8px 0 16px;
      font-size: 1.35rem;
      letter-spacing: -0.02em;
      font-family: 'SF Pro Display', 'Avenir Next', sans-serif;
      color: #92400e;
    }
    .energy-flow-content {
      display: grid;
      gap: 12px;
    }
    .energy-sentence {
      padding: 12px 14px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(251, 191, 36, 0.3);
    }
    .energy-sentence .energy-label {
      display: block;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #92400e;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .energy-sentence p {
      margin: 0;
      font-size: 0.95rem;
      color: #451a03;
      line-height: 1.5;
    }
    .energy-mental {
      border-left: 3px solid #3b82f6;
    }
    .energy-conflict {
      border-left: 3px solid #8b5cf6;
    }
    .energy-blindspot {
      border-left: 3px solid #f59e0b;
    }
    .energy-advice {
      border-left: 3px solid #10b981;
    }
    .energy-meta {
      margin-top: 14px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .energy-tag {
      display: inline-flex;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.8);
      color: #78350f;
      border: 1px solid rgba(251, 191, 36, 0.4);
    }
    .energy-tag.energy-warning {
      background: rgba(251, 146, 60, 0.2);
      color: #c2410c;
      border-color: rgba(251, 146, 60, 0.5);
    }
    .energy-tag.energy-info {
      background: rgba(59, 130, 246, 0.15);
      color: #1d4ed8;
      border-color: rgba(59, 130, 246, 0.4);
    }
    .eyebrow {
      margin: 0;
      font-size: 0.76rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--info);
      font-weight: 700;
    }
    .briefing h2 {
      margin: 8px 0 6px;
      font-size: 1.55rem;
      letter-spacing: -0.02em;
      font-family: 'SF Pro Display', 'Avenir Next', sans-serif;
    }
    .briefing p {
      margin: 0;
      color: #334155;
      font-size: 1rem;
      max-width: 70ch;
    }
    .briefing-narrative {
      white-space: pre-line;
    }
    .signal-row {
      margin-top: 14px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .signal {
      position: relative;
      display: inline-flex;
      align-items: center;
      padding: 5px 10px;
      border-radius: 999px;
      font-size: 0.78rem;
      border: 1px solid;
      font-weight: 600;
      line-height: 1.25;
      font-family: inherit;
    }
    .signal-with-tooltip {
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
    }
    .signal-tooltip {
      position: absolute;
      left: 50%;
      top: calc(100% + 8px);
      transform: translateX(-50%) translateY(6px);
      min-width: 220px;
      max-width: min(360px, 85vw);
      padding: 10px 12px;
      border-radius: 10px;
      background: #0f172a;
      color: #f8fafc;
      border: 1px solid rgba(148, 163, 184, 0.3);
      box-shadow: 0 12px 24px rgba(15, 23, 42, 0.25);
      font-size: 0.78rem;
      font-weight: 500;
      line-height: 1.45;
      text-align: left;
      white-space: normal;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s ease;
      z-index: 10;
    }
    .signal-with-tooltip:hover .signal-tooltip,
    .signal-with-tooltip:focus .signal-tooltip,
    .signal-with-tooltip.is-open .signal-tooltip {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0);
    }
    .signal-cat { color: var(--cat); border-color: rgba(16, 185, 129, 0.35); background: rgba(16, 185, 129, 0.09); }
    .signal-hung { color: var(--hung); border-color: rgba(244, 63, 94, 0.35); background: rgba(244, 63, 94, 0.09); }
    .signal-info { color: var(--info); border-color: rgba(59, 130, 246, 0.35); background: rgba(59, 130, 246, 0.09); }
    .insight-shell {
      padding: 16px;
    }
    .chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }
    .topic-chip {
      border: 1px solid var(--border);
      background: #fff;
      color: var(--text);
      border-radius: 999px;
      padding: 8px 13px;
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .topic-chip:hover {
      border-color: #bfdbfe;
      color: var(--info);
    }
    .topic-chip.is-active {
      background: var(--info);
      border-color: var(--info);
      color: #fff;
      box-shadow: 0 8px 18px rgba(59, 130, 246, 0.25);
    }
    .insight-card {
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px;
      background: #fff;
    }
    .insight-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .insight-topic {
      margin: 2px 0 0;
      font-size: 1.15rem;
      font-family: 'SF Pro Display', 'Avenir Next', sans-serif;
    }
    .insight-meta {
      margin: 2px 0 0;
      color: var(--muted);
      font-size: 0.9rem;
    }
    .verdict-pill {
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 700;
      border: 1px solid;
      white-space: nowrap;
    }
    .verdict-pill.cat { color: var(--cat); border-color: rgba(16,185,129,0.35); background: rgba(16,185,129,0.09); }
    .verdict-pill.hung { color: var(--hung); border-color: rgba(244,63,94,0.35); background: rgba(244,63,94,0.09); }
    .verdict-pill.info { color: var(--info); border-color: rgba(59,130,246,0.35); background: rgba(59,130,246,0.09); }
    .score-wrap {
      margin-top: 14px;
      display: grid;
      gap: 7px;
    }
    .score-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.86rem;
      color: var(--muted);
    }
    .score-head strong {
      font-size: 1.2rem;
      color: var(--text);
      font-family: 'SF Pro Display', 'Avenir Next', sans-serif;
    }
    .score-track {
      height: 12px;
      border-radius: 999px;
      background: #e2e8f0;
      overflow: hidden;
    }
    .score-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.28s ease;
    }
    .score-fill.cat { background: var(--cat); }
    .score-fill.hung { background: var(--hung); }
    .score-fill.info { background: var(--info); }
    .advice {
      margin-top: 14px;
      font-size: 0.95rem;
      color: #334155;
    }
    .tactics-grid {
      margin-top: 12px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .tactics-box {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px;
      background: #fff;
    }
    .tactics-box.do {
      background: rgba(16, 185, 129, 0.08);
      border-color: rgba(16, 185, 129, 0.2);
    }
    .tactics-box.avoid {
      background: rgba(244, 63, 94, 0.08);
      border-color: rgba(244, 63, 94, 0.2);
    }
    .tactics-box h4 {
      margin: 0 0 6px;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--muted);
    }
    .tactics-box ul {
      margin: 0;
      padding-left: 16px;
      display: grid;
      gap: 4px;
      font-size: 0.82rem;
      color: #334155;
    }
    .topic-disclaimer {
      margin-top: 10px;
      font-size: 0.8rem;
      color: #64748B;
    }
    .evidence-title {
      margin-top: 16px;
      margin-bottom: 6px;
      font-size: 0.85rem;
      color: var(--muted);
      font-weight: 600;
    }
    .evidence {
      margin: 0;
      border: 1px solid var(--border);
      background: var(--code-bg);
      border-radius: 12px;
      padding: 12px;
      font-size: 0.82rem;
      line-height: 1.45;
      color: #0f172a;
      font-family: 'SF Mono', Menlo, Consolas, monospace;
      white-space: pre-wrap;
    }
    .side-column {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .snapshot-card,
    .legend-card {
      padding: 16px;
    }
    .side-title {
      margin: 0 0 10px;
      font-size: 0.93rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
    }
    .snapshot-list {
      margin: 0;
      display: grid;
      grid-template-columns: 1fr;
      gap: 9px;
    }
    .snapshot-item {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font-size: 0.9rem;
      border-bottom: 1px dashed #e2e8f0;
      padding-bottom: 7px;
    }
    .snapshot-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .snapshot-key { color: var(--muted); }
    .snapshot-value { text-align: right; font-weight: 600; }
    .legend-card p {
      margin: 0;
      font-size: 0.88rem;
      color: var(--muted);
    }
    .legend-row {
      margin-top: 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .expert {
      padding: 14px 16px;
    }
    .expert summary {
      cursor: pointer;
      font-weight: 700;
      color: #334155;
      list-style: none;
    }
    .expert summary::-webkit-details-marker { display: none; }
    .expert summary::after {
      content: ' +';
      color: var(--info);
      font-weight: 700;
    }
    .expert[open] summary::after { content: ' -'; }
    .expert-content {
      margin-top: 12px;
      display: grid;
      gap: 12px;
    }
    .expert table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.84rem;
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
    }
    .expert th,
    .expert td {
      border-bottom: 1px solid #eef2f7;
      padding: 8px 9px;
      text-align: left;
    }
    .expert th {
      background: #f8fafc;
      color: #334155;
      font-weight: 700;
    }
    .expert tr:last-child td { border-bottom: none; }
    a.link {
      color: var(--info);
      text-decoration: none;
    }
    a.link:hover { text-decoration: underline; }
    @media (max-width: 960px) {
      .workspace { grid-template-columns: 1fr; }
      .side-column { order: -1; }
      .main-column::before { inset: 2px; }
      .controls { width: 100%; }
      .tactics-grid { grid-template-columns: 1fr; }
      .signal-tooltip {
        left: 0;
        transform: translateY(6px);
      }
      .signal-with-tooltip:hover .signal-tooltip,
      .signal-with-tooltip:focus .signal-tooltip,
      .signal-with-tooltip.is-open .signal-tooltip {
        transform: translateY(0);
      }
    }
    /* 9-Palace Grid Styles */
    .palace-grid-section {
      padding: 16px;
    }
    .palace-grid-title {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
      margin-bottom: 12px;
    }
    .palace-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .palace-cell {
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px;
      min-height: 90px;
      display: flex;
      flex-direction: column;
      transition: box-shadow 0.15s;
    }
    .palace-cell:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .palace-cell.verdict-good { border-left: 3px solid var(--cat); }
    .palace-cell.verdict-warn { border-left: 3px solid #f59e0b; }
    .palace-cell.verdict-bad { border-left: 3px solid var(--hung); }
    .palace-cell.verdict-neutral { border-left: 3px solid #94a3b8; }
    .palace-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .palace-dir {
      font-size: 0.72rem;
      font-weight: 600;
      color: #334155;
    }
    .palace-num {
      font-size: 0.65rem;
      color: var(--muted);
      background: #e2e8f0;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .palace-elements {
      font-size: 0.68rem;
      color: var(--muted);
      margin-bottom: 6px;
    }
    .palace-summary {
      font-size: 0.75rem;
      color: #475569;
      line-height: 1.4;
      flex-grow: 1;
    }
    .palace-verdict {
      font-size: 0.7rem;
      margin-top: 4px;
    }
    .palace-cell-center {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #fbbf24;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .palace-cell-center .palace-dir {
      font-size: 0.9rem;
      color: #92400e;
    }
    @media (max-width: 600px) {
      .palace-grid { gap: 6px; }
      .palace-cell { padding: 8px; min-height: 80px; }
      .palace-summary { font-size: 0.7rem; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <header class="card app-header">
      <div>
        <h1 class="app-title">Strategic Advisor</h1>
        <p class="app-subtitle">Simple Mode mặc định: tập trung quyết định hành động, giảm tải dữ liệu kỹ thuật.</p>
      </div>
      <form method="GET" action="/" class="controls" id="timeForm">
        <label>Ngày
          <input id="dateInput" type="date" name="date" value="${selectedDate}">
        </label>
        <label>Giờ
          <input id="hourInput" type="number" name="hour" min="0" max="23" value="${hour}" style="width:80px;">
        </label>
        <label>Phút
          <input id="minuteInput" type="number" name="minute" min="0" max="59" value="${selectedMinute}" style="width:80px;">
        </label>
        <button type="submit">Cập nhật phân tích</button>
        <a href="/" class="link-btn" id="useNowLink">Dùng thời điểm hiện tại</a>
      </form>
    </header>

    <div class="workspace">
      <main class="main-column">
        <section class="card briefing" id="briefingCard">
          <p class="eyebrow">Tóm Tắt Chiến Lược</p>
          <h2 id="briefingTitle">${briefingHeading}</h2>
          <p id="briefingContent" class="briefing-narrative">${briefingParagraph}</p>
          <span id="totalScoreValue" data-kimon-score="${evaluation.overallScore}" hidden>${evaluation.overallScore}</span>
          <div class="signal-row">${signalBadges}</div>
        </section>

        <section class="card energy-flow-card" id="energyFlowCard">
          <p class="eyebrow">Tóm Tắt Dòng Năng Lượng Bên Trong</p>
          <h2 id="energyFlowTitle">Đọc Vị Tâm Lý</h2>
          <div class="energy-flow-content">
            <div class="energy-sentence energy-mental">
              <span class="energy-label">Trạng thái tinh thần:</span>
              <p>${escapeHTML(energyFlow.mentalState || '')}</p>
            </div>
            <div class="energy-sentence energy-conflict">
              <span class="energy-label">Dòng chảy năng lượng:</span>
              <p>${escapeHTML(energyFlow.conflict || '')}</p>
            </div>
            <div class="energy-sentence energy-blindspot">
              <span class="energy-label">Điểm mù năng lượng:</span>
              <p>${escapeHTML(energyFlow.blindSpot || '')}</p>
            </div>
            <div class="energy-sentence energy-advice">
              <span class="energy-label">Lời khuyên cân bằng:</span>
              <p>${escapeHTML(energyFlow.advice || '')}</p>
            </div>
          </div>
          <div class="energy-meta">
            <span class="energy-tag">Nhật Can: ${escapeHTML(energyFlow.metadata?.dayStem || '—')}</span>
            <span class="energy-tag">Cung: ${energyFlow.metadata?.dayPalace || '—'}</span>
            <span class="energy-tag">Môn: ${escapeHTML(energyFlow.metadata?.door || '—')}</span>
            <span class="energy-tag">Thần: ${escapeHTML(energyFlow.metadata?.deity || '—')}</span>
            ${energyFlow.metadata?.hasFanYin ? '<span class="energy-tag energy-warning">Phản Ngâm</span>' : ''}
            ${energyFlow.metadata?.hasFuYin ? '<span class="energy-tag energy-warning">Phục Ngâm</span>' : ''}
            ${energyFlow.metadata?.hasVoid ? '<span class="energy-tag energy-warning">Không Vong</span>' : ''}
            ${energyFlow.metadata?.hasDichMa ? '<span class="energy-tag energy-info">Dịch Mã</span>' : ''}
          </div>
        </section>

        <section class="card palace-grid-section">
          <p class="palace-grid-title">Cửu Cung · Tài Lộc</p>
          <div class="palace-grid">
            ${(() => {
              const grid = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];
              return grid.flat().map(p => {
                const pal = palacesByNum[p];
                const sum = palaceSummaries[p];
                const meta = PALACE_META_MAP[p];
                if (p === 5) {
                  return '<div class="palace-cell palace-cell-center"><div class="palace-dir">⊕ Trung Cung</div></div>';
                }
                const verdictClass = sum.color === 'green' ? 'verdict-good'
                  : (sum.color === 'orange' || sum.color === 'red') ? 'verdict-warn'
                  : 'verdict-neutral';
                const elements = [
                  pal?.mon?.short || '—',
                  displayStarShort(pal) || '—',
                  displayDeity(pal) || '—',
                ].join(' · ');
                return '<div class="palace-cell ' + verdictClass + '">' +
                  '<div class="palace-header">' +
                    '<span class="palace-dir">' + meta.dir + '</span>' +
                    '<span class="palace-num">Cung ' + p + '</span>' +
                  '</div>' +
                  '<div class="palace-elements">' + elements + '</div>' +
                  '<div class="palace-summary">' + sum.emoji + ' ' + escapeHTML(sum.shortSummary || sum.verdict) + '</div>' +
                '</div>';
              }).join('');
            })()}
          </div>
        </section>

        <section class="card insight-shell">
          <div class="chip-row">
            ${topicChips}
          </div>
          <article class="insight-card">
            <div class="insight-top">
              <div>
                <p class="eyebrow" style="margin:0;color:#64748B;">Thẻ Cố Vấn</p>
                <h3 class="insight-topic" id="insightTopic">${defaultTopic.headline || defaultTopic.topic}</h3>
                <p class="insight-meta" id="insightMeta">Hướng ${defaultTopic.usefulGodDir} · Cung ${defaultTopic.usefulGodPalaceName}</p>
              </div>
              <span class="verdict-pill ${defaultTopic.tone}" id="insightVerdict">${defaultTopic.verdict}</span>
            </div>
            <p class="advice" id="insightAdvice" style="margin:12px 0;font-size:0.95rem;line-height:1.6;">${defaultTopic.oneLiner || defaultTopic.actionAdvice}</p>
            <div class="tactics-grid">
              <div class="tactics-box do">
                <h4>Nên làm</h4>
                <ul id="insightDoList">
                  ${(defaultTopic.tactics?.do || []).slice(0, 3).map(item => `<li>${escapeHTML(item)}</li>`).join('') || '<li>Chưa có dữ liệu.</li>'}
                </ul>
              </div>
              <div class="tactics-box avoid">
                <h4>Nên tránh</h4>
                <ul id="insightAvoidList">
                  ${(defaultTopic.tactics?.avoid || []).slice(0, 2).map(item => `<li>${escapeHTML(item)}</li>`).join('') || '<li>Chưa có dữ liệu.</li>'}
                </ul>
              </div>
            </div>
            <p class="topic-disclaimer" id="insightDisclaimer" style="font-size:0.75rem;color:#94a3b8;margin-top:12px;">${defaultTopic.disclaimer || ''}</p>
            <details style="margin-top:12px;">
              <summary style="font-size:0.75rem;color:#64748B;cursor:pointer;">Chi tiết kỹ thuật</summary>
              <pre class="evidence" id="insightEvidence" style="margin-top:8px;font-size:0.7rem;">${defaultTopic.insightEvidenceText}</pre>
            </details>
          </article>
        </section>

        <details class="card expert">
          <summary>Developer / Expert Mode (Raw Tables)</summary>
          <div class="expert-content">
            <table id="topicAnalysisTable">
              <thead>
                <tr>
                  <th>Cung</th>
                  <th>Phi Tinh</th>
                  <th>Hướng</th>
                  <th>Tinh</th>
                  <th>Thiên Can</th>
                  <th>Địa Can</th>
                  <th>Môn</th>
                  <th>Thần</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                ${palaceRows.join('')}
              </tbody>
            </table>
            <table>
              <thead>
                <tr>
                  <th>Chủ Đề</th>
                  <th>Hướng</th>
                  <th>Cung</th>
                  <th>Verdict</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                ${topicRows}
              </tbody>
            </table>
          </div>
        </details>
      </main>

      <aside class="side-column">
        <section class="card snapshot-card">
          <h2 class="side-title">Snapshot</h2>
          <dl class="snapshot-list">
            <div class="snapshot-item" data-field="tiet-khi"><dt class="snapshot-key">Tiết khí</dt><dd class="snapshot-value">${chart.solarTerm.name}</dd></div>
            <div class="snapshot-item" data-field="nguyen"><dt class="snapshot-key">Nguyên</dt><dd class="snapshot-value">${chart.solarTerm.nguyenName}</dd></div>
            <div class="snapshot-item" data-field="cuc"><dt class="snapshot-key">Cục</dt><dd class="snapshot-value">${chart.cucSo} ${chart.isDuong ? 'Dương' : 'Âm'}</dd></div>
            <div class="snapshot-item" data-field="total-score"><dt class="snapshot-key">Total Score</dt><dd class="snapshot-value">${formatScore(evaluation.overallScore)}</dd></div>
            <div class="snapshot-item" data-field="phuc-phan"><dt class="snapshot-key">Phục/Phản</dt><dd class="snapshot-value">${chart.isPhucAm ? 'Phục Âm' : chart.isPhanNgam ? 'Phản Ngâm' : 'Bình thường'}</dd></div>
            <div class="snapshot-item" data-field="ngay"><dt class="snapshot-key">Ngày</dt><dd class="snapshot-value">${chart.dayPillar.stemName} ${chart.dayPillar.branchName}</dd></div>
            <div class="snapshot-item" data-field="gio"><dt class="snapshot-key">Giờ</dt><dd class="snapshot-value">${chart.gioPillar.displayStemName || chart.gioPillar.stemName} ${chart.gioPillar.branchName}</dd></div>
            <div class="snapshot-item" data-field="timezone"><dt class="snapshot-key">Cơ sở giờ</dt><dd class="snapshot-value">${timeBasis}</dd></div>
            <div class="snapshot-item" data-field="khong-vong"><dt class="snapshot-key">Không Vong</dt><dd class="snapshot-value">${chart.khongVong.void1.name}, ${chart.khongVong.void2.name}</dd></div>
            <div class="snapshot-item" data-field="dich-ma"><dt class="snapshot-key">Dịch Mã</dt><dd class="snapshot-value">${chart.dichMa ? `${chart.dichMa.horseBranch} · Cung ${chart.dichMa.palace}` : '—'}</dd></div>
          </dl>
        </section>
        <section class="card legend-card">
          <h2 class="side-title">Legend</h2>
          <p>
            Ưu tiên xem <strong>Tóm Tắt Chiến Lược</strong> và <strong>Insight Card</strong> trước.
            Khi cần kiểm chứng kỹ thuật, mở <strong>Developer / Expert Mode</strong>.
          </p>
          <div class="legend-row">
            <span class="signal signal-cat">Cát</span>
            <span class="signal signal-hung">Hung</span>
            <span class="signal signal-info">Thông tin</span>
          </div>
          <p style="margin-top:10px;">
            API JSON vẫn giữ nguyên tại
            <a href="/api/analyze?date=${selectedDate}&hour=${hour}&minute=${selectedMinute}" class="link">/api/analyze</a>.
          </p>
        </section>
      </aside>
    </div>
  </div>

  <script>
    const AUTO_LOCAL_NOW = ${autoLocalNow ? 'true' : 'false'};
    const topics = ${topicPayloadJSON};
    const defaultTopicKey = ${JSON.stringify(defaultTopic.key)};
    const topicMap = Object.fromEntries(topics.map(t => [t.key, t]));
    const chips = Array.from(document.querySelectorAll('.topic-chip'));
    const topicEl = document.getElementById('insightTopic');
    const metaEl = document.getElementById('insightMeta');
    const actionMetaEl = document.getElementById('insightActionMeta');
    const verdictEl = document.getElementById('insightVerdict');
    const scoreEl = document.getElementById('insightScore');
    const scoreFillEl = document.getElementById('insightScoreFill');
    const adviceEl = document.getElementById('insightAdvice');
    const narrativeEl = document.getElementById('insightNarrative');
    const doListEl = document.getElementById('insightDoList');
    const avoidListEl = document.getElementById('insightAvoidList');
    const disclaimerEl = document.getElementById('insightDisclaimer');
    const evidenceEl = document.getElementById('insightEvidence');
    const timeFormEl = document.getElementById('timeForm');
    const dateInputEl = document.getElementById('dateInput');
    const hourInputEl = document.getElementById('hourInput');
    const minuteInputEl = document.getElementById('minuteInput');
    const useNowLinkEl = document.getElementById('useNowLink');
    const signalButtons = Array.from(document.querySelectorAll('.signal-with-tooltip'));

    function toneClass(score) {
      if (score >= 5) return 'cat';
      if (score < 0) return 'hung';
      return 'info';
    }

    function evidenceLines(topic) {
      if (Array.isArray(topic.insightEvidence) && topic.insightEvidence.length) {
        return topic.insightEvidence.map(line => '// ' + line).join('\\n');
      }
      const lines = [];
      lines.push('// Huong: ' + topic.usefulGodDir + ' · Cung ' + topic.usefulGodPalace + ' (' + topic.usefulGodPalaceName + ')');
      topic.reasons.slice(0, 6).forEach(r => lines.push('// ' + r));
      if (topic.actionAdvice) lines.push('// Action: ' + topic.actionAdvice);
      return lines.join('\\n');
    }

    function escapeText(text) {
      return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function renderTopic(key) {
      const topic = topicMap[key] || topics[0];
      if (!topic) return;
      chips.forEach(btn => btn.classList.toggle('is-active', btn.dataset.topic === topic.key));
      topicEl.textContent = topic.headline || topic.topic;
      metaEl.textContent = 'Hướng ' + topic.usefulGodDir + ' · Cung ' + topic.usefulGodPalaceName;
      verdictEl.textContent = topic.verdict;
      verdictEl.className = 'verdict-pill ' + toneClass(topic.score);
      adviceEl.textContent = topic.oneLiner || topic.actionAdvice || 'Không có khuyến nghị cụ thể.';
      if (doListEl) {
        const doItems = Array.isArray(topic.tactics?.do) && topic.tactics.do.length
          ? topic.tactics.do.slice(0, 3)
          : ['Chưa có dữ liệu.'];
        doListEl.innerHTML = doItems.map(item => '<li>' + escapeText(item) + '</li>').join('');
      }
      if (avoidListEl) {
        const avoidItems = Array.isArray(topic.tactics?.avoid) && topic.tactics.avoid.length
          ? topic.tactics.avoid.slice(0, 2)
          : ['Chưa có dữ liệu.'];
        avoidListEl.innerHTML = avoidItems.map(item => '<li>' + escapeText(item) + '</li>').join('');
      }
      if (disclaimerEl) {
        disclaimerEl.textContent = topic.disclaimer || '';
      }
      if (evidenceEl) {
        evidenceEl.textContent = evidenceLines(topic);
      }
    }

    function pad2(value) {
      return String(value).padStart(2, '0');
    }

    function applyClientNowToForm() {
      if (!dateInputEl || !hourInputEl || !minuteInputEl) return;
      const now = new Date();
      const ymd = now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate());
      dateInputEl.value = ymd;
      hourInputEl.value = String(now.getHours());
      minuteInputEl.value = String(now.getMinutes());
    }

    function submitWithClientNow() {
      applyClientNowToForm();
      if (timeFormEl) {
        timeFormEl.requestSubmit();
      }
    }

    function closeSignalTooltips(exceptEl = null) {
      signalButtons.forEach(btn => {
        if (btn !== exceptEl) btn.classList.remove('is-open');
      });
    }

    chips.forEach(btn => {
      btn.addEventListener('click', () => renderTopic(btn.dataset.topic));
    });

    signalButtons.forEach(btn => {
      btn.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const opening = !btn.classList.contains('is-open');
        closeSignalTooltips(btn);
        btn.classList.toggle('is-open', opening);
      });
      btn.addEventListener('blur', () => btn.classList.remove('is-open'));
    });
    document.addEventListener('click', () => closeSignalTooltips());

    if (useNowLinkEl) {
      useNowLinkEl.addEventListener('click', event => {
        event.preventDefault();
        submitWithClientNow();
      });
    }

    renderTopic(defaultTopicKey);

    if (AUTO_LOCAL_NOW) {
      submitWithClientNow();
    }
  </script>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/' || url.pathname === '') {
    const dateParam = url.searchParams.get('date');
    const hourParam = url.searchParams.get('hour');
    const minuteParam = url.searchParams.get('minute');
    const hasDateParam = url.searchParams.has('date');
    const hasHourParam = url.searchParams.has('hour');
    const hasMinuteParam = url.searchParams.has('minute');
    const hasAnyTimeParam = hasDateParam || hasHourParam || hasMinuteParam;
    const { date, hour, minute } = parseDateTimeQuery({ dateParam, hourParam, minuteParam });

    try {
      const html = generateHTML(date, hour, minute, { autoLocalNow: !hasAnyTimeParam });
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error: ' + err.message);
    }
  } else if (url.pathname === '/dung-than' || url.pathname === '/dung-than.html') {
    // Serve the Dụng Thần Analysis React page
    try {
      const htmlPath = path.join(__dirname, 'public', 'dung-than.html');
      const html = fs.readFileSync(htmlPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading page: ' + err.message);
    }
  } else if (url.pathname.startsWith('/public/')) {
    // Serve static files from public directory
    try {
      const filePath = path.join(__dirname, url.pathname);
      const ext = path.extname(filePath);
      const contentTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.jsx': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
      };
      const contentType = contentTypes[ext] || 'text/plain';
      const content = fs.readFileSync(filePath, 'utf8');
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found: ' + url.pathname);
    }
  } else if (url.pathname.startsWith('/src/')) {
    // Serve selected source modules for browser-side shared state helpers.
    try {
      const filePath = path.join(__dirname, url.pathname);
      const ext = path.extname(filePath);
      const contentTypes = {
        '.js': 'text/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
      };
      const contentType = contentTypes[ext] || 'text/plain';
      const content = fs.readFileSync(filePath, 'utf8');
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found: ' + url.pathname);
    }
  } else if (url.pathname === '/api/analyze') {
    const dateParam = url.searchParams.get('date');
    const hourParam = url.searchParams.get('hour');
    const minuteParam = url.searchParams.get('minute');
    const { date, hour } = parseDateTimeQuery({ dateParam, hourParam, minuteParam });

    try {
      const result = analyze(date, hour);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result, null, 2));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`\n🔮 QMDJ Engine Server running at http://localhost:${PORT}\n`);
  console.log('Endpoints:');
  console.log(`  - GET /                  → Strategic Advisor UI`);
  console.log(`  - GET /dung-than         → Dụng Thần Analysis (React)`);
  console.log(`  - GET /api/analyze       → JSON API`);
  console.log(`\nQuery params: ?date=YYYY-MM-DD&hour=0-23&minute=0-59\n`);
});
