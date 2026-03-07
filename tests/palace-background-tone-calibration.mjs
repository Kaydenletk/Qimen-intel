import assert from 'node:assert/strict';
import { analyze } from '../src/index.js';

const DATE = new Date('2026-03-06T19:20:00');
const HOUR = 19;

const { chart } = analyze(DATE, HOUR);
const p2 = chart.palaces[2];
const p7 = chart.palaces[7];

assert.ok(p2?.backgroundDebug, 'P2 phải có backgroundDebug');
assert.ok(p7?.backgroundDebug, 'P7 phải có backgroundDebug');

assert.equal(p2?.backgroundTone, 'softDark', 'P2 phải được Trực Phù che chắn để hạ xuống softDark');
assert.equal(p7?.backgroundTone, 'dark', 'P7 phải tối hơn vì Kinh + Đằng Xà cộng hưởng hung');
assert.ok((p7?.backgroundDebug?.finalScore ?? 0) < (p2?.backgroundDebug?.finalScore ?? 0), 'Điểm nền của P7 phải nặng hơn P2 sau modifier rules');
assert.ok((p2?.backgroundDebug?.modifierAdjustments?.trucPhuShield ?? 0) >= 4, 'P2 phải có shield modifier mạnh từ Trực Phù');
assert.ok((p7?.backgroundDebug?.modifierAdjustments?.toxicResonance ?? 0) <= -3, 'P7 phải có toxic resonance modifier');
assert.ok((p2?.backgroundDebug?.finalScore ?? 0) <= -4 && (p2?.backgroundDebug?.finalScore ?? 0) > -8, 'P2 phải ở vùng softDark gần mốc web1');
assert.ok((p7?.backgroundDebug?.finalScore ?? 0) <= -8, 'P7 phải rơi vào vùng dark');
assert.ok((p7?.backgroundDebug?.tagAdjustments?.khongVong ?? 0) > -1, 'Không Vong ở P7 chỉ được làm tối nhẹ, không kéo cả ô xuống dark');
assert.ok(
  (p7?.backgroundDebug?.reasons || []).some(reason => reason.includes('Không Vong')),
  'P7 phải ghi rõ Không Vong chỉ là cảnh báo nền nhẹ trong debug reasons'
);
assert.ok(
  (p2?.backgroundDebug?.reasons || []).some(reason => reason.includes('Trực Phù che chắn')),
  'P2 phải ghi rõ modifier che chắn của Trực Phù'
);
assert.ok(
  (p7?.backgroundDebug?.reasons || []).some(reason => reason.includes('Kinh + Đằng Xà')),
  'P7 phải ghi rõ modifier cộng hưởng hung'
);

console.log('ASSERTIONS: OK');
