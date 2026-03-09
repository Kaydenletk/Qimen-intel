import assert from 'node:assert/strict';
import { analyze } from '../src/index.js';

const studyDate = new Date(2026, 2, 7, 3, 0, 0);
const { topicResults: studyTopics } = analyze(studyDate, 3, ['hoc-tap']);
const study = studyTopics['hoc-tap'];

assert.equal(
  study.strategicInsight.evidence.flags.some(flag => flag.name === 'VOID'),
  true,
  'hoc-tap case phải carry VOID vào strategic insight'
);
assert.match(
  study.actionAdvice,
  /Không Vong|ảo ảnh|lời hứa suông|Đừng dồn/i,
  'ActionAdvice học tập phải ưu tiên cảnh báo VOID'
);
assert.match(
  study.strategicInsight.coreMessage,
  /Không Vong|lời hứa suông|chưa nên đặt cược/i,
  'coreMessage học tập phải phản ánh VOID'
);

const promiseDate = new Date(2026, 2, 7, 21, 0, 0);
const { topicResults: loveTopics } = analyze(promiseDate, 21, ['tinh-duyen']);
const love = loveTopics['tinh-duyen'];

assert.equal(
  love.strategicInsight.evidence.flags.some(flag => flag.name === 'VOID'),
  true,
  'case lời hứa tình cảm phải carry VOID'
);
assert.match(
  love.actionAdvice,
  /Không Vong|ảo ảnh|nói được mà chưa chắc làm được|Đừng dồn/i,
  'ActionAdvice tình duyên phải cảnh báo lời hứa suông'
);
assert.match(
  love.strategicInsight.narrative,
  /Không Vong|ảo ảnh|chưa chắc làm được/i,
  'narrative tình duyên phải nói rõ VOID'
);

const horseVoidDate = new Date(2026, 4, 9, 7, 0, 0);
const { topicResults: horseVoidTopics } = analyze(horseVoidDate, 7, ['hoc-tap']);
const horseVoidStudy = horseVoidTopics['hoc-tap'];

assert.equal(
  horseVoidStudy.strategicInsight.evidence.flags.some(flag => flag.name === 'VOID'),
  true,
  'combo case phải carry VOID'
);
assert.equal(
  horseVoidStudy.strategicInsight.evidence.flags.some(flag => flag.name === 'DICH_MA'),
  true,
  'combo case phải carry DICH_MA'
);
assert.match(
  horseVoidStudy.actionAdvice,
  /ngựa chạy vào hố|phanh gấp|Đừng ôn cấp tốc/i,
  'ActionAdvice combo phải bật cảnh báo ngựa chạy vào hố'
);
assert.match(
  horseVoidStudy.strategicInsight.coreMessage,
  /Dịch Mã \+ Không Vong|phanh gấp/i,
  'coreMessage combo phải override về phanh gấp'
);
