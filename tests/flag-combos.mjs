/**
 * flag-combos.mjs — Tests for Flag Conflict Engine (flagCombos.js)
 *
 * Verifies: combo detection priority, Yin-dominates-Yang rule,
 * score overrides, topic advice, backward compatibility.
 */

import assert from 'node:assert/strict';
import {
  COMBO_DEFS,
  detectFlagCombos,
  getPrimaryCombo,
  getComboTopicAdvice,
  getComboAdviceForDungThan,
} from '../src/logic/dungThan/flagCombos.js';

// ── 1. COMBO DETECTION BASICS ─────────────────────────────────────────────────

// Single flag → no combo
assert.equal(getPrimaryCombo({ VOID: true }), null, 'Single VOID should NOT trigger combo');
assert.equal(getPrimaryCombo({ DICH_MA: true }), null, 'Single DICH_MA should NOT trigger combo');
assert.equal(getPrimaryCombo({ FU_YIN: true }), null, 'Single FU_YIN should NOT trigger combo');
assert.equal(getPrimaryCombo({ FAN_YIN: true }), null, 'Single FAN_YIN should NOT trigger combo');

// No flags → no combo
assert.equal(getPrimaryCombo({}), null, 'Empty flags → null');
assert.equal(getPrimaryCombo(null), null, 'null flags → null');
assert.equal(getPrimaryCombo(undefined), null, 'undefined flags → null');

// ── 2. PAIRWISE COMBO DETECTION ──────────────────────────────────────────────

assert.equal(
  getPrimaryCombo({ VOID: true, FU_YIN: true })?.id,
  'VOID_FU_YIN',
  'VOID + FU_YIN → VOID_FU_YIN'
);

assert.equal(
  getPrimaryCombo({ VOID: true, FAN_YIN: true })?.id,
  'VOID_FAN_YIN',
  'VOID + FAN_YIN → VOID_FAN_YIN'
);

assert.equal(
  getPrimaryCombo({ DICH_MA: true, VOID: true })?.id,
  'HORSE_VOID',
  'DICH_MA + VOID → HORSE_VOID'
);

assert.equal(
  getPrimaryCombo({ DICH_MA: true, FAN_YIN: true })?.id,
  'HORSE_FAN_YIN',
  'DICH_MA + FAN_YIN → HORSE_FAN_YIN'
);

assert.equal(
  getPrimaryCombo({ DICH_MA: true, FU_YIN: true })?.id,
  'HORSE_FU_YIN',
  'DICH_MA + FU_YIN → HORSE_FU_YIN'
);

assert.equal(
  getPrimaryCombo({ FU_YIN: true, FAN_YIN: true })?.id,
  'FU_FAN',
  'FU_YIN + FAN_YIN → FU_FAN'
);

// ── 3. YIN DOMINATES YANG (triple-flag priority) ─────────────────────────────

assert.equal(
  getPrimaryCombo({ DICH_MA: true, VOID: true, FU_YIN: true })?.id,
  'VOID_FU_YIN',
  'Triple (DICH_MA+VOID+FU_YIN) → VOID_FU_YIN wins (Yin+Yin > Yin+Yang)'
);

assert.equal(
  getPrimaryCombo({ DICH_MA: true, VOID: true, FAN_YIN: true })?.id,
  'VOID_FAN_YIN',
  'Triple (DICH_MA+VOID+FAN_YIN) → VOID_FAN_YIN wins over HORSE_VOID'
);

assert.equal(
  getPrimaryCombo({ DICH_MA: true, FU_YIN: true, FAN_YIN: true })?.id,
  'HORSE_FAN_YIN',
  'Triple (DICH_MA+FU_YIN+FAN_YIN) → HORSE_FAN_YIN wins (high severity > medium)'
);

// All 4 flags → VOID_FU_YIN (critical) must win
assert.equal(
  getPrimaryCombo({ DICH_MA: true, VOID: true, FU_YIN: true, FAN_YIN: true })?.id,
  'VOID_FU_YIN',
  'All 4 flags → VOID_FU_YIN (critical) always wins'
);

// ── 4. SEVERITY ORDERING ────────────────────────────────────────────────────

const severityOrder = COMBO_DEFS.map(c => c.id);
assert.equal(severityOrder[0], 'VOID_FU_YIN', 'First combo should be VOID_FU_YIN (critical)');
assert.ok(
  severityOrder.indexOf('VOID_FU_YIN') < severityOrder.indexOf('HORSE_VOID'),
  'VOID_FU_YIN must come before HORSE_VOID'
);
assert.ok(
  severityOrder.indexOf('VOID_FAN_YIN') < severityOrder.indexOf('HORSE_VOID'),
  'VOID_FAN_YIN must come before HORSE_VOID'
);

// ── 5. SCORE OVERRIDES ──────────────────────────────────────────────────────

assert.equal(
  getPrimaryCombo({ VOID: true, FU_YIN: true })?.scoreAdjust,
  -15,
  'VOID_FU_YIN scoreAdjust = -15'
);

assert.equal(
  getPrimaryCombo({ VOID: true, FAN_YIN: true })?.scoreAdjust,
  -12,
  'VOID_FAN_YIN scoreAdjust = -12'
);

assert.equal(
  getPrimaryCombo({ DICH_MA: true, VOID: true })?.scoreAdjust,
  -10,
  'HORSE_VOID scoreAdjust = -10'
);

assert.equal(
  getPrimaryCombo({ DICH_MA: true, FU_YIN: true })?.scoreAdjust,
  -8,
  'HORSE_FU_YIN scoreAdjust = -8'
);

// ── 6. CONFIDENCE OVERRIDES ─────────────────────────────────────────────────

assert.equal(
  getPrimaryCombo({ VOID: true, FU_YIN: true })?.conf,
  0.35,
  'VOID_FU_YIN confidence = 0.35'
);

assert.equal(
  getPrimaryCombo({ DICH_MA: true, VOID: true })?.conf,
  0.45,
  'HORSE_VOID confidence = 0.45'
);

// ── 7. BACKWARD COMPATIBILITY: HORSE_VOID ───────────────────────────────────

const horseVoid = getPrimaryCombo({ DICH_MA: true, VOID: true });
assert.equal(horseVoid?.label, 'Ngựa chạy vào hố', 'HORSE_VOID label = "Ngựa chạy vào hố"');
assert.equal(horseVoid?.severity, 'high', 'HORSE_VOID severity = high');

// ── 8. TOPIC ADVICE ─────────────────────────────────────────────────────────

// VOID_FU_YIN topics
const vfStudy = getComboTopicAdvice('VOID_FU_YIN', 'hoc-tap');
assert.ok(vfStudy, 'VOID_FU_YIN should have hoc-tap advice');
assert.equal(vfStudy.headline, 'Ngưng Ôn Tập');

const vfExam = getComboTopicAdvice('VOID_FU_YIN', 'thi-cu');
assert.ok(vfExam, 'VOID_FU_YIN should have thi-cu advice');
assert.equal(vfExam.headline, 'Tạm Dừng Ôn Thi');

const vfLove = getComboTopicAdvice('VOID_FU_YIN', 'tinh-duyen');
assert.ok(vfLove, 'VOID_FU_YIN should have tinh-duyen advice');
assert.equal(vfLove.headline, 'Đình Chỉ Cảm Xúc');

// HORSE_FAN_YIN topics
const hfExam = getComboTopicAdvice('HORSE_FAN_YIN', 'thi-cu');
assert.ok(hfExam, 'HORSE_FAN_YIN should have thi-cu advice');
assert.equal(hfExam.headline, 'Quay Xe Đề Thi');

// VOID_FAN_YIN upgraded advice map
const vfyExam = getComboTopicAdvice('VOID_FAN_YIN', 'thi-cu');
assert.ok(vfyExam, 'VOID_FAN_YIN should have thi-cu advice');
assert.equal(vfyExam.headline, 'Chống Nhiễu Tín Hiệu (Signal Noise)');
assert.ok(
  vfyExam.coreMessage.includes('Ghost Signals'),
  'VOID_FAN_YIN thi-cu coreMessage should mention "Ghost Signals"'
);
assert.ok(
  vfyExam.narrative.includes('Oscillation'),
  'VOID_FAN_YIN thi-cu narrative should mention "Oscillation"'
);

const vfyWealth = getComboTopicAdvice('VOID_FAN_YIN', 'tai-van');
assert.ok(vfyWealth, 'VOID_FAN_YIN should have tai-van advice');
assert.equal(vfyWealth.headline, 'Bẫy Reversal Giả');
assert.ok(
  vfyWealth.narrative.includes('Fake Out'),
  'VOID_FAN_YIN tai-van narrative should mention "Fake Out"'
);
assert.ok(
  vfyWealth.doHint.includes('High-Z'),
  'VOID_FAN_YIN tai-van doHint should mention "High-Z"'
);

const vfyLove = getComboTopicAdvice('VOID_FAN_YIN', 'tinh-duyen');
assert.ok(vfyLove, 'VOID_FAN_YIN should have tinh-duyen advice');
assert.equal(vfyLove.headline, 'Lời Hứa Gió Bay');
assert.ok(
  vfyLove.doHint.includes('Undefined Variable'),
  'VOID_FAN_YIN tinh-duyen doHint should mention "Undefined Variable"'
);

const vfyStrategy = getComboTopicAdvice('VOID_FAN_YIN', 'muu-luoc');
assert.ok(vfyStrategy, 'VOID_FAN_YIN should have muu-luoc advice');
assert.equal(vfyStrategy.headline, 'Chiến Thuật Zombie Process');
assert.ok(
  vfyStrategy.coreMessage.includes('Output'),
  'VOID_FAN_YIN muu-luoc coreMessage should mention missing "Output"'
);
assert.ok(
  vfyStrategy.narrative.includes('Infinite Loop'),
  'VOID_FAN_YIN muu-luoc narrative should mention "Infinite Loop"'
);

// Default fallback
const fuFanDefault = getComboTopicAdvice('FU_FAN', 'some-unknown-topic');
assert.ok(fuFanDefault, 'FU_FAN should fall back to default');
assert.equal(fuFanDefault.headline, 'Ngầm Ngầm Dậy Sóng');
assert.ok(
  fuFanDefault.doHint.includes('Đừng nghe lời khuyên'),
  'FU_FAN doHint should contain "Đừng nghe lời khuyên"'
);

// Null for nonexistent combo
assert.equal(getComboTopicAdvice('NONEXISTENT', 'thi-cu'), null, 'Unknown combo → null');

// ── 9. TOPIC KEY NORMALIZATION ──────────────────────────────────────────────

const vfLoveAlias = getComboTopicAdvice('VOID_FU_YIN', 'tinh-yeu');
assert.ok(vfLoveAlias, 'tinh-yeu should normalize to tinh-duyen');
assert.equal(vfLoveAlias.headline, 'Đình Chỉ Cảm Xúc');

// ── 10. DUNGTHAN ADVICE FORMAT ──────────────────────────────────────────────

const dtAdvice = getComboAdviceForDungThan('HORSE_VOID', 'tai-van', {
  ok: '⚠️',
  dir: 'Tây Bắc',
  pNm: 'Càn',
  mon: 'Sinh Môn',
  than: 'Bạch Hổ',
});
assert.ok(dtAdvice, 'getComboAdviceForDungThan should return advice string');
assert.ok(dtAdvice.includes('Ngựa chạy vào hố'), 'DungThan advice should include combo label');
assert.ok(dtAdvice.includes('Tây Bắc'), 'DungThan advice should include direction');

// ── 11. detectFlagCombos returns ALL matching combos ────────────────────────

const allCombos = detectFlagCombos({ DICH_MA: true, VOID: true, FU_YIN: true });
assert.ok(allCombos.length >= 2, 'Triple flags should detect at least 2 combos');
assert.equal(allCombos[0].id, 'VOID_FU_YIN', 'First combo should be highest severity');
const comboIds = allCombos.map(c => c.id);
assert.ok(comboIds.includes('HORSE_VOID'), 'Should also detect HORSE_VOID');
assert.ok(comboIds.includes('HORSE_FU_YIN'), 'Should also detect HORSE_FU_YIN');

console.log('✅ flag-combos.mjs — all tests passed');
