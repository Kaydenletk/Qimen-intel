import assert from 'node:assert/strict';
import { getAIHints } from '../src/logic/dungThan/injector.js';

const studyHints = getAIHints('hoc-tap', [
  'Cảnh Môn',
  'Đằng Xà',
  'Dịch Mã',
  'Phản Ngâm',
  'Đỗ Môn',
  'Thiên Phụ',
  'Tân',
  'Cảnh Môn',
  'Không tồn tại',
]);

assert.match(studyHints, /\[GỢI Ý ẨN DỤ CHO AI\]/);
assert.match(studyHints, /\[QUAN TRỌNG - FLAGS\]/, 'Flags phải có block ưu tiên riêng');
assert.ok(studyHints.indexOf('[Dịch Mã]') < studyHints.indexOf('[Cảnh Môn]'), 'Flags phải đứng trước các thành phần khác');
assert.ok(studyHints.indexOf('[Phản Ngâm]') < studyHints.indexOf('[Cảnh Môn]'), 'Mọi flag đều phải lên trước hint thường');
assert.match(studyHints, /\[Cảnh Môn\].*đề cương, tài liệu/i);
assert.match(studyHints, /\[Đằng Xà\].*lắt léo|rắc rối/i);
assert.match(studyHints, /\[Dịch Mã\].*đang phi tới|chạy nước rút/i);
assert.match(studyHints, /\[Phản Ngâm\].*(quay xe|đổi ý|bật ngược|vừa chốt đã phải đổi|lên xuống mạnh)/i);
assert.match(studyHints, /\[Đỗ Môn\].*chưa công bố|bế tắc/i);
assert.match(studyHints, /\[Thiên Phụ\].*giáo viên|tài liệu chuẩn|người chỉ bài/i);
assert.match(studyHints, /\[Tân\].*tinh lọc|chi tiết nhỏ/i);
assert.equal((studyHints.match(/\[Cảnh Môn\]/g) || []).length, 1, 'Không được lặp hint cùng một phần tử');

const aliasStudyHints = getAIHints('thi-cu', ['Cảnh Môn']);
assert.match(aliasStudyHints, /\[Cảnh Môn\].*đề cương, tài liệu/i, 'thi-cu phải dùng cùng dictionary với hoc-tap');

const horseVoidHints = getAIHints('hoc-tap', ['Dịch Mã', 'Không Vong', 'Cảnh Môn']);
assert.match(horseVoidHints, /\[CẢNH BÁO ĐẶC BIỆT\]: Ngựa chạy vào hố/i, 'Combo Dịch Mã \+ Không Vong phải có cảnh báo đặc biệt');
assert.ok(
  horseVoidHints.indexOf('[CẢNH BÁO ĐẶC BIỆT]') < horseVoidHints.indexOf('[Dịch Mã]'),
  'Cảnh báo đặc biệt phải đứng trước từng flag riêng lẻ'
);

const propertyHints = getAIHints('bat-dong-san', ['Sinh Môn', 'Cửu Địa']);
assert.match(propertyHints, /\[Sinh Môn\].*nhà cửa|công trình/i);
assert.match(propertyHints, /\[Cửu Địa\].*đất đai|bền chắc/i);

const familyHints = getAIHints('gia-dao', ['Hưu Môn', 'Lục Hợp', 'Đằng Xà', 'Không Vong', 'Phản Ngâm']);
assert.match(familyHints, /\[Hưu Môn\].*bình yên|nghỉ chiến/i);
assert.match(familyHints, /\[Lục Hợp\].*sum vầy|hòa giải|ngồi lại/i);
assert.match(familyHints, /\[Đằng Xà\].*bằng mặt không bằng lòng|rối/i);
assert.match(familyHints, /\[Không Vong\].*chẳng chạm được|ai cũng thấy trống/i);
assert.match(familyHints, /\[Phản Ngâm\].*đổi thái độ nhanh|vừa dịu đã bùng lại/i);

const fallbackHints = getAIHints('bat-dong-san', ['Thiên Tâm', 'Quý']);
assert.match(fallbackHints, /\[Thiên Tâm\].*phân tích|chiến thuật/i);
assert.match(fallbackHints, /\[Quý\].*thấm dần|âm thầm/i);

const emptyHints = getAIHints('hoc-tap', ['Không rõ']);
assert.equal(emptyHints, '', 'Phần tử không có trong dictionary phải bị bỏ qua sạch');

console.log('qmdj-injector.mjs: OK');
