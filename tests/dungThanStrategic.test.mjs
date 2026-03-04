import assert from 'node:assert/strict';
import { generateStrategicInsight } from '../src/logic/dungThan/index.js';

function buildChartWithPalace(palaceNum, palaceOverrides = {}) {
  return {
    isPhucAm: false,
    isPhanNgam: false,
    palaces: {
      [palaceNum]: {
        mon: { name: 'Sinh Môn', short: 'Sinh' },
        star: { name: 'Thiên Phụ', short: 'Phụ' },
        than: { name: 'Lục Hợp' },
        can: { name: 'Bính' },
        earthStem: 'Mậu',
        khongVong: false,
        trucSu: false,
        trucPhu: false,
        dichMa: false,
        ...palaceOverrides,
      },
    },
  };
}

function buildTopicResult({ palaceNum, dir = 'E', palaceName = 'Chấn', score = 0 } = {}) {
  return {
    topic: 'Mock Topic',
    score,
    usefulGodPalace: palaceNum,
    usefulGodDir: dir,
    usefulGodPalaceName: palaceName,
    actionAdvice: 'Fallback action advice',
  };
}

function testWealthWarningCase() {
  const chart = buildChartWithPalace(2, {
    mon: { name: 'Sinh Môn', short: 'Sinh' },
    than: { name: 'Bạch Hổ' },
    can: { name: 'Mậu' },
    khongVong: true,
  });

  const topicResult = buildTopicResult({
    palaceNum: 2,
    dir: 'SW',
    palaceName: 'Khôn',
    score: 2,
  });

  const insight = generateStrategicInsight({
    chart,
    topicKey: 'tai-van',
    topicResult,
  });

  assert.equal(typeof insight.score, 'number');
  assert.ok(
    insight.score === -1 || /phòng thủ|cắt/i.test(insight.headline),
    `Expected warning signal; got score=${insight.score}, headline=${insight.headline}`
  );
  assert.ok(insight.confidence < 0.72, `Expected confidence drop under 0.72, got ${insight.confidence}`);
}

function testHealthDigestiveFocusCase() {
  const chart = buildChartWithPalace(2, {
    mon: { name: 'Hưu Môn', short: 'Hưu' },
    star: { name: 'Thiên Nhuế', short: 'Nhuế' },
    can: { name: 'Mậu' },
    earthStem: 'Kỷ',
  });

  const topicResult = buildTopicResult({
    palaceNum: 2,
    dir: 'SW',
    palaceName: 'Khôn',
    score: 0,
  });

  const insight = generateStrategicInsight({
    chart,
    topicKey: 'suc-khoe',
    topicResult,
  });

  assert.equal(typeof insight.recommendedDepartment, 'string');
  assert.ok(
    /tiêu hóa/i.test(insight.recommendedDepartment),
    `Expected digestive recommendation, got ${insight.recommendedDepartment}`
  );
}

function testNegotiationAdvantageCase() {
  const chart = buildChartWithPalace(9, {
    mon: { name: 'Khai Môn', short: 'Khai' },
    than: { name: 'Trực Phù' },
    star: { name: 'Thiên Tâm', short: 'Tâm' },
    can: { name: 'Đinh' },
    khongVong: false,
    trucSu: false,
    trucPhu: true,
  });

  const topicResult = buildTopicResult({
    palaceNum: 9,
    dir: 'S',
    palaceName: 'Ly',
    score: 2,
  });

  const insight = generateStrategicInsight({
    chart,
    topicKey: 'dam-phan',
    topicResult,
  });

  assert.equal(insight.score, 1, `Expected negotiation score=1, got ${insight.score}`);
  assert.ok(
    /chốt|lợi thế/i.test(insight.headline),
    `Expected CHỐT/LỢI THẾ headline, got ${insight.headline}`
  );
}

testWealthWarningCase();
testHealthDigestiveFocusCase();
testNegotiationAdvantageCase();

console.log('dungThanStrategic.test.mjs: OK');
