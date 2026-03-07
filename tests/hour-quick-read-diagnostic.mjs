import assert from 'node:assert/strict';
import { analyze, buildHourDiagnosticRecord } from '../src/index.js';

const DATE = new Date('2026-03-06T00:00:00');
const HOURS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

const rows = HOURS.map(hour => {
  const { chart } = analyze(DATE, hour);
  return buildHourDiagnosticRecord(chart, hour);
});

const headers = [
  ['hour', 4],
  ['hourPillar', 10],
  ['hourMarkerPalace', 16],
  ['hourPalaceDirection', 18],
  ['door', 6],
  ['star', 6],
  ['deity', 10],
  ['hourEnergyScore', 15],
  ['hourEnergyTone', 14],
  ['trucSuPalace', 12],
  ['trucSuScore', 11],
  ['finalCombinedVerdict', 0],
];

const formatCell = (value, width) => {
  const text = String(value ?? '—');
  return width > 0 ? text.padEnd(width) : text;
};

console.log(`DIAGNOSTIC 12 THOI THAN · ${DATE.toISOString().slice(0, 10)}`);
console.log(headers.map(([key, width]) => formatCell(key, width)).join(' | '));
console.log(headers.map(([, width]) => (width > 0 ? '-'.repeat(width) : '-'.repeat(36))).join('-|-'));
for (const row of rows) {
  console.log(headers.map(([key, width]) => formatCell(row[key], width)).join(' | '));
}

const toneCounts = rows.reduce((acc, row) => {
  acc[row.hourEnergyTone] = (acc[row.hourEnergyTone] || 0) + 1;
  return acc;
}, {});
const uniqueMarkerPalaces = [...new Set(rows.map(row => row.hourMarkerPalace).filter(Boolean))];
const unresolvedMarkers = rows.filter(row => row.hourMarkerResolutionSource === 'unresolved');

console.log('');
console.log(`Marker sequence: ${rows.map(row => `P${row.hourMarkerPalace}`).join(' → ')}`);
console.log(`Marker sources : ${rows.map(row => row.hourMarkerResolutionSource).join(', ')}`);
console.log(`Tone counts    : ${JSON.stringify(toneCounts)}`);

assert.ok(uniqueMarkerPalaces.length >= 4, 'hourMarkerPalace không được đứng hoặc lặp bất thường trên cả 12 thời thần');
assert.equal(unresolvedMarkers.length, 0, 'hourMarkerPalace phải resolve được ở mọi thời thần');
assert.ok((toneCounts['bright'] || 0) + (toneCounts['very-bright'] || 0) >= 2, '12 thời thần phải có ít nhất 2 khung sáng');
assert.ok((toneCounts['dark'] || 0) <= 2, '12 thời thần không nên rơi vào dark quá nhiều');
assert.ok((toneCounts['dim'] || 0) + (toneCounts['dark'] || 0) >= 2, '12 thời thần phải có đủ các khung sẫm để giữ tính phân biệt');

console.log('ASSERTIONS: OK');
