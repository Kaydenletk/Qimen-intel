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

const hourPalace = chart.palaces[3];

assert.equal(chart.dayMarkerPalace, 3, 'dayMarkerPalace phải ở Đông / P3');
assert.equal(chart.hourMarkerPalace, 3, 'hourMarkerPalace phải ở Đông / P3');
assert.ok(chart.monthPillar?.stemName, 'monthPillar phải có stem');
assert.ok(chart.yearPillar?.stemName, 'yearPillar phải có stem');
assert.notEqual(chart.dayMarkerResolutionSource, 'unresolved', 'dayMarker phải resolve được');
assert.notEqual(chart.hourMarkerResolutionSource, 'unresolved', 'hourMarker phải resolve được');
assert.deepEqual(chart.temporalBadgesByPalace[3], ['Ngày', 'Giờ'], 'P3 phải có badges Ngày + Giờ');
assert.equal(chart.hourEnergyTone, 'dark', 'Hour tone phải là dark');
assert.equal(chart.hourEnergyVerdict, 'nghịch', 'Hour verdict phải là nghịch');
assert.ok(chart.hourEnergyScore < 0, 'Hour score phải âm');
assert.equal(chart.directEnvoyActionPalace, 9, 'Direct Envoy action palace phải là P9');
assert.equal(chart.directEnvoyActionVerdict, 'thuận', 'Direct Envoy action verdict phải là thuận');
assert.ok(['bright', 'very-bright'].includes(chart.directEnvoyActionTone), 'Direct Envoy action tone phải sáng');
assert.equal(chart.hourQuickReadSummary, 'Khí giờ đang nghịch, nhưng hành động đúng cách vẫn có cửa');

assert.equal(hourPalace?.mon?.short, 'Kinh', 'P3 phải có Kinh Môn');
assert.equal(hourPalace?.star?.short, 'Nhuế', 'P3 phải có Thiên Nhuế');
assert.equal(hourPalace?.than?.name, 'Chu Tước', 'P3 phải có Chu Tước');
assert.equal(hourPalace?.can?.name, 'Kỷ', 'Thiên Can của P3 phải giữ nguyên là Kỷ');
assert.equal(hourPalace?.earthStem, 'Canh', 'Địa Can của P3 phải giữ nguyên là Canh');
assert.equal(Boolean(hourPalace?.dayMarker), true, 'P3 phải được đánh dấu Ngày');
assert.equal(Boolean(hourPalace?.hourMarker), true, 'P3 phải được đánh dấu Giờ');
for (let p = 1; p <= 9; p++) {
  assert.equal(typeof chart.palaces[p]?.score, 'number', `P${p} phải có score`);
  assert.ok(['bright', 'neutral', 'softDark', 'dark'].includes(chart.palaces[p]?.tone), `P${p} phải có tone board-level hợp lệ`);
}

assert.equal(displayChart.dayMarkerPalace, 3, 'displayChart.dayMarkerPalace phải là 3');
assert.equal(displayChart.hourMarkerPalace, 3, 'displayChart.hourMarkerPalace phải là 3');
assert.notEqual(displayChart.hourMarkerResolutionSource, 'unresolved', 'displayChart.hourMarkerResolutionSource không được unresolved');
assert.deepEqual(displayChart.temporalBadgesByPalace[3], ['Ngày', 'Giờ'], 'displayChart phải giữ badges Ngày + Giờ cho P3');
assert.equal(displayChart.hourEnergyTone, 'dark', 'displayChart.hourEnergyTone phải là dark');
assert.equal(displayChart.hourEnergyVerdict, 'nghịch', 'displayChart.hourEnergyVerdict phải là nghịch');
assert.equal(displayChart.directEnvoyActionPalace, 9, 'displayChart.directEnvoyActionPalace phải là P9');
assert.equal(displayChart.hourQuickReadSummary, 'Khí giờ đang nghịch, nhưng hành động đúng cách vẫn có cửa');
assert.deepEqual(
  displayChart.palaces[3]?.temporalBadgeLabels?.map(label => label.displayShort),
  ['Ngày', 'Giờ'],
  'display palace P3 phải render temporal badges riêng'
);
assert.ok(
  !displayChart.palaces[3]?.flagLabels?.some(label => ['Ngày', 'Giờ'].includes(label.displayShort)),
  'Ngày/Giờ không được lẫn vào flagLabels thông thường'
);
for (let p = 1; p <= 9; p++) {
  assert.equal(displayChart.palaces[p]?.tone, chart.palaces[p]?.tone, `display tone của P${p} phải khớp engine`);
}

console.log('ASSERTIONS: OK');
