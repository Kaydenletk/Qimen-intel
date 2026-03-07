import { analyze, getXunInfo } from '../src/index.js';
import { PERIMETER, WEB1_REFERENCE_CASES } from './web1ReferenceCases.mjs';

const DOOR_BY_ORIG_PALACE = {
  1: { name: 'Hưu Môn', short: 'Hưu' },
  2: { name: 'Tử Môn', short: 'Tử' },
  3: { name: 'Thương Môn', short: 'Thương' },
  4: { name: 'Đỗ Môn', short: 'Đỗ' },
  6: { name: 'Khai Môn', short: 'Khai' },
  7: { name: 'Kinh Môn', short: 'Kinh' },
  8: { name: 'Sinh Môn', short: 'Sinh' },
  9: { name: 'Cảnh Môn', short: 'Cảnh' },
};

const PALACE_LABELS = {
  1: 'P1 Bắc',
  2: 'P2 Tây Nam',
  3: 'P3 Đông',
  4: 'P4 Đông Nam',
  5: 'P5 Trung Cung',
  6: 'P6 Tây Bắc',
  7: 'P7 Tây',
  8: 'P8 Đông Bắc',
  9: 'P9 Nam',
};

function normalizePalace(palace) {
  return palace === 5 ? 2 : palace;
}

function formatPillar(pillar) {
  return `${pillar.stemName} ${pillar.branchName}`;
}

function palaceOfEarthStem(chart, stemName) {
  return Number(
    Object.keys(chart.palaces).find((palace) => chart.palaces[palace]?.earthStem === stemName)
  ) || null;
}

function getCurrentEngineModel(chart) {
  const originPalace = normalizePalace(palaceOfEarthStem(chart, 'Mậu'));
  const doorRingByPalace = Object.fromEntries(
    PERIMETER.map((palace) => [palace, chart.palaces[palace]?.mon?.short || null])
  );

  return {
    id: 'current-engine',
    originPalace,
    originDoor: DOOR_BY_ORIG_PALACE[originPalace]?.short || null,
    directEnvoyPalace: chart.trucSuPalace,
    doorRingByPalace,
  };
}

function rotateDoorCycle(originPalace) {
  const baseCycle = PERIMETER.map((palace) => DOOR_BY_ORIG_PALACE[palace]);
  const startIdx = PERIMETER.indexOf(originPalace);
  if (startIdx === -1) {
    throw new Error(`Không xác định được cung gốc Môn trên chu vi: P${originPalace}`);
  }
  return baseCycle.map((_, idx) => baseCycle[(startIdx + idx) % baseCycle.length]);
}

function shiftOnNinePalaces(originPalace, steps, isDuong) {
  const zeroBased = originPalace - 1;
  const shifted = isDuong
    ? ((zeroBased + steps) % 9 + 9) % 9
    : ((zeroBased - steps) % 9 + 9) % 9;
  let destination = shifted + 1;
  if (destination === 5) destination = isDuong ? 2 : 8;
  return destination;
}

function getHypothesisModel(chart) {
  const hourCanChi = formatPillar(chart.gioPillar);
  const xun = getXunInfo(hourCanChi);
  const originPalace = normalizePalace(palaceOfEarthStem(chart, 'Mậu'));
  const steps = chart.isDuong
    ? (chart.gioPillar.branchIdx - xun.tuanBranchIdx + 12) % 12
    : (xun.tuanBranchIdx - chart.gioPillar.branchIdx + 12) % 12;
  const directEnvoyPalace = normalizePalace(
    shiftOnNinePalaces(originPalace, steps, chart.isDuong)
  );

  const orderedDoors = rotateDoorCycle(originPalace);
  const doorRingByPalace = {};
  const destinationIdx = PERIMETER.indexOf(directEnvoyPalace);
  const direction = chart.isDuong ? 1 : -1;

  if (destinationIdx === -1) {
    throw new Error(`Cung đích giả thuyết không nằm trên chu vi: P${directEnvoyPalace}`);
  }

  for (let i = 0; i < orderedDoors.length; i++) {
    const ringIdx = ((destinationIdx + i * direction) % 8 + 8) % 8;
    const palace = PERIMETER[ringIdx];
    doorRingByPalace[palace] = orderedDoors[i].short;
  }

  return {
    id: 'luoshu-trucsu-hypothesis',
    xun,
    steps,
    originPalace,
    originDoor: DOOR_BY_ORIG_PALACE[originPalace]?.short || null,
    directEnvoyPalace,
    doorRingByPalace,
  };
}

function formatDoorRing(doorRingByPalace) {
  return PERIMETER.map((palace) => `${PALACE_LABELS[palace]}:${doorRingByPalace[palace] || '—'}`).join(' | ');
}

function countDoorMismatches(referenceDoorByPalace, candidateDoorByPalace) {
  return PERIMETER.filter((palace) => referenceDoorByPalace[palace] !== candidateDoorByPalace[palace]).length;
}

function buildScore(referenceCase, model) {
  const doorMismatchCount = countDoorMismatches(referenceCase.expectedDoorByPalace, model.doorRingByPalace);
  const directEnvoyMismatch = referenceCase.expectedTrucSuPalace === model.directEnvoyPalace ? 0 : 1;
  return {
    doorMismatchCount,
    directEnvoyMismatch,
    totalMismatchCount: doorMismatchCount + directEnvoyMismatch,
  };
}

function printCaseReport(referenceCase) {
  const date = new Date(referenceCase.dateIso);
  const { chart } = analyze(date, referenceCase.hour);
  const currentModel = getCurrentEngineModel(chart);
  const hypothesisModel = getHypothesisModel(chart);
  const xun = hypothesisModel.xun;
  const currentScore = buildScore(referenceCase, currentModel);
  const hypothesisScore = buildScore(referenceCase, hypothesisModel);

  console.log(`CASE ${referenceCase.id}`);
  console.log(`  timestamp: ${referenceCase.timestamp}`);
  console.log(`  reference: ${referenceCase.referenceType}`);
  console.log(`  source: ${referenceCase.source}`);
  console.log(`  giờ/ngày: ${formatPillar(chart.gioPillar)} / ${formatPillar(chart.dayPillar)}`);
  console.log(`  độn/cục: ${chart.isDuong ? 'Dương' : 'Âm'} / ${chart.cucSo}`);
  console.log(`  tuần/tuần thủ: ${xun.tuanName} / ${chart.leadStem}`);
  console.log(`  lead stem palace: ${PALACE_LABELS[chart.leadStemPalace]}`);
  console.log(`  current-engine: origin=${PALACE_LABELS[currentModel.originPalace]} (${currentModel.originDoor}) -> direct envoy=${PALACE_LABELS[currentModel.directEnvoyPalace]}`);
  console.log(`  luoshu-trucsu-hypothesis: origin=${PALACE_LABELS[hypothesisModel.originPalace]} (${hypothesisModel.originDoor}) -> direct envoy=${PALACE_LABELS[hypothesisModel.directEnvoyPalace]} | steps=${hypothesisModel.steps}`);
  console.log(`  web1 direct envoy: ${PALACE_LABELS[referenceCase.expectedTrucSuPalace]}`);
  console.log(`  current ring: ${formatDoorRing(currentModel.doorRingByPalace)}`);
  console.log(`  hypothesis : ${formatDoorRing(hypothesisModel.doorRingByPalace)}`);
  console.log(`  web1       : ${formatDoorRing(referenceCase.expectedDoorByPalace)}`);
  console.log(`  mismatch current-engine=${currentScore.totalMismatchCount} (doors=${currentScore.doorMismatchCount}, trucSu=${currentScore.directEnvoyMismatch})`);
  console.log(`  mismatch luoshu-trucsu-hypothesis=${hypothesisScore.totalMismatchCount} (doors=${hypothesisScore.doorMismatchCount}, trucSu=${hypothesisScore.directEnvoyMismatch})`);
  console.log('');

  return {
    id: referenceCase.id,
    referenceType: referenceCase.referenceType,
    currentScore,
    hypothesisScore,
  };
}

function summarize(results) {
  const totals = results.reduce(
    (acc, result) => {
      acc.current.total += result.currentScore.totalMismatchCount;
      acc.current.doors += result.currentScore.doorMismatchCount;
      acc.current.trucSu += result.currentScore.directEnvoyMismatch;
      acc.hypothesis.total += result.hypothesisScore.totalMismatchCount;
      acc.hypothesis.doors += result.hypothesisScore.doorMismatchCount;
      acc.hypothesis.trucSu += result.hypothesisScore.directEnvoyMismatch;

      if (result.currentScore.totalMismatchCount < result.hypothesisScore.totalMismatchCount) acc.current.wins += 1;
      else if (result.hypothesisScore.totalMismatchCount < result.currentScore.totalMismatchCount) acc.hypothesis.wins += 1;
      else acc.ties += 1;

      if (result.referenceType === 'web1-screenshot') {
        acc.screenshot.current += result.currentScore.totalMismatchCount;
        acc.screenshot.hypothesis += result.hypothesisScore.totalMismatchCount;
        acc.screenshot.count += 1;
      }

      return acc;
    },
    {
      current: { total: 0, doors: 0, trucSu: 0, wins: 0 },
      hypothesis: { total: 0, doors: 0, trucSu: 0, wins: 0 },
      screenshot: { current: 0, hypothesis: 0, count: 0 },
      ties: 0,
    }
  );

  console.log('=== TỔNG KẾT SO SÁNH ===');
  for (const result of results) {
    const winner = result.currentScore.totalMismatchCount < result.hypothesisScore.totalMismatchCount
      ? 'current-engine'
      : result.hypothesisScore.totalMismatchCount < result.currentScore.totalMismatchCount
        ? 'luoshu-trucsu-hypothesis'
        : 'tie';
    console.log(
      `${result.id} | current=${result.currentScore.totalMismatchCount} | hypothesis=${result.hypothesisScore.totalMismatchCount} | winner=${winner}`
    );
  }
  console.log('');
  console.log(`current-engine total=${totals.current.total} (doors=${totals.current.doors}, trucSu=${totals.current.trucSu}, wins=${totals.current.wins})`);
  console.log(`luoshu-trucsu-hypothesis total=${totals.hypothesis.total} (doors=${totals.hypothesis.doors}, trucSu=${totals.hypothesis.trucSu}, wins=${totals.hypothesis.wins})`);
  if (totals.screenshot.count > 0) {
    console.log(`web1-screenshot only: current=${totals.screenshot.current} | hypothesis=${totals.screenshot.hypothesis} | cases=${totals.screenshot.count}`);
  }
  console.log(`ties=${totals.ties}`);
}

const selectedIds = new Set(process.argv.slice(2));
const cases = selectedIds.size
  ? WEB1_REFERENCE_CASES.filter((referenceCase) => selectedIds.has(referenceCase.id))
  : WEB1_REFERENCE_CASES;

if (!cases.length) {
  console.error('Không tìm thấy case nào khớp với filter đã nhập.');
  process.exit(1);
}

console.log(`PERIMETER ORDER: [${PERIMETER.join(', ')}]`);
console.log('');

const results = cases.map(printCaseReport);
summarize(results);
