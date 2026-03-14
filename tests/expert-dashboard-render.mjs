import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const serverSource = readFileSync(new URL('../server.js', import.meta.url), 'utf8');

assert.match(
  serverSource,
  /<div id="topicAnalysisTable" class="expert-copy-grid">/,
  'Expert mode phải render container dạng copy-first mới'
);
assert.doesNotMatch(
  serverSource,
  /<table id="topicAnalysisTable"/,
  'Expert mode không được còn render bảng table kiểu cũ'
);
assert.match(
  serverSource,
  /class="expert-copy-card expert-copy-card--\$\{toneKey\}"/,
  'Mỗi cung expert phải map tone thành card class riêng'
);
assert.match(
  serverSource,
  /class="expert-copy-card-title"/,
  'Card expert phải có title rõ cung và hướng'
);
assert.match(
  serverSource,
  /renderExpertField\('Marker', renderExpertValue\(markerText\)\)/,
  'Expert mode phải giữ marker riêng để copy đủ ngữ cảnh thời gian'
);
assert.match(
  serverSource,
  /renderExpertField\('Cờ', renderExpertValue\(flagText\)\)/,
  'Expert mode phải giữ cờ riêng để copy đủ ngữ cảnh'
);
assert.match(
  serverSource,
  /renderExpertField\('Cách cục & trạng thái', renderExpertValue\(mergedPatternText\)\)/,
  'Expert mode phải gộp cách cục và trạng thái thành một field sạch cho AI'
);
assert.doesNotMatch(
  serverSource,
  /renderExpertField\('BG Base'|renderExpertField\('BG Tags'|renderExpertField\('BG Reasons'|renderExpertField\('Tone'/,
  'Expert mode không được còn nhồi BG debug và tone vào card copy-first'
);
assert.doesNotMatch(
  serverSource,
  /renderExpertField\('Cách cục', renderExpertValue\(cachCucText\)\)|renderExpertField\('Pattern động', renderExpertValue\(specialPatternText\)\)|renderExpertField\('Pattern hợp nhất'/,
  'Expert mode không nên còn tách pattern thành nhiều field trùng nghĩa'
);
assert.doesNotMatch(
  serverSource,
  /Phi Tinh #\$\{escapeHTML\(String\(phiText\)\)\} · Score/,
  'Card expert không nên còn meta Phi Tinh/Score kiểu debug'
);
assert.doesNotMatch(
  serverSource,
  /class="expert-reason-trigger"|class="expert-reason-popover"|class="expert-dashboard"|class="expert-row"/,
  'Không được còn layout dashboard và popover cũ'
);

console.log('ASSERTIONS: OK');
