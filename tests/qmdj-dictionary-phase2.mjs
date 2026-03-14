import assert from 'node:assert/strict';
import QMDJ_DICTIONARY from '../src/lib/qmdj_dictionary.json' with { type: 'json' };
import { evaluateStates } from '../src/core/states.js';
import { evaluateSpecialPatterns } from '../src/core/specialPatterns.js';

assert.ok(QMDJ_DICTIONARY.stemStemPatterns?.['Mậu']?.['Bính'], 'Dictionary phải có stemStemPatterns cho Mậu/Bính');
assert.ok(Array.isArray(QMDJ_DICTIONARY.cuuDonPatterns), 'Dictionary phải có mảng cuuDonPatterns');
assert.ok(QMDJ_DICTIONARY.majorPatterns?.su_gia_dac_the, 'Dictionary phải có major pattern Sứ giả đắc thế');

const netHits = evaluateStates(
  {
    can: { name: 'Quý' },
  },
  { palaceNum: 4, isUsefulGod: true }
);

assert.ok(netHits.some(item => item.name === 'Thiên La/Địa Võng'), 'Quý tại cung trọng điểm phải đi qua lớp Thiên La/Địa Võng');
assert.ok(netHits.some(item => item.isPhysicalConstraint === true), 'State hits Mộ/La/Võng phải gắn isPhysicalConstraint');

const patternSummary = evaluateSpecialPatterns({
  dayPillar: { stemName: 'Bính' },
  trucSuPalace: 9,
  palaces: {
    1: {},
    2: {},
    3: {},
    4: {},
    5: {},
    6: {},
    7: {},
    8: {},
    9: {
      can: { name: 'Ất' },
      mon: { short: 'Khai', name: 'Khai Môn', element: 'Hỏa' },
      than: { name: 'Cửu Thiên' },
      cachCuc: [],
    },
  },
});

assert.ok(patternSummary.byPalace[9].some(item => item.name === 'Sứ giả đắc thế'), 'Trực Sử lâm cung sinh/hòa phải ra Sứ giả đắc thế');

console.log('✅ qmdj-dictionary-phase2.mjs — all tests passed');
