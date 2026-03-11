import assert from 'node:assert/strict';

import { __test as groundingTest, buildGroundingUserContext } from '../src/logic/kimon/grounding.js';
import { normalizeLooseVietnameseText, toTightSearchKey } from '../src/logic/kimon/textNormalization.js';

function makeChunk({
  sourceId = 'truong-hai-ban',
  title = 'Kỳ môn độn giáp Trương Hải Ban',
  sectionKey,
  chunkId,
  text,
  chunkRole = 'topical',
  prevChunkId = null,
  nextChunkId = null,
}) {
  return {
    sourceId,
    title,
    sectionKey,
    chunkId,
    text,
    searchKey: normalizeLooseVietnameseText(text),
    tightSearchKey: toTightSearchKey(text),
    chunkRole,
    prevChunkId,
    nextChunkId,
  };
}

assert.equal(
  normalizeLooseVietnameseText('sự-nghiệp'),
  normalizeLooseVietnameseText('su nghiep'),
  'normalize phải gom được dấu, gạch nối và khoảng trắng'
);

assert.equal(
  normalizeLooseVietnameseText('Sự nghiệp'),
  normalizeLooseVietnameseText('sự nghiệp'),
  'normalize phải xử lý giống nhau giữa Unicode dựng sẵn và tổ hợp'
);

const methodologyChunk = makeChunk({
  sectionKey: 'truong-hai-ban:section:01',
  chunkId: 'truong-hai-ban-s01-c01',
  text: 'Can ngay dai dien cho nguoi hoi, can thang dai dien cho doi tac, can gio dai dien cho su viec. Dung than la truc chinh de luan giai.',
  chunkRole: 'methodology',
});

const careerChunk = makeChunk({
  sectionKey: 'truong-hai-ban:section:02',
  chunkId: 'truong-hai-ban-s02-c01',
  text: 'Thong thuong lay cua khai dai bieu cong viec va chuc vu. Neu cua khai sinh can ngay thi duong su de mo vai tro moi.',
  nextChunkId: 'truong-hai-ban-s02-c02',
});

const careerAdjacentChunk = makeChunk({
  sectionKey: 'truong-hai-ban:section:02',
  chunkId: 'truong-hai-ban-s02-c02',
  text: 'Khi cung cong viec gap cat than va can ngay duoc tuong sinh, co the thang chuc hoac doi viec co cua mo.',
  prevChunkId: 'truong-hai-ban-s02-c01',
});

const wealthChunk = makeChunk({
  sectionKey: 'truong-hai-ban:section:03',
  chunkId: 'truong-hai-ban-s03-c01',
  text: 'Sinh mon chu loi nhuan, can Mau chu von va thanh khoan. Sinh mon vuong thi dong tien de tho hon.',
});

careerChunk.prevChunkId = methodologyChunk.chunkId;
careerAdjacentChunk.nextChunkId = wealthChunk.chunkId;
wealthChunk.prevChunkId = careerAdjacentChunk.chunkId;

const corpus = {
  readySources: [{ sourceId: 'truong-hai-ban', title: 'Kỳ môn độn giáp Trương Hải Ban' }],
  methodologyChunk,
  chunks: [methodologyChunk, careerChunk, careerAdjacentChunk, wealthChunk],
};

const careerBundle = groundingTest.createGroundingBundleFromCorpus({
  topic: 'su-nghiep',
  userContext: 'Sự nghiệp hiện tại ra sao?',
  corpus,
});

assert.equal(careerBundle.mode, 'grounded');
assert.equal(careerBundle.methodologyChunk.chunkId, methodologyChunk.chunkId);
assert.ok(
  careerBundle.topicalChunks.some(chunk => chunk.chunkId === careerChunk.chunkId),
  'sự nghiệp phải match được chunk có công việc/cửa khai'
);
assert.ok(
  careerBundle.topicalChunks.some(chunk => chunk.chunkId === careerAdjacentChunk.chunkId),
  'best hit mạnh phải kéo thêm chunk kề cận cùng section'
);
assert.equal(careerBundle.sources.length, 1);
assert.equal(careerBundle.sources[0].sourceId, 'truong-hai-ban');

const wealthBundle = groundingTest.createGroundingBundleFromCorpus({
  topic: 'tai-van',
  userContext: 'Tài vận có ổn không?',
  corpus,
});

assert.equal(wealthBundle.mode, 'grounded');
assert.ok(
  wealthBundle.topicalChunks.some(chunk => chunk.chunkId === wealthChunk.chunkId),
  'tài vận phải match được chunk chứa Sinh Môn hoặc Mậu'
);

const methodologyOnlyBundle = groundingTest.createGroundingBundleFromCorpus({
  topic: 'mang-thai',
  userContext: 'Mang thai co tin vui khong?',
  corpus,
});

assert.equal(methodologyOnlyBundle.mode, 'methodology_only');
assert.equal(methodologyOnlyBundle.topicalChunks.length, 0);
assert.match(buildGroundingUserContext(methodologyOnlyBundle), /\[GIỚI HẠN THƯ TỊCH\]/);

const noSourceBundle = groundingTest.createGroundingBundleFromCorpus({
  topic: 'su-nghiep',
  userContext: 'Sự nghiệp hiện tại ra sao?',
  corpus: {
    readySources: [],
    methodologyChunk: null,
    chunks: [],
  },
});

assert.equal(noSourceBundle.mode, 'no_source');
assert.equal(noSourceBundle.reason, 'Chưa đủ thư tịch đã nạp');

console.log('kimon-grounding.mjs: OK');
