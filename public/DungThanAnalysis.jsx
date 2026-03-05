/**
 * DungThanAnalysis.jsx
 * React Component for Dụng Thần Analysis - QMDJ Weather-style Energy Dashboard
 *
 * Features:
 * - Weather metaphor for overall energy
 * - 14 topic cards with QMDJ-based descriptions
 * - Animated progress bars and score counters
 * - Expandable detail sections
 * - Mobile-first responsive design
 */

const { useState, useEffect, useMemo } = React;

// ============================================================================
// CONSTANTS
// ============================================================================

const TOPIC_ICONS = {
  'tai-van': '💰',
  'suc-khoe': '💊',
  'tinh-duyen': '💕',
  'su-nghiep': '🏢',
  'kinh-doanh': '🏪',
  'thi-cu': '📝',
  'ky-hop-dong': '📄',
  'dam-phan': '🤝',
  'doi-no': '💳',
  'kien-tung': '⚖️',
  'xuat-hanh': '✈️',
  'xin-viec': '💼',
  'bat-dong-san': '🏠',
  'muu-luoc': '🧠',
};

const TOPIC_LABELS = {
  'tai-van': 'Tiền bạc / Đầu tư',
  'suc-khoe': 'Sức Khỏe & Khám Bệnh',
  'tinh-duyen': 'Tình cảm / Mối quan hệ',
  'su-nghiep': 'Công việc / Sự nghiệp',
  'kinh-doanh': 'Kinh Doanh & Khai Trương',
  'thi-cu': 'Thi Cử & Học Tập',
  'ky-hop-dong': 'Ký Hợp Đồng',
  'dam-phan': 'Đàm Phán & Thương Lượng',
  'doi-no': 'Đòi Nợ & Thu Hồi',
  'kien-tung': 'Kiện Tụng & Pháp Lý',
  'xuat-hanh': 'Xuất Hành & Du Lịch',
  'xin-viec': 'Xin Việc & Phỏng Vấn',
  'bat-dong-san': 'Bất Động Sản',
  'muu-luoc': 'Mưu Lược & Chiến Lược',
};

const WEATHER_MAP = [
  { min: 8, icon: '☀️', label: 'Nắng đẹp rực rỡ', desc: 'Năng lượng cực tốt, vạn sự hanh thông', gradient: 'from-amber-100 to-yellow-50' },
  { min: 4, icon: '🌤️', label: 'Trời quang mây tạnh', desc: 'Thuận lợi, có thể tiến hành', gradient: 'from-sky-100 to-blue-50' },
  { min: 0, icon: '⛅', label: 'Trời nhiều mây', desc: 'Trung bình, nên chuẩn bị kỹ', gradient: 'from-slate-100 to-gray-50' },
  { min: -4, icon: '🌧️', label: 'Mưa rào nhẹ', desc: 'Cần thận trọng, giữ thế thủ', gradient: 'from-slate-200 to-slate-100' },
  { min: -Infinity, icon: '⛈️', label: 'Bão đến gần', desc: 'Hung, nên hoãn lại', gradient: 'from-slate-300 to-slate-200' },
];

const VERDICT_STYLES = {
  daiCat: { label: 'Đại Cát', color: 'emerald', bgClass: 'bg-emerald-500', textClass: 'text-emerald-600', borderClass: 'border-emerald-500', lightBg: 'bg-emerald-50' },
  cat: { label: 'Cát', color: 'blue', bgClass: 'bg-blue-500', textClass: 'text-blue-600', borderClass: 'border-blue-500', lightBg: 'bg-blue-50' },
  binh: { label: 'Bình', color: 'amber', bgClass: 'bg-amber-500', textClass: 'text-amber-600', borderClass: 'border-amber-500', lightBg: 'bg-amber-50' },
  hung: { label: 'Tiểu Hung', color: 'orange', bgClass: 'bg-orange-500', textClass: 'text-orange-600', borderClass: 'border-orange-500', lightBg: 'bg-orange-50' },
  daiHung: { label: 'Hung', color: 'red', bgClass: 'bg-red-500', textClass: 'text-red-600', borderClass: 'border-red-500', lightBg: 'bg-red-50' },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getVerdictLevel(score) {
  if (score >= 10) return 'daiCat';
  if (score >= 5) return 'cat';
  if (score >= 0) return 'binh';
  if (score >= -5) return 'hung';
  return 'daiHung';
}

function getWeatherMetaphor(score) {
  for (const w of WEATHER_MAP) {
    if (score >= w.min) return w;
  }
  return WEATHER_MAP[WEATHER_MAP.length - 1];
}

function scoreToPercent(score) {
  const clamped = Math.max(-20, Math.min(20, score));
  return Math.round(((clamped + 20) / 40) * 100);
}

function formatScore(score) {
  return score >= 0 ? `+${score}` : `${score}`;
}

function getStrategicInsight(topic) {
  return topic?.strategicInsight && typeof topic.strategicInsight === 'object'
    ? topic.strategicInsight
    : null;
}

function confidenceToPercent(topic) {
  const strategic = getStrategicInsight(topic);
  if (strategic && typeof strategic.confidence === 'number') {
    return Math.round(Math.max(0, Math.min(1, strategic.confidence)) * 100);
  }
  return null;
}

function getEvidenceLines(topic) {
  const strategic = getStrategicInsight(topic);
  const lines = [];
  if (strategic?.evidence?.usefulGods?.length) {
    strategic.evidence.usefulGods.forEach(item => {
      lines.push(`${item.type}: ${item.name} · Cung ${item.palaceNum} (${item.state})`);
    });
  }
  if (strategic?.evidence?.flags?.length) {
    strategic.evidence.flags.forEach(flag => {
      lines.push(`Flag ${flag.name} (${flag.severity})`);
    });
  }
  if (strategic?.evidence?.calc) {
    const calc = strategic.evidence.calc;
    const multi = Array.isArray(calc.multipliers) && calc.multipliers.length
      ? calc.multipliers.map(m => `${m.name}x${m.value}`).join(', ')
      : 'none';
    lines.push(`Confidence: base=${calc.base}, multipliers=${multi}, final=${calc.final}`);
  }
  if (lines.length) return lines;

  return (topic.reasons || []).slice(0, 5);
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

function useAnimatedScore(targetScore, duration = 1000) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (typeof targetScore !== 'number') return;

    const startTime = Date.now();
    const startScore = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayScore(Math.round(startScore + (targetScore - startScore) * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [targetScore, duration]);

  return displayScore;
}

function useStaggerAnimation(itemCount) {
  const [visibleItems, setVisibleItems] = useState([]);

  useEffect(() => {
    const timers = [];
    for (let i = 0; i < itemCount; i++) {
      timers.push(
        setTimeout(() => {
          setVisibleItems(prev => [...prev, i]);
        }, i * 80)
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [itemCount]);

  return visibleItems;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function HeaderBar({ dayPillar, gioPillar, solarTerm, nguyen }) {
  return (
    <header className="bg-white/80 glassmorphism sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔮</span>
          <h1 className="font-heading font-bold text-lg logo-gradient italic">
            KỲ MÔN ĐỘN GIÁP
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-200">
            {dayPillar}
          </span>
          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
            Giờ {gioPillar}
          </span>
        </div>
      </div>
    </header>
  );
}

function EnergyOverviewCard({ overallScore, weather, solarTerm, nguyen, cucSo, isDuong }) {
  const animatedScore = useAnimatedScore(overallScore);

  return (
    <div className={`rounded-2xl p-6 mb-6 card-shadow bg-gradient-to-br ${weather.gradient}`}>
      <div className="text-center">
        <span className="text-6xl mb-3 block">{weather.icon}</span>
        <h2 className="font-heading font-bold text-2xl text-gray-800 mb-1">
          {weather.label}
        </h2>
        <p className="text-gray-600 text-sm mb-4">{weather.desc}</p>

        <div className="flex justify-center items-center gap-2 mb-4">
          <span className={`text-4xl font-heading font-bold ${overallScore >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatScore(animatedScore)}
          </span>
          <span className="text-gray-500 text-sm">điểm tổng</span>
        </div>

        <div className="flex justify-center gap-3 flex-wrap">
          <span className="px-3 py-1 bg-white/60 rounded-full text-xs text-gray-700">
            {solarTerm} · {nguyen}
          </span>
          <span className="px-3 py-1 bg-white/60 rounded-full text-xs text-gray-700">
            Cục {cucSo} {isDuong ? 'Dương' : 'Âm'}
          </span>
        </div>
      </div>
    </div>
  );
}

function EnergyFlowCard({ chart }) {
  const [energyFlow, setEnergyFlow] = useState(null);

  useEffect(() => {
    if (!chart || !chart.palaces) return;

    // Generate energy flow summary client-side
    const flow = generateEnergyFlowClient(chart);
    setEnergyFlow(flow);
  }, [chart]);

  if (!energyFlow) return null;

  return (
    <div className="rounded-2xl p-5 mb-6 card-shadow bg-gradient-to-br from-amber-50 to-yellow-100 border border-amber-200">
      <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
        Tóm Tắt Dòng Năng Lượng Bên Trong
      </p>
      <h2 className="font-heading font-bold text-xl text-amber-900 mb-4">
        Đọc Vị Tâm Lý
      </h2>

      <div className="space-y-3">
        <div className="bg-white/70 rounded-xl p-3 border-l-4 border-blue-500">
          <span className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-1 block">
            Trạng thái tinh thần
          </span>
          <p className="text-sm text-amber-950 leading-relaxed">{energyFlow.mentalState}</p>
        </div>

        <div className="bg-white/70 rounded-xl p-3 border-l-4 border-purple-500">
          <span className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-1 block">
            Dòng chảy năng lượng
          </span>
          <p className="text-sm text-amber-950 leading-relaxed">{energyFlow.conflict}</p>
        </div>

        <div className="bg-white/70 rounded-xl p-3 border-l-4 border-orange-500">
          <span className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-1 block">
            Điểm mù năng lượng
          </span>
          <p className="text-sm text-amber-950 leading-relaxed">{energyFlow.blindSpot}</p>
        </div>

        <div className="bg-white/70 rounded-xl p-3 border-l-4 border-emerald-500">
          <span className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-1 block">
            Lời khuyên cân bằng
          </span>
          <p className="text-sm text-amber-950 leading-relaxed">{energyFlow.advice}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <span className="px-2 py-1 bg-white/80 rounded-full text-xs font-medium text-amber-800 border border-amber-200">
          Nhật Can: {energyFlow.metadata?.dayStem || '—'}
        </span>
        <span className="px-2 py-1 bg-white/80 rounded-full text-xs font-medium text-amber-800 border border-amber-200">
          Cung: {energyFlow.metadata?.dayPalace || '—'}
        </span>
        <span className="px-2 py-1 bg-white/80 rounded-full text-xs font-medium text-amber-800 border border-amber-200">
          Môn: {energyFlow.metadata?.door || '—'}
        </span>
        <span className="px-2 py-1 bg-white/80 rounded-full text-xs font-medium text-amber-800 border border-amber-200">
          Thần: {energyFlow.metadata?.deity || '—'}
        </span>
        {energyFlow.metadata?.hasFanYin && (
          <span className="px-2 py-1 bg-orange-100 rounded-full text-xs font-medium text-orange-700 border border-orange-300">
            Phản Ngâm
          </span>
        )}
        {energyFlow.metadata?.hasFuYin && (
          <span className="px-2 py-1 bg-orange-100 rounded-full text-xs font-medium text-orange-700 border border-orange-300">
            Phục Ngâm
          </span>
        )}
        {energyFlow.metadata?.hasVoid && (
          <span className="px-2 py-1 bg-orange-100 rounded-full text-xs font-medium text-orange-700 border border-orange-300">
            Không Vong
          </span>
        )}
        {energyFlow.metadata?.hasDichMa && (
          <span className="px-2 py-1 bg-blue-100 rounded-full text-xs font-medium text-blue-700 border border-blue-300">
            Dịch Mã
          </span>
        )}
      </div>
    </div>
  );
}

// Energy Flow Logic (client-side implementation)
function generateEnergyFlowClient(chart) {
  const DOOR_MENTAL_STATE = {
    'Khai': { neutral: 'Tâm trí bạn đang thông suốt, có thể nhìn vấn đề khá rõ ràng.' },
    'Sinh': { neutral: 'Bạn có cảm giác hy vọng và muốn xây dựng điều gì đó mới.' },
    'Hưu': { neutral: 'Bạn cần nhịp thở, không nên ép bản thân phải hoạt động liên tục.' },
    'Đỗ': { neutral: 'Có vẻ bạn đang cảm thấy bế tắc hoặc muốn che giấu những dự định bên trong.' },
    'Thương': { neutral: 'Có chút bực dọc hoặc tổn thương ngầm, dễ phản ứng mạnh hơn mức cần thiết.' },
    'Cảnh': { neutral: 'Tâm trí sáng nhưng dễ ảo tưởng, cần kiểm chứng thực tế.' },
    'Kinh': { neutral: 'Có sự bất an mơ hồ, đầu óc hay chạy đến kịch bản xấu nhất.' },
    'Tử': { neutral: 'Có cảm giác muốn buông bỏ hoặc cắt đứt điều gì đó không còn phù hợp.' },
  };

  const DEITY_INFLUENCE = {
    'Trực Phù': 'có sự hỗ trợ từ "người dẫn đường" năng lượng cao',
    'Đằng Xà': 'dễ bị cuốn vào suy nghĩ rối rắm và lo âu',
    'Thái Âm': 'trực giác đang khá mạnh, nên lắng nghe tiếng nói bên trong',
    'Lục Hợp': 'năng lượng kết nối và hợp tác đang thuận',
    'Câu Trận': 'dễ gặp cản trở và tranh chấp',
    'Bạch Hổ': 'có áp lực mạnh hoặc xung đột tiềm ẩn',
    'Chu Tước': 'dễ gặp thị phi hoặc hiểu lầm trong giao tiếp',
    'Huyền Vũ': 'cần cẩn thận với thông tin không rõ ràng hoặc lừa dối',
    'Cửu Địa': 'năng lượng ổn định và bền vững',
    'Cửu Thiên': 'có năng lượng vươn lên và mở rộng',
  };

  // Find Day Stem palace
  let dayPalaceNum = null;
  for (let p = 1; p <= 9; p++) {
    const pal = chart.palaces[p];
    if (pal?.isNgayCan || pal?.can?.name === chart.dayPillar?.stemName) {
      dayPalaceNum = p;
      break;
    }
  }

  if (!dayPalaceNum) {
    return {
      mentalState: 'Không tìm thấy vị trí Nhật Can trong trận đồ.',
      conflict: '',
      blindSpot: '',
      advice: '',
      metadata: {},
    };
  }

  const dayPalace = chart.palaces[dayPalaceNum];
  const doorKey = dayPalace?.mon?.short || dayPalace?.mon?.name;
  const deityName = dayPalace?.than?.name;
  const starName = dayPalace?.star?.name || dayPalace?.star?.short;

  // Sentence 1: Mental state
  let mentalState = DOOR_MENTAL_STATE[doorKey]?.neutral || 'Trạng thái tinh thần hiện tại đang ở mức trung tính.';
  if (DEITY_INFLUENCE[deityName]) {
    mentalState += ` Đồng thời, ${DEITY_INFLUENCE[deityName]}.`;
  }

  // Sentence 2: Element relationship
  const DAY_STEM_EL = { 'Giáp': 'Mộc', 'Ất': 'Mộc', 'Bính': 'Hỏa', 'Đinh': 'Hỏa', 'Mậu': 'Thổ', 'Kỷ': 'Thổ', 'Canh': 'Kim', 'Tân': 'Kim', 'Nhâm': 'Thủy', 'Quý': 'Thủy' };
  const PALACE_EL = { 1: 'Thủy', 2: 'Thổ', 3: 'Mộc', 4: 'Mộc', 5: 'Thổ', 6: 'Kim', 7: 'Kim', 8: 'Thổ', 9: 'Hỏa' };

  const stemEl = DAY_STEM_EL[chart.dayPillar?.stemName];
  const palaceEl = PALACE_EL[dayPalaceNum];

  let conflict = `Năng lượng bên trong (${stemEl}) đang tương tác với môi trường (${palaceEl}).`;

  // Sentence 3: Blind spots
  const blindSpots = [];
  if (chart.isPhanNgam) blindSpots.push('Năng lượng đang dao động mạnh (Phản Ngâm) - mọi nỗ lực nhanh chóng dễ bị dội ngược.');
  if (chart.isPhucAm) blindSpots.push('Năng lượng đang trì trệ (Phục Ngâm), cần kiên nhẫn.');
  if (dayPalace?.khongVong) blindSpots.push('Cẩn thận với kỳ vọng quá lớn - có điểm mù thông tin (Không Vong).');
  if (dayPalace?.dichMa) blindSpots.push('Có năng lượng Dịch Mã - thời điểm tốt cho thay đổi.');

  const blindSpot = blindSpots.length > 0 ? blindSpots.join(' ') : 'Không phát hiện điểm mù năng lượng đặc biệt.';

  // Sentence 4: Advice
  const advice = 'Giữ nhịp ổn định, quan sát thêm trước khi tăng cam kết vào bất kỳ hướng nào.';

  return {
    mentalState,
    conflict,
    blindSpot,
    advice,
    metadata: {
      dayStem: chart.dayPillar?.stemName,
      dayPalace: dayPalaceNum,
      door: doorKey,
      star: starName,
      deity: deityName,
      hasFanYin: chart.isPhanNgam,
      hasFuYin: chart.isPhucAm,
      hasVoid: dayPalace?.khongVong,
      hasDichMa: dayPalace?.dichMa,
    },
  };
}

function AnimatedProgressBar({ percent, colorClass }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percent), 100);
    return () => clearTimeout(timer);
  }, [percent]);

  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full progress-bar ${colorClass}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function ExpandableDetail({ topic, palace }) {
  const strategic = getStrategicInsight(topic);
  const evidenceLines = getEvidenceLines(topic);
  const doList = Array.isArray(strategic?.do) ? strategic.do.slice(0, 3) : [];
  const avoidList = Array.isArray(strategic?.avoid) ? strategic.avoid.slice(0, 2) : [];

  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Cung Dụng Thần</p>
          <p className="font-medium text-gray-800">
            Cung {topic.usefulGodPalace} · {topic.usefulGodPalaceName}
          </p>
          <p className="text-gray-600 text-xs">{topic.usefulGodDir}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Chi Tiết Cung</p>
          <p className="text-gray-700 text-xs">Sao: {(palace?.star?.short === 'Cầm' && palace?.trucPhu) ? 'Nhuế' : (palace?.star?.short || '—')}</p>
          <p className="text-gray-700 text-xs">Môn: {palace?.mon?.short || '—'}</p>
          <p className="text-gray-700 text-xs">Thần: {palace?.than?.name || '—'}</p>
        </div>
      </div>

      {(doList.length > 0 || avoidList.length > 0) && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
            <p className="text-emerald-700 text-xs mb-2 font-semibold">Nên làm</p>
            <ul className="space-y-1">
              {doList.length
                ? doList.map((item, i) => (
                  <li key={i} className="text-emerald-800 text-xs flex items-start gap-2">
                    <span>•</span>
                    <span>{item}</span>
                  </li>
                ))
                : <li className="text-emerald-800 text-xs">—</li>}
            </ul>
          </div>
          <div className="bg-rose-50 rounded-lg p-3 border border-rose-100">
            <p className="text-rose-700 text-xs mb-2 font-semibold">Nên tránh</p>
            <ul className="space-y-1">
              {avoidList.length
                ? avoidList.map((item, i) => (
                  <li key={i} className="text-rose-800 text-xs flex items-start gap-2">
                    <span>•</span>
                    <span>{item}</span>
                  </li>
                ))
                : <li className="text-rose-800 text-xs">—</li>}
            </ul>
          </div>
        </div>
      )}

      {evidenceLines.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-2">Logic / Evidence</p>
          <ul className="space-y-1">
            {evidenceLines.slice(0, 6).map((reason, i) => (
              <li key={i} className="text-gray-600 text-xs flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(strategic?.disclaimer || topic.actionAdvice) && (
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
          <p className="text-amber-800 text-xs flex items-start gap-2">
            <span>💡</span>
            <span>{strategic?.disclaimer || topic.actionAdvice}</span>
          </p>
        </div>
      )}
    </div>
  );
}

function TopicCard({ topic, palace, index, isVisible }) {
  const [expanded, setExpanded] = useState(false);
  const verdictLevel = getVerdictLevel(topic.score);
  const style = VERDICT_STYLES[verdictLevel];
  const strategic = getStrategicInsight(topic);
  const headline = strategic?.headline || TOPIC_LABELS[topic.key] || topic.topic;
  const coreMessage = strategic?.coreMessage || topic.actionAdvice || 'Chưa có chỉ dẫn cụ thể.';
  const narrative = strategic?.narrative || '';
  const confidencePct = confidenceToPercent(topic);
  const actionLabel = strategic
    ? (strategic.score > 0 ? 'Chủ động' : strategic.score < 0 ? 'Phòng thủ' : 'Quan sát')
    : (topic.score >= 5 ? 'Chủ động' : topic.score < 0 ? 'Phòng thủ' : 'Quan sát');
  const percent = scoreToPercent(topic.score);

  return (
    <div
      className={`
        bg-white rounded-xl card-shadow overflow-hidden
        border-l-4 ${style.borderClass}
        ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}
      `}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{TOPIC_ICONS[topic.key] || '📊'}</span>
            <div>
              <h3 className="font-heading font-semibold text-gray-800 text-sm">
                {headline}
              </h3>
              <p className="text-xs text-gray-500">{topic.usefulGodDir}</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${style.lightBg} ${style.textClass}`}>
            {style.label} ({formatScore(topic.score)})
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-700 text-sm leading-relaxed mb-4">
          {coreMessage}
        </p>
        {narrative && (
          <p className="text-gray-500 text-xs leading-relaxed mb-4">
            {narrative}
          </p>
        )}

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">Mức năng lượng · Chiến thuật {actionLabel}</span>
            <span className={`text-xs font-semibold ${style.textClass}`}>
              {percent}%{confidencePct !== null ? ` · Độ chắc ${confidencePct}%` : ''}
            </span>
          </div>
          <AnimatedProgressBar percent={percent} colorClass={style.bgClass} />
        </div>

        {/* Expand Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <span>{expanded ? 'Thu gọn' : 'Xem chi tiết kỹ thuật'}</span>
          <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
        </button>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/50">
          <ExpandableDetail topic={topic} palace={palace} />
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-body">Đang phân tích năng lượng...</p>
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center p-4">
      <div className="text-center bg-white rounded-2xl p-8 card-shadow max-w-sm">
        <span className="text-5xl mb-4 block">⚠️</span>
        <h2 className="font-heading font-bold text-xl text-gray-800 mb-2">Có lỗi xảy ra</h2>
        <p className="text-gray-600 text-sm">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// AI ADVISOR COMPONENT
// ============================================================================

function KimonChat({ qmdjData }) {
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState('');

  const askKimon = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/kimon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qmdjData: qmdjData || { mon: 'Hưu', than: 'Cửu Thiên', cung: 'Khảm', score: 8 },
          userContext: context.trim() || 'hành động chung trong ngày hôm nay'
        }),
      });

      const resData = await res.json();

      if (res.ok && resData) {
        // Try parsing assuming the API returns a stringified JSON in `resData` or directly the JSON object.
        // We updated the backend to return the raw Gemini JSON directly.
        try {
          const parsed = typeof resData === 'string' ? JSON.parse(resData) : resData;
          // In case the backend wrapped it in { text: '{"chienLuoc": ...}' }
          if (parsed.text) {
            setResponse(JSON.parse(parsed.text));
          } else {
            setResponse(parsed);
          }
        } catch (e) {
          console.error("Lỗi parse JSON từ Kimon:", e);
          setResponse({ error: 'Kimon đưa ra chiến lược quá phức tạp không thể phân tích lúc này.' });
        }
      } else {
        setResponse({ error: 'Kimon đang bận tĩnh tâm hoặc có nhiễu loạn từ trường. Vui lòng thử lại sau!' });
      }
    } catch (error) {
      console.error("Lỗi Frontend gọi Kimon:", error);
      setResponse('Mất kết nối với Kimon. Vui lòng kiểm tra lại mạng.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1a24] border border-[#2a2a35] rounded-2xl p-6 shadow-2xl w-full text-gray-100 mb-6">
      <div className="flex items-center space-x-4 mb-5">
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-500 to-blue-600 flex items-center justify-center font-bold text-2xl shadow-[0_0_15px_rgba(168,85,247,0.4)]">
          K
        </div>
        <div>
          <h3 className="font-bold text-xl tracking-wide">Kimon AI</h3>
          <p className="text-sm text-purple-400 font-medium tracking-wider uppercase">Strategic Advisor</p>
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-sm text-gray-400 mb-2 font-medium">
          Ngữ cảnh sự việc (VD: Ký hợp đồng, đi phỏng vấn...):
        </label>
        <input
          type="text"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Nhập vấn đề bạn đang băn khoăn..."
          className="w-full bg-[#111118] border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder-gray-600"
          onKeyDown={(e) => e.key === 'Enter' && askKimon()}
        />
      </div>

      <button
        onClick={askKimon}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(168,85,247,0.39)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.23)]"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Kimon đang luận giải...</span>
          </div>
        ) : (
          <span>Tham Vấn Kimon Ngay</span>
        )}
      </button>

      {response && !response.error && (
        <div className="mt-6 space-y-4 animate-fade-in-up">
          {response.chienLuoc && (
            <div className="p-5 bg-gradient-to-br from-[#1c1c28] to-[#111118] rounded-xl border border-purple-500/50 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">⚔️</span>
                <h4 className="text-purple-400 font-bold uppercase tracking-wider text-sm">Hiến Kế: {response.chienLuoc.tieuDe}</h4>
              </div>
              <p className="text-[15px] leading-relaxed text-gray-200 relative z-10">{response.chienLuoc.noiDung}</p>
            </div>
          )}

          {response.tamLy && (
            <div className="p-5 bg-[#111118] rounded-xl border border-blue-500/30 shadow-inner">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">👁️</span>
                <h4 className="text-blue-400 font-bold uppercase tracking-wider text-sm">Đọc Vị Nội Tâm</h4>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                  <p className="text-sm text-gray-300"><strong className="text-gray-200">Trạng thái:</strong> {response.tamLy.trangThai}</p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                  <p className="text-sm text-gray-300"><strong className="text-gray-200">Dòng chảy:</strong> {response.tamLy.dongChay}</p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                  <p className="text-sm text-gray-300"><strong className="text-gray-200">Lời khuyên:</strong> {response.tamLy.loiKhuyen}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {response && response.error && (
        <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl animate-fade-in-up">
          <p className="text-red-400 text-sm">{response.error}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function DungThanAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [sortMode, setSortMode] = useState('score-desc');

  // Get date/hour from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const dateParam = urlParams.get('date');
  const hourParam = urlParams.get('hour');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sharedContext = window.__analysisContext;
        let apiData = null;

        if (sharedContext && typeof sharedContext.analyze === 'function') {
          apiData = await sharedContext.analyze({
            date: dateParam || '',
            hour: hourParam || '',
          });
        } else {
          const params = new URLSearchParams();
          if (dateParam) params.set('date', dateParam);
          if (hourParam) params.set('hour', hourParam);

          const url = `/api/analyze${params.toString() ? '?' + params.toString() : ''}`;
          const response = await fetch(url);

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          apiData = await response.json();
        }

        setData(apiData);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateParam, hourParam]);

  // Convert topics to array for rendering
  const topics = useMemo(() => {
    if (!data?.topicResults) return [];
    return Object.entries(data.topicResults).map(([key, result]) => ({
      key,
      ...result,
    }));
  }, [data]);

  const filteredTopics = useMemo(() => {
    const query = filterText.trim().toLowerCase();
    const base = topics.filter(topic => {
      if (!query) return true;
      const label = (TOPIC_LABELS[topic.key] || topic.topic || '').toLowerCase();
      return label.includes(query) || String(topic.key || '').toLowerCase().includes(query);
    });

    const sorted = [...base];
    if (sortMode === 'confidence-desc') {
      sorted.sort((a, b) => (confidenceToPercent(b) ?? 0) - (confidenceToPercent(a) ?? 0));
    } else if (sortMode === 'topic-asc') {
      sorted.sort((a, b) => (TOPIC_LABELS[a.key] || a.topic || '').localeCompare(TOPIC_LABELS[b.key] || b.topic || '', 'vi'));
    } else {
      sorted.sort((a, b) => (b.score || 0) - (a.score || 0));
    }
    return sorted;
  }, [topics, filterText, sortMode]);

  const visibleItems = useStaggerAnimation(filteredTopics.length);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <ErrorState message="Không có dữ liệu" />;

  const { chart, evaluation } = data;
  const weather = getWeatherMetaphor(evaluation.overallScore);
  const currentEnergyFlow = generateEnergyFlowClient(chart);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      <HeaderBar
        dayPillar={`${chart.dayPillar.stemName} ${chart.dayPillar.branchName}`}
        gioPillar={`${chart.gioPillar.displayStemName || chart.gioPillar.stemName} ${chart.gioPillar.branchName}`}
        solarTerm={chart.solarTerm.name}
        nguyen={chart.solarTerm.nguyenName}
      />

      <main className="max-w-lg mx-auto px-4 py-6">
        <EnergyOverviewCard
          overallScore={evaluation.overallScore}
          weather={weather}
          solarTerm={chart.solarTerm.name}
          nguyen={`${chart.solarTerm.nguyenName} Nguyên`}
          cucSo={chart.cucSo}
          isDuong={chart.isDuong}
        />

        <KimonChat
          qmdjData={{
            score: evaluation.overallScore,
            mon: currentEnergyFlow?.metadata?.door,
            than: currentEnergyFlow?.metadata?.deity,
            cung: currentEnergyFlow?.metadata?.dayPalace
          }}
        />

        <EnergyFlowCard chart={chart} />

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-gray-800">
            14 Chủ Đề Phân Tích
          </h2>
          <span className="text-xs text-gray-500">
            Dựa trên Dụng Thần
          </span>
        </div>

        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            placeholder="Lọc chủ đề..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <select
            value={sortMode}
            onChange={e => setSortMode(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="score-desc">Sắp xếp: Điểm cao trước</option>
            <option value="confidence-desc">Sắp xếp: Độ chắc cao trước</option>
            <option value="topic-asc">Sắp xếp: A-Z</option>
          </select>
        </div>

        <div className="space-y-4 pb-8">
          {filteredTopics.map((topic, index) => (
            <TopicCard
              key={topic.key}
              topic={topic}
              palace={chart.palaces[topic.usefulGodPalace]}
              index={index}
              isVisible={visibleItems.includes(index)}
            />
          ))}
          {!filteredTopics.length && (
            <div className="bg-white rounded-xl card-shadow p-4 text-sm text-slate-600">
              Không có chủ đề phù hợp bộ lọc hiện tại.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// RENDER
// ============================================================================

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<DungThanAnalysis />);
