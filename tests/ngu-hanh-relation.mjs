import assert from 'node:assert/strict';
import { compareNguHanh } from '../src/logic/dungThan/nguHanhRelation.js';

const r1 = compareNguHanh(6, 3, 'Canh');
assert.equal(r1.relationship, 'user_controls_target');
assert.ok(r1.summary.includes('kiểm soát'));
assert.ok(r1.promptBlock.includes('[TƯƠNG QUAN LỰC LƯỢNG]'));

const r2 = compareNguHanh(3, 6, 'Giáp');
assert.equal(r2.relationship, 'target_controls_user');
assert.ok(r2.summary.includes('áp lực'));

const r3 = compareNguHanh(1, 3, 'Nhâm');
assert.equal(r3.relationship, 'user_produces_target');
assert.ok(r3.summary.includes('dồn'));

const r4 = compareNguHanh(2, 8, 'Mậu');
assert.equal(r4.relationship, 'same');

const r5 = compareNguHanh(null, 3, 'Giáp');
assert.equal(r5, null);

console.log('✅ ngu-hanh-relation.mjs — all tests passed');
