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
import { analyze } from './src/index.js';
import { generateDeterministicEnergyFlow } from './src/logic/dungThan/index.js';
import { generateQuickSummary } from './src/logic/dungThan/quickSummary.js';
import { buildKimonPrompt, buildKimonSystemInstruction } from './src/logic/kimon/promptBuilder.js';
import { parseKimonJsonResponse, toKimonResponseSchema } from './src/logic/kimon/jsonResponse.js';
import {
  ORDER as SLOT_ORDER,
  SLOT_TO_PALACE,
  normalizePalaces,
} from './src/core/palaceLayout.js';
import {
  DISPLAY_MODE_WEB1,
  buildDisplayChart,
  getDirectionLabel,
  getSectionLabel,
  getVisualPalaceEntries,
} from './src/ui/displayMappings.js';
import {
  formatLocalDateInput,
  getEffectiveChartTime,
} from './src/ui/chartTime.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const PREVIOUS_KYMON_MAX_OUTPUT_TOKENS = 2200;
const KYMON_MAX_OUTPUT_TOKENS = 3072;

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

function escapeHTML(raw) {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getKimonResponseMeta(response) {
  const candidate = response?.candidates?.[0] || null;
  return {
    finishReason: candidate?.finishReason || candidate?.finishMessage || 'unknown',
    stopReason: candidate?.stopReason || response?.promptFeedback?.blockReason || 'n/a',
    candidateCount: Array.isArray(response?.candidates) ? response.candidates.length : 0,
  };
}

function logKimonModelMeta(route, response, rawText = '') {
  const meta = getKimonResponseMeta(response);
  console.log(
    `[Kimon][${route}] maxOutputTokens old=${PREVIOUS_KYMON_MAX_OUTPUT_TOKENS} new=${KYMON_MAX_OUTPUT_TOKENS} rawLength=${String(rawText || '').length} finishReason=${meta.finishReason} stopReason=${meta.stopReason} candidates=${meta.candidateCount}`
  );
}

function generateHTML(date, hour, minute = 0, options = {}) {
  const { chart, evaluation, topicResults } = analyze(date, hour);
  const chartTimeMode = options.chartTimeMode || 'live';
  const loaderPhrases = [
    'Đang channel năng lượng...',
    'Đang lập trận đồ...',
    'Đang xoay Cửu Cung...',
    'Đang dò nhịp thời khí...',
    'Đang mở khóa Thiên Bàn...',
    'Đang căn lại Môn - Tinh - Thần...',
    'Đang gom tín hiệu cho Kymon...',
  ];
  const initialLoaderPhrase = loaderPhrases[Math.floor(Math.random() * loaderPhrases.length)];

  // Generate Energy Flow Summary
  const energyFlow = generateDeterministicEnergyFlow(chart);

  const rawPalacesByNum = normalizePalaces(chart.palaces);
  const displayChart = buildDisplayChart(chart);
  const palacesByNum = displayChart.palaces;

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
    const pal = rawPalacesByNum[p];
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
  const palaceLabelFromNum = palaceNum => palacesByNum[palaceNum]?.directionLabel?.displayShort || `P${palaceNum}`;
  const toneLabelFromKey = tone => ({
    'very-bright': 'Rất sáng',
    bright: 'Sáng',
    neutral: 'Trung',
    dim: 'Sẫm',
    dark: 'Tối',
  }[tone] || 'Trung');
  const renderLabel = (label, fallback = '—') => {
    const displayName = label?.displayName || label?.displayShort || fallback;
    const internalName = label?.internalName || '';
    const safeDisplay = escapeHTML(displayName || fallback);
    const safeInternal = escapeHTML(internalName);
    const internalMarkup = internalName && internalName !== displayName
      ? `<span class="internal-label">${safeInternal}</span>`
      : '';
    const title = safeInternal || safeDisplay;
    return `<span class="dual-label" title="${title}"><span class="display-label">${safeDisplay}</span>${internalMarkup}</span>`;
  };
  const renderEntity = (entity, fallback = '—') => renderLabel(entity, fallback);
  const renderFlagList = pal => {
    if (!Array.isArray(pal?.flagLabels) || !pal.flagLabels.length) return '';
    return `
      <div class="palace-flag-badges">
        ${pal.flagLabels.map(flag => `<span class="flag-badge">${renderLabel(flag, flag.displayShort)}</span>`).join('')}
      </div>
    `;
  };
  const renderTemporalBadgeList = pal => {
    if (!Array.isArray(pal?.temporalBadgeLabels) || !pal.temporalBadgeLabels.length) return '';
    return `
      <div class="temporal-badges">
        ${pal.temporalBadgeLabels.map(flag => `<span class="temporal-badge">${renderLabel(flag, flag.displayShort)}</span>`).join('')}
      </div>
    `;
  };
  const renderSecondaryEntity = (entity, fallback = '—') => (
    entity ? `<span class="palace-secondary">${renderEntity(entity, fallback)}</span>` : ''
  );
  const formatPalaceScore = score => `${Number(score) >= 0 ? '+' : ''}${Number(score) || 0}`;
  const formatDebugScore = score => `${Number(score) >= 0 ? '+' : ''}${Math.round(Number(score || 0) * 100) / 100}`;
  const formatTagAdjustments = backgroundDebug => {
    const components = backgroundDebug?.tagAdjustments || {};
    const entries = Object.entries(components)
      .filter(([, value]) => Number(value) !== 0)
      .map(([key, value]) => `${key}:${formatDebugScore(value)}`);
    return entries.join(', ');
  };
  const formatBackgroundReasons = backgroundDebug => Array.isArray(backgroundDebug?.reasons)
    ? backgroundDebug.reasons.join(' | ')
    : '';
  const buildCounselorNarrative = ({ topic, pal, actionLabel, coreMessage, fallbackNarrative }) => {
    const doorName = pal?.mon?.displayName || pal?.mon?.displayShort || 'Môn chưa xác định';
    const starName = pal?.star?.displayName || pal?.star?.displayShort || 'Tinh chưa xác định';
    const deityName = pal?.than?.displayName || pal?.than?.displayShort || 'Thần chưa xác định';
    const actionDirective = actionLabel === 'Chủ động'
      ? 'chủ động chốt một bước nhỏ ngay bây giờ và đo phản hồi thực tế.'
      : actionLabel === 'Phòng thủ'
        ? 'ưu tiên giữ nguồn lực, giảm cam kết mới và khóa các điểm rò rỉ.'
        : 'giữ nhịp quan sát, thử ở quy mô nhỏ rồi mới tăng cam kết.';
    const advice = coreMessage || fallbackNarrative || topic?.actionAdvice || 'Giữ nhịp ổn định trước khi mở thêm mặt trận mới.';
    return `Đọc dòng năng lượng: Tôi quan sát thấy Dụng thần ${doorName} đang đóng tại ${topic.usefulGodDir} (cung ${topic.usefulGodPalace}), đi cùng ${starName} và ${deityName}. Lời khuyên thực chiến: ${advice} ${actionDirective}`;
  };

  const palaceRows = [];
  for (const [dir, pal] of getVisualPalaceEntries(palacesByNum)) {
    const p = SLOT_TO_PALACE[dir];
    const directionLabel = pal?.directionLabel?.displayShort || getDirectionLabel(dir);
    if (dir === 'C') {
      palaceRows.push(`
        <tr>
          <td>5</td>
          <td>${pal?.phiTinhNum ?? ''}</td>
          <td>${renderLabel(pal?.directionLabel, 'Trung Cung')}</td>
          <td>—</td>
          <td>—</td>
          <td>${renderLabel(pal?.earthStemLabel, '')}</td>
          <td>—</td>
          <td>—</td>
          <td></td>
          <td>${formatPalaceScore(pal?.score ?? 0)}</td>
          <td>${escapeHTML(pal?.tone || 'neutral')}</td>
          <td>${escapeHTML(formatDebugScore(pal?.backgroundDebug?.baseScore ?? 0))}</td>
          <td>${escapeHTML(formatTagAdjustments(pal?.backgroundDebug) || '—')}</td>
          <td>${escapeHTML(pal?.backgroundTone || pal?.tone || 'neutral')}</td>
          <td>${escapeHTML(formatBackgroundReasons(pal?.backgroundDebug) || '—')}</td>
        </tr>
      `);
      continue;
    }
    if (!pal) continue;
    const flags = Array.isArray(pal.flagLabels)
      ? pal.flagLabels.map(flag => `${flag.displayShort}${flag.internalName && flag.internalName !== flag.displayShort ? ` (${flag.internalName})` : ''}`).join(', ')
      : '';

    palaceRows.push(`
      <tr>
        <td>${p}</td>
        <td>${pal.phiTinhNum}</td>
        <td>${renderLabel(pal.directionLabel, directionLabel)}</td>
        <td>${renderEntity(pal.star)}</td>
        <td>${renderEntity(pal.can)}</td>
        <td>${renderLabel(pal.earthStemLabel)}</td>
        <td>${renderEntity(pal.mon)}</td>
        <td>${renderEntity(pal.than)}</td>
        <td>${flags}</td>
        <td>${formatPalaceScore(pal?.score ?? 0)}</td>
        <td>${escapeHTML(pal?.tone || 'neutral')}</td>
        <td>${escapeHTML(formatDebugScore(pal?.backgroundDebug?.baseScore ?? 0))}</td>
        <td>${escapeHTML(formatTagAdjustments(pal?.backgroundDebug) || '—')}</td>
        <td>${escapeHTML(pal?.backgroundTone || pal?.tone || 'neutral')}</td>
        <td>${escapeHTML(formatBackgroundReasons(pal?.backgroundDebug) || '—')}</td>
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
    const usefulGodDir = Number.isFinite(usefulPalaceNum)
      ? palaceLabelFromNum(usefulPalaceNum)
      : t.usefulGodDir;
    const actionLabel = strategic ? mapStrategicAction(strategic.score) : (insight?.actionLabel || fallbackActionLabel(t.score));
    const oneLiner = strategic?.coreMessage || insight?.oneLiner || t.actionAdvice || '';
    const counselorNarrative = buildCounselorNarrative({
      topic: { ...t, usefulGodDir },
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
      usefulGodDir,
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
  const dayPalaceNum = displayChart.dayMarkerPalace || chart.dayMarkerPalace || null;
  const dayPalace = dayPalaceNum ? palacesByNum[dayPalaceNum] : null;
  const dayDoorKey = normalizeDoorKey(dayPalace?.mon?.internalName || dayPalace?.mon?.name);
  const dayDoorText = dayPalace?.mon?.displayName || dayPalace?.mon?.displayShort || 'Môn chưa xác định';
  const dayDirText = dayPalaceNum ? palaceLabelFromNum(dayPalaceNum) : 'vị trí chưa xác định';
  const dayMarkerSource = displayChart.dayMarkerResolutionSource || chart.dayMarkerResolutionSource || '';
  const hourPalaceNum = displayChart.hourMarkerPalace || chart.hourMarkerPalace || null;
  const hourPalace = hourPalaceNum ? palacesByNum[hourPalaceNum] : null;
  const hourDoorKey = normalizeDoorKey(hourPalace?.mon?.internalName || hourPalace?.mon?.name);
  const hourDoorText = hourPalace?.mon?.displayName || hourPalace?.mon?.displayShort || 'Môn chưa xác định';
  const hourStarText = hourPalace?.star?.displayName || hourPalace?.star?.displayShort || 'Tinh chưa xác định';
  const hourDeityText = hourPalace?.than?.displayName || hourPalace?.than?.displayShort || 'Thần chưa xác định';
  const hourDirText = hourPalaceNum ? palaceLabelFromNum(hourPalaceNum) : 'vị trí chưa xác định';
  const hourMarkerSource = displayChart.hourMarkerResolutionSource || chart.hourMarkerResolutionSource || '';
  const hourCarrierStar = chart?.palaces?.[hourPalaceNum || 0]?.sentStar?.short || chart?.palaces?.[hourPalaceNum || 0]?.sentStar?.name || '';
  const hourEnergyTone = displayChart.hourEnergyTone || chart.hourEnergyTone || 'neutral';
  const hourEnergyVerdict = displayChart.hourEnergyVerdict || chart.hourEnergyVerdict || 'trung';
  const hourEnergyScore = displayChart.hourEnergyScore ?? chart.hourEnergyScore ?? 0;
  const routePalaceNum = displayChart.directEnvoyActionPalace || chart.directEnvoyActionPalace || chart.trucSuPalace || null;
  const routePalace = routePalaceNum ? palacesByNum[routePalaceNum] : null;
  const routeDoorText = routePalace?.mon?.displayName || routePalace?.mon?.displayShort || 'Môn chưa xác định';
  const routeStarText = routePalace?.star?.displayName || routePalace?.star?.displayShort || 'Tinh chưa xác định';
  const routeDeityText = routePalace?.than?.displayName || routePalace?.than?.displayShort || 'Thần chưa xác định';
  const routeDirText = routePalaceNum ? palaceLabelFromNum(routePalaceNum) : 'vị trí chưa xác định';
  const routeEnergyTone = displayChart.directEnvoyActionTone || chart.directEnvoyActionTone || 'neutral';
  const routeEnergyVerdict = displayChart.directEnvoyActionVerdict || chart.directEnvoyActionVerdict || 'trung';
  const routeEnergyScore = displayChart.directEnvoyActionScore ?? chart.directEnvoyActionScore ?? 0;
  const quickReadSummary = displayChart.hourQuickReadSummary || chart.hourQuickReadSummary || 'Khí giờ đang trung tính, cần quan sát thêm trước khi tăng lực';
  const markersSamePalace = Boolean(dayPalaceNum && hourPalaceNum && dayPalaceNum === hourPalaceNum);
  let chiefPalaceNum = null;
  for (let p = 1; p <= 9; p++) {
    if (palacesByNum[p]?.trucPhu) {
      chiefPalaceNum = p;
      break;
    }
  }
  const chiefPalace = chiefPalaceNum ? palacesByNum[chiefPalaceNum] : null;
  const chiefDoorKey = normalizeDoorKey(chiefPalace?.mon?.internalName || chiefPalace?.mon?.name);
  const chiefDoorText = chiefPalace?.mon?.displayName || chiefPalace?.mon?.displayShort || 'Môn chưa xác định';
  const chiefDirText = chiefPalaceNum ? palaceLabelFromNum(chiefPalaceNum) : 'vị trí chưa xác định';

  // Trực Phù prefers Nhuế over Cầm
  let trucPhuDisplay = chiefPalace?.star?.displayName || chiefPalace?.star?.displayShort || 'Tinh chưa xác định';
  if (chiefPalace?.sentStar && chiefPalace?.trucPhu) {
    trucPhuDisplay = chiefPalace.sentStar.displayName;
  }

  const briefingHeading = BRIEFING_TITLE_BY_DOOR[dayDoorKey] || strategicTitle;
  const internalLine = `${INTERNAL_STATE_BY_DOOR[dayDoorKey] || 'Năng lượng hiện tại của bạn đang khá nhiễu, cần chậm một nhịp để nhìn rõ ưu tiên chính.'} (Nhật Can ${displayChart.dayPillar?.stem?.displayShort || dayStem || '—'} tại ${dayDoorText}, ${dayDirText}).`;
  const hourRealityTail = REALITY_CHECK_BY_DOOR[hourDoorKey] || 'hãy ưu tiên bước nhỏ có thể kiểm chứng, tránh quyết định vì cảm xúc nhất thời.';
  const routeRealityTail = REALITY_CHECK_BY_DOOR[normalizeDoorKey(routePalace?.mon?.internalName || routePalace?.mon?.name)] || 'đi nhịp gọn, làm đúng cửa trước rồi mới tăng lực.';
  const chiefRealityTail = REALITY_CHECK_BY_DOOR[chiefDoorKey] || 'đi nhịp thận trọng, gom thêm dữ kiện trước khi tăng cam kết.';
  const realityLine = hourPalace
    ? `Cung Giờ hiện nằm ở ${hourDirText} với ${hourDoorText}, sắc độ ${toneLabelFromKey(hourEnergyTone)}, thế ${hourEnergyVerdict}; ${hourRealityTail} Cung Trực Sử đang mở ở ${routeDirText} với ${routeDoorText}, sắc độ ${toneLabelFromKey(routeEnergyTone)}, thế ${routeEnergyVerdict}; ${routeRealityTail}`
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
  const hourLegendMarkup = `
    <div class="hour-legend">
      <p class="hour-legend-note">Màu nền giúp bạn nhìn nhanh tình trạng của cung:</p>
      <p class="hour-legend-note">- Trắng = thuận, dễ hành động hơn</p>
      <p class="hour-legend-note">- Xám rất nhạt = tương đối yên</p>
      <p class="hour-legend-note">- Xám nhạt = có lực cản</p>
      <p class="hour-legend-note">- Xám hơn = áp lực hoặc bế tắc mạnh hơn</p>
      <p class="hour-legend-note">Cung Giờ cho biết khí hiện tại.</p>
    </div>
  `;

  const topicRows = topicEntries.map(res => `
    <tr data-topic="${res.topic}" data-direction="${res.usefulGodDir}" data-score="${res.score}">
      <td data-col="topic">${res.topic}</td>
        <td data-col="direction">${palaceLabelFromNum(res.usefulGodPalace)}</td>
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
  const selectedDate = options.selectedDate || formatLocalDateInput(date);
  const selectedMinute = minute;
  const selectedTimeText = `${String(hour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
  const timeBasis = 'Theo giờ bạn nhập (floating time, không khóa timezone)';
  const structureModeLabel = `${displayChart.sections.structure} ${chart.cucSo} ${displayChart.sections.structurePolarity}`;
  const timeStripItems = [
    { label: getSectionLabel('Giờ'), pillar: displayChart.gioPillar, markerPalace: hourPalaceNum, direction: hourDirText },
    { label: getSectionLabel('Ngày'), pillar: displayChart.dayPillar, markerPalace: dayPalaceNum, direction: dayDirText },
    { label: getSectionLabel('Tháng'), pillar: displayChart.monthPillar, markerPalace: displayChart.monthMarkerPalace || chart.monthMarkerPalace || null, direction: palaceLabelFromNum(displayChart.monthMarkerPalace || chart.monthMarkerPalace || 5) },
    { label: getSectionLabel('Năm'), pillar: displayChart.yearPillar, markerPalace: null, direction: '' },
  ];
  const timeStripMarkup = `
    <div class="board-time-strip">
      ${timeStripItems.map(item => `
        <div class="time-strip-item">
          <div class="time-strip-label-row">
            <span class="time-strip-label">${escapeHTML(item.label)}</span>
          </div>
          <div class="time-strip-pillar">
            <span>${escapeHTML(item.pillar?.stem?.displayShort || item.pillar?.stemName || '—')}</span>
            <span>${escapeHTML(item.pillar?.branch?.displayShort || item.pillar?.branchName || '—')}</span>
          </div>
          <div class="time-strip-meta">
            ${item.markerPalace ? `P${escapeHTML(String(item.markerPalace))} · ${escapeHTML(item.direction || '')}` : '&nbsp;'}
          </div>
        </div>
      `).join('')}
    </div>
  `;
  const palaceGridCards = getVisualPalaceEntries(palacesByNum).map(([slot, pal]) => {
    const p = SLOT_TO_PALACE[slot];
    const toneClass = `palace-tone-${pal?.backgroundTone || pal?.tone || 'neutral'}`;
    const markerClass = Array.isArray(pal?.temporalBadgeLabels) && pal.temporalBadgeLabels.length ? 'palace-has-marker' : '';
    const hourMarkerClass = displayChart.hourMarkerPalace === p ? 'hour-marker' : '';

    if (slot === 'C') {
      return `
        <article class="palace-cell palace-cell-center ${toneClass}" data-slot="${slot}">
          <div class="palace-header">
            <span class="palace-dir">${renderLabel(pal.directionLabel, 'Trung')}</span>
            <span class="palace-num">P5</span>
          </div>
          <div class="center-time" id="liveClockValue">${escapeHTML(selectedTimeText)}</div>
          <div class="palace-line palace-line-center">
            <span class="palace-item">${escapeHTML(displayChart.dayPillar?.stem?.displayShort || chart.dayPillar?.stemName || '—')} ${escapeHTML(displayChart.dayPillar?.branch?.displayShort || chart.dayPillar?.branchName || '—')}</span>
          </div>
          <div class="palace-line palace-line-center">
            <span class="palace-item">${escapeHTML(structureModeLabel)}</span>
          </div>
          <div class="palace-line palace-line-center">
            <span class="palace-item">#${pal?.phiTinhNum ?? '—'}</span>
          </div>
        </article>
      `;
    }

    return `
      <article class="palace-cell ${toneClass} ${markerClass} ${hourMarkerClass}" data-slot="${slot}">
        <div class="palace-header">
          <span class="palace-dir">${renderLabel(pal.directionLabel, slot)}</span>
          <span class="palace-num">P${p}</span>
        </div>
        ${renderTemporalBadgeList(pal)}
        ${renderFlagList(pal)}
        <div class="palace-body">
          <div class="palace-corner palace-corner-top-left">${renderEntity(pal.than)}</div>
          <div class="palace-corner palace-corner-top-right">${renderEntity(pal.can)}</div>
          <div class="palace-center-door">
            ${renderEntity(pal.mon)}
          </div>
          <div class="palace-corner palace-corner-bottom-left">${renderLabel(pal.earthStemLabel)}</div>
          <div class="palace-corner palace-corner-bottom-right">
            ${renderEntity(pal.star)}
            ${renderSecondaryEntity(pal.sentStar)}
          </div>
        </div>
      </article>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kymon · QMDJ Engine</title>
  <script>
    (() => {
      const THEME_STORAGE_KEY = 'kymon_theme';
      const hour = new Date().getHours();
      const autoTheme = (hour >= 19 || hour < 7) ? 'dark' : 'light';
      let theme = autoTheme;
      try {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') {
          theme = savedTheme;
        }
      } catch {}
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    })();
  </script>
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #F8FAFC;
      --card: #FFFFFF;
      --border: #E2E8F0;
      --border-strong: #D1D5DB;
      --text: #1E293B;
      --text-soft: #334155;
      --muted: #64748B;
      --cat: #10B981;
      --hung: #F43F5E;
      --info: #3B82F6;
      --code-bg: #F1F5F9;
      --shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
      --shadow-soft: 0 10px 40px -10px rgba(0, 0, 0, 0.08);
      --surface-soft: #F7F7F7;
      --surface-softer: #F1F5F9;
      --surface-muted: #E5E7EB;
      --surface-highlight: #EFF6FF;
      --surface-highlight-border: #BFDBFE;
      --surface-highlight-text: #1E3A8A;
      --loader-bg: #F8FAFC;
      --loader-title: #0F172A;
      --loader-text: #64748B;
      --control-bg: #FFFFFF;
      --control-border: #E2E8F0;
      --control-text: #1E293B;
      --input-bg: #F1F5F9;
      --input-border: transparent;
      --input-focus-bg: #FFFFFF;
      --input-focus-border: #CBD5E1;
      --input-text: #1E293B;
      --input-placeholder: #94A3B8;
      --tooltip-bg: #0F172A;
      --tooltip-text: #F8FAFC;
      --tooltip-border: rgba(148, 163, 184, 0.3);
      --tooltip-shadow: 0 12px 24px rgba(15, 23, 42, 0.25);
      --energy-card-bg: linear-gradient(135deg, #FEFCE8 0%, #FEF9C3 100%);
      --energy-card-border: #FCD34D;
      --energy-card-title: #92400E;
      --energy-sentence-bg: rgba(255, 255, 255, 0.7);
      --energy-sentence-border: rgba(251, 191, 36, 0.3);
      --energy-label-text: #92400E;
      --energy-paragraph-text: #451A03;
      --energy-tag-bg: rgba(255, 255, 255, 0.8);
      --energy-tag-border: rgba(251, 191, 36, 0.4);
      --energy-tag-text: #78350F;
      --topic-chip-bg: #FFFFFF;
      --topic-chip-hover-border: #BFDBFE;
      --insight-card-bg: #FFFFFF;
      --score-track-bg: #E2E8F0;
      --table-head-bg: #F8FAFC;
      --table-row-border: #EEF2F7;
      --time-strip-bg: #FFFFFF;
      --time-strip-border: #D1D5DB;
      --palace-board-border: #D1D5DB;
      --palace-bright: #FFFFFF;
      --palace-neutral: #F7F7F7;
      --palace-soft-dark: #F1F1F1;
      --palace-dark: #E5E7EB;
      --palace-chip-bg: #F7F7F7;
      --palace-chip-border: #D1D5DB;
      --palace-chip-text: #374151;
      --palace-num-border: #E5E7EB;
      --palace-text: #1F2937;
      --palace-hot-text: #DC2626;
      --palace-earth-text: #991B1B;
      --palace-center-time: #991B1B;
      --badge-bg: #FFFFFF;
      --badge-border: #D1D5DB;
      --badge-text: #1F2937;
      --kimon-container-bg: #FFFFFF;
      --kimon-container-border: #E2E8F0;
      --kimon-container-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.08);
      --kimon-ai-text: #1E293B;
      --kimon-user-bubble-bg: #1E293B;
      --kimon-user-bubble-border: #1E293B;
      --kimon-user-bubble-text: #FFFFFF;
      --kimon-meta-text: #94A3B8;
      --kimon-tip-border: #E2E8F0;
      --scrollbar-thumb: #CBD5E1;
      --scrollbar-thumb-hover: #94A3B8;
      --error-bg: #FEF2F2;
      --error-border: #FECACA;
      --error-text: #DC2626;
      --theme-toggle-bg: #FFFFFF;
      --theme-toggle-border: #D1D5DB;
      --theme-toggle-icon: #334155;
      --theme-toggle-ring: rgba(59, 130, 246, 0.18);
    }
    html[data-theme="dark"] {
      --bg: #0B1220;
      --card: #111827;
      --border: #243041;
      --border-strong: #334155;
      --text: #E5EEF8;
      --text-soft: #CBD5E1;
      --muted: #94A3B8;
      --code-bg: #131C2D;
      --shadow: 0 16px 40px rgba(2, 6, 23, 0.42);
      --shadow-soft: 0 14px 42px rgba(2, 6, 23, 0.46);
      --surface-soft: #162032;
      --surface-softer: #1B2537;
      --surface-muted: #223046;
      --surface-highlight: #13233D;
      --surface-highlight-border: #2E4F78;
      --surface-highlight-text: #DBEAFE;
      --loader-bg: #08111F;
      --loader-title: #F8FAFC;
      --loader-text: #94A3B8;
      --control-bg: #0F172A;
      --control-border: #334155;
      --control-text: #E5EEF8;
      --input-bg: #0F172A;
      --input-border: #243041;
      --input-focus-bg: #111C2F;
      --input-focus-border: #3B82F6;
      --input-text: #E5EEF8;
      --input-placeholder: #64748B;
      --tooltip-bg: #020817;
      --tooltip-text: #E2E8F0;
      --tooltip-border: rgba(148, 163, 184, 0.22);
      --tooltip-shadow: 0 16px 30px rgba(2, 6, 23, 0.45);
      --energy-card-bg: linear-gradient(135deg, rgba(120, 53, 15, 0.28) 0%, rgba(113, 63, 18, 0.2) 100%);
      --energy-card-border: #A16207;
      --energy-card-title: #FCD34D;
      --energy-sentence-bg: rgba(15, 23, 42, 0.38);
      --energy-sentence-border: rgba(245, 158, 11, 0.22);
      --energy-label-text: #FBBF24;
      --energy-paragraph-text: #FDE68A;
      --energy-tag-bg: rgba(15, 23, 42, 0.42);
      --energy-tag-border: rgba(245, 158, 11, 0.22);
      --energy-tag-text: #FCD34D;
      --topic-chip-bg: #111827;
      --topic-chip-hover-border: #334155;
      --insight-card-bg: #111827;
      --score-track-bg: #233145;
      --table-head-bg: #162032;
      --table-row-border: #243041;
      --time-strip-bg: #111827;
      --time-strip-border: #334155;
      --palace-board-border: #334155;
      --palace-bright: #16283F;
      --palace-neutral: #132237;
      --palace-soft-dark: #101C2D;
      --palace-dark: #0D1626;
      --palace-chip-bg: #182235;
      --palace-chip-border: #334155;
      --palace-chip-text: #DBE5F2;
      --palace-num-border: #334155;
      --palace-text: #E5EEF8;
      --palace-hot-text: #FCA5A5;
      --palace-earth-text: #FECACA;
      --palace-center-time: #FCA5A5;
      --badge-bg: #182235;
      --badge-border: #334155;
      --badge-text: #DBE5F2;
      --kimon-container-bg: #111827;
      --kimon-container-border: #243041;
      --kimon-container-shadow: 0 14px 42px rgba(2, 6, 23, 0.46);
      --kimon-ai-text: #E5EEF8;
      --kimon-user-bubble-bg: #1D2A46;
      --kimon-user-bubble-border: #31446B;
      --kimon-user-bubble-text: #F8FBFF;
      --kimon-meta-text: #94A3B8;
      --kimon-tip-border: #243041;
      --scrollbar-thumb: #334155;
      --scrollbar-thumb-hover: #475569;
      --error-bg: rgba(127, 29, 29, 0.35);
      --error-border: rgba(252, 165, 165, 0.24);
      --error-text: #FCA5A5;
      --theme-toggle-bg: #111827;
      --theme-toggle-border: #334155;
      --theme-toggle-icon: #F8FAFC;
      --theme-toggle-ring: rgba(96, 165, 250, 0.24);
    }
    /* === INITIAL LOADER === */
    #initialLoader {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: var(--loader-bg);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: opacity 0.5s ease-out, visibility 0.5s ease-out;
      animation: kymon-loader-dismiss 0.45s ease-out 2.4s forwards;
    }
    #initialLoader.fade-out {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
    .kymon-loader-logo-wrapper {
      position: relative;
      width: 140px;
      height: 140px;
      margin-bottom: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    /* Energy Aura */
    .kymon-loader-logo-wrapper::before {
      content: '';
      position: absolute;
      top: -20%; left: -20%; right: -20%; bottom: -20%;
      background: radial-gradient(circle, rgba(251,191,36,0.35) 0%, rgba(245,158,11,0) 70%);
      border-radius: 50%;
      animation: kymon-aura 2s ease-in-out infinite alternate;
      z-index: 1;
    }
    /* Shockwave/Sparks */
    .kymon-loader-logo-wrapper::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
      animation: kymon-pulse 1.8s cubic-bezier(0.165, 0.840, 0.440, 1.000) infinite;
      z-index: 2;
    }
    #initialLoader img {
      position: relative;
      width: 110px;
      height: 110px;
      object-fit: contain;
      z-index: 3;
      animation: kymon-float 3s ease-in-out infinite;
      filter: drop-shadow(0 4px 15px rgba(251, 191, 36, 0.4));
    }
    @keyframes kymon-aura {
      0% { transform: scale(0.8); opacity: 0.4; }
      100% { transform: scale(1.3); opacity: 0.8; }
    }
    @keyframes kymon-pulse {
      0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6); }
      70% { box-shadow: 0 0 0 50px rgba(245, 158, 11, 0); }
      100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
    }
    @keyframes kymon-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    #initialLoader h1 {
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--loader-title);
      margin: 0 0 8px 0;
      letter-spacing: -0.02em;
    }
    #initialLoader p {
      font-size: 1rem;
      color: var(--loader-text);
      margin: 0;
      min-height: 1.6em;
      text-align: center;
    }
    @keyframes kymon-loader-dismiss {
      to {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
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
    .header-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: flex-end;
      gap: 12px;
      margin-left: auto;
    }
    .app-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }
    .app-subtitle {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 1rem;
    }
    .controls {
      order: 1;
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    .controls label {
      font-size: 0.875rem;
      color: var(--muted);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .display-mode-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      font-size: 0.8rem;
      color: var(--muted);
    }
    .mode-pill {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 999px;
      background: var(--surface-highlight);
      color: var(--surface-highlight-text);
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .debug-toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: var(--muted);
      white-space: nowrap;
    }
    .debug-toggle input {
      width: 16px;
      height: 16px;
      accent-color: #6b7280;
    }
    body:not([data-show-internal-labels="true"]) .internal-label {
      display: none;
    }
    .dual-label {
      display: inline-flex;
      align-items: baseline;
      gap: 6px;
      min-width: 0;
    }
    .display-label {
      min-width: 0;
    }
    .internal-label {
      font-size: 0.7rem;
      color: var(--muted);
      line-height: 1.2;
    }
    .controls input,
    .controls button,
    .controls .link-btn {
      height: 40px;
      border-radius: 10px;
      border: 1px solid var(--control-border);
      background: var(--control-bg);
      color: var(--control-text);
      padding: 0 14px;
      font-size: 0.9375rem;
      font-family: inherit;
      text-decoration: none;
    }
    .controls button {
      background: var(--info);
      border-color: var(--info);
      color: #fff;
      cursor: pointer;
      font-weight: 600;
      font-family: inherit;
      font-size: 0.9375rem;
    }
    .controls .link-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--info);
      font-weight: 600;
    }
    .theme-toggle {
      order: 2;
      width: 42px;
      height: 42px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border-radius: 999px;
      border: 1px solid var(--theme-toggle-border);
      background: var(--theme-toggle-bg);
      color: var(--theme-toggle-icon);
      cursor: pointer;
      padding: 0;
      box-shadow: var(--shadow);
      transition: border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
    }
    .theme-toggle:hover {
      transform: translateY(-1px);
    }
    .theme-toggle:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px var(--theme-toggle-ring);
    }
    .theme-toggle svg {
      width: 18px;
      height: 18px;
      display: block;
    }
    .theme-toggle-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .theme-toggle .theme-icon-sun {
      display: none;
    }
    html[data-theme="dark"] .theme-toggle .theme-icon-sun {
      display: inline-flex;
    }
    html[data-theme="dark"] .theme-toggle .theme-icon-moon {
      display: none;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
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
    .main-column > * {
      position: relative;
      z-index: 1;
    }
    .briefing {
      order: 1;
      padding: 22px;
    }
    .energy-flow-card {
      padding: 22px;
      background: var(--energy-card-bg);
      border-color: var(--energy-card-border);
    }
    .energy-flow-card h2 {
      margin: 8px 0 16px;
      font-size: 1.35rem;
      letter-spacing: -0.02em;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: var(--energy-card-title);
    }
    .energy-flow-content {
      display: grid;
      gap: 12px;
    }
    .energy-sentence {
      padding: 12px 14px;
      border-radius: 12px;
      background: var(--energy-sentence-bg);
      border: 1px solid var(--energy-sentence-border);
    }
    .energy-sentence .energy-label {
      display: block;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--energy-label-text);
      font-weight: 700;
      margin-bottom: 4px;
    }
    .energy-sentence p {
      margin: 0;
      font-size: 1rem;
      color: var(--energy-paragraph-text);
      line-height: 1.6;
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
      background: var(--energy-tag-bg);
      color: var(--energy-tag-text);
      border: 1px solid var(--energy-tag-border);
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
      font-size: 1.625rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }
    .briefing p {
      margin: 0;
      color: var(--text-soft);
      font-size: 1.0625rem;
      line-height: 1.7;
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
      background: var(--tooltip-bg);
      color: var(--tooltip-text);
      border: 1px solid var(--tooltip-border);
      box-shadow: var(--tooltip-shadow);
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
      background: var(--topic-chip-bg);
      color: var(--text);
      border-radius: 999px;
      padding: 8px 13px;
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .topic-chip:hover {
      border-color: var(--topic-chip-hover-border);
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
      background: var(--insight-card-bg);
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
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
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
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .score-track {
      height: 12px;
      border-radius: 999px;
      background: var(--score-track-bg);
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
      font-size: 1rem;
      line-height: 1.65;
      color: var(--text-soft);
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
      background: var(--card);
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
      color: var(--text-soft);
    }
    .topic-disclaimer {
      margin-top: 10px;
      font-size: 0.8rem;
      color: var(--muted);
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
      color: var(--text);
      font-family: 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
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
      border-bottom: 1px dashed var(--border);
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
      color: var(--text-soft);
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
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
    }
    .expert th,
    .expert td {
      border-bottom: 1px solid var(--table-row-border);
      padding: 8px 9px;
      text-align: left;
    }
    .expert th {
      background: var(--table-head-bg);
      color: var(--text-soft);
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
      .header-actions { width: 100%; }
      .theme-toggle {
        order: -1;
        margin-left: auto;
      }
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
      padding: 18px;
      border-color: var(--border-strong);
    }
    .palace-grid-overview {
      order: -1;
      margin-bottom: 0;
    }
    .palace-grid-board-section {
      order: 0;
      margin-top: 0;
    }
    .palace-grid-title {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
    }
    .palace-grid-toolbar {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .board-time-strip {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      margin-bottom: 12px;
    }
    .time-strip-item {
      display: grid;
      grid-template-rows: auto auto auto;
      border: 1px solid var(--time-strip-border);
      border-radius: 12px;
      padding: 10px 12px;
      background: var(--time-strip-bg);
    }
    .time-strip-label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
    }
    .time-strip-label {
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
      font-weight: 700;
    }
    .time-strip-pillar {
      display: grid;
      grid-auto-flow: column;
      justify-content: start;
      gap: 6px;
      font-size: 1rem;
      font-weight: 700;
      color: var(--text);
      align-items: baseline;
    }
    .time-strip-meta {
      margin-top: 4px;
      font-size: 0.72rem;
      color: var(--muted);
    }
    .palace-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1px;
      background: var(--palace-board-border);
      border: 1px solid var(--palace-board-border);
      border-radius: 16px;
      overflow: hidden;
    }
    .palace-cell {
      position: relative;
      background: var(--palace-bright);
      border: 0;
      border-radius: 0;
      padding: 10px 12px 12px;
      min-height: 156px;
      display: flex;
      flex-direction: column;
    }
    .palace-cell.palace-has-marker {
      box-shadow: inset 0 0 0 1px rgba(107, 114, 128, 0.18);
    }
    .palace-cell.hour-marker {
      box-shadow: inset 0 0 0 2px rgba(31, 41, 55, 0.14);
    }
    .palace-cell.palace-tone-bright {
      background: var(--palace-bright);
    }
    .palace-cell.palace-tone-neutral {
      background: var(--palace-neutral);
    }
    .palace-cell.palace-tone-softDark {
      background: var(--palace-soft-dark);
    }
    .palace-cell.palace-tone-dark {
      background: var(--palace-dark);
    }
    .hour-legend {
      margin: 10px 0 14px;
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--card);
    }
    .hour-legend-note {
      margin: 0;
      font-size: 0.78rem;
      color: var(--muted);
      line-height: 1.5;
    }
    .palace-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .temporal-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: -2px 0 6px;
    }
    .temporal-badge {
      display: inline-flex;
    }
    .temporal-badge .dual-label {
      display: inline-flex;
    }
    .temporal-badge .display-label {
      min-width: 34px;
      min-height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.68rem;
      line-height: 1;
      padding: 0 10px;
      border-radius: 999px;
      background: var(--palace-chip-bg);
      color: var(--palace-chip-text);
      border: 1px solid var(--palace-chip-border);
      font-weight: 700;
    }
    .temporal-badge .internal-label {
      display: none;
    }
    .palace-dir {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text);
    }
    .palace-num {
      font-size: 0.65rem;
      color: var(--muted);
      background: var(--palace-chip-bg);
      border: 1px solid var(--palace-num-border);
      padding: 2px 6px;
      border-radius: 999px;
    }
    .palace-body {
      position: relative;
      flex: 1;
      min-height: 96px;
    }
    .palace-corner {
      position: absolute;
      max-width: 48%;
      line-height: 1.15;
      font-size: 0.78rem;
    }
    .palace-corner-top-left {
      top: 0;
      left: 0;
      color: var(--palace-text);
      font-weight: 600;
    }
    .palace-corner-top-right {
      top: 0;
      right: 0;
      color: var(--palace-hot-text);
      font-weight: 700;
      text-align: right;
    }
    .palace-corner-bottom-left {
      left: 0;
      bottom: 0;
      color: var(--palace-earth-text);
      font-weight: 700;
    }
    .palace-corner-bottom-right {
      right: 0;
      bottom: 0;
      color: var(--palace-text);
      font-weight: 700;
      text-align: right;
    }
    .palace-center-door {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      max-width: 72%;
      text-align: center;
      color: var(--text);
      font-weight: 800;
    }
    .palace-center-door .display-label {
      font-size: 1.18rem;
      font-weight: 800;
      line-height: 1;
    }
    .palace-center-door .internal-label {
      display: none;
    }
    .palace-secondary {
      display: block;
      margin-top: 4px;
      font-size: 0.68rem;
      color: var(--muted);
    }
    .palace-empty {
      color: var(--muted);
    }
    .palace-flag-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 8px;
    }
    .flag-badge {
      display: inline-flex;
    }
    .flag-badge .display-label {
      font-size: 0.68rem;
      line-height: 1;
      padding: 3px 8px;
      border-radius: 999px;
      background: var(--badge-bg);
      color: var(--badge-text);
      border: 1px solid var(--badge-border);
      font-weight: 700;
    }
    .flag-badge .internal-label {
      display: none;
    }
    .palace-verdict {
      font-size: 0.7rem;
      margin-top: 4px;
    }
    .palace-cell-center {
      background: var(--surface-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .palace-cell-center .palace-dir {
      font-size: 0.9rem;
      color: var(--palace-text);
    }
    .center-time {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--palace-center-time);
      text-align: center;
      line-height: 1.1;
      margin-bottom: 2px;
    }
    .palace-corner-top-right .display-label {
      color: var(--palace-hot-text);
      font-weight: 700;
    }
    .palace-corner-bottom-left .display-label {
      color: var(--palace-earth-text);
      font-weight: 700;
    }
    .palace-corner-bottom-right .display-label,
    .palace-corner-top-left .display-label {
      color: var(--palace-text);
    }
    @media (max-width: 600px) {
      .board-time-strip {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .palace-grid { gap: 1px; }
      .palace-cell { padding: 8px 9px 10px; min-height: 128px; }
      .palace-body { min-height: 78px; }
      .palace-center-door { max-width: 84%; }
      .palace-center-door .display-label { font-size: 1rem; }
      .palace-corner { font-size: 0.72rem; max-width: 50%; }
    }
    /* ── Kimon Chat ────────────────────────────────────────── */
    .kimon-terminal-container {
      order: -2;
      background: var(--kimon-container-bg);
      border: 1px solid var(--kimon-container-border);
      border-radius: 24px;
      padding: 20px 24px;
      box-shadow: var(--kimon-container-shadow);
      margin: 0 0 18px;
    }
    .kimon-card {
      padding: 20px;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-color: var(--border-strong);
      color: var(--text);
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
    .kimon-name { font-weight: 600; font-size: 1.0625rem; color: var(--surface-highlight-text); }
    .kimon-tagline { font-size: 0.875rem; color: var(--muted); }
    .kimon-messages {
      min-height: 80px; max-height: 340px; overflow-y: auto;
      display: flex; flex-direction: column; gap: 12px;
      margin-bottom: 12px;
    }
    .kimon-message { padding: 12px 14px; border-radius: 12px; font-size: 0.9375rem; line-height: 1.65; }
    .kimon-message-ai {
      background: transparent; border: none; color: var(--kimon-ai-text);
    }
    .kimon-message-user {
      background: var(--kimon-user-bubble-bg); border: 1px solid var(--kimon-user-bubble-border); color: var(--kimon-user-bubble-text);
      align-self: flex-end; border-bottom-right-radius: 4px;
    }
    .kimon-section { margin-top: 8px; }
    .kimon-section:first-child { margin-top: 0; }
    .kimon-section-label {
      display: block; font-size: 0.8rem; font-weight: 600;
      color: var(--muted); margin-bottom: 6px;
    }
    .kimon-section-title {
      display: block;
      margin: 0 0 8px;
      font-size: 0.76rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .kimon-time-note {
      color: var(--muted);
      font-style: italic;
    }
    .kimon-message-text { margin: 0; white-space: pre-wrap; transition: opacity 0.3s ease; }
    
    /* ══════════════════════════════════════════════════════════════════
       KYMON CLEAN UI — Flowing Story Style, No Bullets
       ══════════════════════════════════════════════════════════════════ */

    /* Response container */
    .kimon-response,
    .kimon-response-container {
      font-size: 1rem;
      line-height: 1.8;
      color: var(--text-soft);
    }

    .kimon-quick-take {
      margin: 0 0 14px 0;
      padding: 12px 14px;
      border-radius: 14px;
      background: var(--surface-highlight);
      border: 1px solid var(--surface-highlight-border);
      color: var(--surface-highlight-text);
      line-height: 1.6;
    }

    .kimon-time-hint {
      margin: 0 0 16px 0;
      color: var(--muted);
      font-size: 0.95rem;
      line-height: 1.6;
    }

    .kimon-message-flow {
      color: var(--text-soft);
      line-height: 1.8;
    }

    .kimon-closing-line {
      margin-top: 18px;
      color: var(--muted);
      font-weight: 600;
      line-height: 1.7;
    }

    .kymon-clean-layout {
      color: var(--text-soft);
    }

    .kymon-summary-box {
      margin: 0 0 16px;
      padding: 12px 14px;
      border-radius: 14px;
      background: var(--surface-highlight);
      border: 1px solid var(--surface-highlight-border);
      color: var(--surface-highlight-text);
      line-height: 1.7;
    }

    .kymon-lead {
      margin: 0 0 14px;
      color: var(--surface-highlight-text);
      font-size: 1.02rem;
      line-height: 1.75;
      font-weight: 600;
    }

    .kymon-time-hint {
      margin: 0 0 16px;
      color: var(--muted);
      font-size: 0.96rem;
      line-height: 1.7;
    }

    .kymon-analysis-flow {
      line-height: 1.8;
      letter-spacing: 0.02em;
      font-size: 1.05rem;
      color: var(--text-soft);
      text-align: justify;
      white-space: normal;
    }

    .kymon-analysis-flow br {
      display: block;
      content: "";
      margin-top: 15px;
    }

    .kymon-action-footer {
      margin-top: 18px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
      color: var(--muted);
      font-weight: 600;
      line-height: 1.75;
    }

    .kymon-footer-action {
      margin-top: 18px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
    }

    .kymon-footer-action p {
      margin: 8px 0 0;
      color: var(--muted);
      font-weight: 600;
      line-height: 1.7;
    }

    .action-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 999px;
      background: var(--surface-highlight);
      color: var(--surface-highlight-text);
      border: 1px solid var(--surface-highlight-border);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    @media (max-width: 720px) {
      .kymon-analysis-flow {
        text-align: left;
        font-size: 1rem;
        line-height: 1.78;
        letter-spacing: 0.01em;
      }
    }

    /* Paragraphs - clean spacing for story flow */
    .kimon-paragraph {
      margin: 0 0 24px 0;
      padding: 0;
    }
    .kimon-paragraph:last-child {
      margin-bottom: 0;
    }

    /* Closing quote — italic, centered */
    .kimon-quote {
      text-align: center;
      padding: 28px 0 8px 0;
      margin-top: 20px;
      font-style: italic;
      color: var(--muted);
      font-size: 0.95rem;
      line-height: 1.6;
    }

    /* Fade-in animation */
    @keyframes kimon-fade-in {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .kimon-response {
      animation: kimon-fade-in 0.4s ease-out forwards;
    }

    /* Greeting message */
    .kimon-greeting {
      animation: kimon-fade-in 0.3s ease-out forwards;
    }
    .kimon-greeting p {
      margin: 0;
    }
    
    .kimon-input-row {
      display: flex; gap: 8px;
    }
    .kimon-input-row input {
      flex: 1; background: var(--input-bg); border: 1px solid var(--input-border);
      color: var(--input-text); border-radius: 10px; padding: 10px 14px;
      font-size: 0.9375rem;
      font-family: inherit;
    }
    .kimon-input-row input::placeholder { color: var(--input-placeholder); }
    .kimon-input-row input:focus { outline: none; border-color: var(--input-focus-border); }
    .kimon-btn {
      background: #6366f1; border: none; color: #fff;
      padding: 10px 18px; border-radius: 10px; cursor: pointer;
      font-size: 0.9375rem; font-weight: 600; transition: background 0.2s;
      font-family: inherit;
    }
    .kimon-btn:hover { background: #4f46e5; }
    .kimon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .kimon-suggestions {
      display: none; flex-wrap: wrap; gap: 6px; margin-bottom: 10px;
    }
    .kimon-suggestion-chip {
      background: var(--surface-soft); border: 1px solid var(--border-strong); color: var(--muted);
      border-radius: 999px; padding: 4px 12px; font-size: 0.78rem;
      cursor: pointer; transition: all 0.15s;
    }
    .kimon-suggestion-chip:hover { border-color: var(--info); color: var(--text); }
    .kimon-error {
      display: none; color: var(--error-text); font-size: 0.82rem;
      padding: 6px 10px; border-radius: 8px;
      background: var(--error-bg); margin-bottom: 8px;
    }
    .kimon-error-inline { color: var(--error-text); margin: 0; font-size: 0.88rem; }
    /* === KYMON CHAT (Gemini-like minimal) === */
    .kimon-terminal {
      background: transparent;
      border: none;
      border-radius: 0;
      padding: 0;
      color: var(--text);
      box-shadow: none;
      overflow: visible;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .kimon-terminal-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 4px 16px;
    }
    .kimon-terminal-header img {
      border-radius: 50% !important;
    }
    .kimon-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      animation: kimon-pulse 2s infinite;
    }
    @keyframes kimon-pulse {
      0%,100% { opacity:1; }
      50% { opacity:0.5; }
    }
    .kimon-terminal-title {
      margin: 0;
      font-size: 1.0625rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: var(--text);
    }
    .kimon-meta-tags {
      margin-left: auto;
      font-size: 0.72rem;
      color: var(--kimon-meta-text);
      font-weight: 400;
    }
    .kimon-messages {
      padding: 8px 0;
      min-height: 200px;
      max-height: 65vh;
      overflow-y: auto;
      overflow-x: hidden;
      background: transparent;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch; /* Smooth scroll on iOS */
    }
    /* Scrollbar */
    .kimon-messages::-webkit-scrollbar { width: 4px; }
    .kimon-messages::-webkit-scrollbar-track { background: transparent; }
    .kimon-messages::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 4px; }
    .kimon-messages::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover); }

    /* ── Thinking Animation ── */
    .kimon-thinking {
      display: none;
      align-items: center;
      gap: 10px;
      padding: 12px 0;
      color: var(--muted);
      font-size: 0.85rem;
      animation: kimon-fadein 0.3s ease-out;
      order: 9999; /* Always at the bottom */
    }
    .kimon-thinking.is-visible { display: flex; }

    /* Tip text */
    .kimon-tip {
      font-size: 0.8rem;
      color: var(--muted);
      text-align: center;
      padding: 16px 12px;
      line-height: 1.5;
      border-top: 1px solid var(--kimon-tip-border);
      margin-top: 8px;
    }
    .kimon-tip-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-right: 6px;
      font-size: 0.95rem;
    }
    .kimon-tip strong { color: var(--muted); }
    .kimon-thinking-dots {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .kimon-thinking-dots span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--muted);
      animation: kimon-bounce 1.4s infinite ease-in-out both;
    }
    .kimon-thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
    .kimon-thinking-dots span:nth-child(2) { animation-delay: -0.16s; }
    .kimon-thinking-text {
      color: var(--muted);
      margin: 0;
      font-size: 0.85rem;
    }

    @keyframes kimon-bounce {
      0%,80%,100% { transform: scale(0.6); opacity: 0.3; }
      40% { transform: scale(1); opacity: 1; }
    }
    @keyframes kimon-fadein {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Messages */
    .kimon-message {
      margin-bottom: 10px;
      padding: 12px 16px;
      border-radius: 18px;
      animation: kimon-fadein 0.3s ease-out;
      max-width: 85%;
    }
    .kimon-message-ai {
      background: transparent;
      margin-right: auto;
      border: none;
    }
    .kimon-message-user {
      background: var(--kimon-user-bubble-bg);
      margin-left: auto;
      margin-right: 0;
      border: 1px solid var(--kimon-user-bubble-border);
      border-bottom-right-radius: 6px;
    }
    .kimon-message-user .kimon-message-text { color: var(--kimon-user-bubble-text); }
    .kimon-section { margin-bottom: 10px; }
    .kimon-section:last-child { margin-bottom: 0; }
    .kimon-section-label {
      display: block; font-size: 0.8rem; font-weight: 600;
      color: var(--muted); margin-bottom: 6px;
    }
    .kimon-message-text {
      font-size: 0.9375rem; line-height: 1.75; color: var(--text-soft); margin: 0;
    }
    /* Suggestions */
    .kimon-suggestions-dynamic {
      padding: 6px 0;
      display: flex; flex-wrap: wrap; gap: 6px;
      background: transparent;
      border: none;
    }
    .kimon-suggestion-chip {
      background: var(--surface-softer);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 6px 14px;
      border-radius: 20px; /* Fully rounded */
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .kimon-suggestion-chip:hover {
      background: var(--surface-soft);
      border-color: var(--border-strong);
      color: var(--text);
      transform: translateY(-1px);
    }

    /* Input */
    .kimon-input-area {
      display: flex;
      gap: 8px;
      padding: 12px 0 0;
      border: none;
      background: transparent;
    }
    .kimon-input {
      flex: 1;
      background: var(--input-bg);
      border: 1px solid var(--input-border);
      color: var(--input-text);
      border-radius: 24px;
      padding: 12px 20px;
      font-size: 0.9375rem;
      font-family: inherit;
      box-sizing: border-box;
      transition: all 0.2s ease;
    }
    .kimon-input:focus {
      outline: none;
      background: var(--input-focus-bg);
      border-color: var(--input-focus-border);
      box-shadow: 0 0 0 3px rgba(148,163,184,0.1);
    }
    .kimon-input::placeholder { color: var(--input-placeholder); }
    .kimon-send-btn {
      background: var(--kimon-user-bubble-bg);
      border: none;
      color: var(--kimon-user-bubble-text);
      width: 44px; height: 44px;
      border-radius: 50%;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }
    .kimon-send-btn:hover:not(:disabled) {
      filter: brightness(1.08);
      transform: scale(1.05);
    }
    .kimon-send-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    /* Error */
    .kimon-error {
      display: none; margin: 8px 0;
      padding: 8px 14px;
      background: var(--error-bg);
      border: 1px solid var(--error-border);
      border-radius: 12px;
      color: var(--error-text);
      font-size: 0.82rem;
    }
    .kimon-error-inline {
      color: var(--error-text); font-size: 0.82rem; margin: 0;
      background: var(--error-bg); padding: 10px 14px;
      border-radius: 12px; border: 1px solid var(--error-border);
    }

    /* Old unused styles kept for compatibility */
    .kimon-topic-chips { display: none; }
  </style>
</head>
<body data-display-mode="${DISPLAY_MODE_WEB1}" data-show-internal-labels="false">
  <div class="shell">
    <header class="card app-header">
      <div>
        <h1 class="app-title"><img src="/favicon.png" alt="" style="height:32px; vertical-align:middle; margin-right:8px;">Kymon</h1>
        <p class="app-subtitle">Vô xem cho biết, chốt cho nhanh</p>
      </div>
      <div class="header-actions">
        <button type="button" class="theme-toggle" id="themeToggle" aria-label="Đổi giao diện" title="Đổi giao diện">
          <span class="theme-toggle-icon theme-icon-moon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"></path>
            </svg>
          </span>
          <span class="theme-toggle-icon theme-icon-sun" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4"></circle>
              <path d="M12 2v2.2M12 19.8V22M4.93 4.93l1.56 1.56M17.51 17.51l1.56 1.56M2 12h2.2M19.8 12H22M4.93 19.07l1.56-1.56M17.51 6.49l1.56-1.56"></path>
            </svg>
          </span>
          <span class="sr-only">Đổi giao diện</span>
        </button>
        <form method="GET" action="/" class="controls" id="timeForm">
          <label>${getSectionLabel('Ngày')}
            <input id="dateInput" type="date" name="date" value="${selectedDate}">
          </label>
          <label>${getSectionLabel('Giờ')}
            <input id="hourInput" type="number" name="hour" min="0" max="23" value="${hour}" style="width:80px;">
          </label>
          <label>Phút
            <input id="minuteInput" type="number" name="minute" min="0" max="59" value="${selectedMinute}" style="width:80px;">
          </label>
          <button type="submit">Lập Bàn</button>
          <a href="/" class="link-btn" id="useNowLink">Hiện Tại</a>
        </form>
      </div>
    </header>

    <div class="workspace">
      <main class="main-column">
        <!-- INITIAL LOADER -->
        <div id="initialLoader">
          <div class="kymon-loader-logo-wrapper">
            <img src="/favicon.png" alt="Loading Kymon">
          </div>
          <h1>Kỳ Môn Độn Giáp</h1>
          <p id="initialLoaderSlogan">${escapeHTML(initialLoaderPhrase)}</p>
        </div>

        <section class="card palace-grid-section palace-grid-overview">
          <div class="palace-grid-toolbar">
            <div class="palace-grid-title">Trụ Cột Thời Gian</div>
          </div>
          ${timeStripMarkup}
          ${hourLegendMarkup}
        </section>

        <div class="kimon-terminal-container">
          <section class="kimon-terminal" id="kimonTerminal">
            <div class="kimon-terminal-header">
            <img src="/favicon.png" alt="Kimon" style="width:24px;height:24px;border-radius:4px;object-fit:contain;">
            <div class="kimon-status-dot"></div>
            <h2 class="kimon-terminal-title">Kymon nè</h2>
            <div class="kimon-meta-tags">
              <span>${escapeHTML(chart.solarTerm?.name || '')} · ${escapeHTML(structureModeLabel)}</span>
            </div>
          </div>
          <div id="kimonError" class="kimon-error"></div>
          <div class="kimon-messages" id="kimonMessages">
            <div class="kimon-message kimon-message-ai kimon-greeting">
              <p class="kimon-paragraph">Chào bạn! Tôi là Kymon. Hãy hỏi tôi bất cứ điều gì về năng lượng hiện tại, công việc, tình cảm, hay quyết định bạn đang cân nhắc.</p>
            </div>
            <div class="kimon-tip">
              <span class="kimon-tip-icon" aria-hidden="true">💡</span><strong>Mẹo:</strong> Hãy nghĩ tới đúng vấn đề bạn đang vướng, rồi hỏi thật rõ. Càng cụ thể, Kymon càng luận sát. Ví dụ: "Tôi có nên ký hợp đồng này hôm nay không?" sẽ tốt hơn "Hôm nay thế nào?"
            </div>
            <div class="kimon-thinking" id="kimonThinking">
              <div class="kimon-thinking-dots"><span></span><span></span><span></span></div>
              <span class="kimon-thinking-text" id="kimonThinkingText">Đang suy nghĩ...</span>
            </div>
          </div>
          <!-- Claude-like: no suggestions, just clean chat -->
          <form id="kimonChatForm" class="kimon-input-area" novalidate autocomplete="off">
            <input type="text" id="kimonContext" name="kimon_context_input" class="kimon-input" placeholder="Hỏi Kymon bất cứ điều gì..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-autocomplete="none" data-lpignore="true" enterkeyhint="send">
            <button id="kimonBtn" class="kimon-send-btn" title="Gửi" type="submit">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>
        </section>
        </div>

        <section class="card palace-grid-section palace-grid-board-section">
          <div class="palace-grid-toolbar">
            <div class="palace-grid-title">${escapeHTML(getSectionLabel('Thiên Bàn'))}</div>
          </div>
          <div class="palace-grid">
            ${palaceGridCards}
          </div>
        </section>

        <section class="card briefing" id="briefingCard" hidden>
          <p class="eyebrow">Tóm Tắt Chiến Lược</p>
          <h2 id="briefingTitle">${briefingHeading}</h2>
          <p id="briefingContent" class="briefing-narrative">${briefingParagraph}</p>
          <span id="totalScoreValue" data-kimon-score="${evaluation.overallScore}" hidden>${evaluation.overallScore}</span>
          <span id="kimonAutoData"
            data-display-palaces="${escapeHTML(JSON.stringify(displayChart.palaces || {}))}"
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
            data-day-marker-palace="${dayPalaceNum || ''}"
            data-day-marker-direction="${escapeHTML(dayDirText || '')}"
            data-day-marker-source="${escapeHTML(dayMarkerSource || '')}"
            data-day-door="${escapeHTML(dayDoorText || '')}"
            data-hour-marker-palace="${hourPalaceNum || ''}"
            data-hour-marker-direction="${escapeHTML(hourDirText || '')}"
            data-hour-marker-source="${escapeHTML(hourMarkerSource || '')}"
            data-hour-carrier-star="${escapeHTML(hourCarrierStar || '')}"
            data-markers-same-palace="${markersSamePalace}"
            data-hour-door="${escapeHTML(hourDoorText || '')}"
            data-hour-star="${escapeHTML(hourStarText || '')}"
            data-hour-deity="${escapeHTML(hourDeityText || '')}"
            data-hour-tone="${escapeHTML(hourEnergyTone || '')}"
            data-hour-verdict="${escapeHTML(hourEnergyVerdict || '')}"
            data-hour-score="${hourEnergyScore}"
            data-route-palace="${routePalaceNum || ''}"
            data-route-direction="${escapeHTML(routeDirText || '')}"
            data-route-door="${escapeHTML(routeDoorText || '')}"
            data-route-star="${escapeHTML(routeStarText || '')}"
            data-route-deity="${escapeHTML(routeDeityText || '')}"
            data-route-tone="${escapeHTML(routeEnergyTone || '')}"
            data-route-verdict="${escapeHTML(routeEnergyVerdict || '')}"
            data-route-score="${routeEnergyScore}"
            data-quick-read-summary="${escapeHTML(quickReadSummary || '')}"
            data-formations="${escapeHTML(evaluation.topFormations?.map(f => f.name).join(', ') || '')}"
            hidden></span>
          <div class="signal-row">${signalBadges}</div>
        </section>

        <!-- Thẻ Cố Vấn (insight-shell) has been removed -->

        <details class="card expert">
          <summary>${getSectionLabel('Developer / Expert Mode (Raw Tables)')}</summary>
          <div class="expert-content">
            <!-- Visual grid removed per user request for a cleaner, AI-focused UI -->
            <table id="topicAnalysisTable">
              <thead>
                <tr>
                  <th>${getSectionLabel('Cung')}</th>
                  <th>${getSectionLabel('Phi Tinh')}</th>
                  <th>${getSectionLabel('Hướng')}</th>
                  <th>${getSectionLabel('Tinh')}</th>
                  <th>${getSectionLabel('Thiên Can')}</th>
                  <th>${getSectionLabel('Địa Can')}</th>
                  <th>${getSectionLabel('Môn')}</th>
                  <th>${getSectionLabel('Thần')}</th>
                  <th>${getSectionLabel('Flags')}</th>
                  <th>Score</th>
                  <th>Tone</th>
                  <th>BG Base</th>
                  <th>BG Tags</th>
                  <th>BG Tone</th>
                  <th>BG Reasons</th>
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
    const THEME_STORAGE_KEY = 'kymon_theme';
    const CHART_TIME_MODE = ${JSON.stringify(chartTimeMode)};
    const INITIAL_CHART_TIME = ${JSON.stringify({ date: selectedDate, hour, minute })};
    const timeFormEl = document.getElementById('timeForm');
    const dateInputEl = document.getElementById('dateInput');
    const hourInputEl = document.getElementById('hourInput');
    const themeToggleEl = document.getElementById('themeToggle');
    
    const LOADER_PHRASES = ${JSON.stringify(loaderPhrases)};

    // Handle initial loader fade out
    (function hideLoader() {
      const loader = document.getElementById('initialLoader');
      const sloganEl = document.getElementById('initialLoaderSlogan');
      if (!loader) return;
      let sloganTimer = null;

      if (sloganEl && Array.isArray(LOADER_PHRASES) && LOADER_PHRASES.length > 1) {
        let phraseIndex = LOADER_PHRASES.indexOf(sloganEl.textContent);
        if (phraseIndex < 0) phraseIndex = 0;
        sloganTimer = setInterval(() => {
          phraseIndex = (phraseIndex + 1) % LOADER_PHRASES.length;
          sloganEl.textContent = LOADER_PHRASES[phraseIndex];
        }, 650);
      }

      // Fade out after short delay (don't wait for all resources)
      setTimeout(() => {
        loader.classList.add('fade-out');
        if (sloganTimer) clearInterval(sloganTimer);
        setTimeout(() => loader.style.display = 'none', 400);
      }, 1800);
    })();
    const minuteInputEl = document.getElementById('minuteInput');
    const useNowLinkEl = document.getElementById('useNowLink');
    const signalButtons = Array.from(document.querySelectorAll('.signal-with-tooltip'));
    const internalLabelToggles = Array.from(document.querySelectorAll('#showInternalLabelsToggle, #showInternalLabelsGridToggle'));

    function getActiveTheme() {
      return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    }

    function syncThemeToggle(theme) {
      if (!themeToggleEl) return;
      const nextTheme = theme === 'dark' ? 'light' : 'dark';
      const label = nextTheme === 'dark' ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng';
      themeToggleEl.setAttribute('aria-label', label);
      themeToggleEl.setAttribute('title', label);
      themeToggleEl.setAttribute('aria-pressed', String(theme === 'dark'));
    }

    function applyTheme(theme, { persist = false } = {}) {
      const resolvedTheme = theme === 'dark' ? 'dark' : 'light';
      document.documentElement.dataset.theme = resolvedTheme;
      document.documentElement.style.colorScheme = resolvedTheme;
      syncThemeToggle(resolvedTheme);
      if (!persist) return;
      try {
        localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
      } catch {}
    }

    function escapeHTML(raw) {
      const source = String(raw ?? '');
      let escaped = '';
      for (const ch of source) {
        if (ch === '&') escaped += '&amp;';
        else if (ch === '<') escaped += '&lt;';
        else if (ch === '>') escaped += '&gt;';
        else if (ch === '"') escaped += '&quot;';
        else if (ch === '\\'') escaped += '&#39;';
        else escaped += ch;
      }
      return escaped;
    }

    function replaceDelimitedPairs(source, marker, openTag, closeTag) {
      if (!source || !marker) return source || '';
      let result = '';
      let cursor = 0;
      while (cursor < source.length) {
        const start = source.indexOf(marker, cursor);
        if (start === -1) {
          result += source.slice(cursor);
          break;
        }
        const end = source.indexOf(marker, start + marker.length);
        if (end === -1) {
          result += source.slice(cursor);
          break;
        }
        result += source.slice(cursor, start);
        result += openTag + source.slice(start + marker.length, end) + closeTag;
        cursor = end + marker.length;
      }
      return result;
    }

    function formatKimonRichText(raw) {
      let normalized = String(raw || '');
      normalized = normalized.split('\\\\r\\\\n').join('\\n');
      normalized = normalized.split('\\\\n').join('\\n');
      let formatted = escapeHTML(normalized);
      formatted = replaceDelimitedPairs(formatted, '**', '<strong>', '</strong>');
      formatted = replaceDelimitedPairs(formatted, '*', '<em>', '</em>');
      return formatted.split('\\n').join('<br>');
    }

    function pad2(value) {
      return String(value).padStart(2, '0');
    }

    function getClientNowResolvedTime() {
      const now = new Date();
      const ymd = now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate());
      return {
        mode: 'live',
        date: ymd,
        hour: now.getHours(),
        minute: now.getMinutes(),
      };
    }

    function isIsoDateLike(value) {
      if (!value || typeof value !== 'string') return false;
      if (value.length !== 10) return false;
      const parts = value.split('-');
      if (parts.length !== 3) return false;
      const [year, month, day] = parts;
      if (year.length !== 4 || month.length !== 2 || day.length !== 2) return false;
      return [year, month, day].every(part => [...part].every(ch => ch >= '0' && ch <= '9'));
    }

    function isLiveModeFromLocation() {
      const params = new URLSearchParams(window.location.search);
      const value = params.get('live');
      if (value === null) return false;
      const normalized = String(value).trim().toLowerCase();
      return normalized === '1' || normalized === 'true' || normalized === 'yes';
    }

    function getEffectiveChartTimeFromLocation() {
      const params = new URLSearchParams(window.location.search);
      const isLiveMode = isLiveModeFromLocation();
      const hasExplicitOverride = ['date', 'hour', 'minute'].some(key => {
        const raw = params.get(key);
        return raw !== null && String(raw).trim() !== '';
      });

      if (!hasExplicitOverride) {
        return {
          ...getClientNowResolvedTime(),
          mode: 'live',
        };
      }

      const now = getClientNowResolvedTime();
      const rawDate = params.get('date');
      const rawHour = params.get('hour');
      const rawMinute = params.get('minute');
      const parsedHour = Number.parseInt(rawHour ?? '', 10);
      const parsedMinute = Number.parseInt(rawMinute ?? '', 10);

      return {
        mode: isLiveMode ? 'live' : 'manual',
        date: isIsoDateLike(rawDate) ? rawDate : now.date,
        hour: Number.isInteger(parsedHour) ? Math.min(23, Math.max(0, parsedHour)) : now.hour,
        minute: Number.isInteger(parsedMinute) ? Math.min(59, Math.max(0, parsedMinute)) : now.minute,
      };
    }

    function isSameResolvedMinute(left, right) {
      if (!left || !right) return false;
      return String(left.date) === String(right.date)
        && Number(left.hour) === Number(right.hour)
        && Number(left.minute) === Number(right.minute);
    }

    function getMillisecondsUntilNextMinute(now = new Date()) {
      return ((59 - now.getSeconds()) * 1000) + (1000 - now.getMilliseconds()) + 10;
    }

    function buildLiveChartUrl(resolvedTime) {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set('live', '1');
      nextUrl.searchParams.set('date', resolvedTime.date);
      nextUrl.searchParams.set('hour', String(resolvedTime.hour));
      nextUrl.searchParams.set('minute', String(resolvedTime.minute));
      return nextUrl.toString();
    }

    function redirectToLiveChart(resolvedTime, { replace = true } = {}) {
      const targetUrl = buildLiveChartUrl(resolvedTime);
      if (targetUrl === window.location.href) return false;
      if (replace) {
        window.location.replace(targetUrl);
      } else {
        window.location.assign(targetUrl);
      }
      return true;
    }

    function syncInternalLabelToggles(nextValue) {
      internalLabelToggles.forEach(toggle => {
        if (toggle) toggle.checked = nextValue;
      });
      document.body.dataset.showInternalLabels = nextValue ? 'true' : 'false';
      try {
        localStorage.setItem('web1_showInternalLabels', nextValue ? 'true' : 'false');
      } catch {}
    }

    (function initInternalLabelToggles() {
      let showInternalLabels = false;
      try {
        showInternalLabels = localStorage.getItem('web1_showInternalLabels') === 'true';
      } catch {}
      syncInternalLabelToggles(showInternalLabels);
      internalLabelToggles.forEach(toggle => {
        toggle?.addEventListener('change', event => syncInternalLabelToggles(Boolean(event.target.checked)));
      });
    })();

    function applyResolvedTimeToForm(resolvedTime) {
      if (!dateInputEl || !hourInputEl || !minuteInputEl) return;
      if (!resolvedTime) return;
      dateInputEl.value = resolvedTime.date;
      hourInputEl.value = String(resolvedTime.hour);
      minuteInputEl.value = String(resolvedTime.minute);
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
        redirectToLiveChart(getClientNowResolvedTime(), { replace: false });
      });
    }

    function updateLiveClock(resolvedTime = getClientNowResolvedTime()) {
      const liveClock = document.getElementById('liveClockValue');
      if (!liveClock) return;
      liveClock.textContent = pad2(resolvedTime.hour) + ':' + pad2(resolvedTime.minute);
    }

    (function initChartTimeMode() {
      const effectiveTime = getEffectiveChartTimeFromLocation();
      applyResolvedTimeToForm(effectiveTime);

      if (CHART_TIME_MODE === 'live') {
        const clientTime = getClientNowResolvedTime();
        const needsLiveRedirect = !isLiveModeFromLocation() || !isSameResolvedMinute(INITIAL_CHART_TIME, clientTime);
        if (needsLiveRedirect && redirectToLiveChart(clientTime)) {
          return;
        }

        updateLiveClock(clientTime);

        const scheduleRefresh = () => {
          window.setTimeout(() => {
            const nextClientTime = getClientNowResolvedTime();
            if (redirectToLiveChart(nextClientTime)) {
              return;
            }
            updateLiveClock(nextClientTime);
            scheduleRefresh();
          }, getMillisecondsUntilNextMinute());
        };

        scheduleRefresh();
        return;
      }

      updateLiveClock(effectiveTime);
    })();

    (function initThemeToggle() {
      applyTheme(getActiveTheme());
      if (!themeToggleEl) return;
      themeToggleEl.addEventListener('click', () => {
        const nextTheme = getActiveTheme() === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme, { persist: true });
      });
    })();

    // ── Kimon AI ─────────────────────────────────────────────────────────────
    const kimonBtn = document.getElementById('kimonBtn');
    const kimonContext = document.getElementById('kimonContext');
    const kimonForm = document.getElementById('kimonChatForm');
    const kimonMessages = document.getElementById('kimonMessages');
    const kimonSuggestions = null; // Removed: Claude-like clean UI
    const kimonError = document.getElementById('kimonError');
    const kimonAutoData = document.getElementById('kimonAutoData');
    const kimonThinking = document.getElementById('kimonThinking');
    const kimonThinkingText = document.getElementById('kimonThinkingText');
    let currentTopic = null; // set by renderTopic
    let thinkingMessageTimeout = null;
    let kimonErrorTimeout = null;
    let isKimonFetching = false;
    let activeKimonAbortController = null;
    let activeKimonRequestId = 0;
    let activeKimonRequestSource = '';
    let activeKimonTypingSession = null;
    const KYMON_REQUEST_TIMEOUT_MS = 30000;
    const TYPEWRITER_CHUNK_SIZE = 3;
    const TYPEWRITER_TICK_MS = 18;
    const TYPEWRITER_SECTION_PAUSE_MS = 110;
    const TYPEWRITER_SCROLL_EVERY_TICKS = 4;

    function logKimonDebug(stage, details) {
      if (typeof console === 'undefined' || typeof console.debug !== 'function') return;
      if (details === undefined) {
        console.debug('[Kymon]', stage);
        return;
      }
      console.debug('[Kymon]', stage, details);
    }

    function setKimonInteractiveState({ pending = false, source = '' } = {}) {
      const lockManualSubmit = pending && source === 'manual';
      if (kimonBtn) kimonBtn.disabled = lockManualSubmit;
      if (kimonContext) {
        kimonContext.readOnly = lockManualSubmit;
        kimonContext.setAttribute('aria-busy', pending ? 'true' : 'false');
      }
    }

    function showThinking(source = 'manual') {
      if (!kimonThinking || !kimonMessages) return;
      if (thinkingMessageTimeout) {
        clearTimeout(thinkingMessageTimeout);
        thinkingMessageTimeout = null;
      }
      kimonMessages.appendChild(kimonThinking);
      kimonThinking.classList.add('is-visible');
      if (kimonThinkingText) {
        kimonThinkingText.textContent = source === 'auto'
          ? 'Kymon đang đọc bàn...'
          : 'Kymon đang luận...';
      }
      thinkingMessageTimeout = setTimeout(() => {
        if (!kimonThinking?.classList.contains('is-visible') || !kimonThinkingText) return;
        kimonThinkingText.textContent = source === 'auto'
          ? 'Đang nối các tín hiệu quan trọng...'
          : 'Đang đi sâu vào ý chính...';
      }, 6000);
      smartScroll();
    }

    function hideThinking() {
      if (thinkingMessageTimeout) {
        clearTimeout(thinkingMessageTimeout);
        thinkingMessageTimeout = null;
      }
      if (kimonThinkingText) {
        kimonThinkingText.textContent = 'Đang suy nghĩ...';
      }
      if (kimonThinking) kimonThinking.classList.remove('is-visible');
    }

    // Smart scroll: only auto-scroll if user is already near bottom.
    let userScrolledUp = false;

    function smartScroll() {
      if (!kimonMessages || userScrolledUp) return;
      const threshold = 150; // pixels from bottom
      const isNearBottom = kimonMessages.scrollHeight - kimonMessages.scrollTop - kimonMessages.clientHeight < threshold;
      if (isNearBottom) {
        kimonMessages.scrollTop = kimonMessages.scrollHeight;
      }
    }

    // Track if user manually scrolled up
    if (kimonMessages) {
      kimonMessages.addEventListener('scroll', () => {
        const threshold = 150;
        const isNearBottom = kimonMessages.scrollHeight - kimonMessages.scrollTop - kimonMessages.clientHeight < threshold;
        userScrolledUp = !isNearBottom;
      });
    }

    // Reset scroll tracking when new message starts
    function resetScrollTracking() {
      userScrolledUp = false;
    }

    function getBaseQmdjData() {
      if (!kimonAutoData) return {};
      let displayPalaces = {};
      try {
        displayPalaces = JSON.parse(kimonAutoData.dataset.displayPalaces || '{}');
      } catch {}
      const resolvePalaceSignals = palaceNum => {
        const palace = displayPalaces?.[palaceNum] || displayPalaces?.[String(palaceNum)] || null;
        return {
          door: palace?.mon?.displayShort || palace?.mon?.displayName || palace?.mon?.internalName || '',
          star: palace?.star?.displayShort || palace?.star?.displayName || palace?.star?.internalName || '',
          deity: palace?.than?.displayShort || palace?.than?.displayName || palace?.than?.internalName || '',
        };
      };

      const hourMarkerPalace = parseInt(kimonAutoData.dataset.hourMarkerPalace) || null;
      const directEnvoyPalace = parseInt(kimonAutoData.dataset.routePalace) || null;
      const hourSignals = resolvePalaceSignals(hourMarkerPalace);
      const routeSignals = resolvePalaceSignals(directEnvoyPalace);

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
        dayMarkerPalace: parseInt(kimonAutoData.dataset.dayMarkerPalace) || null,
        dayMarkerDirection: kimonAutoData.dataset.dayMarkerDirection || '',
        dayMarkerResolutionSource: kimonAutoData.dataset.dayMarkerSource || '',
        dayDoor: kimonAutoData.dataset.dayDoor || '',
        hourMarkerPalace,
        hourMarkerDirection: kimonAutoData.dataset.hourMarkerDirection || '',
        hourMarkerResolutionSource: kimonAutoData.dataset.hourMarkerSource || '',
        hourMarkerCarrierStar: kimonAutoData.dataset.hourCarrierStar || '',
        markersSamePalace: kimonAutoData.dataset.markersSamePalace === 'true',
        hourPalaceDirection: kimonAutoData.dataset.hourMarkerDirection || '',
        hourDoor: kimonAutoData.dataset.hourDoor || hourSignals.door || '',
        hourStar: kimonAutoData.dataset.hourStar || hourSignals.star || '',
        hourDeity: kimonAutoData.dataset.hourDeity || hourSignals.deity || '',
        hourEnergyTone: kimonAutoData.dataset.hourTone || '',
        hourEnergyVerdict: kimonAutoData.dataset.hourVerdict || '',
        hourEnergyScore: parseInt(kimonAutoData.dataset.hourScore) || 0,
        directEnvoyPalace,
        directEnvoyDirection: kimonAutoData.dataset.routeDirection || '',
        directEnvoyDoor: kimonAutoData.dataset.routeDoor || routeSignals.door || '',
        directEnvoyStar: kimonAutoData.dataset.routeStar || routeSignals.star || '',
        directEnvoyDeity: kimonAutoData.dataset.routeDeity || routeSignals.deity || '',
        directEnvoyActionTone: kimonAutoData.dataset.routeTone || '',
        directEnvoyActionVerdict: kimonAutoData.dataset.routeVerdict || '',
        directEnvoyActionScore: parseInt(kimonAutoData.dataset.routeScore) || 0,
        quickReadSummary: kimonAutoData.dataset.quickReadSummary || '',
        allTopics: kimonAutoData.dataset.allTopics || '[]'
      };
    }

    function createMessageBubble(isKimon = true) {
      const bubble = document.createElement('div');
      bubble.className = 'kimon-message ' + (isKimon ? 'kimon-message-ai' : 'kimon-message-user');
      return bubble;
    }

    // Suggestions disabled for Claude-like minimal UI
    function renderSuggestions(suggestions) {
      // No-op: removed suggestion chips for cleaner UI
    }

    function showKimonError(msg) {
      if (!kimonError) return;
      if (kimonErrorTimeout) {
        clearTimeout(kimonErrorTimeout);
        kimonErrorTimeout = null;
      }
      kimonError.textContent = msg;
      kimonError.style.display = 'block';
      kimonErrorTimeout = setTimeout(() => {
        kimonError.style.display = 'none';
        kimonErrorTimeout = null;
      }, 8000);
    }

    function extractFirstJsonBlockText(rawText) {
      const source = String(rawText || '').trim();
      const start = source.indexOf('{');
      if (start === -1) return source;

      let depth = 0;
      let inString = false;
      let escapeNext = false;

      for (let index = start; index < source.length; index++) {
        const ch = source[index];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (ch === '\\\\') {
          escapeNext = true;
          continue;
        }

        if (ch === '"') {
          inString = !inString;
          continue;
        }

        if (inString) continue;

        if (ch === '{') depth++;
        if (ch === '}') {
          depth--;
          if (depth === 0) {
            return source.slice(start, index + 1).trim();
          }
        }
      }

      return source.slice(start).trim();
    }

    function createEmergencyKimonPayload(rawText) {
      const source = String(rawText || '').trim();
      const structured = /"(?:summary|analysis|action|mode|lead|timeHint|message|closingLine)"\\s*:/.test(source);
      return {
        mode: 'interpretation',
        lead: 'Kymon bị gián đoạn.',
        timeHint: '',
        message: structured
          ? 'Phản hồi vừa rồi bị cắt giữa chừng, nên hệ thống không hiển thị nội dung thô lên màn hình.'
          : 'Phản hồi từ hệ thống không đủ rõ để dựng câu trả lời an toàn.',
        closingLine: 'Bạn hỏi lại một lần nữa nhé.',
      };
    }

    function parseKimonResponseText(rawText) {
      const source = String(rawText || '').trim();
      if (!source) return createEmergencyKimonPayload('');
      try {
        return JSON.parse(source);
      } catch (error) {
        console.warn('[Kymon] Frontend parse direct failed:', error?.message || 'unknown error');
      }

      const firstJsonBlock = extractFirstJsonBlockText(source);
      if (!firstJsonBlock) {
        console.warn('[Kymon] Frontend parse fallback: no balanced JSON block found');
        return createEmergencyKimonPayload(source);
      }

      try {
        return JSON.parse(firstJsonBlock);
      } catch (error) {
        console.warn('[Kymon] Frontend parse fallback failed:', error?.message || 'unknown error');
        return createEmergencyKimonPayload(source);
      }
    }

    function normalizeKimonUiPayload(rawData) {
      if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
        return createEmergencyKimonPayload('');
      }

      const lead = typeof rawData.lead === 'string'
        ? rawData.lead.trim()
        : (typeof rawData.summary === 'string' ? rawData.summary.trim() : '');
      const timeHint = typeof rawData.timeHint === 'string'
        ? rawData.timeHint.trim()
        : (typeof rawData.thoiDiemGoiY === 'string' ? rawData.thoiDiemGoiY.trim() : '');
      let message = typeof rawData.message === 'string'
        ? rawData.message.trim()
        : (typeof rawData.analysis === 'string' ? rawData.analysis.trim() : '');
      const closingLine = typeof rawData.closingLine === 'string'
        ? rawData.closingLine.trim()
        : (typeof rawData.action === 'string' ? rawData.action.trim() : (typeof rawData.kimonQuote === 'string' ? rawData.kimonQuote.trim() : ''));

      if (!message && typeof rawData.analysis === 'string') message = rawData.analysis.trim();

      const normalized = {
        mode: typeof rawData.mode === 'string' && rawData.mode.trim() ? rawData.mode.trim() : 'interpretation',
        lead,
        timeHint,
        message,
        closingLine,
      };

      if (!normalized.lead && !normalized.timeHint && !normalized.message && !normalized.closingLine) {
        return createEmergencyKimonPayload('');
      }

      if (!normalized.message) {
        normalized.message = 'Phần phân tích vừa rồi chưa đủ hoàn chỉnh để hiển thị an toàn.';
      }

      if (!normalized.lead) {
        normalized.lead = 'Kymon bị gián đoạn.';
      }

      if (!normalized.closingLine) {
        normalized.closingLine = 'Bạn hỏi lại một lần nữa nhé.';
      }

      return normalized;
    }

    async function sendKymonRequest({ qmdjData, userContext, signal }) {
      logKimonDebug('request dispatch', {
        endpoint: '/api/kimon',
        userContextPreview: String(userContext || '').slice(0, 80),
      });

      try {
        const res = await fetch('/api/kimon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qmdjData, userContext }),
          signal,
        });
        const responseText = await res.text();
        logKimonDebug('response received', {
          status: res.status,
          responseLength: responseText.length,
        });
        const parsed = parseKimonResponseText(responseText);

        if (!res.ok) {
          throw new Error((parsed && parsed.error) || ('Kymon phản hồi lỗi (' + res.status + ')'));
        }

        if (parsed?.error) {
          throw new Error(parsed.error);
        }

        const normalized = normalizeKimonUiPayload(parsed);
        logKimonDebug('parse success', {
          mode: normalized.mode,
          leadLength: normalized.lead.length,
          messageLength: normalized.message.length,
          hasTimeHint: Boolean(normalized.timeHint),
          hasClosingLine: Boolean(normalized.closingLine),
        });
        return normalized;
      } catch (error) {
        logKimonDebug('parse fail', { message: error?.message || 'unknown error' });
        throw error;
      }
    }

    function humanizeKimonSectionLabel(key) {
      const labelMap = {
        tongQuan: '',
        chienLuoc: '🚩 Chiến Lược',
        tamLy: '🧠 Tâm Trí & Năng Lượng',
        hanhDong: '📋 Hành Động',
        kimonQuote: '🎯 Góc Nhìn Kymon',
      };
      if (key in labelMap) return labelMap[key];
      const raw = String(key || '');
      let normalized = '';
      for (let idx = 0; idx < raw.length; idx++) {
        const ch = raw[idx];
        const prev = idx > 0 ? raw[idx - 1] : '';
        if (ch === '_' || ch === '-') {
          normalized += ' ';
          continue;
        }
        const isUpper = ch >= 'A' && ch <= 'Z';
        const prevIsAlphaNum = (prev >= 'a' && prev <= 'z') || (prev >= '0' && prev <= '9');
        if (isUpper && prevIsAlphaNum) normalized += ' ';
        normalized += ch;
      }
      const compact = normalized.split(' ').filter(Boolean).join(' ').trim();
      if (!compact) return '';
      return compact[0].toUpperCase() + compact.slice(1);
    }

    function hasRenderableValue(value) {
      if (!value) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object') return Object.values(value).some(hasRenderableValue);
      return true;
    }

    function appendGenericKimonSection(container, typables, key, value) {
      if (!hasRenderableValue(value)) return;
      const sec = document.createElement('div');
      sec.className = 'kimon-section';
      const label = humanizeKimonSectionLabel(key);
      if (label) {
        const lbl = document.createElement('strong');
        lbl.className = 'kimon-section-label';
        lbl.textContent = label;
        sec.appendChild(lbl);
      }
      if (Array.isArray(value)) {
        const ol = document.createElement('ol');
        ol.style.cssText = 'margin:0; padding-left:1.2em; list-style-type:decimal;';
        value.forEach(step => {
          if (!hasRenderableValue(step)) return;
          const li = document.createElement('li');
          li.className = 'kimon-message-text';
          ol.appendChild(li);
          typables.push({ el: li, text: typeof step === 'string' ? step : JSON.stringify(step) });
        });
        sec.appendChild(ol);
      } else if (typeof value === 'object' && value !== null) {
        const p = document.createElement('p');
        p.className = 'kimon-message-text';
        sec.appendChild(p);
        const combinedText = Object.values(value)
          .filter(hasRenderableValue)
          .map(item => typeof item === 'string' ? item : JSON.stringify(item))
          .join('\\n\\n');
        typables.push({ el: p, text: combinedText });
      } else {
        const p = document.createElement('p');
        p.className = 'kimon-message-text';
        sec.appendChild(p);
        typables.push({ el: p, text: String(value) });
      }
      container.appendChild(sec);
    }

    function appendNarrativeSection(container, typables, label, text, className = 'kimon-paragraph') {
      if (!hasRenderableValue(text)) return;
      const sec = document.createElement('div');
      sec.className = 'kimon-section';
      if (label) {
        const lbl = document.createElement('strong');
        lbl.className = 'kimon-section-title';
        lbl.textContent = label;
        sec.appendChild(lbl);
      }
      const p = document.createElement('p');
      p.className = className;
      sec.appendChild(p);
      typables.push({ el: p, text: String(text) });
      container.appendChild(sec);
    }

    function buildTypewriterRichTextFragment(rawText) {
      const template = document.createElement('template');
      template.innerHTML = formatKimonRichText(rawText);
      const units = [];

      function cloneNodeForTyping(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const target = document.createTextNode('');
          units.push({
            fullText: node.nodeValue || '',
            currentLength: 0,
            target,
          });
          return target;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
          const clone = node.cloneNode(false);
          node.childNodes.forEach(child => clone.appendChild(cloneNodeForTyping(child)));
          return clone;
        }

        return document.createTextNode('');
      }

      const fragment = document.createDocumentFragment();
      template.content.childNodes.forEach(child => {
        fragment.appendChild(cloneNodeForTyping(child));
      });

      return { fragment, units };
    }

    function createTypewriterSectionEntry(className, rawText, options = {}) {
      const text = String(rawText || '');
      if (!text) return null;

      const entryEl = document.createElement('div');
      entryEl.className = className;
      entryEl.hidden = true;

      if (options.labelText) {
        const labelEl = document.createElement('strong');
        labelEl.textContent = options.labelText;
        entryEl.appendChild(labelEl);
        entryEl.appendChild(document.createTextNode(' '));
      }

      const prepared = buildTypewriterRichTextFragment(text);
      entryEl.appendChild(prepared.fragment);

      return {
        element: entryEl,
        units: prepared.units,
        unitIndex: 0,
      };
    }

    function fillTypewriterSectionInstant(section) {
      if (section?.element) section.element.hidden = false;
      if (!section?.units?.length) return;
      section.units.forEach(unit => {
        unit.currentLength = unit.fullText.length;
        unit.target.nodeValue = unit.fullText;
      });
      section.unitIndex = section.units.length;
    }

    function revealTypewriterSectionChunk(section, chunkSize = TYPEWRITER_CHUNK_SIZE) {
      if (section?.element) section.element.hidden = false;
      if (!section?.units?.length) return true;

      let remaining = chunkSize;
      while (remaining > 0 && section.unitIndex < section.units.length) {
        const unit = section.units[section.unitIndex];
        const pending = unit.fullText.length - unit.currentLength;

        if (pending <= 0) {
          section.unitIndex += 1;
          continue;
        }

        const take = Math.min(remaining, pending);
        unit.currentLength += take;
        unit.target.nodeValue = unit.fullText.slice(0, unit.currentLength);
        remaining -= take;

        if (unit.currentLength >= unit.fullText.length) {
          section.unitIndex += 1;
        }
      }

      return section.unitIndex >= section.units.length;
    }

    function cancelActiveKimonTypingSession({ finalize = true, reason = 'superseded' } = {}) {
      if (!activeKimonTypingSession) return;
      const session = activeKimonTypingSession;
      activeKimonTypingSession = null;
      if (typeof session.cancel === 'function') {
        session.cancel({ finalize, reason });
      }
    }

    function startKimonTypewriterSession(container, sections) {
      const session = {
        container,
        sections,
        timerId: null,
        cancelled: false,
        sectionIndex: 0,
        tickCount: 0,
      };

      function clearSessionTimer() {
        if (session.timerId) {
          clearTimeout(session.timerId);
          session.timerId = null;
        }
      }

      function finalizeSectionsInstant() {
        sections.forEach(fillTypewriterSectionInstant);
      }

      function finishSession() {
        clearSessionTimer();
        session.cancelled = true;
        if (activeKimonTypingSession === session) {
          activeKimonTypingSession = null;
        }
        smartScroll();
        logKimonDebug('typewriter end', {
          sections: sections.length,
          containerClass: container?.className || '',
        });
      }

      function scheduleNextTick(delayMs) {
        clearSessionTimer();
        if (session.cancelled) return;
        session.timerId = window.setTimeout(runTick, delayMs);
      }

      function runTick() {
        if (session.cancelled) return;

        const currentSection = sections[session.sectionIndex];
        if (!currentSection) {
          finishSession();
          return;
        }

        const completed = revealTypewriterSectionChunk(currentSection, TYPEWRITER_CHUNK_SIZE);
        session.tickCount += 1;

        if (session.tickCount % TYPEWRITER_SCROLL_EVERY_TICKS === 0) {
          smartScroll();
        }

        if (completed) {
          smartScroll();
          session.sectionIndex += 1;
          if (session.sectionIndex >= sections.length) {
            finishSession();
            return;
          }
          scheduleNextTick(TYPEWRITER_SECTION_PAUSE_MS);
          return;
        }

        scheduleNextTick(TYPEWRITER_TICK_MS);
      }

      session.cancel = ({ finalize = true, reason = 'superseded' } = {}) => {
        if (session.cancelled) return;
        logKimonDebug('typewriter cancel', {
          reason,
          sectionIndex: session.sectionIndex,
        });
        clearSessionTimer();
        session.cancelled = true;
        if (finalize) {
          finalizeSectionsInstant();
          smartScroll();
        }
        if (activeKimonTypingSession === session) {
          activeKimonTypingSession = null;
        }
      };

      logKimonDebug('typewriter start', {
        sections: sections.length,
        chunkSize: TYPEWRITER_CHUNK_SIZE,
        intervalMs: TYPEWRITER_TICK_MS,
      });
      scheduleNextTick(TYPEWRITER_TICK_MS);
      return session;
    }

    function renderParsedSections(container, data) {
      cancelActiveKimonTypingSession({ finalize: true, reason: 'new render' });
      container.className = 'kymon-clean-layout';
      const fragment = document.createDocumentFragment();
      const typewriterSections = [];

      const leadText = data?.lead || data?.summary || data?.quickTake || '';
      const timeHintText = data?.timeHint || '';
      const messageText = data?.message || data?.analysis || '';
      const closingText = data?.closingLine || data?.action || '';

      if (leadText) {
        const leadEntry = createTypewriterSectionEntry('kymon-lead', leadText);
        if (leadEntry) {
          fragment.appendChild(leadEntry.element);
          typewriterSections.push(leadEntry);
        }
      }

      if (timeHintText) {
        const timeHintEntry = createTypewriterSectionEntry('kymon-time-hint', timeHintText, { labelText: 'Thời điểm:' });
        if (timeHintEntry) {
          fragment.appendChild(timeHintEntry.element);
          typewriterSections.push(timeHintEntry);
        }
      }

      if (messageText) {
        const analysisEntry = createTypewriterSectionEntry('kymon-analysis-flow', messageText);
        if (analysisEntry) {
          fragment.appendChild(analysisEntry.element);
          typewriterSections.push(analysisEntry);
        }
      }

      if (closingText) {
        const closingEntry = createTypewriterSectionEntry('kymon-action-footer', closingText);
        if (closingEntry) {
          fragment.appendChild(closingEntry.element);
          typewriterSections.push(closingEntry);
        }
      }

      container.replaceChildren(fragment);
      smartScroll();

      if (!typewriterSections.length) return;

      try {
        activeKimonTypingSession = startKimonTypewriterSession(container, typewriterSections);
      } catch (error) {
        logKimonDebug('typewriter fallback', { message: error?.message || 'unknown' });
        typewriterSections.forEach(fillTypewriterSectionInstant);
        smartScroll();
      }
    }

    // Clear stale rate limit state on page load (server handles rate limiting now)
    localStorage.removeItem('kimon_rate_limit');

    const CACHE_EXPIRE_MS = 3600000; // 1 hour cache
    const KYMON_CACHE_VERSION = 'v3-json-final';

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

    function appendKimonResponseBubble(data) {
      const bubble = createMessageBubble(true);
      kimonMessages?.appendChild(bubble);
      logKimonDebug('render start', {
        mode: data?.mode || 'unknown',
        leadLength: data?.lead?.length || 0,
        messageLength: data?.message?.length || 0,
      });
      renderParsedSections(bubble, data);
      logKimonDebug('render end');
      return bubble;
    }

    function appendKimonErrorBubble(message) {
      const bubble = createMessageBubble(true);
      bubble.innerHTML = '<p class="kimon-error-inline">⚠️ ' + escapeHTML(message) + '</p>';
      kimonMessages?.appendChild(bubble);
      smartScroll();
      return bubble;
    }

    function isSameActiveKimonRequest(ctx) {
      return Boolean(ctx) && activeKimonRequestId === ctx.requestId;
    }

    function abortActiveKimonRequest(reason = 'superseded') {
      if (!activeKimonAbortController) return;
      logKimonDebug('request abort', {
        requestId: activeKimonRequestId,
        source: activeKimonRequestSource,
        reason,
      });
      activeKimonAbortController.abort();
    }

    function beginKimonRequest(source) {
      cancelActiveKimonTypingSession({ finalize: true, reason: 'new request: ' + source });
      const requestId = activeKimonRequestId + 1;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        if (!isSameActiveKimonRequest({ requestId })) return;
        logKimonDebug('request timeout', {
          requestId,
          source,
          timeoutMs: KYMON_REQUEST_TIMEOUT_MS,
        });
        controller.abort();
      }, KYMON_REQUEST_TIMEOUT_MS);

      activeKimonRequestId = requestId;
      activeKimonAbortController = controller;
      activeKimonRequestSource = source;
      isKimonFetching = true;
      setKimonInteractiveState({ pending: true, source });
      showThinking(source);
      logKimonDebug('submit start', { requestId, source });

      return {
        requestId,
        source,
        controller,
        timeoutId,
      };
    }

    function finalizeKimonRequest(ctx) {
      if (ctx?.timeoutId) clearTimeout(ctx.timeoutId);
      logKimonDebug('finally cleanup hit', {
        requestId: ctx?.requestId,
        source: ctx?.source,
        stillActive: isSameActiveKimonRequest(ctx),
      });
      if (!isSameActiveKimonRequest(ctx)) return;
      activeKimonAbortController = null;
      activeKimonRequestSource = '';
      isKimonFetching = false;
      hideThinking();
      setKimonInteractiveState({ pending: false, source: ctx.source });
    }

    function isAbortErrorLike(error) {
      return error?.name === 'AbortError' || /abort|nghẽn nhịp|quá nhiều thời gian/i.test(String(error?.message || ''));
    }

    async function autoLoadKimon() {
      if (isKimonFetching) return;

      const qData = getBaseQmdjData();
      const cacheKey = 'kimon_auto_' + KYMON_CACHE_VERSION + '_' + (qData.dayStem||'') + '_' + (qData.hourStem||'') + '_' + (qData.solarTerm||'');
      const cached = getCachedKimon(cacheKey);

      if (cached) {
        try {
          appendKimonResponseBubble(normalizeKimonUiPayload(cached));
          hideThinking();
          return;
        } catch (error) {
          logKimonDebug('cache miss due to invalid payload', { message: error?.message || 'invalid cache' });
        }
      }

      const requestContext = beginKimonRequest('auto');

      try {
        const data = await sendKymonRequest({
          qmdjData: qData,
          userContext: '__AUTO_LOAD__',
          signal: requestContext.controller.signal,
        });
        if (!isSameActiveKimonRequest(requestContext)) {
          logKimonDebug('stale autoLoad result ignored', { requestId: requestContext.requestId });
          return;
        }
        setCachedKimon(cacheKey, data);
        appendKimonResponseBubble(data);
      } catch (error) {
        if (!isSameActiveKimonRequest(requestContext)) {
          logKimonDebug('stale autoLoad error ignored', { requestId: requestContext.requestId });
          return;
        }
        if (isAbortErrorLike(error)) {
          logKimonDebug('autoLoad aborted', { requestId: requestContext.requestId });
          return;
        }
        console.error('Lỗi autoLoadKimon:', error);
        const errMsg = error.message || 'Lỗi kết nối';
        appendKimonErrorBubble(errMsg);
      } finally {
        finalizeKimonRequest(requestContext);
      }
    }

    async function askKimon(displayText, hiddenPrompt) {
      const question = String(displayText || '').trim();
      if (!question) {
        showKimonError('Nhập câu hỏi trước khi gửi.');
        kimonContext?.focus();
        return;
      }
      if (isKimonFetching && activeKimonRequestSource === 'manual') {
        logKimonDebug('submit blocked', { source: 'manual' });
        showKimonError('Kymon đang trả lời câu trước. Đợi một nhịp rồi gửi tiếp.');
        return;
      }
      if (isKimonFetching && activeKimonRequestSource === 'auto') {
        abortActiveKimonRequest('manual superseded autoload');
      }

      resetScrollTracking();
      if (kimonSuggestions) kimonSuggestions.style.display = 'none';

      // Remove tip if exists (only show on first load)
      const existingTip = kimonMessages.querySelector('.kimon-tip');
      if (existingTip) existingTip.remove();

      const userBubble = createMessageBubble(false);
      userBubble.innerHTML = '<p class="kimon-message-text">' + escapeHTML(question) + '</p>';
      kimonMessages.appendChild(userBubble);
      smartScroll();

      kimonContext.value = '';

      // Use hiddenPrompt (rich context) if provided, otherwise displayText
      const promptToSend = hiddenPrompt || question;
      const requestContext = beginKimonRequest('manual');

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

        const data = await sendKymonRequest({
          qmdjData: payload,
          userContext: promptToSend,
          signal: requestContext.controller.signal,
        });
        if (!isSameActiveKimonRequest(requestContext)) {
          logKimonDebug('stale manual result ignored', { requestId: requestContext.requestId });
          return;
        }
        appendKimonResponseBubble(data);
      } catch (error) {
        if (!isSameActiveKimonRequest(requestContext)) {
          logKimonDebug('stale manual error ignored', { requestId: requestContext.requestId });
          return;
        }
        console.error('Lỗi askKimon:', error);
        const errMsg = isAbortErrorLike(error)
          ? 'Kymon đang mất quá nhiều thời gian để trả lời. Bạn thử gửi lại nhé.'
          : (error.message || 'Lỗi kết nối. Vui lòng thử lại sau.');
        showKimonError(errMsg);
        appendKimonErrorBubble(errMsg);
        if (kimonContext && !kimonContext.value) {
          kimonContext.value = question;
        }
      } finally {
        finalizeKimonRequest(requestContext);
      }
    }

    function handleKymonSend(event) {
      if (event?.preventDefault) event.preventDefault();
      if (event?.stopPropagation) event.stopPropagation();
      return askKimon(kimonContext?.value.trim() || '');
    }

    if (kimonForm) {
      kimonForm.addEventListener('submit', handleKymonSend);
    }

    // (Topic chips have been removed)

    // Show greeting on load - wait for user to ask questions
    function initChat() {
      if (!kimonMessages) return;
      hideThinking();
      if (kimonMessages.querySelector('.kimon-greeting')) return;

      // Show greeting message
      const greeting = createMessageBubble(true);
      greeting.classList.add('kimon-greeting');
      greeting.innerHTML = '<p class="kimon-paragraph">Chào bạn! Tôi là Kymon. Hãy hỏi tôi bất cứ điều gì về năng lượng hiện tại, công việc, tình cảm, hay quyết định bạn đang cân nhắc.</p>';
      kimonMessages.appendChild(greeting);

      // Add tip about how to ask questions
      const tip = document.createElement('div');
      tip.className = 'kimon-tip';
      tip.innerHTML = '<span class="kimon-tip-icon" aria-hidden="true">💡</span><strong>Mẹo:</strong> Hãy nghĩ tới đúng vấn đề bạn đang vướng, rồi hỏi thật rõ. Càng cụ thể, Kymon càng luận sát. Ví dụ: "Tôi có nên ký hợp đồng này hôm nay không?" sẽ tốt hơn "Hôm nay thế nào?"';
      kimonMessages.appendChild(tip);
    }

    if (kimonMessages) {
      initChat();
      setTimeout(() => {
        if (!kimonMessages.querySelector('.kimon-greeting')) initChat();
      }, 120);
    }

  </script>
</body>
</html>`;
}

export default function handler(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/' || url.pathname === '') {
    const resolvedChartTime = getEffectiveChartTime(url.searchParams);
    const { date, hour, minute, mode, dateInputValue } = resolvedChartTime;

    try {
      const html = generateHTML(date, hour, minute, {
        chartTimeMode: mode,
        selectedDate: dateInputValue,
      });
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error: ' + err.message);
    }
  } else if (url.pathname === '/favicon.png' || url.pathname === '/loading.gif') {
    // Serve static files like favicon and loading gif from public directory
    try {
      const fileName = path.basename(url.pathname);
      const filePath = path.join(__dirname, 'public', fileName);
      const content = fs.readFileSync(filePath);
      const contentType = fileName.endsWith('.gif') ? 'image/gif' : 'image/png';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400'
      });
      res.end(content);
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
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
    const resolvedChartTime = getEffectiveChartTime(url.searchParams);
    const { date, hour, minute, mode, dateInputValue } = resolvedChartTime;

    try {
      const result = analyze(date, hour);
      result.displayChart = buildDisplayChart(result.chart);
      result.chartTimeMode = mode;
      result.chartTime = {
        date: dateInputValue,
        hour,
        minute,
      };
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
        const systemInstruction = buildKimonSystemInstruction();

        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: KYMON_MAX_OUTPUT_TOKENS,
            responseMimeType: 'application/json',
          },
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
          ]
        });

        const prompt = buildKimonPrompt({ qmdjData, userContext, isAutoLoad });

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
        const finalResponse = await streamResult.response;
        logKimonModelMeta('/api/kimon/stream', finalResponse, fullText);

        try {
          const parsed = toKimonResponseSchema(parseKimonJsonResponse(fullText), fullText);
          console.log('[Kimon] Parsed OK, keys:', Object.keys(parsed));
          res.write(`data: ${JSON.stringify({ __DONE__: true, parsed })}\n\n`);
        } catch (parseErr) {
          console.error('[Kimon] JSON parse failed:', parseErr.message);
          console.error('[Kimon] Raw response:', fullText.substring(0, 500));
          const fallback = toKimonResponseSchema(parseKimonJsonResponse(fullText), fullText);
          res.write(`data: ${JSON.stringify({ __DONE__: true, parsed: fallback })}\n\n`);
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
          systemInstruction: buildKimonSystemInstruction(),
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: KYMON_MAX_OUTPUT_TOKENS,
          }
        });
        const prompt = buildKimonPrompt({ qmdjData, userContext, isAutoLoad });
        const result = await model.generateContent(prompt);
        const rawText = await result.response.text();
        logKimonModelMeta('/api/kimon', result.response, rawText);
        const parsed = toKimonResponseSchema(parseKimonJsonResponse(rawText), rawText);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(parsed));
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
    console.log(`  - GET /api/kimon/stream  → Kimon Streaming Chat endpoints`);
    console.log(`  - GET /api/analyze       → JSON API`);
    console.log(`\nQuery params: ?date=YYYY-MM-DD&hour=0-23&minute=0-59\n`);
  });
}
