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
  assert.ok(
    /thanh khoản|giữ tiền mặt|không dồn vốn/i.test(`${insight.coreMessage} ${insight.narrative} ${insight.do.join(' ')}`),
    `Expected defensive wealth wording, got ${insight.coreMessage} // ${insight.narrative}`
  );
  assert.ok(
    !/nhà|đất|cọc|pháp lý/i.test(`${insight.coreMessage} ${insight.narrative}`),
    'Wealth insight must not leak property-specific wording'
  );
}

function testWealthShortTermCase() {
  const chart = buildChartWithPalace(9, {
    mon: { name: 'Khai Môn', short: 'Khai' },
    star: { name: 'Thiên Xung', short: 'Xung' },
    than: { name: 'Cửu Thiên' },
    can: { name: 'Bính' },
    dichMa: true,
  });

  chart.dayPillar = { stemName: 'Tân' };
  chart.palaces[4] = {
    can: { name: 'Mậu' },
    khongVong: false,
  };

  const topicResult = buildTopicResult({
    palaceNum: 9,
    dir: 'S',
    palaceName: 'Ly',
    score: 3,
  });

  const insight = generateStrategicInsight({
    chart,
    topicKey: 'tai-van',
    topicResult,
  });

  assert.ok(
    /tốc độ|thanh khoản nhanh|đánh nhanh|chốt/i.test(`${insight.coreMessage} ${insight.narrative} ${insight.do.join(' ')}`),
    `Expected short-term wealth reading, got ${insight.coreMessage} // ${insight.narrative}`
  );
}

function testWealthLongTermCase() {
  const chart = buildChartWithPalace(8, {
    mon: { name: 'Sinh Môn', short: 'Sinh' },
    star: { name: 'Thiên Nhậm', short: 'Nhậm' },
    than: { name: 'Cửu Địa' },
    can: { name: 'Kỷ' },
    dichMa: false,
  });

  chart.dayPillar = { stemName: 'Giáp' };
  chart.palaces[2] = {
    can: { name: 'Mậu' },
    khongVong: false,
  };

  const topicResult = buildTopicResult({
    palaceNum: 8,
    dir: 'NE',
    palaceName: 'Cấn',
    score: 3,
  });

  const insight = generateStrategicInsight({
    chart,
    topicKey: 'tai-van',
    topicResult,
  });

  assert.ok(
    /kiên nhẫn|tích lũy|thesis|nhiều nhịp|dài hạn/i.test(`${insight.coreMessage} ${insight.narrative} ${insight.do.join(' ')}`),
    `Expected long-term wealth reading, got ${insight.coreMessage} // ${insight.narrative}`
  );
}

function testPropertyInsightSeparatedCase() {
  const chart = buildChartWithPalace(2, {
    mon: { name: 'Sinh Môn', short: 'Sinh' },
    star: { name: 'Thiên Phụ', short: 'Phụ' },
    than: { name: 'Cửu Địa' },
    can: { name: 'Mậu' },
  });

  const topicResult = buildTopicResult({
    palaceNum: 2,
    dir: 'SW',
    palaceName: 'Khôn',
    score: 2,
  });

  const insight = generateStrategicInsight({
    chart,
    topicKey: 'bat-dong-san',
    topicResult,
  });

  assert.ok(
    /pháp lý|hồ sơ|giao dịch|cọc|quy hoạch/i.test(`${insight.coreMessage} ${insight.narrative} ${insight.do.join(' ')}`),
    `Expected property wording, got ${insight.coreMessage} // ${insight.narrative}`
  );
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

function testStudyInsightCase() {
  const chart = buildChartWithPalace(9, {
    mon: { name: 'Cảnh Môn', short: 'Cảnh' },
    than: { name: 'Cửu Thiên' },
    star: { name: 'Thiên Phụ', short: 'Phụ' },
    can: { name: 'Đinh' },
    khongVong: false,
    trucSu: false,
    trucPhu: false,
  });

  const topicResult = buildTopicResult({
    palaceNum: 9,
    dir: 'S',
    palaceName: 'Ly',
    score: 1,
  });

  const insight = generateStrategicInsight({
    chart,
    topicKey: 'hoc-tap',
    topicResult,
  });

  assert.equal(insight.score, 1, `Expected study score=1, got ${insight.score}`);
  assert.ok(
    /học tập|ôn tập|kiến thức/i.test(insight.coreMessage + ' ' + insight.narrative),
    `Expected study narrative, got ${insight.coreMessage} // ${insight.narrative}`
  );
}

function testFamilyInsightCase() {
  const chart = buildChartWithPalace(7, {
    mon: { name: 'Hưu Môn', short: 'Hưu' },
    than: { name: 'Lục Hợp' },
    star: { name: 'Thiên Phụ', short: 'Phụ' },
    can: { name: 'Kỷ' },
    khongVong: false,
    trucSu: false,
    trucPhu: false,
  });

  const topicResult = buildTopicResult({
    palaceNum: 7,
    dir: 'W',
    palaceName: 'Đoài',
    score: 1,
  });

  const insight = generateStrategicInsight({
    chart,
    topicKey: 'gia-dao',
    topicResult,
  });

  assert.ok(insight.score >= 0, `Expected family score >= 0, got ${insight.score}`);
  assert.ok(
    /gia đạo|gia đình|trong nhà/i.test(insight.coreMessage + ' ' + insight.narrative),
    `Expected family narrative, got ${insight.coreMessage} // ${insight.narrative}`
  );
}

testWealthWarningCase();
testWealthShortTermCase();
testWealthLongTermCase();
testPropertyInsightSeparatedCase();
testHealthDigestiveFocusCase();
testNegotiationAdvantageCase();
testStudyInsightCase();
testFamilyInsightCase();

console.log('dungThanStrategic.test.mjs: OK');
