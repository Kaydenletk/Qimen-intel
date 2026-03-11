import assert from 'node:assert/strict';

import {
  buildCompanionPrompt,
  buildKimonPrompt,
  buildKimonSystemInstruction,
} from '../src/logic/kimon/promptBuilder.js';
import {
  buildStrategyPrompt,
  buildStrategySystemInstruction,
} from '../src/logic/kimon/strategyPrompt.js';

const qmdjData = {
  selectedTopicKey: 'su-nghiep',
  selectedTopicCanonicalDungThan: {
    palaceNum: 6,
    palaceName: 'Càn',
    direction: 'Tây Bắc',
    matchedByText: 'Khai Môn',
    targetSummary: 'Khai Môn',
    boardText: 'Cung Tây Bắc (P6): Môn Khai · Thần Trực Phù',
  },
  hourMarkerPalace: 6,
  hourMarkerDirection: 'Tây Bắc',
  hourDoor: 'Khai',
  hourStar: 'Phụ',
  hourDeity: 'Trực Phù',
  hourEnergyScore: 8,
  directEnvoyPalace: 8,
  directEnvoyDirection: 'Đông Bắc',
  directEnvoyDoor: 'Sinh',
  directEnvoyStar: 'Tâm',
  directEnvoyDeity: 'Cửu Địa',
  directEnvoyActionScore: 5,
};

const groundingBundle = {
  mode: 'grounded',
  strict: true,
  reason: 'Luận theo thư tịch trực tiếp',
  methodologyChunk: {
    title: 'Kỳ môn độn giáp Trương Hải Ban',
    chunkId: 'truong-hai-ban-s01-c01',
    text: 'Can Ngày đại diện người hỏi, Can Tháng đại diện đối tác, Can Giờ đại diện sự việc.',
  },
  topicalChunks: [
    {
      title: 'Kỳ môn độn giáp Trương Hải Ban',
      chunkId: 'truong-hai-ban-s02-c01',
      text: 'Thông thường lấy cửa Khai đại biểu công việc và chức vụ.',
    },
  ],
  sources: [
    {
      sourceId: 'truong-hai-ban',
      title: 'Kỳ môn độn giáp Trương Hải Ban',
      chunkIds: ['truong-hai-ban-s01-c01', 'truong-hai-ban-s02-c01'],
    },
  ],
};

const methodologyOnlyBundle = {
  ...groundingBundle,
  mode: 'methodology_only',
  reason: 'Luận theo nguyên lý cơ bản do chưa có đoạn chuyên biệt',
  topicalChunks: [],
};

const topicSystem = buildKimonSystemInstruction({ groundingBundle });
const strategySystem = buildStrategySystemInstruction({ groundingBundle });
const topicPrompt = buildKimonPrompt({
  qmdjData,
  userContext: 'Sự nghiệp hiện tại ra sao?',
  groundingBundle,
});
const strategyPrompt = buildStrategyPrompt({
  qmdjData,
  userContext: 'Sự nghiệp hiện tại ra sao?',
  topicKey: 'su-nghiep',
  groundingBundle,
});
const companionPrompt = buildCompanionPrompt({
  qmdjData,
  userContext: 'Nay công việc ổn không?',
  groundingBundle,
});
const methodologyOnlyPrompt = buildKimonPrompt({
  qmdjData,
  userContext: 'Mang thai có tin vui không?',
  groundingBundle: methodologyOnlyBundle,
});

assert.match(topicSystem, /\[GROUNDING BẮT BUỘC\]/);
assert.match(strategySystem, /\[GROUNDING BẮT BUỘC\]/);

assert.match(topicPrompt, /\[THƯ TỊCH BẮT BUỘC\]/);
assert.match(topicPrompt, /\[NGUYÊN LÝ CỐT LÕI\]/);
assert.match(topicPrompt, /\[TRÍCH ĐOẠN LIÊN QUAN\]/);
assert.match(topicPrompt, /truong-hai-ban-s01-c01/);
assert.match(topicPrompt, /Thông thường lấy cửa Khai đại biểu công việc/i);

assert.match(strategyPrompt.userPrompt, /\[THƯ TỊCH BẮT BUỘC\]/);
assert.match(strategyPrompt.userPrompt, /\[NGUYÊN LÝ CỐT LÕI\]/);
assert.match(strategyPrompt.systemPrompt, /\[GROUNDING BẮT BUỘC\]/);

assert.match(companionPrompt.systemPrompt, /\[GROUNDING BẮT BUỘC\]/);
assert.match(companionPrompt.userPrompt, /\[THƯ TỊCH BẮT BUỘC\]/);

assert.match(methodologyOnlyPrompt, /\[GIỚI HẠN THƯ TỊCH\]/);
assert.match(methodologyOnlyPrompt, /nguyên lý cơ bản/i);

console.log('kimon-grounding-prompt.mjs: OK');
