import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const serverSource = readFileSync(new URL('../server.js', import.meta.url), 'utf8');

assert.match(serverSource, /const CHART_TIME_MODE = /, 'Client script phải nhận mode live\\/manual từ server');
assert.match(serverSource, /const INITIAL_CHART_TIME = /, 'Client script phải nhận initial chart time từ server');
assert.match(serverSource, /function getEffectiveChartTimeFromLocation\(/, 'Client script phải có resolver thời gian thống nhất');
assert.match(serverSource, /window\.location\.assign\(window\.location\.pathname \+ window\.location\.hash\)/, 'Nút Hiện Tại phải đưa về root path mà không ghi date\\/hour\\/minute vào URL');
assert.doesNotMatch(serverSource, /window\.location\.replace\(window\.location\.pathname \+ window\.location\.hash\)/, 'Không được tự reload page theo live mode nữa');
assert.doesNotMatch(serverSource, /setInterval\(tickClock,\s*1000\)/, 'Không được giữ timer cập nhật theo giây');
assert.doesNotMatch(serverSource, /getMillisecondsUntilNextMinute\(/, 'Không được giữ logic minute rollover trong client');
assert.doesNotMatch(serverSource, /const nextUrl = '\/\?date='/, 'Không được tiếp tục tự ghi query params stale trong live mode');

console.log('ASSERTIONS: OK');
