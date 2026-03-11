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
  /renderExpertField\('BG Reasons', renderExpertReasons\(reasons\), \{ multiline: true \}\)/,
  'Expert mode phải hiển thị BG Reasons trực tiếp theo label để tiện copy'
);
assert.match(
  serverSource,
  /renderExpertField\('BG Base', renderExpertValue\(bgBaseText\)\)/,
  'Expert mode phải hiển thị BG Base'
);
assert.match(
  serverSource,
  /renderExpertField\('BG Tags', renderExpertValue\(bgTagsText\), \{ multiline: bgTagsText !== '—' \}\)/,
  'Expert mode phải hiển thị BG Tags'
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
assert.doesNotMatch(
  serverSource,
  /class="expert-reason-trigger"|class="expert-reason-popover"|class="expert-dashboard"|class="expert-row"/,
  'Không được còn layout dashboard và popover cũ'
);

console.log('ASSERTIONS: OK');
