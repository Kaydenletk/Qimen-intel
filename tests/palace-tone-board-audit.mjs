import assert from 'node:assert/strict';
import { analyze, buildDisplayChart } from '../src/index.js';
import { WEB1_REFERENCE_CASES } from './web1ReferenceCases.mjs';

const TONE_SET = new Set(['bright', 'neutral', 'softDark', 'dark']);
const SWEEP_COUNT = 30;
const sweepStart = new Date('2026-03-05T00:00:00');

function timestampLabel(date, hour) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d} ${String(hour).padStart(2, '0')}:00`;
}

function buildSweepTimestamps() {
  const entries = [];
  for (let i = 0; i < SWEEP_COUNT; i++) {
    const date = new Date(sweepStart.getTime() + i * 60 * 60 * 1000);
    entries.push({ date, hour: date.getHours(), label: timestampLabel(date, date.getHours()) });
  }
  return entries;
}

function collectBoardIssues(chart, displayChart, label) {
  const issues = [];
  for (let p = 1; p <= 9; p++) {
    const palace = chart.palaces[p];
    const displayPalace = displayChart.palaces[p];
    if (typeof palace?.score !== 'number') {
      issues.push(`${label} | P${p} | missing-engine-score`);
    }
    if (!TONE_SET.has(palace?.tone)) {
      issues.push(`${label} | P${p} | missing-engine-tone`);
    }
    if (!TONE_SET.has(displayPalace?.tone)) {
      issues.push(`${label} | P${p} | missing-display-tone`);
    }
    if ((displayPalace?.tone || '') !== (palace?.tone || '')) {
      issues.push(`${label} | P${p} | tone-mapping-mismatch engine=${palace?.tone} display=${displayPalace?.tone}`);
    }

    const components = palace?.scoreBreakdown?.flagComponents || {};
    if (palace?.trucPhu && components.trucPhu !== 1) {
      issues.push(`${label} | P${p} | trucPhu missing from flag score`);
    }
    if (palace?.trucSu && components.trucSu !== 1) {
      issues.push(`${label} | P${p} | trucSu missing from flag score`);
    }
    if (palace?.dichMa && components.dichMa !== 1) {
      issues.push(`${label} | P${p} | dichMa missing from flag score`);
    }
    if (palace?.khongVong && components.khongVong !== -2) {
      issues.push(`${label} | P${p} | khongVong missing from flag score`);
    }
    if (chart.isPhucAm && components.phucAm !== -1) {
      issues.push(`${label} | P${p} | phucAm missing from flag score`);
    }
    if (chart.isPhanNgam && components.phanNgam !== -1) {
      issues.push(`${label} | P${p} | phanNgam missing from flag score`);
    }
  }

  if (Object.keys(chart.boardPalaces || {}).length !== 9) {
    issues.push(`${label} | boardPalaces missing or incomplete`);
  }

  return issues;
}

function compareWeb1Fixture(referenceCase) {
  const date = new Date(referenceCase.dateIso);
  const { chart } = analyze(date, referenceCase.hour);
  const issues = [];

  for (const [palace, expectedDoor] of Object.entries(referenceCase.expectedDoorByPalace)) {
    const actualDoor = chart.boardPalaces?.[palace]?.door || '';
    if (actualDoor !== expectedDoor) {
      issues.push(`${referenceCase.id} | P${palace} | reference-door-mismatch actual=${actualDoor} expected=${expectedDoor}`);
    }
  }

  if (chart.trucSuPalace !== referenceCase.expectedTrucSuPalace) {
    issues.push(`${referenceCase.id} | trucSu mismatch actual=P${chart.trucSuPalace} expected=P${referenceCase.expectedTrucSuPalace}`);
  }

  return issues;
}

const sweepIssues = [];
for (const entry of buildSweepTimestamps()) {
  const { chart } = analyze(entry.date, entry.hour);
  const displayChart = buildDisplayChart(chart);
  sweepIssues.push(...collectBoardIssues(chart, displayChart, entry.label));
}

const allFixtureIssues = WEB1_REFERENCE_CASES.flatMap(compareWeb1Fixture);
const trustedTypes = new Set(['user-image-reference', 'user-reported-reference']);
const trustedFixtureIssues = WEB1_REFERENCE_CASES
  .filter(referenceCase => trustedTypes.has(referenceCase.referenceType))
  .flatMap(compareWeb1Fixture);

console.log(`SWEEP_TIMESTAMPS=${SWEEP_COUNT}`);
console.log(`SWEEP_ISSUES=${sweepIssues.length}`);
if (sweepIssues.length) {
  sweepIssues.slice(0, 50).forEach(issue => console.log(issue));
}

console.log(`REFERENCE_FIXTURE_CASES=${WEB1_REFERENCE_CASES.length}`);
console.log(`REFERENCE_FIXTURE_ISSUES_ALL=${allFixtureIssues.length}`);
console.log(`REFERENCE_FIXTURE_ISSUES_TRUSTED=${trustedFixtureIssues.length}`);
if (allFixtureIssues.length) {
  allFixtureIssues.forEach(issue => console.log(issue));
}

assert.equal(sweepIssues.length, 0, '30 timestamp sweep still has board/tone issues');
assert.equal(trustedFixtureIssues.length, 0, 'Trusted reference fixture comparison still has mapping/rotation issues');

console.log('ASSERTIONS: OK');
