import assert from 'node:assert/strict';
import {
  TOPIC_DUNG_THAN_MAP,
  resolveDungThanMarker,
  buildDungThanBoardText,
  findTopicDungThanPalace,
} from '../src/logic/kimon/dungThanHelper.js';

const boardData = {
  8: {
    palaceName: 'Cấn',
    directionLabel: { displayShort: 'Đông Bắc' },
    mon: { displayShort: 'Sinh' },
    star: { displayShort: 'Bồng' },
    than: { displayName: 'Lục Hợp' },
    can: { displayShort: 'Đinh' },
    khongVong: true,
  },
  9: {
    palaceName: 'Ly',
    directionLabel: { displayShort: 'Nam' },
    mon: { displayShort: 'Cảnh' },
    star: { displayShort: 'Phụ' },
    than: { displayName: 'Cửu Địa' },
    can: { displayShort: 'Bính' },
  },
  6: {
    palaceName: 'Càn',
    directionLabel: { displayShort: 'Tây Bắc' },
    mon: { displayShort: 'Sinh' },
    star: { displayShort: 'Tâm' },
    than: { displayName: 'Cửu Thiên' },
    can: { displayShort: 'Mậu' },
  },
};

const splitWealthBoard = {
  8: {
    palaceName: 'Cấn',
    directionLabel: { displayShort: 'Đông Bắc' },
    mon: { displayShort: 'Sinh' },
    star: { displayShort: 'Bồng' },
    than: { displayName: 'Lục Hợp' },
    can: { displayShort: 'Đinh' },
  },
  6: {
    palaceName: 'Càn',
    directionLabel: { displayShort: 'Tây Bắc' },
    mon: { displayShort: 'Khai' },
    star: { displayShort: 'Tâm' },
    than: { displayName: 'Cửu Thiên' },
    can: { displayShort: 'Mậu' },
  },
};

assert.equal(TOPIC_DUNG_THAN_MAP['gia-dao'].mon, 'Sinh');
assert.equal(TOPIC_DUNG_THAN_MAP['gia-dao'].than, 'Lục Hợp');

const examPalace = findTopicDungThanPalace('thi-cu', boardData);
assert.equal(examPalace?.id, 9, 'Thi cử phải bắt vào Cảnh/Phụ ở P9');
assert.match(examPalace?.matchedByText || '', /Môn Cảnh/);
assert.match(examPalace?.matchedByText || '', /Tinh Phụ/);

const familyPalace = findTopicDungThanPalace('gia-dao', boardData);
assert.equal(familyPalace?.id, 8, 'Gia đạo phải bắt vào Sinh/Lục Hợp ở P8');
assert.match(familyPalace?.matchedByText || '', /Môn Sinh/);
assert.match(familyPalace?.matchedByText || '', /Thần Lục Hợp/);

const wealthPalace = findTopicDungThanPalace('tai-van', boardData);
assert.equal(wealthPalace?.id, 6, 'Tài vận phải ưu tiên trục Sinh + Mậu ở P6');
assert.match(wealthPalace?.matchedByText || '', /Môn Sinh/);
assert.match(wealthPalace?.matchedByText || '', /Can Mậu/);

const splitWealthPalace = findTopicDungThanPalace('tai-van', splitWealthBoard);
assert.equal(splitWealthPalace?.id, 6, 'Nếu Sinh và Mậu bị tách cung, tài vận phải ưu tiên Mậu trước');
assert.doesNotMatch(splitWealthPalace?.matchedByText || '', /Môn Sinh/);
assert.match(splitWealthPalace?.matchedByText || '', /Can Mậu/);

const familyMarker = resolveDungThanMarker({ topic: 'gia-dao', boardData });
assert.equal(familyMarker?.palaceNum, 8);
assert.match(familyMarker?.boardText || '', /===> \[DỤNG THẦN CHÍNH - BẮT BUỘC PHÂN TÍCH TRỌNG TÂM TẠI ĐÂY\] <===/);
assert.match(familyMarker?.boardText || '', /Cung Đông Bắc \(P8\):\n===> \[DỤNG THẦN CHÍNH - BẮT BUỘC PHÂN TÍCH TRỌNG TÂM TẠI ĐÂY\] <===/);
assert.match(familyMarker?.boardText || '', /- Cờ: Không Vong/);

const examBoardText = buildDungThanBoardText({ topic: 'thi-cu', boardData });
assert.match(examBoardText, /Cung Nam \(P9\):\n===> \[DỤNG THẦN CHÍNH - BẮT BUỘC PHÂN TÍCH TRỌNG TÂM TẠI ĐÂY\] <===/);
assert.match(examBoardText, /- Môn: Cảnh/);

const personMarker = resolveDungThanMarker({
  topic: 'chung',
  boardData,
  userContext: 'Phân tích người này, tôi gặp họ lúc 2h chiều hôm nay',
  hourPalaceNum: 6,
});
assert.equal(personMarker?.palaceNum, 6, 'Đọc người có mốc giờ phải ưu tiên Cung Giờ');
assert.match(personMarker?.matchedByText || '', /Cung Giờ/);

console.log('✅ topic-dung-than-marker.mjs — all tests passed');
