import assert from 'node:assert/strict';
import { analyze } from '../src/index.js';

const date = new Date(2026, 2, 9, 10, 0, 0);
const { topicResults } = analyze(date, 10, ['tai-van']);
const wealth = topicResults['tai-van'];

assert.ok(wealth.strategicInsight.markersForAI, 'strategicInsight phải có markersForAI');
assert.ok(wealth.strategicInsight.markersForAI.rootCausePalace, 'phải có rootCausePalace');
assert.ok(wealth.strategicInsight.markersForAI.actionPalace != null, 'phải có actionPalace');

if (wealth.strategicInsight.nguHanhRelation) {
  assert.ok(wealth.strategicInsight.nguHanhRelation.promptBlock.includes('[TƯƠNG QUAN LỰC LƯỢNG]'));
}

console.log('✅ markers-for-ai.mjs — all tests passed');
