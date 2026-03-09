import assert from 'node:assert/strict';
import { detectTopic } from '../src/logic/kimon/detectTopic.js';
import { buildKimonPrompt } from '../src/logic/kimon/promptBuilder.js';
import { buildStrategyPrompt } from '../src/logic/kimon/strategyPrompt.js';

const q1 = detectTopic('Tôi mua nhà này để kinh doanh có nên xuống tiền không?');
assert.equal(q1.topic, 'bat-dong-san', 'Quyết định xuống tiền mua tài sản phải route về bat-dong-san');
assert.equal(q1.secondaryTopic, 'kinh-doanh', 'Domain phụ của case mua nhà để kinh doanh phải giữ kinh-doanh');
assert.ok(Array.isArray(q1.topicCandidates), 'detectTopic phải trả topicCandidates cho case chồng domain');
assert.ok(q1.topicCandidates.includes('bat-dong-san'));
assert.ok(q1.topicCandidates.includes('kinh-doanh'));

const q2 = detectTopic('Mua nhà để kinh doanh thì tài vận thế nào?');
assert.ok(['kinh-doanh', 'tai-van'].includes(q2.topic), 'Case lai có thể giữ kinh-doanh hoặc tai-van làm primary');
assert.ok(
  q2.secondaryTopic === 'bat-dong-san' || (Array.isArray(q2.topicCandidates) && q2.topicCandidates.includes('bat-dong-san')),
  'Case lai phải giữ lại lens bat-dong-san như secondary hoặc candidate'
);

const overlapQmdjData = {
  selectedTopicKey: 'bat-dong-san',
  selectedSecondaryTopicKey: 'kinh-doanh',
  selectedTopicCandidates: ['bat-dong-san', 'kinh-doanh', 'tai-van'],
  selectedTopicResult: 'Headline: Đây là một quyết định xuống tiền vào tài sản.',
  selectedTopicCanonicalDungThan: {
    palaceNum: 6,
    palaceName: 'Càn',
    direction: 'Tây Bắc',
    matchedByText: 'Can Mậu + Môn Sinh',
    targetSummary: 'Can Mậu + Môn Sinh',
    boardText: 'Cung Tây Bắc (P6):\n===> [DỤNG THẦN CHÍNH - BẮT BUỘC PHÂN TÍCH TRỌNG TÂM TẠI ĐÂY] <===\n[ĐÂY LÀ CUNG DỤNG THẦN CHÍNH]\n- Môn: Sinh\n- Tinh: Tâm\n- Thần: Cửu Địa\n- Can: Mậu',
  },
  displayPalaces: {
    6: {
      palaceName: 'Càn',
      directionLabel: { displayShort: 'Tây Bắc' },
      mon: { displayShort: 'Sinh' },
      star: { displayShort: 'Tâm' },
      than: { displayName: 'Cửu Địa' },
      can: { displayShort: 'Mậu' },
    },
    9: {
      palaceName: 'Ly',
      directionLabel: { displayShort: 'Nam' },
      mon: { displayShort: 'Cảnh' },
      star: { displayShort: 'Phụ' },
      than: { displayName: 'Chu Tước' },
      can: { displayShort: 'Bính' },
    },
  },
};

const topicPrompt = buildKimonPrompt({
  qmdjData: overlapQmdjData,
  userContext: 'Tôi mua nhà này để kinh doanh có nên xuống tiền không?',
  isAutoLoad: false,
});
assert.match(topicPrompt, /\[TOPIC CHỒNG LỚP\]/);
assert.match(topicPrompt, /Chủ đề chính: bat-dong-san/);
assert.match(topicPrompt, /Chủ đề phụ: kinh-doanh/);
assert.match(topicPrompt, /\[ƯU TIÊN BẤT ĐỘNG SẢN\]/);
assert.match(topicPrompt, /Cảnh Môn để đọc pháp lý/i);
assert.match(topicPrompt, /Cửu Địa để chốt độ bền/i);

const strategyPrompt = buildStrategyPrompt({
  qmdjData: overlapQmdjData,
  userContext: 'Tôi mua nhà này để kinh doanh có nên xuống tiền không?',
  topicKey: 'bat-dong-san',
});
assert.match(strategyPrompt.userPrompt, /\[TOPIC CHỒNG LỚP\]/);
assert.match(strategyPrompt.userPrompt, /\[ƯU TIÊN BẤT ĐỘNG SẢN\]/);
assert.match(strategyPrompt.userPrompt, /Cảnh Môn để đọc pháp lý\/giấy tờ\/hồ sơ/i);
assert.match(strategyPrompt.userPrompt, /Cửu Địa để đọc độ bền nền đất/i);

console.log('✅ regression-overlap-domain.mjs — all tests passed');
