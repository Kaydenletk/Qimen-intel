import assert from 'node:assert/strict';
import { detectDeepDive, detectTopic, detectTopicHybrid } from '../src/logic/kimon/detectTopic.js';

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
assert.equal(t4.tier, 'strategy');

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

const t8b = detectTopic('xem đề cương môn này giúp mình');
assert.equal(t8b.topic, 'hoc-tap', 'Đề cương → hoc-tap');

const t8c = detectTopic('bao giờ mình tốt nghiệp');
assert.equal(t8c.topic, 'thi-cu', 'Tốt nghiệp → thi-cu');

const t8d = detectTopic('môn này test lúc nào');
assert.equal(t8d.topic, 'hoc-tap', 'môn + test → hoc-tap');

const t8e = detectTopic('giáo viên chưa gửi bài tập');
assert.equal(t8e.topic, 'hoc-tap', 'giáo viên + bài tập → hoc-tap');

const t8f = detectTopic('thi cử dạo này sao');
assert.equal(t8f.topic, 'hoc-tap', 'thi cử → hoc-tap');

const t8g = detectTopic('mẹ chồng với con dâu đang bất hòa');
assert.equal(t8g.topic, 'gia-dao', 'mẹ chồng + bất hòa → gia-dao');

const t8h = detectTopic('gia đình dạo này hay cãi nhau');
assert.equal(t8h.topic, 'gia-dao', 'gia đình + cãi nhau → gia-dao');

// ── Strategy tier ──
const t9 = detectTopic('chiến lược Q2 cho công ty');
assert.equal(t9.topic, 'muu-luoc', 'Chiến lược → muu-luoc');
assert.equal(t9.tier, 'strategy');

const t10 = detectTopic('đàm phán lương');
assert.equal(t10.topic, 'dam-phan', 'Đàm phán → dam-phan');
assert.equal(t10.tier, 'topic');

const t11 = detectTopic('nên pivot hay giữ nguyên');
assert.equal(t11.topic, 'muu-luoc', 'Pivot → muu-luoc');
assert.equal(t11.tier, 'strategy');

const t11b = detectTopic('mưu lược giá cho quý tới');
assert.equal(t11b.topic, 'muu-luoc', 'Mưu lược → muu-luoc');
assert.equal(t11b.tier, 'strategy');

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

// ── Single-word keyword regression ──
const t17 = detectTopic('tiền');
assert.equal(t17.topic, 'tai-van', '1 từ tiền → tai-van');

const t17b = detectTopic('tiền đạo đội này hay quá');
assert.equal(t17b.topic, null, 'tiền đạo không được false-positive sang tai-van');

const t18 = detectTopic('yêu');
assert.equal(t18.topic, 'tinh-duyen', '1 từ yêu → tinh-duyen');

const t19 = detectTopic('bệnh');
assert.equal(t19.topic, 'suc-khoe', '1 từ bệnh → suc-khoe');

const t20 = detectTopic('gym');
assert.equal(t20.topic, 'suc-khoe', '1 từ gym → suc-khoe');

const t21 = detectTopic('nhà');
assert.equal(t21.topic, 'bat-dong-san', '1 từ nhà → bat-dong-san');

const t24 = detectTopic('Tình hình đất đai dạo này sao?');
assert.equal(t24.topic, 'bat-dong-san', 'Đất đai → bat-dong-san');
assert.equal(t24.tier, 'topic');

const t25 = detectTopic('deadline dự án đang dí quá');
assert.equal(t25.topic, 'su-nghiep', 'deadline dự án → su-nghiep');

const t26 = detectTopic('thủ môn bắt hay quá');
assert.equal(t26.topic, null, 'thủ môn không được false-positive sang hoc-tap');

// ── AI fallback threshold regression ──
const t22 = await detectTopicHybrid('thất nghiệp', '');
assert.equal(t22.topic, 'chung', '2 từ không match + không API key → fallback chung');
assert.equal(t22.confidence, 'fallback', '2 từ phải đi qua nhánh AI fallback trước khi hạ xuống chung');

const t23 = await detectTopicHybrid('alo', '');
assert.equal(t23.topic, 'chung', '1 từ casual → companion');
assert.equal(t23.confidence, 'fallback', '1 từ vẫn fallback ngay');

assert.equal(detectDeepDive('tại sao lại chọn hướng này'), true, 'Tại sao lại chọn → deep dive');
assert.equal(detectDeepDive('giải thích kỹ hơn giúp mình'), false, 'Giải thích kỹ chung chung không được đẩy lên Pro');
assert.equal(detectDeepDive('giải thích chi tiết giúp mình'), true, 'Giải thích chi tiết → deep dive');
assert.equal(detectDeepDive('cho mình chiến lược cụ thể'), true, 'Chiến lược → deep dive');
assert.equal(detectDeepDive('tại sao nay trời nóng vậy'), false, 'Tại sao đời thường không được đẩy lên Pro');
assert.equal(detectDeepDive('chốt nhanh đi'), false, 'Câu thường không phải deep dive');

console.log('ASSERTIONS: OK');
