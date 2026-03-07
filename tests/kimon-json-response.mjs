import assert from 'node:assert/strict';
import { parseKimonJsonResponse, toKimonResponseSchema } from '../src/logic/kimon/jsonResponse.js';

const clean = parseKimonJsonResponse('{"tongQuan":"Ổn","tamLy":{"trangThai":"A","dongChay":"B"},"chienLuoc":{"noiDung":"C"},"hanhDong":["D"],"kimonQuote":"E"}');
assert.equal(clean.tongQuan, 'Ổn');
assert.deepEqual(clean.hanhDong, ['D']);

const fenced = parseKimonJsonResponse('```json\n{"message":"Xin chờ","hanhDong":"Giữ nhịp"}\n```');
assert.equal(fenced.tongQuan, 'Xin chờ');
assert.equal(fenced.traLoiTrucTiep, 'Xin chờ');
assert.deepEqual(fenced.hanhDong, ['Giữ nhịp']);
assert.equal(fenced.chienLuoc.noiDung, '');

const minimal = parseKimonJsonResponse('{"mode":"decision","lead":"Dựa trên những gì đang hiện ra, mình nghiêng về phương án chờ thêm.","timeHint":"10:30 - 11:30","message":"Mình thấy bạn nên chờ thêm một nhịp rồi mới quyết.","closingLine":"Đừng ép nhịp khi đường chưa thật mở."}');
assert.equal(minimal.mode, 'decision');
assert.equal(minimal.lead, 'Dựa trên những gì đang hiện ra, mình nghiêng về phương án chờ thêm.');
assert.equal(minimal.quickTake, 'Dựa trên những gì đang hiện ra, mình nghiêng về phương án chờ thêm.');
assert.equal(minimal.timeHint, '10:30 - 11:30');
assert.equal(minimal.message, 'Mình thấy bạn nên chờ thêm một nhịp rồi mới quyết.');
assert.equal(minimal.traLoiTrucTiep, 'Mình thấy bạn nên chờ thêm một nhịp rồi mới quyết.');
assert.equal(minimal.thoiDiemGoiY, '10:30 - 11:30');
assert.equal(minimal.closingLine, 'Đừng ép nhịp khi đường chưa thật mở.');

const v3 = parseKimonJsonResponse('{"summary":"Chưa nên chốt ngay.","analysis":"Nhịp hiện tại chưa thật mở.\\n\\nTuy nhiên, nếu bạn giữ chậm và quan sát thêm, cửa tốt hơn vẫn còn.","action":"Đợi thêm 30-60 phút rồi mới quyết."}');
assert.equal(v3.summary, 'Chưa nên chốt ngay.');
assert.equal(v3.quickTake, 'Chưa nên chốt ngay.');
assert.equal(v3.analysis, 'Nhịp hiện tại chưa thật mở.\n\nTuy nhiên, nếu bạn giữ chậm và quan sát thêm, cửa tốt hơn vẫn còn.');
assert.equal(v3.message, 'Nhịp hiện tại chưa thật mở.\n\nTuy nhiên, nếu bạn giữ chậm và quan sát thêm, cửa tốt hơn vẫn còn.');
assert.equal(v3.action, 'Đợi thêm 30-60 phút rồi mới quyết.');
assert.equal(v3.closingLine, 'Đợi thêm 30-60 phút rồi mới quyết.');

const duplicated = parseKimonJsonResponse('{"mode":"decision","lead":"Khối 1","timeHint":"","message":"Tin đầu.","closingLine":"Chốt 1"}\n{"mode":"decision","lead":"Khối 2","timeHint":"","message":"Tin hai.","closingLine":"Chốt 2"}');
assert.equal(duplicated.lead, 'Khối 1');
assert.equal(duplicated.message, 'Tin đầu.');
assert.equal(duplicated.closingLine, 'Chốt 1');

const extended = parseKimonJsonResponse('{"tongQuan":"Ổn","thoiDiem":"Đợi thêm một nhịp","ruiRo":["Nói quá tay"],"doiPhuong":{"tamThe":"Đang dò xét"}}');
assert.equal(extended.thoiDiem, 'Đợi thêm một nhịp');
assert.deepEqual(extended.ruiRo, ['Nói quá tay']);
assert.deepEqual(extended.doiPhuong, { tamThe: 'Đang dò xét' });

const surrounded = parseKimonJsonResponse('rác đầu dòng\n{"mode":"decision","lead":"Đừng ký vội.","timeHint":"","message":"Bạn vẫn còn một chi tiết chưa nhìn ra.","closingLine":"Đừng ký khi còn thấy mờ."}\nrác cuối dòng');
assert.equal(surrounded.lead, 'Đừng ký vội.');
assert.equal(surrounded.message, 'Bạn vẫn còn một chi tiết chưa nhìn ra.');
assert.equal(surrounded.closingLine, 'Đừng ký khi còn thấy mờ.');

const plain = parseKimonJsonResponse('Đèn đỏ. Nên chậm lại và quan sát thêm.');
assert.equal(plain.summary, 'Kymon chưa trả lời trọn vẹn.');
assert.equal(plain.tongQuan, 'Phản hồi từ hệ thống chưa đủ rõ để hiển thị an toàn.');
assert.equal(plain.traLoiTrucTiep, 'Phản hồi từ hệ thống chưa đủ rõ để hiển thị an toàn.');
assert.deepEqual(plain.hanhDong, []);
assert.equal(plain.kimonQuote, '');

const repaired = parseKimonJsonResponse(`{
  "mode": "companion",
  "traLoiTrucTiep": "Chà, mình thấy bạn đang hơi rối.
Nhưng vẫn còn cửa để sắp lại nhịp học.",
  "thoiDiemGoiY": "Sau 15h",
  "tongQuan": "",
  "tamLy": { "trangThai": "", "dongChay": "" },
  "chienLuoc": { "noiDung": "" },
  "hanhDong": [],
  "kimonQuote": "Cứ chậm mà chắc nhé.",
}`);
assert.equal(repaired.mode, 'companion');
assert.match(repaired.traLoiTrucTiep, /hơi rối/);
assert.equal(repaired.thoiDiemGoiY, 'Sau 15h');
assert.equal(repaired.kimonQuote, 'Cứ chậm mà chắc nhé.');

const truncatedStructured = parseKimonJsonResponse(`{
  "mode": "decision",
  "lead": "Mình hiểu bạn đang đứng trước một quyết định quan trọng với hợp đồng này, để mình xem tình hình giúp bạn nhé.",
  "timeHint": "Theo
{
  "mode": "decision",
  "lead": "Mình hiểu bạn đang đứng trước một quyết định quan trọng với hợp đồng này, để mình xem tình hình giúp bạn nhé.",
  "timeHint": "Theo`);
assert.equal(truncatedStructured.mode, 'decision');
assert.match(truncatedStructured.lead, /quyết định quan trọng/);
assert.equal(truncatedStructured.timeHint, 'Theo');
assert.doesNotMatch(truncatedStructured.tongQuan, /"mode"/);
assert.doesNotMatch(truncatedStructured.traLoiTrucTiep, /"lead"/);

const structuredGarbageFallback = parseKimonJsonResponse('{"mode":"decision","lead":"Đang xem..."\n{"mode":"decision"');
assert.doesNotMatch(structuredGarbageFallback.tongQuan, /"mode"/);
assert.doesNotMatch(structuredGarbageFallback.traLoiTrucTiep, /"lead"/);
assert.ok(structuredGarbageFallback.traLoiTrucTiep.length > 0);
assert.equal(structuredGarbageFallback.summary, 'Đang xem...');

const publicSchema = toKimonResponseSchema({
  mode: 'decision',
  lead: 'Chưa nên ký.',
  timeHint: 'Sáng mai hợp hơn.',
  message: 'Bề ngoài ổn, nhưng còn một lớp thông tin chưa lộ hết.',
  closingLine: 'Đừng ký khi vẫn còn thấy mờ.',
  traLoiTrucTiep: 'legacy',
  tongQuan: 'legacy',
  tamLy: { trangThai: 'legacy', dongChay: 'legacy' },
  hanhDong: ['legacy'],
});
assert.deepEqual(publicSchema, {
  mode: 'decision',
  lead: 'Chưa nên ký.',
  timeHint: 'Sáng mai hợp hơn.',
  message: 'Bề ngoài ổn, nhưng còn một lớp thông tin chưa lộ hết.',
  closingLine: 'Đừng ký khi vẫn còn thấy mờ.',
});

const strictFallbackSchema = toKimonResponseSchema(
  parseKimonJsonResponse('{"mode":"decision","lead":"Đang xem..."\n{"mode":"decision"'),
  '{"mode":"decision","lead":"Đang xem..."\n{"mode":"decision"'
);
assert.deepEqual(strictFallbackSchema, {
  mode: 'decision',
  lead: 'Đang xem...',
  timeHint: '',
  message: 'Đang xem...',
  closingLine: 'Bạn gửi lại câu hỏi ngắn hơn nhé.',
});

console.log('ASSERTIONS: OK');
