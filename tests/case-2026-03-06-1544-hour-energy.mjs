import assert from 'node:assert/strict';
import { analyze, buildDisplayChart } from '../src/index.js';

const DATE = new Date('2026-03-06T15:44:00');
const HOUR = 15;

const { chart } = analyze(DATE, HOUR);
const displayChart = buildDisplayChart(chart);

console.log(
  'CASE',
  DATE.toISOString(),
  'hour',
  HOUR,
  `${chart.gioPillar.stemName}${chart.gioPillar.branchName}`,
  'marker-day',
  chart.dayMarkerPalace,
  'marker-hour',
  chart.hourMarkerPalace,
  'tone',
  chart.hourEnergyTone,
  'verdict',
  chart.hourEnergyVerdict,
  'score',
  chart.hourEnergyScore,
);

const markerPalace = chart.palaces[3];

assert.equal(chart.dayMarkerPalace, 3, 'dayMarkerPalace phải ở Đông / P3');
assert.equal(chart.hourMarkerPalace, 3, 'hourMarkerPalace phải ở Đông / P3');
assert.ok(chart.monthPillar?.stemName, 'monthPillar phải có stem');
assert.ok(chart.yearPillar?.stemName, 'yearPillar phải có stem');
assert.notEqual(chart.dayMarkerResolutionSource, 'unresolved', 'dayMarker phải resolve được');
assert.notEqual(chart.hourMarkerResolutionSource, 'unresolved', 'hourMarker phải resolve được');
assert.deepEqual(chart.temporalBadgesByPalace[3], ['Ngày', 'Giờ'], 'P3 phải có đủ badge Ngày/Giờ');
assert.equal(chart.hourEnergyTone, 'dark', 'Hour tone phải là dark');
assert.equal(chart.hourEnergyVerdict, 'nghịch', 'Hour verdict phải là nghịch');
assert.ok(chart.hourEnergyScore < 0, 'Hour score phải âm');
assert.equal(chart.directEnvoyActionPalace, 9, 'Direct Envoy action palace phải là P9');
assert.equal(chart.directEnvoyActionVerdict, 'thuận', 'Direct Envoy action verdict phải là thuận');
assert.equal(chart.directEnvoyActionTone, 'very-bright', 'Direct Envoy action tone phải là very-bright');
assert.equal(chart.hourQuickReadSummary, 'Khí giờ đang nghịch, nhưng hành động đúng cách vẫn có cửa', 'Quick read summary phải phản ánh khí giờ nghịch nhưng còn cửa hành động');

assert.equal(markerPalace?.mon?.short, 'Kinh', 'P3 phải có Kinh Môn');
assert.equal(markerPalace?.star?.short, 'Nhuế', 'P3 phải có Thiên Nhuế');
assert.equal(markerPalace?.than?.name, 'Chu Tước', 'P3 phải có Chu Tước');
assert.equal(markerPalace?.can?.name, 'Kỷ', 'Thiên Can của P3 phải là Kỷ');
assert.equal(markerPalace?.earthStem, 'Canh', 'Địa Can của P3 phải là Canh');
assert.equal(Boolean(markerPalace?.dayMarker), true, 'P3 phải được đánh dấu Ngày');
assert.equal(Boolean(markerPalace?.hourMarker), true, 'P3 phải được đánh dấu Giờ');
for (let p = 1; p <= 9; p++) {
  assert.equal(typeof chart.palaces[p]?.score, 'number', `P${p} phải có score`);
  assert.ok(['bright', 'neutral', 'softDark', 'dark'].includes(chart.palaces[p]?.tone), `P${p} phải có tone board-level hợp lệ`);
}

assert.equal(displayChart.dayMarkerPalace, 3, 'displayChart.dayMarkerPalace phải là 3');
assert.equal(displayChart.hourMarkerPalace, 3, 'displayChart.hourMarkerPalace phải là 3');
assert.notEqual(displayChart.hourMarkerResolutionSource, 'unresolved', 'displayChart.hourMarkerResolutionSource không được unresolved');
assert.deepEqual(displayChart.temporalBadgesByPalace[3], ['Ngày', 'Giờ'], 'displayChart phải giữ đủ badge Ngày/Giờ cho P3');
assert.equal(displayChart.hourEnergyTone, 'dark', 'displayChart.hourEnergyTone phải là dark');
assert.equal(displayChart.hourEnergyVerdict, 'nghịch', 'displayChart.hourEnergyVerdict phải là nghịch');
assert.equal(displayChart.directEnvoyActionPalace, 9, 'displayChart.directEnvoyActionPalace phải là P9');
assert.equal(displayChart.hourQuickReadSummary, 'Khí giờ đang nghịch, nhưng hành động đúng cách vẫn có cửa', 'displayChart.hourQuickReadSummary phải khớp engine');
assert.deepEqual(
  displayChart.palaces[3]?.temporalBadgeLabels?.map(label => label.displayShort),
  ['Ngày', 'Giờ'],
  'display palace P3 phải render đủ temporal badge Ngày/Giờ'
);
assert.ok(
  !displayChart.palaces[3]?.flagLabels?.some(label => ['Ngày', 'Giờ'].includes(label.displayShort)),
  'Ngày/Giờ không được lẫn vào flagLabels thông thường'
);
for (let p = 1; p <= 9; p++) {
  assert.equal(displayChart.palaces[p]?.tone, chart.palaces[p]?.tone, `display tone của P${p} phải khớp engine`);
}

console.log('ASSERTIONS: OK');
