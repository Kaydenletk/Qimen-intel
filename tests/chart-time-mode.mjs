import assert from 'node:assert/strict';
import {
  getEffectiveChartTime,
  getMillisecondsUntilNextMinute,
  getLocalTimeParts,
  hasExplicitTimeOverride,
  isLiveTimeMode,
  isIsoDateInputValue,
  isSameResolvedMinute,
} from '../src/ui/chartTime.js';

const NOW = new Date(2026, 2, 6, 19, 20, 45, 250);
const LATER = new Date(2026, 2, 6, 19, 21, 2, 10);

const liveTime = getEffectiveChartTime(new URLSearchParams(''), NOW);
assert.equal(liveTime.mode, 'live', 'Không có query params thì phải vào live mode');
assert.equal(liveTime.dateInputValue, getLocalTimeParts(NOW).date, 'Live mode phải lấy ngày hiện tại');
assert.equal(liveTime.hour, 19, 'Live mode phải lấy giờ hiện tại');
assert.equal(liveTime.minute, 20, 'Live mode phải lấy phút hiện tại');
assert.equal(hasExplicitTimeOverride(new URLSearchParams('')), false, 'Clean URL không được xem là manual');

const manualTime = getEffectiveChartTime(new URLSearchParams('date=2026-03-06&hour=19&minute=20'), NOW);
assert.equal(manualTime.mode, 'manual', 'Có query params thì phải vào manual mode');
assert.equal(manualTime.dateInputValue, '2026-03-06', 'Manual mode phải giữ nguyên ngày từ URL');
assert.equal(manualTime.hour, 19, 'Manual mode phải giữ nguyên giờ từ URL');
assert.equal(manualTime.minute, 20, 'Manual mode phải giữ nguyên phút từ URL');
assert.equal(hasExplicitTimeOverride(new URLSearchParams('date=2026-03-06&hour=19&minute=20')), true, 'URL override phải được nhận diện');
assert.equal(isIsoDateInputValue('2026-03-07'), true, 'Date picker/query phải dùng ISO YYYY-MM-DD');
assert.equal(isIsoDateInputValue('07/03/2026'), false, 'Không được parse nhầm DD/MM/YYYY thành ngày hợp lệ');
assert.equal(isLiveTimeMode(new URLSearchParams('live=1')), true, 'Flag live=1 phải được nhận diện');

const liveQueryTime = getEffectiveChartTime(new URLSearchParams('live=1&date=2026-03-06&hour=19&minute=20'), NOW);
assert.equal(liveQueryTime.mode, 'live', 'live=1 phải giữ page ở live mode dù có date/hour/minute');
assert.equal(liveQueryTime.dateInputValue, '2026-03-06', 'Live mode có query vẫn phải giữ đúng ngày đang render');
assert.equal(liveQueryTime.hour, 19, 'Live mode có query vẫn phải giữ đúng giờ đang render');
assert.equal(liveQueryTime.minute, 20, 'Live mode có query vẫn phải giữ đúng phút đang render');

const invalidLocaleDate = getEffectiveChartTime(new URLSearchParams('date=07/03/2026&hour=19&minute=20'), NOW);
assert.equal(invalidLocaleDate.dateInputValue, getLocalTimeParts(NOW).date, 'Ngày không đúng ISO phải fallback an toàn, không trượt Can Chi âm thầm');

const liveLater = getEffectiveChartTime(new URLSearchParams(''), LATER);
assert.equal(liveLater.mode, 'live', 'Live mode phải vẫn là live sau khi thời gian đổi');
assert.equal(liveLater.minute, 21, 'Live mode phải đổi phút khi sang phút mới');
assert.equal(isSameResolvedMinute(liveTime, liveLater), false, 'Live mode không được kẹt ở phút cũ');

const delay = getMillisecondsUntilNextMinute(NOW);
assert.ok(delay > 0, 'Delay tới phút tiếp theo phải dương');
assert.ok(delay <= 60000, 'Delay tới phút tiếp theo không được vượt quá 60 giây');

console.log('ASSERTIONS: OK');
