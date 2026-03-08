/**
 * index.js — QMDJ Engine Entry Point
 * Aggregates all 6 layers and exposes the public API.
 *
 * Usage (ESM):
 *   import { analyze, findUsefulGod, TOPICS } from './src/index.js';
 *
 * Usage (Node CLI):
 *   node src/index.js
 */

// ── Re-export entire public surface ──────────────────────────────────────────
export * from './core/tables.js';
export * from './core/calendar.js';
export * from './core/stems.js';
export * from './core/flying.js';
export * from './core/states.js';
export * from './core/cachcuc.js';
export * from './core/dungthan.js';
export * from './core/insightEngine.js';
export * from './core/palaceLayout.js';
export * from './core/temporalMarkers.js';
export * from './ui/displayMappings.js';
export * from './logic/dungThan/index.js';
export { generateEnergyFlowSummary, generateDeterministicEnergyFlow } from './logic/dungThan/energyFlowLogic.js';
export * from './state/analysisContext.js';

// ── Named imports for composite functions ────────────────────────────────────
import { buildFullChart }    from './core/flying.js';
import { evaluateChart }     from './core/cachcuc.js';
import { findUsefulGod, TOPICS } from './core/dungthan.js';
import { scoreChartStates }  from './core/states.js';
import { PALACE_META }       from './core/tables.js';
import { buildInsight }      from './core/insightEngine.js';
import { generateStrategicInsight } from './logic/dungThan/index.js';
import { buildDisplayChart, getSectionLabel, getVisualPalaceEntries } from './ui/displayMappings.js';

const DEFAULT_TOPIC_KEYS = [
  'tai-van', 'suc-khoe', 'tinh-duyen', 'su-nghiep', 'kinh-doanh',
  'thi-cu', 'hoc-tap', 'ky-hop-dong', 'dam-phan', 'doi-no', 'kien-tung',
  'xuat-hanh', 'xin-viec', 'bat-dong-san', 'muu-luoc',
];

/**
 * analyze(date, hour, topics?)
 * One-call convenience wrapper — builds chart + evaluates + scores all topics.
 *
 * @param {Date}     date     Target date
 * @param {number}   hour     Hour (0-23)
 * @param {string[]} topics   Subset of TOPICS keys (default: all)
 * @returns {{ chart, states, evaluation, topicResults }}
 */
export function analyze(date, hour, topics = DEFAULT_TOPIC_KEYS) {
  const chart      = buildFullChart(date, hour);
  const states     = scoreChartStates(chart);
  const evaluation = evaluateChart(chart);
  const globalFlags = {
    FU_YIN: Boolean(chart.isPhucAm),
    FAN_YIN: Boolean(chart.isPhanNgam),
  };
  const topicResults = Object.fromEntries(
    topics.map(t => {
      const topicResult = findUsefulGod(t, chart);
      topicResult.insight = buildInsight({
        chart,
        topicKey: t,
        topicResult,
        globalFlags,
      });
      topicResult.strategicInsight = generateStrategicInsight({
        chart,
        topicKey: t,
        topicResult,
      });
      return [t, topicResult];
    })
  );
  return { chart, states, evaluation, topicResults };
}

// ── runDemo ───────────────────────────────────────────────────────────────────
/**
 * runDemo() — smoke-tests all 6 layers and prints a formatted summary.
 * Run directly: node src/index.js
 */
export function runDemo() {
  const hr  = '═'.repeat(60);
  const date = new Date(2026, 2, 2, 10, 0, 0); // 2026-03-02 10:00
  const hour = 10;

  console.log(`\n${hr}`);
  console.log('  QMDJ ENGINE v2.0 — runDemo()');
  console.log(`  Target: ${date.toDateString()} ${hour}:00`);
  console.log(hr);

  const { chart, states, evaluation, topicResults } = analyze(date, hour, [
    'tai-van', 'suc-khoe', 'su-nghiep', 'kinh-doanh', 'xuat-hanh',
  ]);
  const displayChart = buildDisplayChart(chart);

  // ── Solar Term + Cục ──────────────────────────────────────────────────────
  const tk = chart.solarTerm;
  console.log(`\n[L0] Tiết Khí   : ${tk.name} (${tk.nguyenName} Nguyên)`);
  console.log(`     ${getSectionLabel('Cục').padEnd(12)}: ${chart.cucSo} ${getSectionLabel(chart.isDuong ? 'Dương Độn' : 'Âm Độn')}`);
  console.log(`     Phục/Phản   : ${chart.isPhucAm ? '⚠️ Phục Âm' : chart.isPhanNgam ? '⚠️ Phản Ngâm' : '✅ Bình thường'}`);

  // ── Day/Hour Pillars ──────────────────────────────────────────────────────
  console.log(`\n[L1] ${getSectionLabel('Ngày').padEnd(11)}: ${displayChart.dayPillar?.stem?.displayShort || chart.dayPillar.stemName} ${displayChart.dayPillar?.branch?.displayShort || chart.dayPillar.branchName} (Tuần: ${chart.xuName})`);
  console.log(`     ${getSectionLabel('Giờ').padEnd(11)}: ${displayChart.gioPillar?.stem?.displayShort || chart.gioPillar.stemName} ${displayChart.gioPillar?.branch?.displayShort || chart.gioPillar.branchName}`);
  console.log(`     ${getSectionLabel('Không Vong').padEnd(11)}: ${displayChart.khongVong?.void1?.branch?.displayShort || chart.khongVong.void1.name}, ${displayChart.khongVong?.void2?.branch?.displayShort || chart.khongVong.void2.name}  (${chart.khongVong.xunName})`);
  if (chart.dichMa) console.log(`     ${getSectionLabel('Dịch Mã').padEnd(11)}: ${displayChart.dichMa?.horseBranchLabel?.displayShort || chart.dichMa.horseBranch} → Cung ${chart.dichMa.palace} ${displayChart.dichMa?.directionLabel || PALACE_META[chart.dichMa.palace].dir}`);
  if (chart.dayMarkerPalace || chart.hourMarkerPalace) {
    console.log(`     Marker ngày  : P${chart.dayMarkerPalace || '—'}`);
    console.log(`     Marker giờ   : P${chart.hourMarkerPalace || '—'}  →  ${chart.hourEnergyVerdict || 'trung'} (${chart.hourEnergyTone || 'neutral'}, ${chart.hourEnergyScore ?? 0})`);
  }

  // ── Palace grid ───────────────────────────────────────────────────────────
  console.log(`\n[L2] ${getSectionLabel('Thiên Bàn').toUpperCase()}:`);
  console.log('  Hướng      │ P  │ Cửu Tinh     │ Thiên Can    │ Bát Môn   │ Bát Thần     │ Cờ');
  console.log('  ───────────┼────┼──────────────┼──────────────┼───────────┼──────────────┼──────');
  for (const [slot, pal] of getVisualPalaceEntries(displayChart.palaces)) {
    const palaceNum = pal?.palaceNum || (slot === 'C' ? 5 : '');
    const flags = [
      ...(pal?.flagLabels || []).map(flag => flag.displayShort),
    ].join(' ');
    console.log(
      `  ${String(pal?.directionLabel?.displayShort || slot).padEnd(10)} │ ${String(palaceNum).padEnd(2)} │ ` +
      `${(pal?.star?.displayName || '—').padEnd(12)} │ ${(pal?.can?.displayShort || '—').padEnd(12)} │ ` +
      `${(pal?.mon?.displayName || '—').padEnd(9)} │ ${(pal?.than?.displayName || '—').padEnd(12)} │ ${flags}`
    );
  }

  // ── Cách Cục ──────────────────────────────────────────────────────────────
  console.log(`\n[L4] Cách Cục Score: ${evaluation.overallScore >= 0 ? '+' : ''}${evaluation.overallScore}  →  ${evaluation.verdict}`);
  if (evaluation.topFormations.length) {
    console.log('     Top Formations:');
    evaluation.topFormations.slice(0, 5).forEach(f =>
      console.log(`       [${f.type.toUpperCase().padEnd(4)}] P${f.palace} ${f.name}`)
    );
  }

  // ── Dụng Thần ─────────────────────────────────────────────────────────────
  console.log('\n[L5] Dụng Thần / Topic Analysis:');
  for (const [key, res] of Object.entries(topicResults)) {
    if (res.error) continue;
    console.log(`  ${res.topic.padEnd(26)} → ${res.usefulGodDir.padEnd(10)} Cung ${res.usefulGodPalace} [${res.verdict.label}] score ${res.score >= 0 ? '+' : ''}${res.score}`);
  }

  console.log(`\n${hr}\n  Demo complete — đã dựng đủ 6 tầng.\n${hr}\n`);
}

// ── Direct execution ──────────────────────────────────────────────────────────
// Detect whether this file is the entry point in both Node CJS and ESM
const isMain =
  (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('index.js'));

if (isMain) runDemo();
