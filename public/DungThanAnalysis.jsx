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
          <p className="text-gray-700 text-xs">Sao: {palace?.star?.short || '—'}</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      <HeaderBar
        dayPillar={`${chart.dayPillar.stemName} ${chart.dayPillar.branchName}`}
        gioPillar={`${chart.gioPillar.stemName} ${chart.gioPillar.branchName}`}
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
