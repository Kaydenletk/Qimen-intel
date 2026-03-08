import assert from 'node:assert/strict';
import { analyze } from '../src/index.js';
import { buildInsight, __test } from '../src/core/insightEngine.js';

const DATE = new Date('2026-03-03T12:00:00');
const HOUR = 5;

function testTopicMapping() {
  const cases = {
    'tai-van': 'MONEY_INVEST',
    'kinh-doanh': 'MONEY_INVEST',
    'ky-hop-dong': 'MONEY_INVEST',
    'dam-phan': 'MONEY_INVEST',
    'doi-no': 'MONEY_INVEST',
    'bat-dong-san': 'MONEY_INVEST',
    'dien-trach': 'MONEY_INVEST',
    'su-nghiep': 'CAREER_INTERVIEW',
    'xin-viec': 'CAREER_INTERVIEW',
    'muu-luoc': 'CAREER_INTERVIEW',
    'kien-tung': 'CAREER_INTERVIEW',
    'thi-cu': 'EXAM_STUDY',
    'suc-khoe': 'HEALTH_CHECK',
    'tinh-duyen': 'MONEY_INVEST',
    'tinh-yeu': 'MONEY_INVEST',
    'xuat-hanh': 'MONEY_INVEST',
  };

  for (const [topicKey, expected] of Object.entries(cases)) {
    const notes = [];
    const resolved = __test.resolveTopicMapping(topicKey, notes);
    assert.equal(resolved.libraryKey, expected, `map ${topicKey} -> ${expected}`);
  }

  const notes = [];
  const unknown = __test.resolveTopicMapping('khong-ton-tai', notes);
  assert.equal(unknown.libraryKey, 'MONEY_INVEST');
  assert.ok(notes.some(n => n.includes('fallback MONEY_INVEST')));
}

function testDoorAndStarNormalize() {
  assert.equal(__test.normalizeDoorName('Sinh'), 'Sinh');
  assert.equal(__test.normalizeDoorName('Sinh Môn'), 'Sinh');
  assert.equal(__test.normalizeDoorName('Hưu'), 'Huu');
  assert.equal(__test.normalizeDoorName('Đỗ Môn'), 'Do');
  assert.equal(__test.normalizeDoorName('Cảnh'), 'Canh');
  assert.equal(__test.normalizeDoorName('Tử Môn'), 'Tu');

  assert.equal(__test.normalizeStarName('Thiên Phụ'), 'ThienPhu');
  assert.equal(__test.normalizeStarName('Thiên Nhuế'), 'ThienNhue');
  assert.equal(__test.normalizeStarName('Thiên Tâm'), 'ThienTam');
}

function testConfidenceMultipliers() {
  const confidence = __test.computeConfidence([
    { name: 'VOID', multiplier: 0.75 },
    { name: 'FU_YIN', multiplier: 0.6 },
  ]);
  assert.equal(confidence, 0.324);

  const floored = __test.computeConfidence([
    { name: 'A', multiplier: 0.01 },
    { name: 'B', multiplier: 0.01 },
    { name: 'C', multiplier: 0.01 },
  ]);
  assert.equal(floored, 0.1);
}

function testActionLabelMapping() {
  assert.equal(__test.actionLabelFromMode('GO'), 'Làm');
  assert.equal(__test.actionLabelFromMode('GO_FAST'), 'Làm');
  assert.equal(__test.actionLabelFromMode('GO_WITH_GUARD'), 'Làm');
  assert.equal(__test.actionLabelFromMode('GO_LIGHT'), 'Làm nhẹ');
  assert.equal(__test.actionLabelFromMode('HOLD'), 'Chờ');
  assert.equal(__test.actionLabelFromMode('WAIT'), 'Chờ');
  assert.equal(__test.actionLabelFromMode('CUT'), 'Tránh');
}

function testBuildInsightContract() {
  const { chart, topicResults } = analyze(DATE, HOUR, ['tai-van']);
  const topicResult = topicResults['tai-van'];

  const insight = buildInsight({
    chart,
    topicKey: 'tai-van',
    topicResult,
    globalFlags: {
      FU_YIN: chart.isPhucAm,
      FAN_YIN: chart.isPhanNgam,
    },
  });

  assert.ok(insight && typeof insight === 'object');
  assert.ok(['Làm', 'Làm nhẹ', 'Chờ', 'Tránh'].includes(insight.actionLabel));
  assert.equal(typeof insight.oneLiner, 'string');
  assert.equal(typeof insight.confidence, 'number');
  assert.ok(Array.isArray(insight.evidence));
  assert.ok(Array.isArray(insight.tactics.do));
  assert.ok(Array.isArray(insight.tactics.avoid));
  assert.ok(Array.isArray(insight.learn.usefulGods));
  assert.ok(Array.isArray(insight.learn.flags));
  assert.ok(Array.isArray(insight.learn.mappingNotes));
  assert.ok(insight.learn.mappingNotes.some(n => n.includes('GRAVE/Nhập Mộ')));
}

function testGravePlaceholderDoesNotReduceConfidence() {
  const chart = {
    isPhucAm: false,
    isPhanNgam: false,
    palaces: {
      3: {
        mon: { short: 'Sinh' },
        star: { name: 'Thiên Phụ' },
        than: { name: 'Lục Hợp' },
        can: { name: 'Bính' },
        earthStem: 'Mậu',
        khongVong: false,
        trucSu: false,
        trucPhu: false,
        dichMa: false,
      },
    },
  };
  const topicResult = {
    usefulGodPalace: 3,
    usefulGodDir: 'E',
    usefulGodPalaceName: 'Chấn',
    actionAdvice: 'fallback',
  };
  const insight = buildInsight({
    chart,
    topicKey: 'tai-van',
    topicResult,
    globalFlags: { GRAVE: true },
  });

  assert.equal(insight.confidence, 0.72);
  assert.ok(insight.learn.mappingNotes.some(n => n.includes('bỏ qua multiplier')));
}

function testAnalyzeBackCompatAndInsightPresent() {
  const { topicResults } = analyze(DATE, HOUR, ['tai-van', 'suc-khoe']);

  for (const key of ['tai-van', 'suc-khoe']) {
    const result = topicResults[key];
    assert.equal(typeof result.score, 'number');
    assert.ok(result.verdict && typeof result.verdict.label === 'string');
    assert.equal(typeof result.usefulGodPalace, 'number');
    assert.equal(typeof result.usefulGodDir, 'string');
    assert.ok(result.insight && typeof result.insight === 'object');
  }
}

function testAnalyzeDefaultsUseCanonicalTopicKeys() {
  const { topicResults } = analyze(DATE, HOUR);
  assert.ok(topicResults['tinh-duyen'], 'Default analyze should include tinh-duyen');
  assert.ok(topicResults['bat-dong-san'], 'Default analyze should include bat-dong-san');
  assert.ok(topicResults['hoc-tap'], 'Default analyze should include hoc-tap');
  assert.ok(!topicResults['tinh-yeu'], 'Default analyze should not duplicate alias tinh-yeu');
  assert.ok(!topicResults['dien-trach'], 'Default analyze should not duplicate alias dien-trach');
}

testTopicMapping();
testDoorAndStarNormalize();
testConfidenceMultipliers();
testActionLabelMapping();
testBuildInsightContract();
testGravePlaceholderDoesNotReduceConfidence();
testAnalyzeBackCompatAndInsightPresent();
testAnalyzeDefaultsUseCanonicalTopicKeys();

console.log('insightEngine.test.mjs: OK');
