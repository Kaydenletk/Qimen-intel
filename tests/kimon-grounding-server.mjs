import assert from 'node:assert/strict';

import { __test as serverTest } from '../server.js';

const noSourceBundle = {
  mode: 'no_source',
  strict: true,
  reason: 'Chưa đủ thư tịch đã nạp',
  methodologyChunk: null,
  topicalChunks: [],
  sources: [],
};

const groundedBundle = {
  mode: 'grounded',
  strict: true,
  reason: 'Luận theo thư tịch trực tiếp',
  methodologyChunk: {
    sourceId: 'truong-hai-ban',
    title: 'Kỳ môn độn giáp Trương Hải Ban',
    chunkId: 'truong-hai-ban-s01-c01',
    text: 'Can Ngày đại diện người hỏi.',
  },
  topicalChunks: [
    {
      sourceId: 'truong-hai-ban',
      title: 'Kỳ môn độn giáp Trương Hải Ban',
      chunkId: 'truong-hai-ban-s02-c01',
      text: 'Thông thường lấy cửa Khai đại biểu công việc.',
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

const fallbackPayload = serverTest.createKimonFallbackPayload({
  tier: 'topic',
  topic: 'su-nghiep',
  message: 'Chưa đủ thư tịch đã nạp',
  groundingBundle: noSourceBundle,
});

assert.equal(fallbackPayload.grounding.mode, 'no_source');
assert.equal(fallbackPayload.grounding.reason, 'Chưa đủ thư tịch đã nạp');

const parsedPayload = serverTest.finalizeKimonParsedPayload({
  responseFormat: 'json',
  rawText: '{"lead":"Có cửa","message":"Bám Khai Môn để đọc trục công việc.","closingLine":"Cửa mở nhưng phải khóa điều khoản."}',
  tier: 'topic',
  topic: 'su-nghiep',
  groundingBundle: groundedBundle,
});

assert.equal(parsedPayload.grounding.mode, 'grounded');
assert.equal(parsedPayload.grounding.sources[0].sourceId, 'truong-hai-ban');

const generationContext = serverTest.buildKimonGenerationContext({
  apiKey: '',
  tier: 'topic',
  topic: 'su-nghiep',
  qmdjData: {},
  userContext: 'Sự nghiệp hiện tại ra sao?',
  groundingBundle: noSourceBundle,
});

assert.equal(generationContext.skipModelCall, true);
assert.equal(generationContext.model, null);
assert.equal(generationContext.responseFormat, 'json');
assert.equal(generationContext.groundingBundle.mode, 'no_source');

console.log('kimon-grounding-server.mjs: OK');
