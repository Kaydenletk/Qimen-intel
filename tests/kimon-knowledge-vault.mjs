import assert from 'node:assert/strict';
import { lookupQmdjDictionaryEntry } from '../src/interpretation/dictionary.js';
import { findStemInteractionRule } from '../src/logic/dungThan/comboAnalogies.js';
import { buildKnowledgeVaultContext } from '../src/logic/kimon/knowledgeVault.js';

const defaultDoor = lookupQmdjDictionaryEntry('Kinh Môn');
assert.ok(defaultDoor?.text.includes('chấn động') || defaultDoor?.text.includes('lo âu'), 'Kinh Môn phải lookup được từ dictionary');

const topicDoor = lookupQmdjDictionaryEntry('Sinh Môn', 'gia-dao');
assert.ok(topicDoor?.text.includes('hơi ấm') || topicDoor?.text.includes('nếp nhà'), 'Sinh Môn phải trả về nghĩa topic-aware cho gia đạo');

const stemRule = findStemInteractionRule('Kỷ', 'Nhâm', 'muu-luoc');
assert.ok(stemRule?.text.includes('khóa biên') || stemRule?.text.includes('giữ khuôn'), 'Kỷ gặp Nhâm phải có luật tương tác Can');

const knowledgeContext = buildKnowledgeVaultContext({
  qmdjData: {
    selectedTopicKey: 'gia-dao',
    selectedTopicCanonicalDungThan: {
      palaceNum: 8,
      palaceName: 'Cấn',
      direction: 'Đông Bắc',
      boardText: 'Cung Đông Bắc (P8):\n- Môn: Sinh\n- Tinh: Trụ\n- Thần: Lục Hợp\n- Can: Đinh\n- Cờ: Không Vong',
    },
    dayStem: 'Ất',
    hourStem: 'Canh',
    selectedTopicFlags: ['Dịch Mã', 'Không Vong'],
    hourMarkerPalace: 3,
    hourMarkerDirection: 'Đông',
    hourDoor: 'Kinh',
    hourStar: 'Nhuế',
    hourDeity: 'Chu Tước',
    directEnvoyPalace: 9,
    directEnvoyDirection: 'Nam',
    directEnvoyDoor: 'Khai',
    directEnvoyStar: 'Tâm',
    directEnvoyDeity: 'Trực Phù',
  },
  userContext: 'Nhà mình hiện tại ra sao?',
  topicKey: 'gia-dao',
});

assert.match(knowledgeContext, /\[KHO TRI THỨC QMDJ\]/);
assert.match(knowledgeContext, /Dụng Thần chính: P8 · Cấn · Đông Bắc/i);
assert.match(knowledgeContext, /Sinh Môn:/);
assert.match(knowledgeContext, /Lục Hợp:/);
assert.match(knowledgeContext, /Không Vong:/);
assert.match(knowledgeContext, /Dịch Mã:/);
assert.match(knowledgeContext, /Combo cờ Ngựa chạy vào hố:/);
assert.match(knowledgeContext, /Tổ hợp Dụng Thần chính \(Sinh Môn × Lục Hợp\):/);
assert.match(knowledgeContext, /Can Ngày vs Can Giờ \(Ất -> Canh\):/);

console.log('ASSERTIONS: OK');
