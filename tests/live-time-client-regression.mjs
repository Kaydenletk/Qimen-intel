import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const serverSource = readFileSync(new URL('../server.js', import.meta.url), 'utf8');

assert.match(serverSource, /const CHART_TIME_MODE = /, 'Client script phải nhận mode live\\/manual từ server');
assert.match(serverSource, /const INITIAL_CHART_TIME = /, 'Client script phải nhận initial chart time từ server');
assert.match(serverSource, /function getEffectiveChartTimeFromLocation\(/, 'Client script phải có resolver thời gian thống nhất');
assert.match(serverSource, /function buildLiveChartUrl\(/, 'Client script phải tự dựng URL live từ giờ browser');
assert.match(serverSource, /window\.location\.replace\(targetUrl\)/, 'Live mode phải tự đồng bộ lại chart bằng full reload khi lệch phút\\/timezone');
assert.match(serverSource, /window\.location\.assign\(targetUrl\)/, 'Nút Hiện Tại phải dùng cùng một đường live URL để tránh split-brain');
assert.match(serverSource, /getMillisecondsUntilNextMinute\(/, 'Live mode phải tự rollover sang phút kế tiếp');
assert.doesNotMatch(serverSource, /window\.location\.assign\(window\.location\.pathname \+ window\.location\.hash\)/, 'Không được quay về root trống rồi render sai theo giờ server');
assert.doesNotMatch(serverSource, /setInterval\(tickClock,\s*1000\)/, 'Không cần timer cập nhật theo giây');

console.log('ASSERTIONS: OK');
