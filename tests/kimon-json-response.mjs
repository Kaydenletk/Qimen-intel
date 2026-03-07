import assert from 'node:assert/strict';
import { parseKimonJsonResponse } from '../src/logic/kimon/jsonResponse.js';

const clean = parseKimonJsonResponse('{"tongQuan":"Ổn","tamLy":{"trangThai":"A","dongChay":"B"},"chienLuoc":{"noiDung":"C"},"hanhDong":["D"],"kimonQuote":"E"}');
assert.equal(clean.tongQuan, 'Ổn');
assert.deepEqual(clean.hanhDong, ['D']);

const fenced = parseKimonJsonResponse('```json\n{"message":"Xin chờ","hanhDong":"Giữ nhịp"}\n```');
assert.equal(fenced.tongQuan, 'Xin chờ');
assert.deepEqual(fenced.hanhDong, ['Giữ nhịp']);
assert.equal(fenced.chienLuoc.noiDung, '');

const extended = parseKimonJsonResponse('{"tongQuan":"Ổn","thoiDiem":"Đợi thêm một nhịp","ruiRo":["Nói quá tay"],"doiPhuong":{"tamThe":"Đang dò xét"}}');
assert.equal(extended.thoiDiem, 'Đợi thêm một nhịp');
assert.deepEqual(extended.ruiRo, ['Nói quá tay']);
assert.deepEqual(extended.doiPhuong, { tamThe: 'Đang dò xét' });

const plain = parseKimonJsonResponse('Đèn đỏ. Nên chậm lại và quan sát thêm.');
assert.equal(plain.tongQuan, 'Đèn đỏ. Nên chậm lại và quan sát thêm.');
assert.deepEqual(plain.hanhDong, []);
assert.equal(plain.kimonQuote, '');

console.log('ASSERTIONS: OK');
