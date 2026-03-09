import assert from 'node:assert/strict';
import {
  buildDungThanBoardText,
  findDungThanPalace,
} from '../src/logic/dungThan/canonicalDungThan.js';
import { detectTopic } from '../src/logic/kimon/detectTopic.js';
import { buildKimonPrompt } from '../src/logic/kimon/promptBuilder.js';
import { buildStrategyPrompt } from '../src/logic/kimon/strategyPrompt.js';

const boardData = {
  8: {
    palaceName: 'Cấn',
    directionLabel: { displayShort: 'Đông Bắc' },
    mon: { displayShort: 'Sinh' },
    star: { displayShort: 'Bồng' },
    than: { displayName: 'Lục Hợp' },
    can: { displayShort: 'Đinh' },
    khongVong: true,
    mockScore: 4,
  },
  9: {
    palaceName: 'Ly',
    directionLabel: { displayShort: 'Nam' },
    mon: { displayShort: 'Cảnh' },
    star: { displayShort: 'Phụ' },
    than: { displayName: 'Cửu Địa' },
    can: { displayShort: 'Bính' },
    mockScore: 4,
  },
};

const giaDaoPalace = findDungThanPalace('gia-dao', boardData);
assert.equal(giaDaoPalace?.id, 8, 'Gia đạo phải bám Sinh/Lục Hợp ở P8, không được trôi sang P9');
assert.notEqual(giaDaoPalace?.id, 9, 'Gia đạo tuyệt đối không được trỏ nhầm sang Cảnh/Phụ ở P9');
assert.match(giaDaoPalace?.matchedByText || '', /Môn Sinh/);
assert.match(giaDaoPalace?.matchedByText || '', /Thần Lục Hợp/);

const boardText = buildDungThanBoardText('gia-dao', boardData);
assert.match(boardText, /Cung Đông Bắc \(P8\):\n===> \[DỤNG THẦN CHÍNH - BẮT BUỘC PHÂN TÍCH TRỌNG TÂM TẠI ĐÂY\] <===\n\[ĐÂY LÀ CUNG DỤNG THẦN CHÍNH\]/);
assert.match(boardText, /- Cờ: Không Vong/);
assert.doesNotMatch(boardText, /Cung Nam \(P9\):\n===> \[DỤNG THẦN CHÍNH - BẮT BUỘC PHÂN TÍCH TRỌNG TÂM TẠI ĐÂY\] <===/);

assert.equal(detectTopic('gia đình nhà Khanh hiện tại ra sao').topic, 'gia-dao');
assert.equal(detectTopic('nhà cửa dạo này có yên không').topic, 'gia-dao');
assert.equal(detectTopic('vợ chồng gần đây hay bất hòa').topic, 'gia-dao');
assert.equal(detectTopic('con cái trong nhà đang thế nào').topic, 'gia-dao');
assert.equal(detectTopic('Nhà Khanh hiện tại ra sao?').topic, 'gia-dao');
assert.equal(detectTopic('Nhà tôi dạo này có vấn đề gì?').topic, 'gia-dao');
assert.equal(detectTopic('Nhà anh ấy đang lạnh lắm phải không?').topic, 'gia-dao');
assert.equal(detectTopic('Nhà Khanh có sổ đỏ ổn không?').topic, 'bat-dong-san');

const giaDaoPrompt = buildKimonPrompt({
  qmdjData: {
    selectedTopicKey: 'gia-dao',
    selectedTopicResult: 'Headline: Bề ngoài vẫn có nếp, nhưng bên trong đang hẫng.',
    selectedTopicCanonicalDungThan: {
      palaceNum: 8,
      palaceName: 'Cấn',
      direction: 'Đông Bắc',
      matchedByText: 'Môn Sinh + Thần Lục Hợp',
      targetSummary: 'Môn Sinh + Thần Lục Hợp',
      boardText,
    },
    selectedTopicFlags: ['Không Vong'],
    selectedTopicUsefulPalace: 8,
    selectedTopicUsefulPalaceName: 'Đông Bắc',
    aiHints: '[GỢI Ý ẨN DỤ CHO AI]\n- Đối với [Không Vong]: Hãy ẩn dụ nó là "nhà có người nhưng lòng cách xa".',
  },
  userContext: 'Nhà Khanh hiện tại ra sao?',
  isAutoLoad: false,
});

assert.match(giaDaoPrompt, /\[PERSONA THEO CHỦ ĐỀ\]/);
assert.match(giaDaoPrompt, /Quân sư tâm lý/);
assert.match(giaDaoPrompt, /tổ ấm|hòa khí|nếp nhà/);
assert.match(giaDaoPrompt, /Lục Hợp đi cùng Không Vong/i);
assert.match(giaDaoPrompt, /nhà có người nhưng lòng cách xa/i);
assert.match(giaDaoPrompt, /Tránh dùng: giao dịch, pháp lý, đầu tư/i);

const giaDaoStrategyPrompt = buildStrategyPrompt({
  qmdjData: {
    selectedTopicKey: 'gia-dao',
    selectedTopicResult: 'Headline: Có vẻ còn nhà, nhưng lòng người đang lỏng.',
    selectedTopicCanonicalDungThan: {
      palaceNum: 8,
      palaceName: 'Cấn',
      direction: 'Đông Bắc',
      matchedByText: 'Môn Sinh + Thần Lục Hợp',
      targetSummary: 'Môn Sinh + Thần Lục Hợp',
      boardText,
    },
  },
  userContext: 'Nhà Khanh hiện tại ra sao?',
  topicKey: 'gia-dao',
});

assert.match(giaDaoStrategyPrompt.userPrompt, /\[LENS THEO CHỦ ĐỀ\]/);
assert.match(giaDaoStrategyPrompt.userPrompt, /hòa khí|nếp nhà|sự kết nối/i);
assert.match(giaDaoStrategyPrompt.userPrompt, /Chỉ nói về tài sản, giao dịch, giấy tờ khi câu hỏi thật sự hỏi về căn nhà như một tài sản/i);

console.log('✅ regression-gia-dao.mjs — all tests passed');
