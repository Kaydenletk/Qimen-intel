/**
 * Simple HTTP server for QMDJ Engine
 * Run: node server.js
 * Access: http://localhost:3000
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { enrichData } from './src/utils/qmdjHelper.js';
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

// ══════════════════════════════════════════════════════════════════════════════
// SERVER-SIDE RATE LIMITING (prevents 429 from Gemini)
// ══════════════════════════════════════════════════════════════════════════════
const GEMINI_RATE_LIMIT = {
  maxRequests: 8,        // Stay under 10 RPM for gemini-2.5-flash
  windowMs: 60000,       // 1 minute
  cooldownMs: 30000,     // 30 sec cooldown after 429
  requests: [],          // timestamps
  cooldownUntil: 0       // when cooldown expires
};

function canCallGemini() {
  const now = Date.now();

  // Check cooldown
  if (GEMINI_RATE_LIMIT.cooldownUntil > now) {
    const secsLeft = Math.ceil((GEMINI_RATE_LIMIT.cooldownUntil - now) / 1000);
    return { allowed: false, reason: 'cooldown', secsLeft };
  }

  // Clean old requests
  GEMINI_RATE_LIMIT.requests = GEMINI_RATE_LIMIT.requests.filter(
    t => t > now - GEMINI_RATE_LIMIT.windowMs
  );

  if (GEMINI_RATE_LIMIT.requests.length >= GEMINI_RATE_LIMIT.maxRequests) {
    const oldestExpires = GEMINI_RATE_LIMIT.requests[0] + GEMINI_RATE_LIMIT.windowMs;
    const secsLeft = Math.ceil((oldestExpires - now) / 1000);
    return { allowed: false, reason: 'rate_limit', secsLeft };
  }

  return { allowed: true };
}

function recordGeminiRequest() {
  GEMINI_RATE_LIMIT.requests.push(Date.now());
}

function triggerGeminiCooldown() {
  GEMINI_RATE_LIMIT.cooldownUntil = Date.now() + GEMINI_RATE_LIMIT.cooldownMs;
  console.log('[Rate Limit] Cooldown triggered for 30 seconds');
}

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
  <title>Kymon · QMDJ Engine</title>
  <link rel="icon" type="image/png" href="/favicon.png">
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
      display: block;
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
    /* ── Kimon Chat ────────────────────────────────────────── */
    .kimon-card {
      padding: 20px;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-color: #334155;
      color: #e2e8f0;
      margin-top: 18px;
    }
    .kimon-header {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 14px;
    }
    .kimon-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; flex-shrink: 0;
    }
    .kimon-name { font-weight: 700; font-size: 1rem; color: #a5b4fc; }
    .kimon-tagline { font-size: 0.78rem; color: #64748b; }
    .kimon-messages {
      min-height: 80px; max-height: 340px; overflow-y: auto;
      display: flex; flex-direction: column; gap: 12px;
      margin-bottom: 12px;
    }
    .kimon-message { padding: 12px 14px; border-radius: 12px; font-size: 0.9rem; line-height: 1.55; }
    .kimon-message-ai {
      background: #1e293b; border: 1px solid #334155; color: #e2e8f0;
      border-bottom-left-radius: 4px;
    }
    .kimon-message-user {
      background: #312e81; border: 1px solid #4338ca; color: #e0e7ff;
      align-self: flex-end; border-bottom-right-radius: 4px;
    }
    .kimon-section { margin-top: 8px; }
    .kimon-section:first-child { margin-top: 0; }
    .kimon-section-label {
      display: block; font-size: 0.68rem; text-transform: uppercase;
      letter-spacing: 0.09em; color: #6366f1; font-weight: 700; margin-bottom: 3px;
    }
    .kimon-message-text { margin: 0; }
    /* Real-time streaming cursor */
    .kimon-stream-live::after {
      content: '▋';
      animation: kimon-blink 0.8s step-end infinite;
      color: #6366f1;
    }
    @keyframes kimon-blink { 0%,100%{opacity:1} 50%{opacity:0} }
    .kimon-loading {
      display: flex; align-items: center; gap: 8px;
      color: #64748b; font-size: 0.85rem; padding: 6px 0;
    }
    .kimon-typing-indicator { display: flex; gap: 4px; align-items: center; }
    .kimon-typing-indicator span {
      width: 7px; height: 7px; border-radius: 50%;
      background: #6366f1; animation: kimon-dot 1.2s infinite;
    }
    .kimon-typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .kimon-typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes kimon-dot { 0%,80%,100%{opacity:0.3;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }
    .kimon-input-row {
      display: flex; gap: 8px;
    }
    .kimon-input-row input {
      flex: 1; background: #0f172a; border: 1px solid #334155;
      color: #e2e8f0; border-radius: 10px; padding: 9px 13px;
      font-size: 0.88rem;
    }
    .kimon-input-row input::placeholder { color: #475569; }
    .kimon-input-row input:focus { outline: none; border-color: #6366f1; }
    .kimon-btn {
      background: #6366f1; border: none; color: #fff;
      padding: 9px 16px; border-radius: 10px; cursor: pointer;
      font-size: 0.88rem; font-weight: 600; transition: background 0.2s;
    }
    .kimon-btn:hover { background: #4f46e5; }
    .kimon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .kimon-suggestions {
      display: none; flex-wrap: wrap; gap: 6px; margin-bottom: 10px;
    }
    .kimon-suggestion-chip {
      background: #1e293b; border: 1px solid #334155; color: #94a3b8;
      border-radius: 999px; padding: 4px 12px; font-size: 0.78rem;
      cursor: pointer; transition: all 0.15s;
    }
    .kimon-suggestion-chip:hover { border-color: #6366f1; color: #a5b4fc; }
    .kimon-error {
      display: none; color: #f87171; font-size: 0.82rem;
      padding: 6px 10px; border-radius: 8px;
      background: rgba(239,68,68,0.1); margin-bottom: 8px;
    }
    .kimon-error-inline { color: #f87171; margin: 0; font-size: 0.88rem; }
    /* === KIMON AI TERMINAL (white theme) === */
    .kimon-terminal {
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 0;
      color: #1E293B;
      box-shadow: var(--shadow);
      overflow: hidden;
      font-family: 'SF Pro Text', 'Avenir Next', 'Helvetica Neue', sans-serif;
    }
    .kimon-terminal-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      border-bottom: 1px solid #E2E8F0;
      background: #F8FAFC;
    }
    .kimon-status-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px rgba(16,185,129,0.6);
      animation: kimon-pulse 2s infinite;
    }
    @keyframes kimon-pulse {
      0%,100% { opacity:1; box-shadow:0 0 8px rgba(16,185,129,0.6); }
      50% { opacity:0.7; box-shadow:0 0 14px rgba(16,185,129,0.8); }
    }
    .kimon-terminal-title {
      margin: 0;
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #1E293B;
    }
    .kimon-meta-tags {
      margin-left: auto;
      font-size: 0.74rem;
      color: #64748B;
      font-weight: 500;
    }
    .kimon-messages {
      padding: 20px;
      min-height: 260px;
      max-height: 60vh;
      overflow-y: auto;
      background: #FFFFFF;
    }
    .kimon-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      padding: 40px;
      color: #64748B;
    }
    .kimon-loading p { font-size:0.9rem; margin:0; }
    .kimon-typing-indicator { display:flex; gap:5px; }
    .kimon-typing-indicator span {
      width: 8px; height: 8px;
      background: #3B82F6;
      border-radius: 50%;
      animation: kimon-bounce 1.4s infinite ease-in-out both;
    }
    .kimon-typing-indicator span:nth-child(1) { animation-delay:-0.32s; }
    .kimon-typing-indicator span:nth-child(2) { animation-delay:-0.16s; }
    @keyframes kimon-bounce {
      0%,80%,100% { transform:scale(0.6); opacity:0.4; }
      40% { transform:scale(1); opacity:1; }
    }
    @keyframes kimon-fadein {
      from { opacity:0; transform:translateY(8px); }
      to { opacity:1; transform:translateY(0); }
    }
    .kimon-message {
      margin-bottom: 14px;
      padding: 14px 18px;
      border-radius: 12px;
      animation: kimon-fadein 0.35s ease-out;
      max-width: 88%;
    }
    .kimon-message-ai {
      background: #F1F5F9;
      border-left: 3px solid #3B82F6;
      margin-right: auto;
    }
    .kimon-message-user {
      background: #2563EB;
      border-radius: 12px;
      margin-left: auto;
      margin-right: 0;
    }
    .kimon-message-user .kimon-message-text { color:#FFFFFF; }
    .kimon-section { margin-bottom:12px; }
    .kimon-section:last-child { margin-bottom:0; }
    .kimon-section-label {
      display:block; font-size:0.68rem; font-weight:700;
      color:#3B82F6; margin-bottom:5px; letter-spacing:0.04em; text-transform:uppercase;
    }
    .kimon-message-text {
      font-size:0.93rem; line-height:1.7; color:#1E293B; margin:0;
    }
    .kimon-message-text.typing-cursor::after {
      content:'|'; animation:kimon-blink 0.6s infinite; color:#3B82F6; font-weight:300;
    }
    @keyframes kimon-blink { 0%,50% { opacity:1; } 51%,100% { opacity:0; } }
    .kimon-suggestions-dynamic {
      padding: 10px 20px;
      display: flex; flex-wrap:wrap; gap:8px;
      background: #FAFBFC;
      border-top: 1px solid #E2E8F0;
    }
    .kimon-suggestion-chip {
      background:#fff; border:1px solid #3B82F6; color:#3B82F6;
      padding:7px 14px; border-radius:20px; font-size:0.78rem; font-weight:500;
      cursor:pointer; transition:all 0.2s ease;
    }
    .kimon-suggestion-chip:hover {
      background:#EFF6FF; border-color:#2563EB; color:#2563EB;
      transform:translateY(-1px);
    }
    .kimon-input-area {
      display:flex; gap:10px;
      padding: 14px 20px 18px;
      border-top: 1px solid #E2E8F0;
      background:#FFFFFF;
    }
    .kimon-input {
      flex:1; background:#FFFFFF; border:1px solid #E2E8F0;
      color:#1E293B; border-radius:10px; padding:12px 16px;
      font-size:0.92rem; font-family:inherit; box-sizing:border-box;
      transition:all 0.2s ease;
    }
    .kimon-input:focus { outline:none; border-color:#3B82F6; box-shadow:0 0 0 3px rgba(59,130,246,0.15); }
    .kimon-input::placeholder { color:#94A3B8; }
    .kimon-send-btn {
      background:#3B82F6; border:none; color:#FFFFFF;
      width:46px; height:46px; border-radius:10px;
      cursor:pointer; display:flex; align-items:center; justify-content:center;
      transition:all 0.2s ease; flex-shrink:0;
    }
    .kimon-send-btn:hover:not(:disabled) { background:#2563EB; transform:translateY(-1px); box-shadow:0 4px 12px rgba(59,130,246,0.3); }
    .kimon-send-btn:disabled { opacity:0.5; cursor:not-allowed; }
    .kimon-error {
      display:none; margin:10px 20px;
      padding:9px 14px; background:#FEF2F2; border:1px solid #FECACA;
      border-radius:8px; color:#DC2626; font-size:0.83rem;
    }
    .kimon-error-inline {
      color:#DC2626; font-size:0.83rem; margin:0;
      background:#FEF2F2; padding:10px 14px;
      border-radius:8px; border:1px solid #FECACA;
    }
    .kimon-topic-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px 20px 6px;
      border-top: 1px solid #E2E8F0;
    }
    .kimon-topic-chips .topic-chip {
      font-size: 0.78rem;
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid #E2E8F0;
      background: #F8FAFC;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    .kimon-topic-chips .topic-chip:hover {
      background: #EEF2FF;
      border-color: #818CF8;
      color: #4338CA;
    }
    .kimon-topic-chips .topic-chip.is-active {
      background: #3B82F6;
      border-color: #3B82F6;
      color: #FFFFFF;
    }
  </style>
</head>
<body>
  <div class="shell">
    <header class="card app-header">
      <div>
        <h1 class="app-title"><img src="/favicon.png" alt="" style="height:32px; vertical-align:middle; margin-right:8px;">Kymon</h1>
        <p class="app-subtitle">Vô xem cho biết, quyết cho nhanh.</p>
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
        <button type="submit">Lập Bàn</button>
        <a href="/" class="link-btn" id="useNowLink">Hiện Tại</a>
        <a href="/dung-than" class="link-btn" style="background:#10B981; border-color:#10B981; color:#fff;">Xem báo cáo chi tiết</a>
      </form>
    </header>

    <div class="workspace">
      <main class="main-column">
        <!-- KIMON AI TERMINAL -->
        <section class="kimon-terminal" id="kimonTerminal">
          <div class="kimon-terminal-header">
            <img src="/favicon.png" alt="Kimon" style="width:24px;height:24px;border-radius:4px;object-fit:contain;">
            <div class="kimon-status-dot"></div>
            <h2 class="kimon-terminal-title">Kymon nè</h2>
            <div class="kimon-meta-tags">
              <span>${escapeHTML(chart.solarTerm?.name || '')} · Cục ${chart.cucSo} ${chart.isDuong ? 'Dương' : 'Âm'}</span>
            </div>
          </div>
          <div id="kimonError" class="kimon-error"></div>
          <div class="kimon-messages" id="kimonMessages">
            <div class="kimon-loading" id="kimonLoading">
              <div class="kimon-typing-indicator"><span></span><span></span><span></span></div>
              <p>Đang đọc trận bàn...</p>
            </div>
          </div>
          <div class="kimon-suggestions-dynamic" id="kimonSuggestions" style="display:none;"></div>
          <!-- Removing topic chips here -->
          <div class="kimon-input-area">
            <input type="text" id="kimonContext" class="kimon-input" placeholder="Hỏi Kymon chi tiết hơn...">
            <button id="kimonBtn" class="kimon-send-btn" title="Gửi">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </section>

        <section class="card briefing" id="briefingCard" hidden>
          <p class="eyebrow">Tóm Tắt Chiến Lược</p>
          <h2 id="briefingTitle">${briefingHeading}</h2>
          <p id="briefingContent" class="briefing-narrative">${briefingParagraph}</p>
          <span id="totalScoreValue" data-kimon-score="${evaluation.overallScore}" hidden>${evaluation.overallScore}</span>
          <span id="kimonAutoData"
            data-all-topics="${escapeHTML(JSON.stringify(uiTopics.map(t => ({ topic: t.topic, score: t.score, action: t.actionAdvice, verdict: t.verdict }))))}"
            data-mon="${escapeHTML(energyFlow.metadata?.door || '')}"
            data-than="${escapeHTML(energyFlow.metadata?.deity || '')}"
            data-tinh="${escapeHTML(energyFlow.metadata?.star || '')}"
            data-score="${evaluation.overallScore}"
            data-day-stem="${escapeHTML(chart.dayPillar?.stemName || '')}"
            data-hour-stem="${escapeHTML(chart.gioPillar?.stemName || '')}"
            data-solar-term="${escapeHTML(chart.solarTerm?.name || '')}"
            data-cuc="${chart.cucSo}"
            data-duong="${chart.isDuong}"
            data-phuc-am="${chart.isPhucAm || false}"
            data-phan-ngam="${chart.isPhanNgam || false}"
            data-briefing-title="${escapeHTML(briefingHeading || '')}"
            data-briefing-body="${escapeHTML(briefingParagraph || '')}"
            data-mental-state="${escapeHTML(energyFlow.mentalState || '')}"
            data-conflict="${escapeHTML(energyFlow.conflict || '')}"
            data-blind-spot="${escapeHTML(energyFlow.blindSpot || '')}"
            data-energy-advice="${escapeHTML(energyFlow.advice || '')}"
            data-day-palace="${energyFlow.metadata?.dayPalace || ''}"
            data-formations="${escapeHTML(evaluation.topFormations?.map(f => f.name).join(', ') || '')}"
            hidden></span>
          <div class="signal-row">${signalBadges}</div>
        </section>


        <!-- Thẻ Cố Vấn (insight-shell) has been removed -->

        <details class="card expert">
          <summary>Developer / Expert Mode (Raw Tables)</summary>
          <div class="expert-content">
            <section class="palace-grid-section" style="padding: 0; padding-bottom: 16px; border-bottom: 1px dashed var(--border);">
              <p class="palace-grid-title" style="margin-top: 8px;">Bàn Cửu Cung (Trực Quan)</p>
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
            <!--
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
            -->
          </div>
        </details>
      </main>
  </div>

  <script>
    const AUTO_LOCAL_NOW = ${autoLocalNow ? 'true' : 'false'};
    const timeFormEl = document.getElementById('timeForm');
    const dateInputEl = document.getElementById('dateInput');
    const hourInputEl = document.getElementById('hourInput');
    const minuteInputEl = document.getElementById('minuteInput');
    const useNowLinkEl = document.getElementById('useNowLink');
    const signalButtons = Array.from(document.querySelectorAll('.signal-with-tooltip'));

    function escapeHTML(raw) {
      return String(raw || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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

    if (AUTO_LOCAL_NOW) {
      submitWithClientNow();
    }

    // ── Kimon AI ─────────────────────────────────────────────────────────────
    const kimonBtn = document.getElementById('kimonBtn');
    const kimonContext = document.getElementById('kimonContext');
    const kimonMessages = document.getElementById('kimonMessages');
    const kimonLoading = document.getElementById('kimonLoading');
    const kimonSuggestions = document.getElementById('kimonSuggestions');
    const kimonError = document.getElementById('kimonError');
    const kimonAutoData = document.getElementById('kimonAutoData');
    let currentTopic = null; // set by renderTopic

    function getBaseQmdjData() {
      if (!kimonAutoData) return {};
      return {
        mon: kimonAutoData.dataset.mon || '',
        than: kimonAutoData.dataset.than || '',
        tinh: kimonAutoData.dataset.tinh || '',
        cung: kimonAutoData.dataset.dayPalace || '',
        score: parseInt(kimonAutoData.dataset.score) || 0,
        overallScore: parseInt(kimonAutoData.dataset.score) || 0,
        dayStem: kimonAutoData.dataset.dayStem || '',
        hourStem: kimonAutoData.dataset.hourStem || '',
        solarTerm: kimonAutoData.dataset.solarTerm || '',
        cucSo: parseInt(kimonAutoData.dataset.cuc) || 1,
        isDuong: kimonAutoData.dataset.duong === 'true',
        isPhucAm: kimonAutoData.dataset.phucAm === 'true',
        isPhanNgam: kimonAutoData.dataset.phanNgam === 'true',
        briefingTitle: kimonAutoData.dataset.briefingTitle || '',
        briefingBody: kimonAutoData.dataset.briefingBody || '',
        mentalState: kimonAutoData.dataset.mentalState || '',
        conflict: kimonAutoData.dataset.conflict || '',
        blindSpot: kimonAutoData.dataset.blindSpot || '',
        energyAdvice: kimonAutoData.dataset.energyAdvice || '',
        formations: kimonAutoData.dataset.formations || '',
        allTopics: kimonAutoData.dataset.allTopics || '[]'
      };
    }

    function createMessageBubble(isKimon = true) {
      const bubble = document.createElement('div');
      bubble.className = 'kimon-message ' + (isKimon ? 'kimon-message-ai' : 'kimon-message-user');
      return bubble;
    }

    function renderSuggestions(suggestions) {
      if (!kimonSuggestions || !Array.isArray(suggestions) || !suggestions.length) return;
      kimonSuggestions.innerHTML = suggestions.map(s =>
        '<button class="kimon-suggestion-chip">' + escapeHTML(s) + '</button>'
      ).join('');
      kimonSuggestions.style.display = 'flex';
      kimonSuggestions.querySelectorAll('.kimon-suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => askKimon(chip.textContent));
      });
    }

    function showKimonError(msg) {
      if (!kimonError) return;
      kimonError.textContent = msg;
      kimonError.style.display = 'block';
      setTimeout(() => { kimonError.style.display = 'none'; }, 8000);
    }

    // Hàm giúp trích xuất JSON sạch từ phản hồi của AI
    function cleanAiResponse(rawText) {
      try {
        // Tìm đoạn văn bản nằm giữa dấu { và }
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('[Kimon] Parsed JSON:', Object.keys(parsed));
          return parsed;
        }
        return JSON.parse(rawText);
      } catch (e) {
        console.error("[Kimon] JSON parse error:", e.message);
        console.error("[Kimon] Raw text:", rawText?.substring(0, 300));
        return null;
      }
    }

    // SSE stream helper — pipes chunks into liveEl, resolves with parsed JSON on __DONE__
    async function callKimonStream({ qmdjData, userContext, liveEl, onDone }) {
      const res = await fetch('/api/kimon/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qmdjData, userContext })
      });
      if (!res.ok || !res.body) throw new Error('Stream lỗi (' + res.status + ')');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const msg = JSON.parse(line.slice(6));
            if (msg.__ERROR__) throw new Error(msg.__ERROR__);
            if (msg.__DONE__) {
              let parsed = msg.parsed;
              // Fallback: cleanAiResponse - extract JSON from any text
              if (!parsed && msg.raw) {
                parsed = cleanAiResponse(msg.raw);
              }
              if (onDone) onDone(parsed || null);
              return parsed;
            }
            if (msg.chunk && liveEl) {
              liveEl.textContent += msg.chunk;
              if (kimonMessages) kimonMessages.scrollTop = kimonMessages.scrollHeight;
            }
          } catch(e) { if (e.message && !e.message.startsWith('Unexpected')) throw e; }
        }
      }
      return null;
    }

    function renderParsedSections(container, data, keys) {
      container.innerHTML = '';
      const typables = [];
      keys.forEach(({ key, label }) => {
        const val = data[key];
        if (!val) return;
        const sec = document.createElement('div');
        sec.className = 'kimon-section';
        if (label) {
          const lbl = document.createElement('strong');
          lbl.className = 'kimon-section-label';
          lbl.textContent = label;
          sec.appendChild(lbl);
        }

        // Handle array values (e.g., loiKhuyen as steps)
        if (Array.isArray(val)) {
          const ol = document.createElement('ol');
          ol.style.cssText = 'margin:0; padding-left:1.2em; list-style-type:decimal;';
          val.forEach(step => {
            const li = document.createElement('li');
            li.className = 'kimon-message-text';
            li.style.marginBottom = '4px';
            ol.appendChild(li);
            typables.push({ el: li, text: step });
          });
          sec.appendChild(ol);
        } else {
          const p = document.createElement('p');
          p.className = 'kimon-message-text';
          sec.appendChild(p);
          typables.push({ el: p, text: val });
        }
        container.appendChild(sec);
      });

      let tIdx = 0; let cIdx = 0;
      function typeNext() {
        if (tIdx >= typables.length) {
          if (kimonMessages) kimonMessages.scrollTop = kimonMessages.scrollHeight;
          return;
        }
        const curr = typables[tIdx];
        if (cIdx < curr.text.length) {
          curr.el.textContent += curr.text.charAt(cIdx);
          cIdx++;
          if (kimonMessages) kimonMessages.scrollTop = kimonMessages.scrollHeight;
          setTimeout(typeNext, 10);
        } else {
          tIdx++;
          cIdx = 0;
          setTimeout(typeNext, 100);
        }
      }
      typeNext();
    }

    let isKimonFetching = false;

    // Clear stale rate limit state on page load (server handles rate limiting now)
    localStorage.removeItem('kimon_rate_limit');

    const CACHE_EXPIRE_MS = 3600000; // 1 hour cache

    function getCachedKimon(cacheKey) {
      try {
        const item = JSON.parse(localStorage.getItem(cacheKey));
        if (item && item.expireAt > Date.now()) return item.data;
        localStorage.removeItem(cacheKey);
      } catch {}
      return null;
    }

    function setCachedKimon(cacheKey, data) {
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        expireAt: Date.now() + CACHE_EXPIRE_MS
      }));
    }

    async function autoLoadKimon() {
      if (isKimonFetching) return;

      const qData = getBaseQmdjData();
      const cacheKey = 'kimon_auto_' + (qData.dayStem||'') + '_' + (qData.hourStem||'') + '_' + (qData.solarTerm||'');
      const cached = getCachedKimon(cacheKey);

      if (cached) {
        try {
          const bubble = createMessageBubble(true);
          renderParsedSections(bubble, cached, [
            { key: 'chienLuoc', label: '' },
            { key: 'kyThuat', label: '🔍 Phân Tích' },
            { key: 'nangLuong', label: '' },
            { key: 'loiKhuyen', label: '📋 Hành Động' },
          ]);
          if (cached.suggestedQuestions?.length) renderSuggestions(cached.suggestedQuestions);
          else if (cached.suggestions?.length) renderSuggestions(cached.suggestions);
          kimonMessages.appendChild(bubble);
          if (kimonLoading) kimonLoading.style.display = 'none';
          kimonMessages.scrollTop = kimonMessages.scrollHeight;
          return;
        } catch(e) {}
      }

      isKimonFetching = true;
      if (kimonLoading) kimonLoading.style.display = 'flex';

      const bubble = createMessageBubble(true);
      const liveEl = document.createElement('p');
      liveEl.className = 'kimon-message-text kimon-stream-live';
      bubble.appendChild(liveEl);

      try {
        await callKimonStream({
          qmdjData: qData,
          userContext: '__AUTO_LOAD__',
          liveEl,
          onDone: (data) => {
            liveEl.classList.remove('kimon-stream-live');
            if (!data) {
              // Clean up raw text display
              liveEl.innerHTML = '<em>Không thể phân tích phản hồi. Vui lòng thử lại.</em>';
              return;
            }
            setCachedKimon(cacheKey, data);
            renderParsedSections(bubble, data, [
              { key: 'chienLuoc', label: '' },
              { key: 'kyThuat', label: '🔍 Phân Tích' },
              { key: 'nangLuong', label: '' },
              { key: 'loiKhuyen', label: '📋 Hành Động' },
            ]);
            if (data.suggestedQuestions?.length) renderSuggestions(data.suggestedQuestions);
            else if (data.suggestions?.length) renderSuggestions(data.suggestions);
          }
        });
        kimonMessages.appendChild(bubble);
      } catch(e) {
        console.error('Lỗi autoLoadKimon:', e);
        const errMsg = e.message || 'Lỗi kết nối';

        liveEl.innerHTML = '⚠️ ' + escapeHTML(errMsg) + '<br><br><small><i>Vui lòng tiếp tục nhập câu hỏi phía dưới.</i></small>';
        liveEl.classList.remove('kimon-stream-live');
        kimonMessages.appendChild(bubble);
      } finally {
        isKimonFetching = false;
        if (kimonLoading) kimonLoading.style.display = 'none';
        kimonMessages.scrollTop = kimonMessages.scrollHeight;
      }
    }

    async function askKimon(displayText, hiddenPrompt) {
      if (isKimonFetching) return;
      const question = displayText;
      if (!question?.trim()) return;

      isKimonFetching = true;
      if (kimonSuggestions) kimonSuggestions.style.display = 'none';

      const userBubble = createMessageBubble(false);
      userBubble.innerHTML = '<p class="kimon-message-text">' + escapeHTML(question) + '</p>';
      kimonMessages.appendChild(userBubble);

      const aiBubble = createMessageBubble(true);
      const liveEl = document.createElement('p');
      liveEl.className = 'kimon-message-text kimon-stream-live';
      aiBubble.appendChild(liveEl);
      
      kimonBtn.disabled = true;
      kimonContext.value = '';
      if (kimonLoading) kimonLoading.style.display = 'flex';

      // Use hiddenPrompt (rich context) if provided, otherwise displayText
      const promptToSend = hiddenPrompt || question;

      try {
        const base = getBaseQmdjData();
        const payload = currentTopic ? {
          ...base,
          score: currentTopic.score,
          mon: currentTopic.usefulGodGate || base.mon,
          than: currentTopic.usefulGodDeity || base.than,
          cung: currentTopic.usefulGodPalaceName || base.cung,
          selectedTopic: currentTopic.chipLabel || 'chung'
        } : base;

        await callKimonStream({
          qmdjData: payload,
          userContext: promptToSend,
          liveEl,
          onDone: (data) => {
            liveEl.classList.remove('kimon-stream-live');
            if (!data) {
              liveEl.innerHTML = '<em>Không thể phân tích phản hồi.</em>';
              return;
            }
            renderParsedSections(aiBubble, data, [
              { key: 'chienLuoc', label: '' },
              { key: 'kyThuat', label: '🔍 Phân Tích' },
              { key: 'nangLuong', label: '' },
              { key: 'loiKhuyen', label: '📋 Hành Động' },
            ]);
            kimonMessages.scrollTop = kimonMessages.scrollHeight;
          }
        });
        kimonMessages.appendChild(aiBubble);
      } catch(e) {
        console.error('Lỗi askKimon:', e);
        const errMsg = e.message || 'Lỗi kết nối. Vui lòng thử lại sau.';
        aiBubble.innerHTML = '<p class="kimon-error-inline" style="color:var(--hung); margin:0;">⚠️ ' + escapeHTML(errMsg) + '</p>';
        kimonMessages.appendChild(aiBubble);
      } finally {
        isKimonFetching = false;
        if (kimonLoading) kimonLoading.style.display = 'none';
        kimonBtn.disabled = false;
        kimonMessages.scrollTop = kimonMessages.scrollHeight;
      }
    }

    if (kimonBtn) {
      kimonBtn.addEventListener('click', () => askKimon(kimonContext.value.trim()));
      kimonContext.addEventListener('keydown', e => { if (e.key === 'Enter') askKimon(kimonContext.value.trim()); });
    }

    // (Topic chips have been removed)

    // Show welcome message with suggestions (NO API call on page load)
    function showWelcomeMessage() {
      if (!kimonMessages) return;

      const qData = getBaseQmdjData();
      const bubble = createMessageBubble(true);

      // Build context-aware welcome based on current chart
      const hourInfo = qData.hourStem && qData.hourBranch ? (qData.hourStem + ' ' + qData.hourBranch) : '';
      const gateInfo = qData.mon || '';
      const starInfo = qData.tinh || '';

      bubble.innerHTML = '<div style="margin-bottom:12px; color:#1E293B;">' +
        '<p style="margin:0 0 8px 0;"><strong>Xin chào!</strong> Tôi là Kymon.</p>' +
        (hourInfo ? '<p style="margin:0 0 8px 0; font-size:0.9em; color:#475569;">Giờ hiện tại: <strong>' + escapeHTML(hourInfo) + '</strong>' +
          (gateInfo ? ' • Môn: <strong>' + escapeHTML(gateInfo) + '</strong>' : '') +
          (starInfo ? ' • Tinh: <strong>' + escapeHTML(starInfo) + '</strong>' : '') + '</p>' : '') +
        '<p style="margin:0; font-size:0.9em; color:#475569;">Hãy chọn một câu hỏi bên dưới hoặc nhập câu hỏi của bạn:</p>' +
        '</div>';

      kimonMessages.appendChild(bubble);
      if (kimonLoading) kimonLoading.style.display = 'none';

      // Static suggestions based on common QMDJ questions
      const defaultSuggestions = [
        'Năng lượng hôm nay thế nào?',
        'Tài vận hôm nay ra sao?',
        'Hướng xuất hành tốt nhất?',
        'Giờ tốt để hành động?'
      ];
      renderSuggestions(defaultSuggestions);
    }

    if (kimonMessages) showWelcomeMessage();

  </script>
</body>
</html>`;
}

export default function handler(req, res) {
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
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml'
      };
      const contentType = contentTypes[ext] || 'text/plain';
      const content = fs.readFileSync(filePath);
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
      const content = fs.readFileSync(filePath);
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
  } else if (url.pathname === '/api/kimon/stream' && req.method === 'POST') {
    // ── STREAMING SSE ENDPOINT ────────────────────────────────────────────────
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk.toString(); });
    req.on('end', async () => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      try {
        const body = JSON.parse(bodyData);
        const { qmdjData, userContext = 'chung' } = body;

        // Server-side rate limit check BEFORE calling Gemini
        const rateCheck = canCallGemini();
        if (!rateCheck.allowed) {
          const msg = rateCheck.reason === 'cooldown'
            ? `Đang cooldown. Vui lòng đợi ${rateCheck.secsLeft} giây.`
            : `Đã đạt giới hạn 12 request/phút. Đợi ${rateCheck.secsLeft} giây.`;
          res.write(`data: ${JSON.stringify({ __ERROR__: msg })}\n\n`);
          res.end();
          return;
        }
        recordGeminiRequest();

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const isAutoLoad = userContext === '__AUTO_LOAD__';

        const systemInstruction = isAutoLoad
          ? `ROLE: Bạn là Kimon - Chuyên gia cấp cao về Kỳ Môn Độn Giáp (QMDJ Strategist).
MISSION: Luận giải dữ liệu từ bảng Cửu Cung để đưa ra chiến lược hành động sắc bén.

QUY TẮC LUẬN GIẢI (BẮT BUỘC):
1. KIỂM TRA FLAGS KỸ THUẬT:
   - "Không Vong" (KV): Năng lượng rỗng → khuyên "Chờ đợi" hoặc "Cẩn trọng"
   - "Dịch Mã" (DM): Ưu tiên di chuyển, thay đổi nhanh
   - "Trực Phù" (TF): Hướng có quý nhân, năng lượng dẫn dắt tốt nhất
   - "Phục Âm": Mọi thứ trì trệ → giữ nguyên hiện trạng
   - "Phản Ngâm": Đảo lộn → cần linh hoạt thay đổi kế hoạch

2. PHÂN TÍCH SINH/KHẮC:
   - Nhật Can (Bạn) vs Thời Can (Sự việc): Ai đang chiếm thế chủ động?
   - Môn + Tinh + Thần: Bộ ba này nói gì về chất lượng năng lượng?

3. PHONG CÁCH: Gãy gọn, logic, tiếng Việt hiện đại. Dùng ẨN DỤ thực tế (kinh doanh, thể thao, đời thường).

CHỈ TRẢ VỀ JSON (KHÔNG CHÀO HỎI, KHÔNG GIẢI THÍCH NGOÀI JSON):
{
  "chienLuoc": "1-2 câu khẳng định thế trận (Chủ động/Bị động, Thuận/Nghịch). Ví dụ: 'GO - Thế trận thuận, bạn (Mộc) đang được môi trường (Thủy) tiếp sức.'",
  "kyThuat": "Giải thích kỹ thuật ngắn gọn. Ví dụ: 'Cung 1 có Sinh Môn + Cửu Địa = nền tảng vững, cơ hội sinh lời. Tuy nhiên Đằng Xà cho thấy có biến số bất ngờ.'",
  "nangLuong": "Đọc vị tâm lý + 1 ẩn dụ. Ví dụ: 'Bạn đang như vận động viên trước trận đấu - hưng phấn nhưng hơi lo lắng. Kinh Môn cho thấy cần kiểm soát cảm xúc.'",
  "loiKhuyen": ["Bước 1: Hành động cụ thể trong 1 giờ tới", "Bước 2: Hành động tiếp theo trong 2-3 giờ", "Bước 3: Điều cần tránh/lưu ý"],
  "suggestions": ["Câu hỏi gợi ý sâu hơn 1", "Câu hỏi gợi ý sâu hơn 2", "Câu hỏi gợi ý sâu hơn 3"]
}`
          : `ROLE: Bạn là Kimon - Chuyên gia cấp cao về Kỳ Môn Độn Giáp (QMDJ Strategist).
MISSION: Trả lời câu hỏi của người dùng dựa trên bảng Cửu Cung.

CÂU HỎI: "${userContext}"

QUY TẮC LUẬN GIẢI:
1. KIỂM TRA FLAGS: Không Vong (rỗng), Dịch Mã (di chuyển), Trực Phù (quý nhân), Phục/Phản Ngâm.
2. PHÂN TÍCH: Nhật Can vs Thời Can, Môn + Tinh + Thần.
3. PHONG CÁCH: Gãy gọn, logic, dùng ẨN DỤ thực tế.

CHỈ TRẢ VỀ JSON:
{
  "chienLuoc": "Kết luận Go/No-go + giải thích thế trận Sinh/Khắc.",
  "kyThuat": "Phân tích kỹ thuật: Môn + Tinh + Thần đang nói gì?",
  "nangLuong": "Đọc vị tâm lý + 1 ẩn dụ thực tế.",
  "loiKhuyen": ["Bước 1: ...", "Bước 2: ...", "Bước 3: ..."]
}`;

        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction,
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
          ]
        });

        const score = qmdjData?.score ?? 0;
        const overallScore = qmdjData?.overallScore ?? score;
        const extras = [
          qmdjData?.isPhucAm ? 'Phục Âm' : '',
          qmdjData?.isPhanNgam ? 'Phản Ngâm' : ''
        ].filter(Boolean).join(' | ');

        const allTopicsStr = qmdjData?.allTopics || '[]';
        let parsedTopics = [];
        try { parsedTopics = JSON.parse(allTopicsStr); } catch (e) { }
        const topicsContext = parsedTopics.map(t => `- ${t.topic} (${t.verdict}, ${t.score >= 0 ? '+' : ''}${t.score}): ${t.action}`).join('\n');

        const prompt = isAutoLoad
          ? `[TRẬN ĐỒ]\n${enrichData(qmdjData || {})}\nĐiểm: ${overallScore} | ${qmdjData?.solarTerm || ''} | Cục ${qmdjData?.cucSo || '?'} ${qmdjData?.isDuong ? 'Dương' : 'Âm'}${extras ? ' | ' + extras : ''}\n\n[DỮ LIỆU DỤNG THẦN CÁC LĨNH VỰC]\n${topicsContext}\n\nDựa vào tất cả dữ liệu trên, hãy tổng hợp lời khuyên 2-4h tới.\nTrả JSON ngay.`
          : `[TRẬN ĐỒ]\n${enrichData(qmdjData || {})}\nĐiểm: ${score}/${overallScore} | Chủ đề: ${qmdjData?.selectedTopic || 'chung'}${extras ? ' | ' + extras : ''}\n\n[DỮ LIỆU DỤNG THẦN CÁC LĨNH VỰC]\n${topicsContext}\n\nCâu hỏi: ${userContext}`;

        const streamResult = await model.generateContentStream(prompt);
        let fullText = '';

        for await (const chunk of streamResult.stream) {
          const txt = chunk.text();
          if (txt) {
            fullText += txt;
            // Send intermediate SSE chunk so frontend can show real-time text
            res.write(`data: ${JSON.stringify({ chunk: txt })}\n\n`);
          }
        }

        try {
          // Extract JSON from any text (handles preamble/postamble)
          const jsonMatch = fullText.match(/\{[\s\S]*\}/);
          const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : fullText);
          console.log('[Kimon] Parsed OK, keys:', Object.keys(parsed));
          res.write(`data: ${JSON.stringify({ __DONE__: true, parsed })}\n\n`);
        } catch (parseErr) {
          console.error('[Kimon] JSON parse failed:', parseErr.message);
          console.error('[Kimon] Raw response:', fullText.substring(0, 500));
          res.write(`data: ${JSON.stringify({ __DONE__: true, raw: fullText })}\n\n`);
        }
        res.end();
      } catch (error) {
        console.error('Kimon Stream Error:', error);
        let errorMsg = error.message;
        if (error.status === 429 || String(error.message).includes('429')) {
          triggerGeminiCooldown(); // Activate cooldown on 429
          errorMsg = 'API Rate Limit (429). Vui lòng đợi 30 giây.';
        }
        res.write(`data: ${JSON.stringify({ __ERROR__: errorMsg })}\n\n`);
        res.end();
      }
    });

  } else if (url.pathname === '/api/kimon' && req.method === 'POST') {
    // ── FALLBACK NON-STREAMING (kept for compatibility) ───────────────────────
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk.toString(); });
    req.on('end', async () => {
      // Server-side rate limit check
      const rateCheck = canCallGemini();
      if (!rateCheck.allowed) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: rateCheck.reason === 'cooldown'
            ? `Đang cooldown. Vui lòng đợi ${rateCheck.secsLeft} giây.`
            : `Đã đạt giới hạn 12 request/phút. Đợi ${rateCheck.secsLeft} giây.`
        }));
        return;
      }
      recordGeminiRequest();

      try {
        const body = JSON.parse(bodyData);
        const { qmdjData, userContext = 'chung' } = body;
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const isAutoLoad = userContext === '__AUTO_LOAD__';
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 512 }
        });
        const score = qmdjData?.score ?? 0;
        const overallScore = qmdjData?.overallScore ?? score;
        const prompt = isAutoLoad
          ? `${enrichData(qmdjData || {})} Điểm: ${overallScore}. Trả JSON: {"chienLuoc":"...","nangLuong":"...","cauHoiMo":"...","suggestions":[]}`
          : `${enrichData(qmdjData || {})} Hỏi: ${userContext}. Trả JSON: {"chienLuoc":"...","nangLuong":"...","loiKhuyen":"..."}`;
        const result = await model.generateContent(prompt);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(await result.response.text());
      } catch (error) {
        if (error.status === 429 || String(error.message).includes('429')) {
          triggerGeminiCooldown();
        }
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });

  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
}

// Ensure local development server still works when not on Vercel
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const server = http.createServer(handler);
  server.listen(PORT, () => {
    console.log(`\n🔮 QMDJ Engine Server running at http://localhost:${PORT}\n`);
    console.log('Endpoints:');
    console.log(`  - GET /                  → Kymon UI`);
    console.log(`  - GET /dung-than         → Dụng Thần Analysis (React)`);
    console.log(`  - GET /api/analyze       → JSON API`);
    console.log(`\nQuery params: ?date=YYYY-MM-DD&hour=0-23&minute=0-59\n`);
  });
}
