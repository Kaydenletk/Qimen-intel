import assert from 'node:assert/strict';
import { analyze } from '../src/index.js';

const date = new Date(2026, 2, 8, 18, 21, 0);
const { topicResults } = analyze(date, 18, ['hoc-tap', 'thi-cu']);

const study = topicResults['hoc-tap'];
assert.equal(study.usefulGodPalace, 6, 'hoc-tap phải neo vào cung có Cảnh Môn/Dịch Mã cho case đề cương');
assert.equal(study.usefulGodPalaceName, 'Càn');
assert.match(study.actionAdvice, /Tây Bắc|Cảnh Môn/i);
assert.ok(
  study.reasons.some(reason => /Cảnh Môn/.test(reason)),
  'hoc-tap phải ghi nhận Cảnh Môn là lý do chính'
);
assert.ok(
  study.reasons.some(reason => /Dịch Mã/.test(reason)),
  'hoc-tap phải ghi nhận Dịch Mã trong reasons'
);
assert.equal(
  study.strategicInsight.evidence.flags.some(flag => flag.name === 'DICH_MA'),
  true,
  'study strategic insight phải mang cờ DICH_MA'
);
assert.equal(
  study.insight.learn.flags.some(flag => flag.name === 'DICH_MA'),
  true,
  'insight engine cũng phải carry DICH_MA, không được giữ logic cũ'
);
assert.ok(
  study.insight.evidence.some(line => /Dịch Mã|Flags đang chi phối nhịp\/cường độ/i.test(line)),
  'insight evidence phải phản ánh flags thay vì nói không có red-flag'
);
assert.match(
  study.strategicInsight.narrative,
  /Dịch Mã đang bật|đến rất nhanh|đón đầu/i,
  'narrative học tập phải phản ánh nhịp nhanh của Dịch Mã'
);

const exam = topicResults['thi-cu'];
assert.equal(exam.usefulGodPalace, study.usefulGodPalace, 'thi-cu phải neo cùng cung với hoc-tap khi cùng hỏi trục đề cương/ôn thi');
assert.equal(exam.usefulGodPalaceName, study.usefulGodPalaceName);
assert.ok(
  exam.reasons.some(reason => /Cảnh Môn/.test(reason)),
  'thi-cu cũng phải ghi nhận Cảnh Môn là lý do chính'
);
assert.equal(
  exam.strategicInsight.evidence.flags.some(flag => flag.name === 'DICH_MA'),
  true,
  'thi-cu strategic insight phải mang cờ DICH_MA giống hoc-tap'
);

const voidFanDate = new Date(2026, 2, 7, 21, 0, 0);
const { topicResults: voidFanTopics } = analyze(voidFanDate, 21, ['hoc-tap', 'thi-cu']);
const voidStudy = voidFanTopics['hoc-tap'];
const voidExam = voidFanTopics['thi-cu'];

assert.equal(voidStudy.usefulGodPalace, voidExam.usefulGodPalace, 'hoc-tap và thi-cu phải dùng cùng cung trong case VOID + FAN_YIN');
assert.equal(voidStudy.usefulGodPalaceName, voidExam.usefulGodPalaceName);
assert.deepEqual(
  voidStudy.strategicInsight.evidence.flags.map(flag => flag.name).sort(),
  voidExam.strategicInsight.evidence.flags.map(flag => flag.name).sort(),
  'hoc-tap và thi-cu phải carry cùng bộ flags, không được split logic'
);
assert.ok(
  voidStudy.strategicInsight.headline === voidExam.strategicInsight.headline,
  'hoc-tap và thi-cu phải cho cùng headline chiến lược khi dùng chung cung'
);
