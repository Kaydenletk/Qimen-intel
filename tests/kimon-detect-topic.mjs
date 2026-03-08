import assert from 'node:assert/strict';
import { detectTopic } from '../src/logic/kimon/detectTopic.js';

// ── Companion tier (casual / short / no keyword) ──
const t1 = detectTopic('tối nay ăn gì');
assert.equal(t1.tier, 'companion', 'Casual food question → companion');

const t2 = detectTopic('hi');
assert.equal(t2.tier, 'companion', 'Too short → companion');

const t3 = detectTopic('');
assert.equal(t3.tier, 'companion', 'Empty → companion');

// ── Topic tier (domain-specific) ──
const t4 = detectTopic('nên mua vàng không');
assert.equal(t4.topic, 'tai-van', 'Vàng → tai-van');
assert.equal(t4.tier, 'topic');

const t5 = detectTopic('crush có thích mình không');
assert.equal(t5.topic, 'tinh-duyen', 'Crush → tinh-duyen');
assert.equal(t5.tier, 'topic');

const t6 = detectTopic('đau đầu quá');
assert.equal(t6.topic, 'suc-khoe', 'Đau → suc-khoe');
assert.equal(t6.tier, 'topic');

const t7 = detectTopic('ký hợp đồng lúc nào tốt');
assert.equal(t7.topic, 'ky-hop-dong', 'Hợp đồng → ky-hop-dong');
assert.equal(t7.tier, 'topic');

const t8 = detectTopic('bay về Việt Nam tuần sau');
assert.equal(t8.topic, 'xuat-hanh', 'Bay → xuat-hanh');
assert.equal(t8.tier, 'topic');

// ── Strategy tier ──
const t9 = detectTopic('chiến lược Q2 cho công ty');
assert.equal(t9.topic, 'muu-luoc', 'Chiến lược → muu-luoc');
assert.equal(t9.tier, 'strategy');

const t10 = detectTopic('đàm phán lương');
assert.equal(t10.topic, 'dam-phan', 'Đàm phán → dam-phan');
assert.equal(t10.tier, 'strategy');

const t11 = detectTopic('nên pivot hay giữ nguyên');
assert.equal(t11.topic, 'muu-luoc', 'Pivot → muu-luoc');
assert.equal(t11.tier, 'strategy');

// ── Kinh doanh keywords (new additions) ──
const t12 = detectTopic('mở quán trà sữa được không');
assert.equal(t12.topic, 'kinh-doanh', 'Mở quán → kinh-doanh');

const t13 = detectTopic('dòng tiền tháng này cạn rồi');
assert.equal(t13.topic, 'kinh-doanh', 'Dòng tiền → kinh-doanh');

const t14 = detectTopic('chạy ads có hiệu quả không');
assert.equal(t14.topic, 'kinh-doanh', 'Chạy ads → kinh-doanh');

// ── Tai-van trading slang ──
const t15 = detectTopic('nên cắt lỗ hay gồng tiếp');
assert.equal(t15.topic, 'tai-van', 'Cắt lỗ → tai-van');

const t16 = detectTopic('bắt đáy lúc này được không');
assert.equal(t16.topic, 'tai-van', 'Bắt đáy → tai-van');

console.log('ASSERTIONS: OK');
