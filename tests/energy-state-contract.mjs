import assert from 'node:assert/strict';
import { buildEnergyStateBundle } from '../src/logic/kimon/energyState.js';

const qmdjData = {
  solarTerm: 'Kinh Trập',
  isPhucAm: false,
  isPhanNgam: true,
  selectedTopicUsefulPalace: 8,
  displayPalaces: {
    8: {
      mon: { name: 'Sinh Môn', short: 'Sinh', element: 'Thổ', type: 'cat' },
      star: { name: 'Thiên Phụ', short: 'Phụ', element: 'Mộc', type: 'cat' },
      than: { name: 'Lục Hợp', element: 'Mộc', type: 'cat' },
      can: { name: 'Đinh' },
      earthStem: 'Kỷ',
      khongVong: true,
      cachCuc: [{ name: 'Thanh Long Phản Thủ', type: 'Đại Cát' }],
      specialPatterns: [{ name: 'Không Vong hóa ảo', type: 'hung' }],
    },
    6: {
      mon: { name: 'Khai Môn', short: 'Khai', element: 'Kim', type: 'cat' },
      star: { name: 'Thiên Tâm', short: 'Tâm', element: 'Kim', type: 'cat' },
      than: { name: 'Trực Phù', element: 'Thổ', type: 'cat' },
      can: { name: 'Canh' },
      earthStem: 'Mậu',
      khongVong: false,
    },
  },
  hourMarkerPalace: 6,
  directEnvoyPalace: 8,
};

const bundle = buildEnergyStateBundle({ qmdjData });

assert.ok(bundle.usefulGodState, 'Phải tạo usefulGodState');
assert.equal(bundle.usefulGodState.vitality, 'Tử khí');
assert.equal(bundle.usefulGodState.transparency, 'Không Vong');
assert.equal(bundle.usefulGodState.structure, 'Phản Phục');
assert.equal(bundle.usefulGodState.tension, 'Xung');
assert.match(bundle.usefulGodState.effectiveState, /ảo|ruột rỗng/i);
assert.match(bundle.usefulGodState.doorPalaceRelation, /Môn hòa Cung/i);
assert.match(bundle.usefulGodState.doorTimeRelation, /Tử khí/i);
assert.ok(bundle.usefulGodState.rescueCondition, 'Không Vong + tín hiệu đẹp phải có điều kiện cứu');

assert.ok(bundle.hourState, 'Phải tạo hourState');
assert.equal(bundle.hourState.palaceNum, 6);
assert.match(bundle.topicStateSummary, /Dụng Thần đang ở trạng thái/i);

console.log('✅ energy-state-contract.mjs — all tests passed');
