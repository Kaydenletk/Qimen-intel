import assert from 'node:assert/strict';
import { evaluateStates } from '../src/core/states.js';
import { evaluateSpecialPatterns } from '../src/core/specialPatterns.js';

const graveHits = evaluateStates(
  {
    can: { name: 'Bính' },
  },
  { palaceNum: 6 }
);

assert.ok(graveHits.some(item => item.name === 'Nhập Mộ'), 'Bính tại cung Tuất (P6) phải ra Nhập Mộ');
assert.ok(graveHits.every(item => item.type === 'warning'), 'State warnings phải có type=warning');

const usefulGodNhamHits = evaluateStates(
  {
    can: { name: 'Nhâm' },
  },
  { palaceNum: 4, isUsefulGod: true }
);

assert.ok(usefulGodNhamHits.some(item => item.name === 'Thiên La/Địa Võng'), 'Nhâm tại cung hành động phải ra Thiên La/Địa Võng');

const patternSummary = evaluateSpecialPatterns({
  selectedTopicUsefulPalace: 4,
  trucPhuPalace: 1,
  trucSuPalace: 8,
  palaces: {
    1: {
      isNgayCan: true,
      than: { name: 'Trực Phù' },
      mon: { short: 'Khai', name: 'Khai Môn' },
      can: { name: 'Canh' },
      cachCuc: [],
    },
    2: {},
    3: {},
    4: {
      can: { name: 'Nhâm' },
      mon: { short: 'Đỗ', name: 'Đỗ Môn' },
      than: { name: 'Cửu Địa' },
      cachCuc: [],
    },
    5: {},
    6: {
      can: { name: 'Bính' },
      mon: { short: 'Hưu', name: 'Hưu Môn' },
      than: { name: 'Thái Âm' },
      cachCuc: [],
    },
    7: {},
    8: {
      can: { name: 'Đinh' },
      mon: { short: 'Sinh', name: 'Sinh Môn' },
      than: { name: 'Trực Phù' },
      khongVong: true,
      cachCuc: [],
    },
    9: {},
  },
});

assert.ok(patternSummary.byPalace[1].some(item => item.name === 'Phù Kỳ tương trợ'), 'Trực Phù đồng cung Nhật Can phải ra Phù Kỳ tương trợ');
assert.ok(patternSummary.byPalace[4].some(item => item.name === 'Thiên La/Địa Võng'), 'Cung Dụng Thần có Nhâm phải có Thiên La/Địa Võng');
assert.ok(patternSummary.byPalace[6].some(item => item.name === 'Nhập Mộ'), 'Bính tại cung Tuất phải merge Nhập Mộ vào specialPatterns');
assert.ok(patternSummary.byPalace[8].some(item => item.name === 'Nhân Độn'), 'Sinh + Đinh + Trực Phù phải ra Nhân Độn');
assert.ok(patternSummary.byPalace[8].some(item => item.name === 'Sứ giả bị vướng'), 'Trực Sử dính Không Vong phải ra Sứ giả bị vướng');
assert.ok(patternSummary.patternScoreDelta[8] > 0 || patternSummary.patternScoreDelta[8] < 0, 'Pattern delta tại P8 phải phản ánh tổng pattern');

console.log('✅ phase2-thap-can-khac-ung-states.mjs — all tests passed');
