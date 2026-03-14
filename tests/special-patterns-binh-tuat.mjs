import assert from 'node:assert/strict';
import { buildFullChart } from '../src/core/flying.js';
import { buildDisplayChart } from '../src/ui/displayMappings.js';

const chart = buildFullChart(new Date('2026-03-13T19:57:00'), '19');

assert.equal(chart.gioPillar.stemName, 'Mậu');
assert.equal(chart.gioPillar.branchName, 'Tuất');
assert.equal(chart.dayPillar.stemName, 'Bính');
assert.equal(chart.dayPillar.branchName, 'Tuất');

assert.ok(chart.palaces[9].specialPatterns.some(item => item.name === 'Thanh Long bị thương'), 'P9 phải có Thanh Long bị thương');
assert.ok(chart.palaces[4].specialPatterns.some(item => item.name === 'Chu Tước khẩu thiệt ảo'), 'P4 phải có Chu Tước khẩu thiệt ảo');
assert.ok(chart.palaces[4].specialPatterns.some(item => item.name === 'Thiên La'), 'P4 phải có Thiên La');
assert.ok(chart.palaces[6].specialPatterns.some(item => item.name === 'Nhật kỳ nhập mộ'), 'P6 phải có Nhật kỳ nhập mộ');
assert.ok(chart.palaces[9].patternScoreDelta < 0, 'P9 bị Thanh Long bị thương nên patternScoreDelta phải âm');

const displayChart = buildDisplayChart(chart);
assert.ok(displayChart.palaces[9].patternLabels.some(item => item.internalName === 'Thanh Long bị thương'), 'Display phải merge Thanh Long bị thương vào patternLabels');
assert.ok(displayChart.palaces[4].patternLabels.some(item => item.internalName === 'Chu Tước khẩu thiệt ảo'), 'Display phải merge Chu Tước khẩu thiệt ảo vào patternLabels');

console.log('✅ special-patterns-binh-tuat.mjs — all tests passed');
