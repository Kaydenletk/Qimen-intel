import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const serverSource = readFileSync(new URL('../server.js', import.meta.url), 'utf8');

assert.match(
  serverSource,
  /<div class="palace-grid-subtitle">Âm lịch \/ Can Chi<\/div>/,
  'Overview strip phải có subtitle Âm lịch / Can Chi'
);

assert.match(
  serverSource,
  /const timeStripItems = \[\s*\{ shortLabel: 'G', label: getSectionLabel\('Giờ'\), pillar: displayChart\.gioPillar,/s,
  'Time strip phải lấy trụ Giờ từ displayChart.gioPillar'
);
assert.match(
  serverSource,
  /shortLabel: 'Ng', label: getSectionLabel\('Ngày'\), pillar: displayChart\.dayPillar,/,
  'Time strip phải lấy trụ Ngày từ displayChart.dayPillar'
);
assert.match(
  serverSource,
  /shortLabel: 'Th', label: getSectionLabel\('Tháng'\), pillar: displayChart\.monthPillar,/,
  'Time strip phải lấy trụ Tháng từ displayChart.monthPillar'
);
assert.match(
  serverSource,
  /shortLabel: 'Na', label: getSectionLabel\('Năm'\), pillar: displayChart\.yearPillar,/,
  'Time strip phải lấy trụ Năm từ displayChart.yearPillar'
);

assert.match(
  serverSource,
  /const centerLunarRows = \[\s*timeStripItems\.slice\(0, 2\),\s*timeStripItems\.slice\(2, 4\),\s*\];/s,
  'Trung Cung phải xếp 4 trụ thành 2 dòng gọn'
);
assert.match(
  serverSource,
  /<div class="center-lunar-stack" aria-label="Âm lịch \/ Can Chi">/,
  'Trung Cung phải có stack 4 trụ âm lịch'
);
assert.doesNotMatch(
  serverSource,
  /const structureModeLabel =/,
  'Trung Cung không được còn dựng nhãn Cục X Dương Độn riêng'
);
assert.doesNotMatch(
  serverSource,
  /escapeHTML\(structureModeLabel\)/,
  'Trung Cung không được render structureModeLabel cũ'
);

console.log('ASSERTIONS: OK');
