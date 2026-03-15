import assert from 'node:assert/strict';
import { detectDeepDive, detectTopic, detectTopicHybrid } from '../src/logic/kimon/detectTopic.js';

// ── Companion tier (small talk only) ──
const t1 = detectTopic('tối nay ăn gì');
assert.equal(t1.topic, null, 'Câu hỏi chung không keyword không được gán topic sync');
assert.equal(t1.tier, 'topic', 'Câu hỏi chung phải mặc định đi về Kymon Pro topic tier');

const t2 = detectTopic('hi');
assert.equal(t2.topic, 'chung', 'Greeting ngắn phải được nhận diện là small talk');
assert.equal(t2.tier, 'companion', 'Greeting ngắn → companion');

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

const t8i = detectTopic('phân tích sâu về giáo viên này');
assert.equal(t8i.topic, 'hoc-tap', 'giáo viên + phân tích sâu vẫn phải giữ domain hoc-tap');
assert.equal(t8i.tier, 'strategy', 'Deep dive chỉ nâng tier lên strategy');

const t8j = detectTopic('Vậy tôi nên làm gì? phân tích sâu về giáo viên này');
assert.equal(t8j.topic, 'hoc-tap', 'Domain rõ phải thắng muu-luoc dù có deep dive');
assert.equal(t8j.tier, 'strategy', 'Domain hoc-tap + deep dive -> strategy');

const t8k = detectTopic('giải thích chi tiết về vàng giúp mình');
assert.equal(t8k.topic, 'tai-van', 'Vàng + giải thích chi tiết vẫn phải giữ domain tai-van');
assert.equal(t8k.tier, 'strategy', 'Tai-van + deep dive -> strategy');

const t8g = detectTopic('mẹ chồng với con dâu đang bất hòa');
assert.equal(t8g.topic, 'gia-dao', 'mẹ chồng + bất hòa → gia-dao');

const t8h = detectTopic('gia đình dạo này hay cãi nhau');
assert.equal(t8h.topic, 'gia-dao', 'gia đình + cãi nhau → gia-dao');

const t8l = detectTopic('Nhà Khanh hiện tại ra sao?');
assert.equal(t8l.topic, 'gia-dao', 'Nhà + tên riêng + câu hỏi trạng thái phải ưu tiên gia-dao');

const t8m = detectTopic('Nhà tôi dạo này có vấn đề gì?');
assert.equal(t8m.topic, 'gia-dao', 'Nhà tôi + trạng thái nội bộ phải ưu tiên gia-dao');

const t8n = detectTopic('Nhà anh ấy đang lạnh lắm phải không?');
assert.equal(t8n.topic, 'gia-dao', 'Nhà + đại từ nhân xưng + khí lạnh phải ưu tiên gia-dao');

const t8o = detectTopic('Tôi mua nhà của Khanh có nên xuống tiền không?');
assert.equal(t8o.topic, 'bat-dong-san', 'Nhà + tên riêng nhưng có tín hiệu xuống tiền phải để bat-dong-san thắng');

const t8p = detectTopic('Nhà Khanh giá bao nhiêu?');
assert.equal(t8p.topic, 'bat-dong-san', 'Nhà + tên riêng nhưng hỏi giá bao nhiêu phải route sang bat-dong-san');

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

const t11c = detectTopic('phân tích sâu tình hình này giúp tôi');
assert.equal(t11c.topic, 'muu-luoc', 'Không có domain rõ nhưng có deep dive -> muu-luoc');
assert.equal(t11c.tier, 'strategy', 'Deep dive thuần -> strategy');

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

const t24b = detectTopic('Tôi mua nhà này để kinh doanh có nên xuống tiền không?');
assert.equal(t24b.topic, 'bat-dong-san', 'Quyết định xuống tiền mua nhà để kinh doanh phải ưu tiên bat-dong-san');
assert.equal(t24b.secondaryTopic, 'kinh-doanh', 'Case overlap phải giữ kinh-doanh làm secondary');

const t24c = detectTopic('Mua nhà để kinh doanh thì tài vận thế nào?');
assert.ok(['kinh-doanh', 'tai-van'].includes(t24c.topic), 'Case overlap có thể giữ kinh-doanh hoặc tai-van làm primary');
assert.ok(
  t24c.secondaryTopic === 'bat-dong-san' || (Array.isArray(t24c.topicCandidates) && t24c.topicCandidates.includes('bat-dong-san')),
  'Case overlap phải giữ bat-dong-san như lens phụ'
);

const t25 = detectTopic('deadline dự án đang dí quá');
assert.equal(t25.topic, 'su-nghiep', 'deadline dự án → su-nghiep');

const t26 = detectTopic('thủ môn bắt hay quá');
assert.equal(t26.topic, null, 'thủ môn không được false-positive sang hoc-tap');

// ── AI fallback threshold regression ──
const t22 = await detectTopicHybrid('thất nghiệp', '');
assert.equal(t22.topic, 'chung', '2 từ không match + không API key → fallback chung');
assert.equal(t22.confidence, 'fallback', '2 từ phải đi qua nhánh AI fallback trước khi hạ xuống chung');
assert.equal(t22.tier, 'topic', 'Fallback chung cho user query phải lên topic tier');

const t23 = await detectTopicHybrid('alo', '');
assert.equal(t23.topic, 'chung', '1 từ casual → companion');
assert.equal(t23.confidence, 'fallback', '1 từ vẫn fallback ngay');
assert.equal(t23.tier, 'companion', 'Small talk rõ ràng phải giữ companion');

const t27 = await detectTopicHybrid('Khanh bạn tôi đang làm gì', '');
assert.equal(t27.topic, 'chung', 'Câu hỏi theo dõi người khác nhưng không có keyword vẫn là chung');
assert.equal(t27.tier, 'topic', 'Câu hỏi chung có ý hỏi phải vào Kymon Pro topic tier');
assert.equal(t27.confidence, 'fallback', 'Không API key thì vẫn fallback sạch');

assert.equal(detectDeepDive('tại sao lại chọn hướng này'), false, 'Tại sao lại chọn không còn đủ để mở Pro');
assert.equal(detectDeepDive('giải thích kỹ hơn giúp mình'), false, 'Giải thích kỹ chung chung không được đẩy lên Pro');
assert.equal(detectDeepDive('giải thích chi tiết giúp mình'), false, 'Giải thích chi tiết không còn đủ để mở Pro');
assert.equal(detectDeepDive('cho mình chiến lược cụ thể'), true, 'Chiến lược → deep dive');
assert.equal(detectDeepDive('need strategy for this'), true, 'strategy tiếng Anh vẫn phải mở Pro');
assert.equal(detectDeepDive('give me a deep analysis'), true, 'deep analysis tiếng Anh vẫn phải mở Pro');
assert.equal(detectDeepDive('muuluoc cho keo nay'), true, 'muuluoc không dấu, không khoảng trắng vẫn phải mở Pro');
assert.equal(detectDeepDive('phantichsau case nay'), true, 'phantichsau không dấu, không khoảng trắng vẫn phải mở Pro');
assert.equal(detectDeepDive('tại sao nay trời nóng vậy'), false, 'Tại sao đời thường không được đẩy lên Pro');
assert.equal(detectDeepDive('chốt nhanh đi'), false, 'Câu thường không phải deep dive');

console.log('ASSERTIONS: OK');
